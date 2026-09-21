---
name: video-factory
description: Rebuild a software walkthrough video with our own cloned presenter over the original screen recording. Use when the job is to take training videos made by someone else and reissue them in Growth Factor's voice and branding: "redo the GHL training with my avatar", "clone these walkthroughs", "put my HeyGen avatar on this tutorial", "rewrite the narration on these videos", "we need our own version of their course". Transcribes the source, rewrites each line to a duration budget with interface names locked, renders the lines on a HeyGen avatar, and composites the avatar over the original footage with the narration kept under the cursor. Not for recording a walkthrough from scratch, and not for translating a video into another language.
---

# Routine: rebuild a walkthrough with our presenter

The screen recording stays. The voice and the face change.

```
source.mp4
  ├─ transcribe    whisper, with word timestamps
  ├─ segment       beats that tile the whole source, each with a word budget
  ├─ rewrite       Claude, in our voice, interface names locked
  ├─ REVIEW        a human reads it against the screen. Not optional.
  ├─ render        HeyGen speaks each line as the cloned avatar
  ├─ composite     avatar over footage, footage fitted to the narration
  ├─ captions      .vtt and .srt from the script we already wrote
  └─ verify        QA gate before anything is handed over
```

For one video use `vf.sh`. For the library use `batch.py`, which runs the same
scripts over every job and collects the failures instead of stopping at the
first one.

Read `references/timing.md` before changing anything in `segment.py` or
`composite.py`. It holds the arithmetic that keeps the narration under the
cursor, and every shortcut past it desynchronises the video.

## Before the first run

Source the footage from material we are licensed to rebrand. For HighLevel
that means the white-label asset library on the Agency Pro tier, not their
YouTube channel. Features and workflows are not copyrightable; their specific
video, script and edit are. Confirm the current terms before anything ships.

```bash
cp .claude/skills/video-factory/config.example.env \
   .claude/skills/video-factory/config.env
# fill it in, then:
.claude/skills/video-factory/scripts/vf.sh doctor
```

`doctor` checks ffmpeg, the python modules, and every key that has to be set.
It is faster than finding out forty beats into a render.

Two IDs come from HeyGen rather than the console:

```bash
scripts/heygen.py avatars
scripts/heygen.py voices --search ben
```

## Step 1: start the job

```bash
scripts/vf.sh new ghl-workflows ~/Downloads/building-a-workflow.mp4
```

Copies the source into `video/jobs/<slug>/` and opens a registry row. The job
directory holds everything: the source, the working files, the manifest, and
the finished video. It is git-ignored, because a 40 video library is tens of
gigabytes.

## Step 2: prep

```bash
scripts/vf.sh prep ghl-workflows
```

Transcribes, segments, rewrites. Produces `review.md` and stops.

What comes out of the rewrite is checked twice before it is written: every
interface name and number the model says it carried through must actually be
in its script verbatim, and every line must land within 15 percent of its word
budget. Failures go back once with the problem named. Anything still failing
is marked `needs_human` and listed at the top of `review.md`.

## Step 3: review, which is the whole job

Read `review.md` with the source video open. You are checking one thing above
all others: does the narration name the same button the cursor is moving
toward. Everything else is taste.

Edit `work/scripts.json` directly for anything wrong. It is the file the
renderer reads. Clear `needs_human` on a line once you have fixed it.

Budget about ten minutes per video here. It does not go away with practice,
and it is the difference between a library clients trust and forty videos
telling them to click a menu that is not there.

## Step 4: render

```bash
scripts/heygen.py render ghl-workflows --dry-run   # what it will cost
scripts/vf.sh render ghl-workflows
```

Refuses to start while any beat is still `needs_human`. Every finished render
is recorded in the manifest, so a re-run after a failure only pays for what is
actually missing.

## Step 5: build

```bash
scripts/vf.sh build ghl-workflows
```

Fits each clip to its narration, overlays the avatar, concatenates. Drop
`assets/intro.mp4` or `assets/outro.mp4` in the job directory and they are
normalised and included.

Check the log for beats that needed more than 1.5 seconds of freeze. Those are
where the rewrite ran well over or under budget, and they are the ones worth
watching before handover.

`build` also writes captions, because a training library without them is not
finished. The text comes from the script we wrote rather than from
transcribing anything, so the words are exact and only the timing is
estimated. `--precise` times them against the rendered audio instead:

```bash
scripts/captions.py ghl-workflows --precise      # real word timings
scripts/captions.py ghl-workflows --burn         # also burn them in
```

Preview a single beat without rebuilding everything:

```bash
scripts/composite.py ghl-workflows --beat 7 --force
```

## Step 6: verify before handover

```bash
scripts/vf.sh verify ghl-workflows
```

Checks the things that are embarrassing to discover after sending a link: a
missing segment, no audio track, silent audio, missing or overrunning
captions, and any beat that got built while still flagged as unreviewed.

## The whole library at once

```bash
scripts/batch.py intake ~/ghl-sources    # a job per video in the folder
scripts/batch.py prep                    # transcribe, segment, rewrite, all
scripts/batch.py queue                   # one review list, not forty files
# review, then for each: registry.py set <slug> --status reviewed
scripts/batch.py render                  # only what is marked reviewed
scripts/batch.py build                   # composite and caption
scripts/batch.py verify                  # QA everything
```

`batch.py` shells out to the same per-job scripts, so there is one copy of the
logic and the batch path cannot drift from the single-job path. One video
failing never stops the rest; failures are collected and printed at the end.

`render` only picks up jobs the registry marks `reviewed`, and nothing sets
that automatically. That is the gate.

## Tests

```bash
python3 .claude/skills/video-factory/tests/test_pipeline.py
```

Covers the fitting arithmetic (including several thousand fuzzed cases), the
beat tiling, the rewrite validator and the caption cue builder. Stdlib only,
no ffmpeg, no keys, well under a second. Run it after touching any of them.

## Calibrate once, on the first video

`GF_WORDS_PER_SEC` is the number every word budget in the pipeline derives
from. The default of 2.5 is a normal instructional pace, but the real figure
depends on the cloned voice and `GF_HEYGEN_VOICE_SPEED`.

After the first render, compare each beat's narration length against its word
count in `work/timing.json`, and put the measured rate in `config.env`. Every
later video needs less fitting.

## What this routine will not do

- It will not face-swap. The avatar is composited over the footage, never
  painted onto the original presenter.
- It will not re-cut the footage. Clicks land where they landed.
- It will not go from a raw source file to a finished video in one command.
  The review gate is deliberate.
- It will not upload anything. The finished file and its captions are on
  disk; putting them into GHL Memberships is still a manual step.
