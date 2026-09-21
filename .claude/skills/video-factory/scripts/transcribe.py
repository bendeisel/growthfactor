#!/usr/bin/env python3
"""Step 1: pull the narration out of the source walkthrough with timestamps.

    transcribe.py <slug> [--force]

Reads  video/jobs/<slug>/source.mp4
Writes video/jobs/<slug>/work/audio.(wav|mp3)
       video/jobs/<slug>/work/transcript.json

Word-level timestamps are not a nicety here. The next step budgets each
rewritten line against the exact seconds of screen footage it has to cover,
and splits over-long beats at real pauses. Both need word times.

Two backends, picked by GF_WHISPER_BACKEND:

  local   faster-whisper on this machine. Free, no upload, needs a one-time
          model download. Default.
  openai  the hosted whisper endpoint. No model download, costs per minute,
          and the audio leaves the building.
"""

import argparse
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import (  # noqa: E402
    Manifest, cfg, die, log, post_multipart, probe_duration, require_binary, run,
    write_json,
)

OPENAI_LIMIT_BYTES = 24 * 1024 * 1024


def extract_audio(source, work, compressed):
    """16 kHz mono for the local model, or a small mono mp3 for the API.

    The hosted endpoint caps uploads at 25 MB, and a 16 kHz wav blows past
    that around the 13 minute mark. A 32 kbps mono mp3 keeps a 90 minute
    walkthrough under the cap and whisper cannot hear the difference.
    """
    require_binary("ffmpeg")
    if compressed:
        dest = os.path.join(work, "audio.mp3")
        codec = ["-c:a", "libmp3lame", "-b:a", "32k"]
    else:
        dest = os.path.join(work, "audio.wav")
        codec = ["-c:a", "pcm_s16le"]
    log("extracting audio -> %s" % os.path.basename(dest))
    run(["ffmpeg", "-y", "-i", source, "-vn", "-ac", "1", "-ar", "16000"]
        + codec + [dest])
    return dest


def transcribe_local(audio):
    try:
        from faster_whisper import WhisperModel
    except ImportError:
        die("faster-whisper is not installed.\n"
            "  pip install faster-whisper\n"
            "or set GF_WHISPER_BACKEND=openai to use the hosted endpoint.")
    size = cfg("GF_WHISPER_MODEL", "small.en")
    device = cfg("GF_WHISPER_DEVICE", "cpu")
    compute = cfg("GF_WHISPER_COMPUTE", "int8")
    log("loading faster-whisper %s on %s (first run downloads the model)" % (size, device))
    model = WhisperModel(size, device=device, compute_type=compute)
    segments, info = model.transcribe(
        audio,
        word_timestamps=True,
        vad_filter=True,
        vad_parameters={"min_silence_duration_ms": 400},
    )
    out = []
    for seg in segments:
        words = [
            {"start": float(w.start), "end": float(w.end), "word": w.word.strip()}
            for w in (seg.words or []) if w.start is not None
        ]
        text = seg.text.strip()
        if not text:
            continue
        out.append({
            "start": float(seg.start),
            "end": float(seg.end),
            "text": text,
            "words": words,
        })
        log("  [%7.2f] %s" % (seg.start, text[:70]))
    return {"language": info.language, "segments": out}


def transcribe_openai(audio):
    key = cfg("OPENAI_API_KEY", required=True)
    size = os.path.getsize(audio)
    if size > OPENAI_LIMIT_BYTES:
        die("%s is %.1f MB, over the 25 MB upload cap. Split the source video "
            "or use GF_WHISPER_BACKEND=local." % (audio, size / 1e6))
    log("uploading %.1f MB to the hosted transcription endpoint" % (size / 1e6))
    payload = post_multipart(
        "https://api.openai.com/v1/audio/transcriptions",
        {"Authorization": "Bearer %s" % key},
        [
            ("model", cfg("GF_OPENAI_STT_MODEL", "whisper-1")),
            ("response_format", "verbose_json"),
            ("timestamp_granularities[]", "word"),
            ("timestamp_granularities[]", "segment"),
        ],
        [("file", os.path.basename(audio), audio)],
        timeout=900,
        error_hints={401: "OPENAI_API_KEY was rejected."})

    words = payload.get("words") or []
    out = []
    for seg in payload.get("segments") or []:
        start, end = float(seg["start"]), float(seg["end"])
        out.append({
            "start": start,
            "end": end,
            "text": seg["text"].strip(),
            "words": [
                {"start": float(w["start"]), "end": float(w["end"]), "word": w["word"]}
                for w in words if start - 0.01 <= float(w["start"]) < end + 0.01
            ],
        })
    return {"language": payload.get("language", "en"), "segments": out}


def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("slug")
    ap.add_argument("--force", action="store_true", help="re-transcribe even if done")
    args = ap.parse_args()

    man = Manifest(args.slug)
    source = os.path.join(man.dir, "source.mp4")
    if not os.path.exists(source):
        die("no source video at %s\nDrop the walkthrough there first." % source)

    out_path = os.path.join(man.dir, "work", "transcript.json")
    if man.done("transcribe") and os.path.exists(out_path) and not args.force:
        log("transcript already present, skipping. --force to redo.")
        return

    duration = probe_duration(source)
    man.set("source_duration", round(duration, 3))
    log("source is %.1f minutes" % (duration / 60))

    backend = (cfg("GF_WHISPER_BACKEND", "local") or "local").lower()
    audio = extract_audio(source, os.path.join(man.dir, "work"),
                          compressed=(backend == "openai"))

    if backend == "local":
        result = transcribe_local(audio)
    elif backend == "openai":
        result = transcribe_openai(audio)
    else:
        die("GF_WHISPER_BACKEND must be 'local' or 'openai', got %r" % backend)

    if not result["segments"]:
        die("the transcript came back empty. Does the source video have narration?")

    write_json(out_path, result)
    man.mark("transcribe", backend=backend, segments=len(result["segments"]),
             audio=os.path.basename(audio))
    log("wrote %d transcript segments to work/transcript.json" % len(result["segments"]))


if __name__ == "__main__":
    main()
