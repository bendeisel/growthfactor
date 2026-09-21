#!/usr/bin/env python3
"""Step 6: captions, from the script we already wrote.

    captions.py <slug> [--precise] [--burn] [--force]

Reads  video/jobs/<slug>/work/scripts.json
       video/jobs/<slug>/work/timing.json
Writes video/jobs/<slug>/out/final.vtt
       video/jobs/<slug>/out/final.srt
       video/jobs/<slug>/out/final-captioned.mp4   (only with --burn)

Course players expect captions and search engines read them, so this is not
an optional extra on a training library.

We are in the unusual position of already knowing exactly what was said: we
wrote it. So the text never comes from transcribing anything, which is what
makes these captions perfect rather than approximate. Only the timing is in
question, and there are two ways to get it:

  proportional  (default) distribute each beat's words across the seconds of
                narration in that beat. No extra cost, no extra dependency,
                and accurate to within about a word at normal pace.
  --precise     transcribe the rendered avatar audio to get real word
                timestamps, then hang OUR text on THEIR timings. Costs a
                whisper pass over the narration. Worth it for anything long
                or heavily edited.

Under --precise the words come from our script, never from the transcript. If
whisper's word count for a beat does not match ours, that beat silently falls
back to proportional rather than risking a misaligned cue.
"""

import argparse
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import (  # noqa: E402
    Manifest, cfg, cfg_float, cfg_int, die, log, probe_duration, read_json,
    require_binary, run,
)

SENTENCE_END = re.compile(r"[.!?]$")


def fmt_vtt(t):
    h, rem = divmod(max(0.0, t), 3600)
    m, s = divmod(rem, 60)
    return "%02d:%02d:%06.3f" % (int(h), int(m), s)


def fmt_srt(t):
    return fmt_vtt(t).replace(".", ",")


def wrap(text, width):
    """Two lines at most, broken as evenly as the words allow."""
    words = text.split()
    if len(" ".join(words)) <= width:
        return " ".join(words)
    best, best_score = None, None
    for cut in range(1, len(words)):
        a = " ".join(words[:cut])
        b = " ".join(words[cut:])
        if len(a) > width or len(b) > width:
            continue
        score = abs(len(a) - len(b))
        if best_score is None or score < best_score:
            best, best_score = (a, b), score
    if best is None:
        # Nothing fits in two lines; let the player wrap it rather than
        # dropping words.
        return " ".join(words)
    return "%s\n%s" % best


def word_times_proportional(words, start, duration):
    """Spread words across the beat weighted by length, so a long word gets
    more of the clock than 'a'. Closer to real speech than even spacing."""
    weights = [max(1, len(w)) for w in words]
    total = float(sum(weights)) or 1.0
    out, t = [], start
    for w, weight in zip(words, weights):
        span = duration * (weight / total)
        out.append((w, t, t + span))
        t += span
    return out


def word_times_from_whisper(avatar_path, words, start, duration):
    """Real timings from the rendered audio, carrying our text.

    Returns None when the transcript does not line up word for word, which is
    the signal to fall back rather than emit a cue that drifts.
    """
    try:
        from faster_whisper import WhisperModel
    except ImportError:
        return None
    model = _precise_model()
    if model is None:
        return None
    segments, _ = model.transcribe(avatar_path, word_timestamps=True,
                                   vad_filter=False)
    heard = []
    for seg in segments:
        for w in (seg.words or []):
            if w.start is None:
                continue
            token = re.sub(r"[^\w']+", "", w.word).strip()
            if token:
                heard.append((token, float(w.start), float(w.end)))
    if len(heard) != len(words):
        return None
    return [(ours, start + h[1], start + h[2]) for ours, h in zip(words, heard)]


_MODEL = None


def _precise_model():
    global _MODEL
    if _MODEL == "unavailable":
        return None
    if _MODEL is None:
        try:
            from faster_whisper import WhisperModel
            _MODEL = WhisperModel(cfg("GF_WHISPER_MODEL", "small.en"),
                                  device=cfg("GF_WHISPER_DEVICE", "cpu"),
                                  compute_type=cfg("GF_WHISPER_COMPUTE", "int8"))
        except Exception as exc:  # noqa: BLE001
            log("precise timing unavailable (%s), using proportional" % exc)
            _MODEL = "unavailable"
            return None
    return _MODEL


def cues_for_beat(timed, max_chars, max_dur, min_dur):
    """Group words into cues, breaking at sentence ends where one is near."""
    cues, buf = [], []
    for item in timed:
        # Test the cue WITH this word before committing to it. Appending first
        # and measuring after lets a cue overshoot by a whole word, and a cue
        # one character over the limit no longer fits on two lines, so it
        # renders as a single long line across the video.
        candidate = buf + [item]
        text = " ".join(w for w, _, _ in candidate)
        span = candidate[-1][2] - candidate[0][1]
        if buf and (len(text) > max_chars or span > max_dur):
            cues.append(buf)
            buf = [item]
            continue
        buf = candidate
        if SENTENCE_END.search(item[0]) and len(text) >= max_chars * 0.35:
            cues.append(buf)
            buf = []
    if buf:
        if cues and len(" ".join(w for w, _, _ in buf)) < max_chars * 0.25:
            cues[-1].extend(buf)   # a two word orphan reads badly on its own
        else:
            cues.append(buf)

    out = []
    for group in cues:
        start, end = group[0][1], group[-1][2]
        if end - start < min_dur:
            end = start + min_dur
        out.append((start, end, " ".join(w for w, _, _ in group)))
    return out


def build(slug, precise=False):
    man = Manifest(slug)
    scripts = read_json(os.path.join(man.dir, "work", "scripts.json"))["lines"]
    tpath = os.path.join(man.dir, "work", "timing.json")
    if not os.path.exists(tpath):
        die("no timing yet. Run composite.py %s first." % slug)
    timing = {t["i"]: t for t in read_json(tpath)["beats"]}
    renders = man.get("renders", {})

    missing = [ln["i"] for ln in scripts if ln["i"] not in timing]
    if missing:
        die("beats %s have no timing. Run composite.py %s without --beat so "
            "every beat is measured." % (", ".join(str(i) for i in missing), slug))

    # The intro is concatenated ahead of beat zero, so every cue shifts by its
    # length. Getting this wrong puts the whole caption track out by a few
    # seconds, which is the kind of error nobody notices until a client does.
    offset = 0.0
    intro = os.path.join(man.dir, "assets", "intro.mp4")
    if os.path.exists(intro):
        offset = probe_duration(os.path.join(man.dir, "work", "clips", "_intro.mp4")
                                if os.path.exists(os.path.join(man.dir, "work", "clips", "_intro.mp4"))
                                else intro)
        log("intro present, shifting every cue by %.2fs" % offset)

    max_chars = cfg_int("GF_CAPTION_CHARS", 74)
    max_dur = cfg_float("GF_CAPTION_MAX_SECONDS", 6.0)
    min_dur = cfg_float("GF_CAPTION_MIN_SECONDS", 1.0)
    line_width = cfg_int("GF_CAPTION_LINE_CHARS", 38)

    all_cues, clock, fell_back = [], offset, []
    for ln in sorted(scripts, key=lambda r: r["i"]):
        t = timing[ln["i"]]
        beat_start = clock
        clock += t["final"]

        words = ln["script"].split()
        if not words:
            continue
        # Narration occupies the front of the beat. Any pad is silence at the
        # end, so captions must not run into it.
        speech = t["final"] - t.get("pad", 0.0)
        speech = max(speech, 0.2)

        timed = None
        if precise:
            rec = renders.get(str(ln["i"]))
            if rec:
                timed = word_times_from_whisper(
                    os.path.join(man.dir, rec["file"]), words, beat_start, speech)
            if timed is None:
                fell_back.append(ln["i"])
        if timed is None:
            timed = word_times_proportional(words, beat_start, speech)

        all_cues.extend(cues_for_beat(timed, max_chars, max_dur, min_dur))

    # Never let one cue start before the previous one ends.
    for i in range(1, len(all_cues)):
        prev_end = all_cues[i - 1][1]
        if all_cues[i][0] < prev_end:
            all_cues[i] = (prev_end, max(all_cues[i][1], prev_end + 0.4), all_cues[i][2])

    out_dir = os.path.join(man.dir, "out")
    vtt = [u"WEBVTT", u""]
    srt = []
    for n, (start, end, text) in enumerate(all_cues, 1):
        body = wrap(text, line_width)
        vtt += [u"%s --> %s" % (fmt_vtt(start), fmt_vtt(end)), body, u""]
        srt += [u"%d" % n, u"%s --> %s" % (fmt_srt(start), fmt_srt(end)), body, u""]

    vtt_path = os.path.join(out_dir, "final.vtt")
    srt_path = os.path.join(out_dir, "final.srt")
    for path, lines in ((vtt_path, vtt), (srt_path, srt)):
        with open(path, "w", encoding="utf-8") as fh:
            fh.write("\n".join(lines).rstrip() + "\n")

    man.mark("captions", cues=len(all_cues), precise=bool(precise),
             fell_back=fell_back)
    log("wrote %d cues to out/final.vtt and out/final.srt" % len(all_cues))
    if fell_back:
        log("beats %s fell back to proportional timing: the rendered audio did "
            "not line up word for word with the script."
            % ", ".join(str(i) for i in fell_back))
    return srt_path


def burn(slug, srt_path):
    """Burn the captions in. A second h264 generation, so only do this for a
    platform that cannot show a sidecar track."""
    require_binary("ffmpeg")
    man = Manifest(slug)
    src = os.path.join(man.dir, "out", "final.mp4")
    if not os.path.exists(src):
        die("no built video at %s" % src)
    dest = os.path.join(man.dir, "out", "final-captioned.mp4")
    style = cfg("GF_CAPTION_STYLE",
                "FontName=Arial,FontSize=22,PrimaryColour=&H00FFFFFF,"
                "BackColour=&H90000000,BorderStyle=3,Outline=0,Shadow=0,"
                "MarginV=48")
    # ffmpeg parses this filter argument itself, so the path separators and
    # the drive colon on Windows both have to be escaped.
    escaped = srt_path.replace("\\", "/").replace(":", "\\\\:")
    run(["ffmpeg", "-y", "-i", src,
         "-vf", "subtitles='%s':force_style='%s'" % (escaped, style),
         "-c:v", "libx264", "-preset", cfg("GF_OUT_PRESET", "medium"),
         "-crf", str(cfg_int("GF_OUT_CRF", 20)), "-pix_fmt", "yuv420p",
         "-c:a", "copy", "-movflags", "+faststart", dest])
    log("wrote out/final-captioned.mp4")


def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("slug")
    ap.add_argument("--precise", action="store_true",
                    help="time the words against the rendered audio")
    ap.add_argument("--burn", action="store_true",
                    help="also write a copy with the captions burned in")
    ap.add_argument("--force", action="store_true")
    args = ap.parse_args()

    man = Manifest(args.slug)
    if man.done("captions") and not args.force and not args.burn:
        log("captions already written, skipping. --force to redo.")
        return
    srt_path = build(args.slug, args.precise)
    if args.burn:
        burn(args.slug, srt_path)


if __name__ == "__main__":
    main()
