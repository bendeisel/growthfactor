#!/usr/bin/env python3
"""Step 5: lay the new narration over the original footage and stitch it up.

    composite.py <slug> [--force] [--beat N] [--no-concat]

Reads  video/jobs/<slug>/source.mp4
       video/jobs/<slug>/work/scripts.json
       video/jobs/<slug>/work/avatar/seg_NNN.mp4
Writes video/jobs/<slug>/work/clips/seg_NNN.mp4
       video/jobs/<slug>/work/timing.json
       video/jobs/<slug>/out/final.mp4

## How a beat is fitted

Each beat has two durations that will not match: the seconds of footage it
covers, and the seconds the avatar took to say the line. The rewrite budgets
them close, but never exact.

Narration wins, because cutting audio mid-word is audible and stretching
footage is not. So the beat runs for as long as the narration takes, and the
footage is fitted to it:

    final    = max(avatar_duration, footage / MAX_SPEEDUP)
    scale    = clamp(final / footage, 1/MAX_SPEEDUP, MAX_SLOWDOWN)
    hold     = final - footage * scale     (freeze the last frame for this long)
    pad      = final - avatar_duration     (freeze the avatar, silence, this long)

Both caps default to 1.25. A screen recording at 1.25x is not noticeable, the
cursor simply moves a little briskly. Past that it reads as a fast-forward, so
the remainder is taken as a freeze on the last frame instead, which looks like
the presenter pausing on a screen. Exactly one of hold and pad is ever nonzero.

Every segment is encoded with identical parameters so the final concat is a
stream copy rather than a second generation of h264.
"""

import argparse
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import (  # noqa: E402
    Manifest, cfg, cfg_float, cfg_int, die, log, probe_duration, read_json,
    require_binary, run, write_json,
)

POSITIONS = {
    "bottom-right": ("W-w-%d", "H-h-%d"),
    "bottom-left": ("%d", "H-h-%d"),
    "top-right": ("W-w-%d", "%d"),
    "top-left": ("%d", "%d"),
}


def fit(d_src, d_av, max_speedup, max_slowdown):
    """Work out the timing for one beat. Pure arithmetic, easy to test."""
    final = max(d_av, d_src / max_speedup)
    scale = final / d_src
    scale = max(1.0 / max_speedup, min(scale, max_slowdown))
    hold = max(0.0, final - d_src * scale)
    pad = max(0.0, final - d_av)
    # Deliberately unrounded. Rounding each field independently makes the dict
    # internally inconsistent by up to a millisecond, so `narration + pad`
    # stops equalling `final` and anything downstream doing that arithmetic
    # inherits the error. Rounding happens where it belongs: in the ffmpeg
    # argument formatting below, and in what gets written to timing.json.
    return {
        "final": final,
        "scale": scale,
        "hold": hold,
        "pad": pad,
        "footage": d_src,
        "narration": d_av,
    }


def rounded(timing):
    """A copy for timing.json and for logs. Not for arithmetic."""
    out = {}
    for key, val in timing.items():
        if key == "scale":
            out[key] = round(val, 5)
        elif isinstance(val, float):
            out[key] = round(val, 3)
        else:
            out[key] = val
    return out


def make_mask(work, size):
    """A white disc on black, used as the alpha channel for the PIP.

    Generated once with geq on a single frame. Running geq per frame of a ten
    minute video would take longer than every other step combined.

    Two details that are easy to get wrong and hard to see afterwards. The
    frame is forced to gray BEFORE geq and written with -pix_fmt gray, because
    a mask that goes out through yuv gets squeezed into limited range: 0 and
    255 come back as 79 and 178, and the disc renders as a translucent smear
    inside a faintly visible square. And the edge is a 1.5 pixel ramp rather
    than a hard cut, because a hard cut leaves a visibly stair-stepped circle.
    """
    path = os.path.join(work, "mask_%d.png" % size)
    if os.path.exists(path):
        return path
    c = size / 2.0
    r = c - 2
    run([
        "ffmpeg", "-y", "-f", "lavfi",
        "-i", "color=c=black:s=%dx%d" % (size, size),
        "-vf", "format=gray,geq=lum='clip(255*((%f-hypot(X-%f,Y-%f))/1.5+0.5),0,255)'"
               % (r, c, c),
        "-frames:v", "1", "-pix_fmt", "gray", path,
    ])
    return path


def encode_args(fps, width, height, crf, preset):
    return [
        "-c:v", "libx264", "-preset", preset, "-crf", str(crf),
        "-pix_fmt", "yuv420p", "-r", str(fps),
        "-c:a", "aac", "-b:a", "160k", "-ar", "48000", "-ac", "2",
        # Pin the mp4 timescale so every segment shares one timebase and the
        # final concat can stay a stream copy.
        "-video_track_timescale", str(fps * 1000),
        "-movflags", "+faststart",
    ]


def build_beat(source, avatar, dest, timing, opts):
    """One finished segment: footage fitted, avatar over it, narration under."""
    fps = opts["fps"]
    w, h = opts["width"], opts["height"]
    pip = opts["pip"]
    mx, my = opts["margin"], opts["margin"]
    xpat, ypat = POSITIONS[opts["position"]]
    x = xpat % mx if "%" in xpat else xpat
    y = ypat % my if "%" in ypat else ypat

    # Footage: trimmed on input so ffmpeg only decodes what the beat needs.
    vfilter = [
        "setpts=%.5f*PTS" % timing["scale"],
        "scale=%d:%d:force_original_aspect_ratio=decrease" % (w, h),
        "pad=%d:%d:(ow-iw)/2:(oh-ih)/2:color=black" % (w, h),
        "fps=%d" % fps,
    ]
    if timing["hold"] > 0.01:
        vfilter.append("tpad=stop_mode=clone:stop_duration=%.3f" % timing["hold"])

    # Avatar: square crop, scaled to the PIP box, then either masked into a
    # disc or keyed out against its flat background.
    av_chain = [
        "crop='min(iw,ih)':'min(iw,ih)'",
        "scale=%d:%d" % (pip, pip),
        "fps=%d" % fps,
    ]
    if timing["pad"] > 0.01:
        av_chain.append("tpad=stop_mode=clone:stop_duration=%.3f" % timing["pad"])

    filt = ["[0:v]%s[bg]" % ",".join(vfilter)]
    if opts["style"] == "cutout":
        av_chain.append("colorkey=%s:%s:%s" % (
            opts["bg_color"], opts["key_similarity"], opts["key_blend"]))
        filt.append("[1:v]%s,format=rgba[pip]" % ",".join(av_chain))
        inputs = ["-i", source, "-i", avatar]
    else:
        av_chain.append("format=rgba")
        filt.append("[1:v]%s[pipsrc]" % ",".join(av_chain))
        filt.append("[2:v]scale=%d:%d:in_range=full:out_range=full,format=gray[mask]"
                    % (pip, pip))
        filt.append("[pipsrc][mask]alphamerge[pip]")
        inputs = ["-i", source, "-i", avatar, "-loop", "1", "-i", opts["mask"]]

    filt.append("[bg][pip]overlay=%s:%s:shortest=0[v]" % (x, y))
    apad = "[1:a]apad=pad_dur=%.3f,aresample=48000[a]" % max(timing["pad"], 0.0)
    filt.append(apad)

    cmd = ["ffmpeg", "-y",
           "-ss", "%.3f" % timing["clip_start"], "-t", "%.3f" % timing["footage"]]
    cmd += inputs
    cmd += ["-filter_complex", ";".join(filt),
            "-map", "[v]", "-map", "[a]",
            "-t", "%.3f" % timing["final"]]
    cmd += encode_args(fps, w, h, opts["crf"], opts["preset"])
    cmd += [dest]
    run(cmd)


def normalise_asset(src, dest, opts):
    """Re-encode an intro or outro to the segment parameters so the final
    concat can stay a stream copy."""
    fps, w, h = opts["fps"], opts["width"], opts["height"]
    cmd = ["ffmpeg", "-y", "-i", src,
           "-filter_complex",
           "[0:v]scale=%d:%d:force_original_aspect_ratio=decrease,"
           "pad=%d:%d:(ow-iw)/2:(oh-ih)/2:color=black,fps=%d[v];"
           "[0:a]aresample=48000[a]" % (w, h, w, h, fps),
           "-map", "[v]", "-map", "[a]"]
    cmd += encode_args(fps, w, h, opts["crf"], opts["preset"]) + [dest]
    run(cmd)
    return dest


def concat(parts, dest, work):
    listing = os.path.join(work, "concat.txt")
    with open(listing, "w", encoding="utf-8") as fh:
        for p in parts:
            fh.write("file '%s'\n" % p.replace("\\", "/").replace("'", "'\\''"))
    run(["ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", listing,
         "-c", "copy", "-movflags", "+faststart", dest])
    return dest


def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("slug")
    ap.add_argument("--force", action="store_true", help="rebuild every segment")
    ap.add_argument("--beat", type=int, help="build one beat only, for eyeballing")
    ap.add_argument("--no-concat", action="store_true")
    args = ap.parse_args()

    require_binary("ffmpeg")
    man = Manifest(args.slug)
    source = os.path.join(man.dir, "source.mp4")
    spath = os.path.join(man.dir, "work", "scripts.json")
    if not os.path.exists(spath):
        die("no scripts yet. Run rewrite.py %s first." % args.slug)

    lines = read_json(spath)["lines"]
    renders = man.get("renders", {})
    if not renders:
        die("nothing rendered yet. Run heygen.py render %s first." % args.slug)

    segments = read_json(os.path.join(man.dir, "work", "segments.json"))["beats"]
    beats_by_i = {b["i"]: b for b in segments}

    position = cfg("GF_PIP_POSITION", "bottom-right")
    if position not in POSITIONS:
        die("GF_PIP_POSITION must be one of: %s" % ", ".join(sorted(POSITIONS)))

    opts = {
        "fps": cfg_int("GF_OUT_FPS", 30),
        "width": cfg_int("GF_OUT_W", 1920),
        "height": cfg_int("GF_OUT_H", 1080),
        "pip": cfg_int("GF_PIP_SIZE", 320),
        "margin": cfg_int("GF_PIP_MARGIN", 48),
        "position": position,
        "style": cfg("GF_PIP_STYLE", "disc"),
        "bg_color": cfg("GF_AVATAR_BG", "#101114"),
        "key_similarity": cfg("GF_KEY_SIMILARITY", "0.18"),
        "key_blend": cfg("GF_KEY_BLEND", "0.05"),
        "crf": cfg_int("GF_OUT_CRF", 20),
        "preset": cfg("GF_OUT_PRESET", "medium"),
    }
    if opts["style"] not in ("disc", "cutout"):
        die("GF_PIP_STYLE must be 'disc' or 'cutout'")

    work = os.path.join(man.dir, "work")
    if opts["style"] == "disc":
        opts["mask"] = make_mask(work, opts["pip"])

    max_speedup = cfg_float("GF_MAX_SPEEDUP", 1.25)
    max_slowdown = cfg_float("GF_MAX_SLOWDOWN", 1.25)

    timings, parts, strained = [], [], []
    for ln in lines:
        i = ln["i"]
        if args.beat is not None and i != args.beat:
            continue
        beat = beats_by_i.get(i)
        rec = renders.get(str(i))
        if beat is None or rec is None:
            die("beat %d has no render. Run heygen.py render %s." % (i, args.slug))

        avatar = os.path.join(man.dir, rec["file"])
        d_av = rec.get("duration") or probe_duration(avatar)
        t = fit(beat["clip_duration"], d_av, max_speedup, max_slowdown)
        t["i"] = i
        t["clip_start"] = beat["clip_start"]
        timings.append(rounded(t))

        dest = os.path.join(work, "clips", "seg_%03d.mp4" % i)
        parts.append(dest)
        if os.path.exists(dest) and not args.force and args.beat is None:
            continue
        log("beat %-3d footage %6.2fs  narration %6.2fs  x%.3f  hold %.2fs  pad %.2fs"
            % (i, t["footage"], t["narration"], t["scale"], t["hold"], t["pad"]))
        if t["hold"] > 1.5 or t["pad"] > 1.5:
            strained.append(i)
        build_beat(source, avatar, dest, t, opts)

    write_json(os.path.join(work, "timing.json"), {
        "max_speedup": max_speedup,
        "max_slowdown": max_slowdown,
        "beats": timings,
    })

    if args.beat is not None:
        log("built beat %d only at %s" % (args.beat, parts[0]))
        return
    if args.no_concat:
        log("segments built, skipping concat")
        return

    assets = os.path.join(man.dir, "assets")
    final_parts = []
    intro = os.path.join(assets, "intro.mp4")
    outro = os.path.join(assets, "outro.mp4")
    if os.path.exists(intro):
        final_parts.append(normalise_asset(
            intro, os.path.join(work, "clips", "_intro.mp4"), opts))
    final_parts += parts
    if os.path.exists(outro):
        final_parts.append(normalise_asset(
            outro, os.path.join(work, "clips", "_outro.mp4"), opts))

    dest = os.path.join(man.dir, "out", "final.mp4")
    concat(final_parts, dest, work)
    total = probe_duration(dest)
    man.mark("composite", output="out/final.mp4", duration=round(total, 2),
             strained=strained)
    log("wrote out/final.mp4, %.1f minutes" % (total / 60))
    if strained:
        log("beats %s needed more than 1.5s of freeze to fit. Watch those: the "
            "rewrite ran well over or under its budget."
            % ", ".join(str(i) for i in strained))


if __name__ == "__main__":
    main()
