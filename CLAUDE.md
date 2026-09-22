# Growth Factor: working notes for Claude

## People

- Ben (ben@growth-factor.ai) works on **Windows, not Mac**. Give Windows
  keyboard shortcuts and paths only, never "Cmd+..." alternatives.

## Artifacts

- **A site has one artifact, and it is edited, never replaced.** Every client
  site has exactly one published artifact holding every page. Work goes into
  that artifact by republishing it to its own URL. Version history is how we
  go back, so a bad version costs nothing and is never a reason to start a
  new one.

- **Never publish a second artifact for a site that already has one.** Not for
  a single page, not for one section, not "just to show you this hero", not
  because the change is large, and not because the existing artifact is stale.
  If it is part of the site, it goes in the site artifact. A new artifact URL
  means Ben has to hunt for which one is current, and the last one he opened
  is wrong.

- **The artifact URL lives in the project README.** Before publishing anything
  for a client, read it and publish to that URL. If a project has no URL
  recorded, that is the thing to fix first, not a reason to make a new one.

- **Building files is not delivering.** Generating artboards, HTML or a build
  folder changes nothing Ben can see. The work is not done until the site
  artifact has been republished and the version shows the change.

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
