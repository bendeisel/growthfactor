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

### If it fails

- **Exit 3, cannot reach YouTube.** Install the stronger fetcher first:
  `pip install -U yt-dlp`. YouTube changes its internals often and yt-dlp
  tracks those changes; the built-in fallback does not. On a sandboxed or
  proxied box YouTube may be blocked outright, in which case use a fallback
  below and say so plainly rather than retrying.
- **Exit 2, no captions.** The video genuinely has none. Say so, then offer:
  youtube-transcript.com (3 free per day), or Ben pastes the transcript.
- **Ben pastes a transcript.** Skip this whole step and go to step 2.

Do not send Ben to a paid site while the script still has an untried option.

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
