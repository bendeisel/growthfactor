# Keeping the narration under the cursor

The one failure mode that makes a rebuilt walkthrough worthless: the viewer is
watching the screen while they listen, and the voice is describing a different
step than the one on screen. Everything in `segment.py` and `composite.py`
exists to stop that.

There are two independent causes. They need different fixes.

## Cause one: the rewrite moves the instructions

Fixed in the prompt and the validator, not in ffmpeg.

The rewrite prompt locks interface names, action verbs, numbers and step
order. The model returns the terms it carried through, and `rewrite.py` checks
each one appears in its own script verbatim before accepting the line. A model
that renames "Workflows" to "the automation builder" fails the check and gets
sent back with the specific term named.

This check is cheap and catches the expensive mistake. Do not weaken it to get
a cleaner-sounding line.

## Cause two: the narration and the footage are different lengths

Fixed in arithmetic.

### Beats tile the source

A beat's footage runs from its own start to the **next beat's start**, never to
the end of its own sentence.

```
transcript:  [--sentence--]   silence   [--sentence--]  silence  [--sentence--]
beats:       [--------------][-------------------------][-----------------------]
```

Cutting on sentence ends would throw away every stretch where a page loads or
the presenter scrolls without talking. Those seconds are real screen action
and the new narration still has to cover them. `segment.py` asserts nothing
about this, but the test in the commit history checks the tiling has no holes
and reaches the source duration exactly.

### The budget comes from footage, not from speech

A beat's word budget is:

```
word_budget = clip_duration * GF_WORDS_PER_SEC
```

Not the original speaker's word count. If the original presenter said forty
words in twelve seconds and then paused for eight, the beat is twenty seconds
of screen time and the budget is fifty words, not forty. Budgeting from the
original speech is the subtle version of this bug: everything looks right and
the video drifts two seconds later with every beat.

`GF_WORDS_PER_SEC` is therefore the most load-bearing number in the config.
Measure it once against a real render and write the measured value down.

### Fitting what is left

Budgets get a line close, never exact. `composite.py` closes the gap:

```
final    = max(avatar_duration, footage / MAX_SPEEDUP)
scale    = clamp(final / footage, 1/MAX_SPEEDUP, MAX_SLOWDOWN)
hold     = final - footage * scale
pad      = final - avatar_duration
```

Narration wins. Cutting audio mid-word is audible; stretching a screen
recording is not. So the beat lasts as long as the line takes, and the footage
is fitted to it.

Both caps default to 1.25. A screen recording at 1.25x reads as a presenter
moving briskly. Past roughly 1.4 it reads as a fast-forward, which is why the
remainder past the cap is taken as `hold`, a freeze on the last frame, which
reads as the presenter pausing on a screen.

Exactly one of `hold` and `pad` is ever nonzero. If `final` came from the
narration, the footage is short and gets held; if it came from the speedup cap,
the narration is short and gets padded with a freeze and silence.

### Reading the output

`work/timing.json` has every beat's numbers. The build log flags any beat
needing more than 1.5 seconds of freeze. Those are not broken, but they are
where the rewrite missed its budget by the most, and they are worth watching
before handover.

Persistent freezes in one direction across a whole video mean
`GF_WORDS_PER_SEC` is wrong, not that the model is bad at counting. Measure
and fix the constant.

## Why the segments are encoded identically

Every segment is written with the same codec, pixel format, frame rate,
timescale and audio parameters, so the final concatenation is a stream copy.
Re-encoding at the concat step would put a second generation of h264 on top of
a screen recording, which is exactly the content where compression artefacts
around text are most visible.

If you change an encoding parameter, change it in `encode_args` so every
segment and every normalised intro still match. One segment encoded differently
makes the concat either fail or silently produce a broken file.

## The mask, in case it looks wrong again

The circular PIP uses a generated PNG as its alpha channel. Two things about
its generation are load bearing and invisible if wrong:

- the frame is forced to gray **before** geq and written with `-pix_fmt gray`.
  Without this, 0 and 255 travel out through a yuv conversion and come back as
  79 and 178, and the disc renders as a translucent smear inside a faintly
  visible square.
- the circle edge is a 1.5 pixel ramp, not a hard cut, so the disc is not
  visibly stair-stepped.

The mask filename carries its size, so changing `GF_PIP_SIZE` regenerates it
rather than silently scaling a stale one.
