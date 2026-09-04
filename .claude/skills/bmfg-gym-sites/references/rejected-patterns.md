# Things Ben has rejected, and what replaced them

Kept in his words, because the phrasing is the signal. When a new build starts
drifting toward one of these, that's the moment to stop.

## "That is really really bad… nothing about this is modern"

**What it was:** a dense, information-heavy redesign of the homepage, argued for
on SEO grounds.

**Two mistakes.** Density was wrong for a brand that sells atmosphere. And the
pitch led with search benefit when the ask was cosmetic — he replied *"i want
cosmetic wins. it needs to look madern. your version is way worse. did you do it
for seo and ai search reasons?"*

**Instead:** offer 2–4 visual directions, let him choose, then build. Cosmetic
asks get cosmetic answers.

## "Looks ai" — the card grid

**What it was:** section cards restyled as a uniform grid of 10px-rounded panels
with thin gold hairline outlines, built faithfully from a reference screenshot
he supplied.

**Why it failed:** the reference was itself a generic SaaS component grid, and
the brand's own kernel specified square panels with rounding reserved for
buttons. Rounding the panels threw away the one piece of geometry the brand
owned, and the result read as a component library.

**Instead:** honour the brand's radius rule, use its existing devices — a gold
hairline as connective tissue, oversized numerals, condensed caps — and let
those carry the layout. If a supplied reference is generic, say so before
building it.

## "Why is everything on one page?"

Long one-page scrolls read as generated and bury the pages that earn search
traffic. Gyms need real programme pages, a real schedule page, real coach pages.

## "The gold program strip still isn't moving"

CSS animation, paused by his browser. See `motion.md`. Reported three times
before the cause was found — trust the report over your own test environment.

## "You got a dot that just moves on and off the screen"

Over-correction after the opposite complaint. A glow that was shrunk and thrown
too far. Broad and gentle beats small and dramatic.

## "The cards… are very redundant and need the pictures from the programs"

Placeholder or repeated imagery where real photos existed. The gym has hundreds
of real photos; use them, and never use the same shot twice on one page.

## "A lot of wasted space on these cards"

Blocks sized by a tall neighbour, with content floating in the middle. Let
content stretch to fill its slot so the space lives inside the block.

## Small type

Raised at every level, more than once. Body copy at 15px got flagged; 17–19px
is right. Display headings can go much larger than feels safe — a condensed caps
face is built to run big, and shrinking it on mobile wastes the one face with
real personality.

## Fabricated or unearned claims

- A hardcoded "5.0" and star rows when the gym was at 4.9. Removed: *"we can't
  advertise that right now."*
- A named coach's professional background where no source existed. Left as a
  marked gap rather than guessed.

## Process failures worth avoiding

- **Repointing the canvas landing page** to a page of placeholders. He opened it
  and reasonably concluded the homepage was broken.
- **Publishing without looking.** A silently-stale payload shipped several
  times because the publish step reported success while refusing to write an
  oversized file.
- **Mixing concerns in one artifact.** Homepage and inner pages now live in
  separate artifacts so version history stays readable.
