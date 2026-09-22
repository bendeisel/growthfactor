---
title: Claude working rules (Growth Factor)
tags: [growth-factor, claude, standards]
source: growthfactor repo, CLAUDE.md
updated: 2026-09-19
---

# Claude working rules (Growth Factor)

Mirror of `CLAUDE.md` in the **growthfactor** repo. Claude reads the repo copy
automatically at the start of every session. This copy is for me, so the rules
are somewhere I can see and edit them too. If they diverge, the repo copy is the
one Claude obeys, so change that one as well.

## Artifacts

**Never create a new artifact for a client site.** Not for a page, a section, a
hero, a trial, or because the current one is stale or the change is large. I
name the artifact the work goes in, and it gets republished to that URL.
Version history is the undo.

**Edit the artifact I point at, and only that one.** A site can have a full-site
artifact and a working artifact for a section, and I decide which is which. If I
say edit the Muay Thai page, edit it where I am looking. If I say duplicate that
onto the other pages, do it in the same artifact. Unclear which artifact or which
pages? Ask before publishing.

**Republishing the full site is not automatic.** It happens when I ask, from
what I have approved, and it builds on the live version, not on a regeneration
from the repo.

**Artifact URLs live in the project README.** Read it before publishing.

**Building files is not delivering.** Work is done when the artifact I named
shows the change.

## Finishing work

**Do the whole set, or say plainly that you did not.** If a change applies to 14
pages, it goes on all 14 before it is called done. Three of fourteen is not a
version of done, and neither is "the pattern is there, the rest is mechanical".

**A trial on one page is fine, but it is not done.** Scoping a new look to a
single page for review is often the right call. Say which page it is on and which
pages it is not, every time.

**Show coverage, not a sample.** Evidence has to cover the whole set. Six
screenshots out of fourteen pages reads as six pages built, whatever the text
says. List every item and what it got, then sample the pictures if the pictures
would be too many.

**Name what is left.** Anything skipped, blocked or waiting on me gets said in
the same message that reports the work, not held back for a later one.

## Writing

**Never use an em dash. Ever.** Not in site copy, not in docs, not in UI text,
not in commit messages. Rewrite with a comma, period or colon. When client copy
arrives containing em dashes, replace them with the closest natural punctuation
and flag the change at handover.

**Do not number things that are not ordered.** Numbered lists are for steps in a
sequence and for things being counted. Findings, options, reasons, blockers and
observations are none of those, so they get prose or bullets.

**That covers built UI, not just prose.** No index numerals on cards, tiles or
feature blocks, and that holds even when the items do have a natural order like
beginner to advanced. Mark a card with the gold rule or let the heading carry it.

## Setup

Ben works on **Windows, not Mac**. Windows keyboard shortcuts and paths only.

## Related

- Repo: `growthfactor`, file `CLAUDE.md`
- Gym build standard: `.claude/skills/bmfg-gym-sites/SKILL.md`
- Nashville MMA notes: `projects/nashvillemma/HANDOFF.md`
- Components sent to Claude: `projects/nashvillemma/components/`
