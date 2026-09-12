---
name: design-to-code
description: Convert a Claude Design canvas into the real coded site, once, and retire the canvas. Use when a look has been decided visually and now needs to become code: "turn this design into a site", "here's the canvas, build it", "ship this design to code", "code up the artboards", "the client approved the mockup, build it". Also use when deciding whether a job should start in Design at all, or go straight to code. Not for creating a canvas (that is `design`) and not for choosing a look (that is `house-style`).
---

# Design to code: convert once, then the code is the site

## What this fixes

A canvas is good at deciding a look. It is bad at being a website: it cannot
hold a class schedule, it cannot be deployed, and it cannot be edited without
someone re-converting it. So the canvas is a **decision**, not an asset.

The failure mode this routine exists to prevent, taken from the Nashville MMA
build: the canvas stayed the source of truth, code was regenerated from it, and
the two drifted. The repo build ended up 16 pages behind its own artifact, and
a hero background shipped as `url(./hero-bg.jpg)`, a path that resolved on the
canvas and nowhere else. Two sources of truth, one of them silently stale.

Convert once. Then the code is the site and the canvas is retired.

## Does this job start in Design at all

| The job | Where it starts |
| --- | --- |
| New client, no reference, look genuinely undecided | Design, then this routine |
| Redesign of a site they already own | Straight to code. `site-redesign` extracts the look from the site itself |
| They supplied a site they want to be like | Straight to code. `site-match` reads structure from the reference |
| Anything data driven: schedule, roster, FAQ, pricing | Code. Never a canvas question |
| Every edit after version one | Code. Going back to the canvas means editing twice |

If it starts in Design, design the **vocabulary**, not the site: a homepage, one
inner page, and the pieces that repeat. Two or three artboards. Thirteen
artboards means thirteen conversions and thirteen things to drift, and it is
slower than writing the code.

## What the canvas must settle before conversion

Conversion is mechanical only if these are decided. If any is still floating,
it gets decided here and written down, because from that moment it is frozen
exactly as `house-style` freezes an extracted kernel.

- Type: display face, body face, the scale, the weights actually used
- Color: grounds, ink, accent, and what each one is *for*
- Spacing: the section rhythm and the gutter
- Radius: one value, or a stated reason there are two
- Motion: what moves, how far, how fast
- One hero, one card, one inner-page header, one button, one nav

## The conversion

**Step 1. Tokens first, in one place.** Read the artboards and write the
vocabulary as CSS custom properties on `:root`. Every later step references
these. If a value in an artboard does not match a token, the token wins and
the mismatch gets flagged, because a canvas accumulates near-misses that a
human eye let through.

**Step 2. Find the repeats, make them components.** Anything that appears
twice in the artboards is one component, not two blocks of markup. Header and
footer especially: they are written once and shared, never pasted per page.

**Step 3. Find the lists, make them data.** Any set of like things becomes a
data file or a CMS collection: class times, coaches, FAQs, programs, prices.
This is the step that pays for the whole routine. Nashville MMA has 86 class
times in one `classes.json`, and every schedule view is generated from it, so
changing a class time once moves it on the master grid and on each program
page. In a canvas that is nine edits and two misses.

**Step 4. Strip the canvas layer.** Claude Design artboards carry markup that
only runs in the canvas. It all comes out:

- `x-dc-*` attributes, `<helmet>`, `<sc-if>`, and `{{ }}` bindings
- `onClick="{{ handler }}"` becomes a real handler
- absolute positioning and the fixed canvas width become flow layout
- artboard-relative asset paths become real paths

`projects/nashvillemma/data/build_site.py` is a working example of this strip,
including the `url()` rewrite that the first version missed.

**Step 5. Make it responsive on purpose.** An artboard is one width. The
build is not. Reflow at phone width deliberately rather than scaling the
desktop composition down, and check the hero, the nav, any grid, and any table
or schedule. A schedule almost always needs its own narrow treatment.

**Step 6. Wire the real nav.** Every link points at a real path, including
pages that do not exist yet, so a gap shows up as a missing page rather than
vanishing quietly.

**Step 7. Build, bundle, publish, register.** Hand off to `site-factory`:
build the site, run `scripts/bundle_artifact.py` against the built output,
publish to the project's artifact URL, and write the registry row. The artifact
name is `<client> Site` and the bundler enforces it.

**Step 8. Retire the canvas.** In `projects/<slug>/design/`, note the date the
look was converted and that these artboards are the record of a decision, not
a live document. Stop publishing the canvas as its own artifact. From here,
edits go to the code.

## Conversion is done when

- Every section in every artboard exists in the built pages
- Every color, face, size, radius and duration in the build comes from a token
- No `x-dc`, `helmet`, `sc-if` or `{{ }}` survives anywhere
- No fixed pixel width outside a deliberate `max-width`
- Nothing that is a list of things is typed out as markup
- The bundler reports zero missing assets
- It holds together at 400px wide
- `polish` has been run and its findings are fixed or accepted out loud

## Traps

- **Fonts.** An artboard may use a face the client has no license for. Check
  before it becomes a token.
- **Fixed geometry.** The single most common bad conversion is a 1440px canvas
  becoming a 1440px page. It looks right on the machine it was built on.
- **Copy.** If the project has a copy lock, the words come from the harvest in
  `content/`, not from whatever placeholder the artboard carried.
- **Near-miss values.** Canvases collect 19px next to 20px and two greys that
  differ by a hair. Tokens are how that gets cleaned up, so do not carry the
  near-misses across as new tokens.
