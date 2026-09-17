---
title: Session Management SOP
tags: [growth-factor, claude, sop, websites, process]
created: 2026-09-17
owner: Ben
applies-to: Website builds in the growthfactor repo
---

# Session Management SOP

How to decide when to start a new Claude session during a website build, and
how to carry context across the break without re-explaining the client.

## The rule in one line

**Context lives in the repo, not in the chat.** A session is disposable. The
project folder is not.

If ending a session would lose something, that something was in the wrong
place. Write it to `projects/<slug>/` and the session becomes free to end at
any time.

## Why memory does not replace this

Memory and repo state do different jobs. Both are needed.

| Holds | Lives in | Examples |
| --- | --- | --- |
| Rules that never change | Memory and `CLAUDE.md` | No em dash. Windows paths only. Automate Everything. |
| State that changes every session | `projects/<slug>/` in git | Kernel hex values. Frozen copy. Standing client instructions. Open items. |

The second category is not a memory problem, it is an auditing problem. If a
session misremembers a hex value, nothing catches it. If `kernel.json` changes,
it shows up in a diff and in the PR. That property does not improve with better
models, so the split stays permanent.

## Session map for a site build

Start a new session at each phase boundary. A full site is four to seven
sessions, not one marathon.

| # | Session | Ends when |
| --- | --- | --- |
| 1 | Intake and kernel | `kernel.json` is written and the one-line kernel is confirmed |
| 2 | Homepage build | Homepage is in the artifact and published |
| 3 | Inner pages | One session per batch sharing a layout stamp |
| 4 | Polish and audit | `/polish` runs clean |
| 5 | Preview | Preview URL is live and the registry row is updated |
| 6 | Ship | Production deploy is verified |

### Audit always gets its own session

This one is not optional. A session that just spent three hours choosing a hero
treatment is the worst possible reviewer of that hero, because it defends its
own decisions. A cold session holding only `kernel.json` and the built HTML
catches problems the builder session structurally cannot see.

## Cut early: signals to start fresh mid-phase

- Second compaction inside one build
- It re-proposes something already rejected
- It reaches for a color or typeface that is not in the kernel
- You are re-pasting something you already told it
- You are about to switch clients

## Never do this

- **Never run two clients in one session.** Kernel bleed is real. The
  divergence check exists because same-vertical sites drift toward each other,
  and a shared session accelerates that drift.
- **Never start fresh mid-page.** Finish the surface, close out, then break.
- **Never treat chat scrollback as the handoff.** If the next session has to
  read the old conversation, the handoff failed.

## Opening a session

Paste this first. Fill in the slug.

```
Client: <slug>

Before anything else, read in this order:
1. projects/<slug>/README.md
2. projects/<slug>/kernel.json
3. .claude/skills/site-factory/data/sites.csv (the row for <slug>)

Then tell me back, in one paragraph: current status, what is built, what is
open, and any standing client instruction. Wait for my go before touching
anything.
```

The read-back is the point. It proves context loaded before any work starts,
and it costs one paragraph to catch a session that opened blind.

## Closing a session

Run this **before** the session gets long, not after compaction has already
eaten the detail.

```
Close out this session.

Update projects/<slug>/README.md:
- Status: what is built, what is in review, what is untouched
- Open items: what is blocked, and on whom
- Any new standing client instruction from this session
- Any copy quirk, exact value, or decision worth preserving verbatim

Then update the notes column for <slug> in
.claude/skills/site-factory/data/sites.csv so it matches.

Show me the diff before committing.
```

The registry note and the README status must tell the same story. When they
disagree, the README wins and the registry gets corrected.

## What each file carries

| File | Carries |
| --- | --- |
| `projects/<slug>/README.md` | The handoff. Status, standing instructions, open items, handover flags. |
| `projects/<slug>/kernel.json` | Frozen identity. Colors, faces, measured values. Never edited casually. |
| `projects/<slug>/content/` | The copy harvest. Nothing is ever retyped from memory. |
| `projects/<slug>/SELF-AUDIT.md` | Why, not just what. Which motif each decision came from. |
| `sites.csv` | Which build is this, and where does it live. |
| Build console briefs store | Intake typed once, readable from any later session. |

## Project README template

Keep every project README in this shape so any session can read it the same way.

```markdown
# <Client Name>

One line on what this build is and how it relates to other builds.

## Contents
Short description of each directory that matters.

## Status
What is built. What is in review. What is untouched.

## Standing client instructions
Numbered, permanent, sourced from the client or Ben.

## Needed from client / open items
What is blocked and who owns it.

## Preserved quirks
Anything wrong on the live site that stays wrong on purpose, flagged so no
future session "fixes" it.
```

## If you are Claude reading this

Treat this file as the process, not as background. When you are opening work on
a client build, read the project README and kernel before anything else, and say
back what you found. When a build session is winding down, or when the user says
they are stopping, write the close-out block yourself without being asked. The
close-out is a step in the pipeline, not a favor.

## Quick reference

| Situation | Action |
| --- | --- |
| Finished a phase | Close out, new session |
| Switching client | Close out, new session, always |
| About to audit | New session, cold |
| Second compaction | Close out, new session |
| Mid-page, going well | Keep going |
| Coming back tomorrow | Open with the read-back block |
