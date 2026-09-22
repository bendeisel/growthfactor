# Growth Factor: working notes for Claude

## People

- Ben (ben@growth-factor.ai) works on **Windows, not Mac**. Give Windows
  keyboard shortcuts and paths only, never "Cmd+..." alternatives.

## Artifacts

- **Never create a new artifact for a client site.** Not for a page, a
  section, a hero, a trial, or because the current one is stale or the change
  is large. Ben names the artifact the work goes in, and it is republished to
  that URL. Version history is the undo, so a bad version costs nothing and is
  never a reason to start fresh.

- **Edit the artifact Ben points at, and only that one.** A site can have a
  full-site artifact and a working artifact for a section, and Ben decides
  which is which. If he says edit the Muay Thai page, edit it where he is
  looking. If he says duplicate that onto the other pages, duplicate it in the
  same artifact. When it is not clear which artifact or which pages he means,
  ask before publishing, not after.

- **Republishing the full site is not automatic.** Ben has said updating the
  full-site artifact on every change is not working. It is republished when
  he asks for it, from what he has approved, not as the tail of every task.
  And when it is, the previous version is what it must build on: v19 of the
  Nashville MMA site carried a header that existed nowhere in the repo, and
  regenerating from the repo replaced it. Read the live version first.

- **Artifact URLs live in the project README.** Read it before publishing. A
  project with no URL recorded means fix that first, not make a new one.

- **Building files is not delivering.** Artboards, HTML and a build folder
  change nothing Ben can see. Work is done when the artifact he named shows
  the change.

## Finishing work

- **Do the whole set, or say plainly that you did not.** If a change applies
  to 14 pages, it goes on all 14 before it is called done. Three of fourteen
  is not a version of done, and neither is "the pattern is there, the rest
  is mechanical". Ben has to be able to trust that finished means finished.

- **A trial on one page is fine, but it is not done.** Scoping a new look to
  a single page for review is often the right call and Ben asks for it. Say
  which page it is on and which pages it is not, every time, and never let a
  trial sit unmentioned as though the site were finished.

- **Show coverage, not a sample.** When reporting, evidence has to cover the
  whole set. Six screenshots out of fourteen pages reads as six pages built,
  whatever the text says. List every item and what it got, then sample the
  pictures if the pictures would be too many.

- **Name what is left.** Anything skipped, blocked or waiting on the client
  gets said in the same message that reports the work, not held back for a
  later one.

## Writing rules

- **Never use an em dash. Ever.** Not in site copy, not in docs, not in UI
  text, not in commit messages. Rewrite with a comma, period, or colon.
  When client copy arrives containing em dashes, replace them with the
  closest natural punctuation and note the change at handover.

- **Do not number things that are not ordered.** Numbered lists are for
  steps in a sequence and for things being counted. Findings, options,
  reasons, blockers and observations are not any of those, so write them
  as prose or bullets. Ben has asked for this many times and it keeps
  coming back, which is why it is written down here.

- **This covers built UI, not just prose.** No index numerals on cards,
  tiles or feature blocks, and that holds even when the items do have a
  natural order like beginner to advanced. Ben calls it one of his big
  no-nos. Mark a card with the gold rule or let the heading carry it.
