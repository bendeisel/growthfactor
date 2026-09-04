---
name: bmfg-gym-sites
description: Ben's build standard for gym and martial-arts websites (BMFG) — what he likes, what he rejects on sight, and how a gym site should look, feel and move. Use this whenever the work touches a gym, MMA, jiu-jitsu, boxing, CrossFit, yoga or fitness-studio website — designing pages, editing a hero, styling cards or grids, choosing motion, building a class schedule, or reviewing a build. Trigger it even for casual asks ("make this look better", "the cards feel empty", "add some movement", "why does this look AI"), and even when no gym is named but the project is a fitness client. Read it BEFORE writing markup, picking a colour, or adding an animation, because the whole point is to stop generic AI-looking output from replacing the gym's own identity.
---

# BMFG — how Ben builds gym websites

## The one test that matters

Before anything ships, ask: **would a stranger guess this was generated?**

If yes, nothing else you did counts. Ben's verbatim rejections have been
"looks ai", "cookie cutter", "nothing about this is modern", and "it ends up
exactly like every other site it has built". This is the failure mode that
kills the work, not bugs and not missing features.

The second test: **does it look like the last gym site we shipped?** Same-city,
same-vertical collisions are the ones clients actually notice.

## What "AI-looking" concretely means

These are the specific tells, learned from things Ben has rejected:

- **A uniform grid of soft rounded cards with thin outlines.** This is the
  single biggest tell. Identical rectangles, evenly spaced, each with a hairline
  border and a title-plus-two-lines-of-grey-text. It reads as a component
  library, not a gym.
- **Rounding everything.** Most gym brands have a radius rule already — often
  square panels with rounded buttons only. Rounding the panels erases the one
  bit of geometric personality the brand owned.
- **Even spacing everywhere.** No hierarchy, no punctuation, every section the
  same height and rhythm.
- **Centred hero + centred subhead + centred button pair** over a low-opacity
  photo.
- **Three-column icon/label/paragraph grids.**
- **Decorative statistics** — round numbers nobody can source.
- **Everything on one page.** Ben asked "why is everything on one page?" — long
  scrolling one-pagers read as generated. Gyms need real pages.

When a reference the client sends *is itself* generic (a SaaS landing page, a
component-library screenshot), say so before building it. Building it faithfully
produces the exact look they'll reject. Ben sent a clean SaaS card grid asking
for "classic style" cards, got exactly that, and called the result AI.

## The feel Ben is after

**Dark and cinematic.** Near-black grounds, one metallic accent, photography
doing the heavy lifting. Not "clean and airy".

**Confident to the point of cocky.** He kept a headline reading "Five stars,
repeatedly" specifically because it was cocky — "good for our brand." Gyms sell
transformation and toughness; timid copy and timid layout both undersell.

**Alive.** Something should always be quietly moving. His words for the target:
*"just sort of like a spark that's going around... not too 'holy crap, that's
hurting my eyes and giving me a seizure,' but more like 'I see that now.'"*
A visitor should do a double-take, not get a light show.

**Big.** He has asked for larger type more than once, at every level — H1, H2,
H3 and body. When in doubt, go larger. Body copy at 15px will get flagged;
17–19px reads right on a dark ground.

**No dead air inside components.** "A lot of wasted space on these cards" is a
recurring note. If a block is tall because a neighbour is tall, make its content
fill the block rather than float in the middle of it.

## Non-negotiables

**Motion must be JavaScript, never CSS animation.** Ben's browser pauses CSS
animations in low-power mode, so a CSS-animated marquee sat frozen on his screen
while it ran fine everywhere else. Drive anything that must move with
`requestAnimationFrame` and a transform. See `references/motion.md` — this has
bitten the project twice and is the fastest way to lose trust.

**Popup lead forms on every request CTA.** Standing instruction for all
small-business builds unless he says otherwise. Inline-only forms are a miss.

**Copy is the client's, frozen.** Place their words verbatim. Do not tighten,
retitle or "improve" — flag oddities at handover instead. Their real copy is
almost always better positioned than anything invented, and it is the difference
between a review of layout and an argument about prose.

**Never invent facts about real people.** A coach's sport, record, or rank goes
in only if it exists in a source you can point at. Mark the gap in gold italic
and ask. Publishing a fabricated credential for a named human is not a design
shortcut, it's a lie about somebody.

**Never advertise a rating the gym doesn't have.** Star rows and aggregate
figures ("5.0") are claims. At 4.9, the stars come out.

**Verify in a real browser before saying it's done.** Not "the markup looks
right" — actually load it and probe. See `references/verification.md`; the
checks there have caught a silently-broken layout, a video that never looped,
and a publish that shipped a stale file.

## Building the thing

**Start from the client's own kernel.** Exact typefaces, exact hexes, exact
radius rules, pulled from their existing site or print — never approximated from
a screenshot. Amplify what they already own rather than importing a nicer
vocabulary. If a change needs a colour or shape the brand doesn't have, it's out
of scope. For every visual decision, name the existing element it came from.

**Gyms have a specific anatomy** — programme pages are the SEO workhorses, the
schedule is the most-visited page, coaches sell memberships, and kids and adults
are different audiences that should not be mixed in one list. Structure,
page inventory and the schedule data model are in `references/gym-anatomy.md`.

**Class data lives in exactly one file.** Every schedule view — the master grid
and each programme page's times — generates from it. Edit a boxing class once
and it moves on the boxing page and the master schedule together. Ben asked for
this explicitly after seeing a developer's WordPress build do it; duplicating
times into pages is a defect, not a shortcut.

**Photography is the design.** Gyms have real photos of real members. Use them
large. A framed treatment — photo inset in a panel with a slightly lighter black
around it — reads more considered than edge-to-edge bleed, and Ben approved it
across every programme page.

## Working with Ben

- **Cosmetic asks are cosmetic.** When he asks for something to look better, do
  not answer with SEO or accessibility rationale. He caught this once: "did you
  do it for seo? i want cosmetic wins." Give him the visual win, then mention
  the side benefits if they matter.
- **Show, don't assert.** Screenshot it. He judges by eye and will tell you
  quickly. Claiming something works without looking at it has burned this
  project more than once.
- **Keep concerns in separate artifacts.** Homepage in one, inner pages in
  another. Never repoint a canvas's landing page without saying so — landing him
  on a page of placeholders reads as "you broke the homepage".
- **Pages get renamed, moved or added — never removed.** If a page's premise
  stops being true, repurpose it and say so.
- **When something's wrong, find the cause before tuning.** "No gradient" turned
  out to be an unclosed `<div>`, not a colour that needed brightening. Reaching
  for opacity first would have wasted a round and still been broken.

## Reference files

- `references/motion.md` — the rAF rule, why CSS animation fails here, and
  tuned values for drift, shimmer and spark effects.
- `references/rejected-patterns.md` — the specific things Ben has rejected, in
  his words, with what was done instead.
- `references/gym-anatomy.md` — page inventory, the shared class-data model,
  and how programme/schedule/coach pages relate.
- `references/verification.md` — the pre-publish checks that catch real bugs.

## Companion artifact

A readable version of this standard — the memory-palace copy Ben returns to —
lives at https://claude.ai/code/artifact/72cad0e7-ee7c-4fb3-a11f-8af223d739af

Keep the two in step: this skill is what Claude reads at build time, the
artifact is what Ben reads when judging. If a rule changes here, update there.
