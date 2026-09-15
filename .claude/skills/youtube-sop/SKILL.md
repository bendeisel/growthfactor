---
name: youtube-sop
description: Turn a YouTube video into an SOP, summary, checklist, prompt, workflow spec, or content swipe. Use whenever a YouTube link or video ID shows up with an ask like "make an SOP from this", "summarize this video", "what's the process here", "turn this into steps", "build me a checklist", "can our agents do this", or just a bare link with no instruction. Also use when a transcript is pasted and needs to become a document. It pulls the transcript directly from YouTube with no paid transcript site, then writes the deliverable in Growth Factor's voice.
---

# YouTube to deliverable

Ben sends a link. This skill gets the transcript for free, then produces
whatever he asked for. Default when he does not say: an SOP.

## 1. Get the transcript

Run the script. It needs no API key, no account, and no transcript site.

```bash
python .claude/skills/youtube-sop/scripts/transcript.py "<url>" --timestamps \
  --out /tmp/transcript.md
```

Flags: `--timestamps` to keep times (use it, they become SOP section anchors),
`--json` for structured cues, `--out FILE` to write instead of printing.
Multiple videos: run it once per link, then write one combined document.

The script tries yt-dlp (module, then CLI), then YouTube's own player
endpoint. Read the transcript file before writing anything.

### Where this runs matters

The script fetches over the network, so it only works where YouTube is
reachable:

- **Claude Code on Ben's own machine, or openclaw:** works. This is the
  path the script is built for.
- **Claude Code on the web, a sandbox, a CI runner:** blocked at the egress
  proxy. The script detects this in about a second and exits 3. Do not try
  to install anything, do not retry, the request never leaves the box.

Check the exit code and route accordingly instead of guessing.

### If it fails

- **Exit 3, blocked egress.** Say so in one line, then ask Ben to paste the
  transcript using the YouTube method below. Do not offer to install
  packages, nothing installed locally can open a blocked proxy.
- **Exit 3, but YouTube is reachable.** Different problem, a stale fetcher.
  `pip install -U yt-dlp` and run again. YouTube changes its internals
  often and yt-dlp tracks those changes.
- **Exit 2, no captions.** The video genuinely has none. Say so, then offer
  to transcribe the audio, or let Ben find a different video.
- **Ben pastes a transcript.** Skip this whole step and go to step 2. This
  is a normal path, not a failure, treat it as such.

### The paste method, when asking is the right move

Tell Ben this, in short form. It is free, unlimited, and beats every
transcript site:

1. Open the video on desktop.
2. Expand the description, the `...more` under the title.
3. Click **Show transcript**. A panel opens on the right.
4. Click just before the first word, scroll to the bottom of the panel,
   **Shift+Click** after the last word, Ctrl+C.

Do not tell him Ctrl+A. Inside that panel it selects the entire page, not
the transcript, and he has to start over.

Timestamps toggle on and off from the three-dot menu in that panel. Ask him
to leave them on when the output needs step anchors.

Prompts, commands, code and settings shown on screen are never in the
transcript, it only carries what was spoken. When the video looks like it
demonstrates any of those, ask for the description text, the pinned comment,
and screenshots alongside the transcript. Reproduce anything he sends
verbatim in a code block, never paraphrased.

Never send Ben to a paid transcript site. YouTube's own panel does the same
job with no cap.

## 2. Pick the output

He names the format most of the time. Map it:

| He says | You produce |
|---|---|
| SOP, process, steps, how do they do it | **SOP** |
| summary, TLDR, what's in this, brief me | **Summary** |
| checklist, punch list, what do I need to do | **Checklist** |
| prompt, make an agent do this, automate this | **Agent spec** |
| swipe, hooks, content, post ideas, script | **Content swipe** |

Nothing named, bare link: write the **SOP**. If the video is plainly not a
process video (a talk, a case study, a rant), write the **Summary** instead
and say in one line why.

Templates are in `references/formats.md`. Read that file before writing.

## 3. Write it

Rules that override the video's own wording:

- **No em dashes anywhere.** Comma, period, or colon.
- **No stale marketing words.** Banned: premier, elite, unleash, step into,
  start your journey, game changer, revolutionize, in today's fast-paced
  world, dive in, unlock, supercharge, seamless, leverage as a verb.
- Short lines. Concrete verbs. No throat clearing.
- **Every step is an action someone can do.** "Understand the funnel" is not
  a step. "Open GHL, Automation, New Workflow, pick Form Submitted" is.
- Keep the video's specifics: tool names, exact settings, field names,
  numbers, prices, thresholds. Those are the whole value.
- Cite times as `[12:04]` on any step where watching the video would help.
- Separate what the video said from what you added. Anything you inferred
  goes under **Gaps** at the bottom, never buried inside a step as if the
  video said it.
- Salesy filler, upsells, and sponsor reads in the video do not make it into
  the document.

## 4. Save and hand over

Write the file to `sops/<video-slug>.md` in the repo, create the folder if
it is not there. Say where you put it in one line.

Then reply with the document itself in chat, not just the path. If it is
long, or he will send it to a client or a VA, publish it as an Artifact so
it has a link.

Commit only if he asks.
