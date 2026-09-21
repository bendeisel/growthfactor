# Video factory: handover

The pipeline is built and the composite math is verified end to end. What is
left is the half that needs accounts, a face, a voice and a judgement call.

Two owners. Ben owns identity, rights and the review gate. Lorenz owns
installing it, calibrating it, and running the library through it.

---

## Ben

### Before Lorenz can run anything

- [ ] **Confirm the footage rights.** Pull source videos from HighLevel's
      white-label asset library on the Agency Pro tier. Not their YouTube
      channel. Check the current white-label terms and note what they allow.
      Everything downstream assumes this is settled.
- [ ] **Lock the white-label product name.** This goes in `GF_PRODUCT_NAME`
      and it is the name the narration says out loud in every video. Changing
      it later means re-rendering the whole library, because it is baked into
      the audio.
- [ ] **Build the HeyGen avatar.** Record to their spec: even lighting, plain
      background, neutral resting face, a few minutes of natural speech. A
      rushed avatar recording is visible in every one of the forty videos.
- [ ] **Clone the voice** in the HeyGen UI. Read varied material, not a
      monotone script. Instructional content has more pitch range than people
      expect.
- [ ] **Hand Lorenz the keys**: HeyGen API key, Anthropic API key. Both bill
      per use, so they go in `config.env`, which is git-ignored, and nowhere
      else.

### Brand calls, needed before the first build

- [ ] **Avatar background colour** (`GF_AVATAR_BG`). In disc mode it is the
      colour inside the circle, so pick a brand colour. In cutout mode it is
      what gets keyed out, so pick something that appears nowhere on your
      clothing.
- [ ] **Disc or cutout** (`GF_PIP_STYLE`). Disc is the safe default and works
      on any plan. Cutout looks better and is fussier about the background.
      Decide by looking at one built beat in each, not in the abstract.
- [ ] **Corner and size** (`GF_PIP_POSITION`, `GF_PIP_SIZE`). Whichever corner
      the source videos leave emptiest. GHL's own UI puts a lot in the top
      left, so bottom right is the usual answer.
- [ ] **Voice note for the rewrite** (`GF_EXTRA_VOICE`). One line of anything
      the prompt template does not already cover. The banned-words list and
      the no-em-dash rule are already in
      `templates/rewrite-prompt.md`; edit that file directly for anything
      bigger than a line.

### Assets worth making once

- [ ] **Intro and outro.** Drop them at `video/jobs/<slug>/assets/intro.mp4`
      and `outro.mp4` and the build includes them automatically. Made once,
      reused across the whole library. Keep the intro under five seconds.

### The part that does not get automated

- [ ] **Pick three short pilots**, ideally under ten minutes, covering
      different UI areas. Do not start on the longest video in the library.
- [ ] **Own the review gate.** After `vf.sh prep`, someone reads `review.md`
      with the source video open and checks that every named button matches
      the button the cursor moves toward. Roughly ten minutes a video.

      This does not go away with practice and it is not worth skipping. One
      hallucinated menu name puts a client in your platform looking for
      something that is not there. It is the whole reason `prep` stops instead
      of running straight into renders.

      If you delegate it, delegate it to someone who has actually used the
      product, not to whoever is free.

---

## Lorenz

### Setup

- [ ] **Install ffmpeg and ffprobe** and put both on PATH. On Windows the
      gyan.dev build is the usual one; extract it and add its `bin` folder to
      PATH. `ffprobe` is a separate binary from `ffmpeg` and the pipeline
      needs both.
- [ ] **Install the Python dependencies**: `pip install anthropic faster-whisper`.
      `faster-whisper` downloads its model on first use, so the first
      transcription is slow and later ones are not.
- [ ] `cp config.example.env config.env`, fill it in from Ben's answers above.
- [ ] `scripts/vf.sh doctor` until it prints `ready`. It checks every binary,
      module and key, which is faster than finding out forty beats into a run.
- [ ] `scripts/heygen.py avatars` and `scripts/heygen.py voices --search ben`
      to get the two IDs into `config.env`.

### First video, end to end

- [ ] `vf.sh new <slug> <source.mp4>`, then `vf.sh prep <slug>`.
- [ ] Hand `review.md` to Ben. Do not skip ahead to rendering: `heygen.py`
      refuses while any beat is marked `needs_human`, and that guard is there
      on purpose.
- [ ] `heygen.py render <slug> --dry-run` first, so the cost is known before
      it is spent.
- [ ] `vf.sh render <slug>`, then `vf.sh build <slug>`.

### Calibrate, once, on that first video

- [ ] **Measure the real speaking rate.** Open `work/timing.json`, divide each
      beat's word count by its narration seconds, take the median, and put
      that in `GF_WORDS_PER_SEC`.

      This is the highest-value twenty minutes in the whole project. Every
      word budget derives from that constant, so being wrong by ten percent
      means every beat in every later video needs fitting. Getting it right
      means most beats need almost none.
- [ ] **Tune the overlay** with `composite.py <slug> --beat 7 --force`, which
      rebuilds one beat in seconds instead of rebuilding the video. Try both
      `GF_PIP_STYLE` values here.
- [ ] **Check the strained beats.** The build log names any beat that needed
      more than 1.5 seconds of freeze. Watch those. If they all lean the same
      direction, the speaking rate is still wrong.

### Then the library

- [ ] Loop `vf.sh prep` over the backlog, batch the review handoffs to Ben,
      then loop render and build. Prep is cheap and parallel; renders are
      neither, so queue those.
- [ ] Keep `data/videos.csv` current with `registry.py set <slug> --status ...`.
      `vf.sh` already does this at each stage; the manual command is for
      review and publish.
- [ ] **Optional n8n wrapper.** The pipeline is already resumable and every
      step is a plain CLI call, so n8n only needs to trigger `prep`, notify
      for review, then trigger `render` and `build` on approval. Do not move
      the logic into n8n. It belongs in the scripts where it can be tested.

### Read before changing the timing code

`references/timing.md`. The arithmetic in `segment.py` and `composite.py` is
short but every part of it is load bearing, and the failure mode is a video
that looks fine for the first minute and drifts after that.

---

## Not built, on purpose or not yet

Honest list, so nobody discovers these mid-project.

- **No HeyGen webhook.** Renders are polled every 20 seconds. Fine for a batch
  of forty, wasteful for four hundred.
- **No transparent-background render path.** The avatar comes back on a flat
  colour and is masked or keyed locally. If the plan supports real alpha
  output it is cleaner, especially around hair.
  `references/heygen-api.md` says what to change.
- **No captions.** Neither burned in nor as a sidecar `.vtt`. The rewritten
  script and the per-beat timings are both on disk, so generating a `.vtt` is
  a short script against `work/scripts.json` and `work/timing.json`. Worth
  doing before publishing, since course players expect captions.
- **No upload step.** Nothing pushes the finished file into GHL Memberships.
  Manual for now.
- **Single speaker assumed.** A source video with two presenters talking over
  each other will transcribe into a mess. None of the GHL library is like
  this, but a webinar recording would be.
- **No automated tests.** The composite math and the segment tiling were
  verified by hand against synthetic footage, with predicted durations landing
  to the millisecond. The `fit()` function in `composite.py` is pure
  arithmetic and is the obvious first unit test if this grows.
