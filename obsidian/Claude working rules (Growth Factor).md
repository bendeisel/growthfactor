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

**A site has one artifact, and it is edited, never replaced.** Every client site
has exactly one published artifact holding every page. Work goes into that
artifact by republishing it to its own URL. Version history is how we go back,
so a bad version costs nothing and is never a reason to start a new one.

**Never publish a second artifact for a site that already has one.** Not for a
single page, not for one section, not "just to show you this hero", not because
the change is large, and not because the existing artifact is stale. If it is
part of the site, it goes in the site artifact.

**The artifact URL lives in the project README.** Read it before publishing
anything for a client. A project with no URL recorded means fix that first, not
make a new one.

**Building files is not delivering.** Artboards, HTML and a build folder change
nothing I can see. The work is not done until the site artifact has been
republished and the version shows the change.

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
