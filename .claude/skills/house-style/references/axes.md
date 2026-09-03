# The axes kit

Variation comes from combining a few independent axes and logging what you
used — not from maintaining a catalog of finished themes. This file holds the
axes and the arithmetic for why.

## Why axes instead of a theme library

Theme collisions follow the birthday problem. With `N` themes assigned across
`k` clients, the chance that at least two match is roughly `1 - e^(-k²/2N)`,
so a 50% chance of collision arrives at about `k ≈ 1.18 √N`.

Protection scales with the **square root** of library size:

| Themes | Clients before a 50% chance two match |
| --- | --- |
| 10 | ~4 |
| 30 | ~6 |
| 100 | ~12 |
| 1,800 | ~50 |

Going from 10 themes to 30 buys two extra clients. Serving 50 clients without a
visible repeat would need ~1,800 themes. A catalog cannot win this fight.

Worse, the model is optimistic: it assumes collisions are spread evenly. Real
ones cluster inside a vertical and a city, which is exactly where they get
noticed.

The axes below give 19,200 combinations from 32 maintained items:

```
8 structures × 5 type stances × 4 densities × 4 rhythms × 6 color stances
                                            × 5 motion stances = 19,200
8 + 5 + 4 + 4 + 6 + 5 = 32 things to maintain
```

Matching that with finished themes would take roughly 19,200 of them. Adding one
axis of five items multiplied the space five times over; adding five more themes
to a catalog of thirty buys nothing measurable.

Catalogs multiply maintenance. Axes multiply output. And the log — not the
count — is what actually prevents repeats, because it checks against
neighbours instead of trusting randomness.

## Axis 1 — Structure (the page spine)

How the page organises itself vertically. This is the axis with the most
visible effect, so vary it first.

- **A. Full-bleed bands** — every section edge-to-edge, alternating grounds.
- **B. Boxed column** — constant max-width content on one ground, wide margins.
- **C. Split-screen** — recurring 50/50 with image or map on one half.
- **D. Offset asymmetric** — content pinned hard left or right, imbalance kept.
- **E. Editorial rail** — narrow text column with a wide margin carrying labels,
  numerals, or rules.
- **F. Dense mosaic** — multi-column card grid, whitespace deliberately scarce.
- **G. Layered overlap** — sections bleed into each other with negative margins.
- **H. Sticky anchor** — one persistent element (nav, form, image) while the
  rest scrolls past it.

## Axis 2 — Type stance

The kernel fixes *which* faces you use. This axis is *how* they are used.

- **1. Extreme contrast** — display 6–8× body. Poster logic.
- **2. Moderate contrast** — display 3–4× body. Conventional marketing.
- **3. Flat** — 1.5–2×. Hierarchy from weight and space, not size. Reads
  utilitarian or editorial.
- **4. Condensed caps dominant** — the display face set in caps carries the
  whole page, body kept small and quiet.
- **5. Body-led** — no display type at all; weight, case, and rules do the work.

## Axis 3 — Density

Information per screen. Pick deliberately; do not default to airy.

- **Airy** — one idea per viewport.
- **Balanced** — a section reads in one screen.
- **Dense** — multiple sections visible at once.
- **Packed** — deliberate maximalism, no idle space.

## Axis 4 — Rhythm

The vertical spacing pattern between sections.

- **Even** — one constant gap throughout.
- **Accelerating** — gaps tighten as the page approaches the primary action.
- **Punctuated** — regular gaps broken once by an oversized moment.
- **Interlocked** — no gaps; sections abut or overlap directly.

## Axis 5 — Color stance

Again: no new colors. This is how the kernel's existing hexes get deployed.

- **Dark-dominant + accent** — dark ground, accent used sparingly.
- **Light-dominant + accent** — light ground, accent for emphasis only.
- **Accent-dominant** — the brand color becomes the ground itself.
- **Duotone** — two kernel colors, nothing else, including for imagery.
- **Alternating high contrast** — sections flip between the two extremes.
- **Monochrome + one accent moment** — accent appears exactly once, at the
  primary action.

## Axis 6 — Motion stance

A still artboard is not a website, and motion is the axis that decides whether
the built page reads as designed or as an export. Full treatment, including the
physics and the banned defaults, is in `references/motion.md`.

- **M1. Static** — no motion beyond instant state change. Utilitarian, fast.
- **M2. Reveal** — content arrives on scroll, then the page is still.
- **M3. Continuous** — exactly one element never stops; everything else is dead
  still, and the contrast is the effect.
- **M4. Reactive** — motion only on input: hover, drag, cursor, scroll direction.
- **M5. Cinematic** — sustained scroll-driven choreography. High effort, real
  performance risk, needs justifying.

Motion is kernel-derived like everything else. Hard-edged 0px geometry wants
linear cuts; round geometry can carry a spring. Picking an easing curve because
you like it is the same drift as picking a typeface because you like it.

## Picking a combination

1. Read `data/shipped-log.csv` and find same-vertical neighbours within ~100mi.
2. Choose a combination where at least two of {type stance, color stance,
   structure} differ from every one of them. Motion stance is not one of the
   three required differences, but a neighbour sharing it will feel closer than
   the three axes predict, so break the tie there when you can.
3. Sanity-check against the client's kernel — an accent-dominant stance needs an
   accent that can carry a whole ground, and a flat type stance needs a body face
   with usable weights. If the kernel cannot support the combination, pick again
   rather than importing something to make it work.
4. Log the combination you shipped.
