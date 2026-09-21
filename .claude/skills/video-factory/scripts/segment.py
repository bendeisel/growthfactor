#!/usr/bin/env python3
"""Step 2: turn the transcript into beats, each with a word budget.

    segment.py <slug> [--force] [--min 6] [--max 20] [--wps 2.5]

Reads  video/jobs/<slug>/work/transcript.json
Writes video/jobs/<slug>/work/segments.json

This is the step that keeps the narration locked to the cursor, so two rules
matter more than anything else here.

1. The beats tile the entire source with no holes. A beat's footage runs from
   its own start to the NEXT beat's start, not to the end of its sentence.
   Cutting on sentence ends instead would throw away every silent stretch
   where a page loads or the presenter scrolls, and those seconds are real
   screen action the new narration still has to cover.

2. The word budget comes from the FOOTAGE duration, not from how long the
   original presenter took to say it. The rewrite has to fill the screen time
   available, which is not the same number.

Beats shorter than --min get merged into their neighbour, because a two second
beat gives the rewrite five words to work with and no room to sound human.
Beats longer than --max get split at the widest pause near their midpoint,
because one long beat lets timing error accumulate with nothing to absorb it.
"""

import argparse
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import (  # noqa: E402
    Manifest, cfg_float, die, log, probe_duration, read_json, write_json,
)


def split_long(seg, max_len):
    """Split an over-long transcript segment at the widest internal pause.

    Recursive, so a 90 second monologue comes apart into several beats rather
    than one oversized one and a remainder.
    """
    dur = seg["end"] - seg["start"]
    words = seg.get("words") or []
    if dur <= max_len or len(words) < 8:
        return [seg]

    mid = seg["start"] + dur / 2.0
    best, best_score = None, -1.0
    # Leave three words on each side so a split never orphans a fragment.
    for i in range(2, len(words) - 3):
        gap = words[i + 1]["start"] - words[i]["end"]
        if gap <= 0:
            continue
        # Prefer a wide pause, and prefer one near the middle. Without the
        # distance term every split lands on the first breath in the sentence.
        closeness = 1.0 - min(1.0, abs(words[i]["end"] - mid) / (dur / 2.0))
        score = gap * (0.35 + 0.65 * closeness)
        if score > best_score:
            best, best_score = i, score

    if best is None:
        return [seg]

    cut = (words[best]["end"] + words[best + 1]["start"]) / 2.0
    left = {
        "start": seg["start"], "end": cut,
        "text": " ".join(w["word"] for w in words[:best + 1]).strip(),
        "words": words[:best + 1],
    }
    right = {
        "start": cut, "end": seg["end"],
        "text": " ".join(w["word"] for w in words[best + 1:]).strip(),
        "words": words[best + 1:],
    }
    return split_long(left, max_len) + split_long(right, max_len)


def merge_short(segs, min_len, max_len):
    """Roll short segments forward into the next one."""
    out = []
    for seg in segs:
        if out:
            prev = out[-1]
            prev_dur = prev["end"] - prev["start"]
            combined = seg["end"] - prev["start"]
            if prev_dur < min_len and combined <= max_len:
                prev["end"] = seg["end"]
                prev["text"] = (prev["text"] + " " + seg["text"]).strip()
                prev["words"] = (prev.get("words") or []) + (seg.get("words") or [])
                continue
        out.append(dict(seg))
    # A trailing runt has no neighbour ahead of it, so fold it backwards.
    if len(out) > 1 and (out[-1]["end"] - out[-1]["start"]) < min_len:
        tail = out.pop()
        out[-1]["end"] = tail["end"]
        out[-1]["text"] = (out[-1]["text"] + " " + tail["text"]).strip()
        out[-1]["words"] = (out[-1].get("words") or []) + (tail.get("words") or [])
    return out


def build_beats(segs, source_duration, wps, max_len):
    """Tile the whole source. Beat N's footage ends where beat N+1 starts."""
    beats = []
    for idx, seg in enumerate(segs):
        clip_start = 0.0 if idx == 0 else seg["start"]
        clip_end = segs[idx + 1]["start"] if idx + 1 < len(segs) else source_duration
        clip_end = max(clip_end, clip_start + 0.5)
        clip_dur = clip_end - clip_start
        beats.append({
            "i": idx,
            "clip_start": round(clip_start, 3),
            "clip_end": round(clip_end, 3),
            "clip_duration": round(clip_dur, 3),
            "orig_start": round(seg["start"], 3),
            "orig_end": round(seg["end"], 3),
            "orig_text": seg["text"],
            "orig_words": len(seg["text"].split()),
            "word_budget": max(4, int(round(clip_dur * wps))),
            "long": clip_dur > max_len * 1.5,
        })
    return beats


def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("slug")
    ap.add_argument("--min", type=float, default=None, help="shortest beat, seconds")
    ap.add_argument("--max", type=float, default=None, help="longest beat, seconds")
    ap.add_argument("--wps", type=float, default=None,
                    help="words per second the avatar speaks (2.5 is ~150 wpm)")
    ap.add_argument("--force", action="store_true")
    args = ap.parse_args()

    min_len = args.min if args.min is not None else cfg_float("GF_BEAT_MIN", 6.0)
    max_len = args.max if args.max is not None else cfg_float("GF_BEAT_MAX", 20.0)
    wps = args.wps if args.wps is not None else cfg_float("GF_WORDS_PER_SEC", 2.5)
    if min_len >= max_len:
        die("--min must be below --max")

    man = Manifest(args.slug)
    tpath = os.path.join(man.dir, "work", "transcript.json")
    if not os.path.exists(tpath):
        die("no transcript yet. Run transcribe.py %s first." % args.slug)

    out_path = os.path.join(man.dir, "work", "segments.json")
    if man.done("segment") and os.path.exists(out_path) and not args.force:
        log("segments already present, skipping. --force to redo.")
        return

    source_duration = man.get("source_duration") or probe_duration(
        os.path.join(man.dir, "source.mp4"))

    raw = read_json(tpath)["segments"]
    segs = []
    for seg in raw:
        segs.extend(split_long(seg, max_len))
    segs = merge_short(segs, min_len, max_len)
    beats = build_beats(segs, source_duration, wps, max_len)

    long_beats = [b["i"] for b in beats if b["long"]]
    payload = {
        "source_duration": round(source_duration, 3),
        "wps": wps,
        "beat_min": min_len,
        "beat_max": max_len,
        "beats": beats,
    }
    write_json(out_path, payload)
    man.mark("segment", beats=len(beats), long_beats=long_beats)

    total_budget = sum(b["word_budget"] for b in beats)
    log("%d beats over %.1f minutes, %d words of narration budgeted"
        % (len(beats), source_duration / 60, total_budget))
    if long_beats:
        log("beats %s run long with little narration under them. Check those on "
            "review: they are usually a page load or a silent scroll."
            % ", ".join(str(i) for i in long_beats))


if __name__ == "__main__":
    main()
