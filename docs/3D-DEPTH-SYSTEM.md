# The Depth System — "futuristic and expensive" without wrecking the site

## The trade you have to understand first

Real-time 3D on the web is expensive in exactly the way that hurts these three
niches most. A Spline embed needs `runtime.js` plus a `.splinecode` scene before
anything renders; measured CPU time for even a *simple* scene runs to
[~17.9s on desktop](https://webdesign.tutsplus.com/how-to-optimize-spline-3d-scenes-for-speed-and-core-web-vitals--cms-108749a),
and because 3D resolves later than the rest of the page it pushes surrounding
content around and wrecks CLS.

Restoration, medical, and gym sites live or die on **mobile local search**. A
water-damage emergency lead is a person on a phone, on cellular, panicking. Losing
that lead to a 6-second hero is a catastrophic trade for a visual effect.

So the rule for this library:

> **Nothing 3D is ever the LCP element, and nothing 3D ever blocks first paint.**
> The LCP element is always text or a static poster image.

The good news: almost none of the "expensive futuristic" look actually requires
real-time 3D. It requires *depth cues* — layering, light, parallax, material. Those
are cheap.

---

## Four tiers

Each Bricks component exposes a `depth` property (0–3). The skin sets the default;
a section can override it. This makes "add more 3D" or "calm it down" a one-token
change instead of a rebuild.

### Tier 0 — CSS depth (always on, ~0 KB)

This is the workhorse. It gets you most of the way to the look, on every device,
for free.

- **Layered mesh gradients** — 2–3 large blurred radial gradients at low opacity,
  offset behind content. Reads as atmospheric lighting.
- **Glass surfaces** — `backdrop-filter: blur()` + 1px inner highlight border +
  low-alpha fill. The single most "expensive-looking" cheap effect there is.
- **Rim light** — an inset top-edge highlight (`box-shadow: inset 0 1px 0 rgb(255 255 255 / .12)`)
  on dark cards. Suggests a physical bevel.
- **Card tilt** — `rotateX/rotateY` a couple of degrees on hover with
  `transform-style: preserve-3d` and `perspective` on the parent. Sub-degree amounts
  read as premium; large amounts read as a 2013 jQuery plugin.
- **Scroll parallax with zero JS** — native `animation-timeline: view()` /
  `scroll()`. Background layers drift at different rates. No scroll listener, no
  jank, no library.
- **Grain overlay** — a tiled 128×128 noise PNG at 3–5% opacity over gradients.
  Kills banding and instantly reads as "designed" rather than "default."
- **Long soft shadows + glow** — one large, low-opacity, offset shadow beats three
  tight ones every time.

### Tier 1 — Pre-rendered 3D (the default for heroes)

**Model the 3D scene in Spline or Blender, then render it out as a looping video or
image sequence instead of shipping the runtime.**

For a hero that the visitor does not interact with, a pre-rendered loop is visually
*identical* to real-time, at roughly 200–500 KB, with no runtime, no main-thread
cost, and no CLS.

Implementation:
- Render 6–10s seamless loop, AV1 with WebM/VP9 fallback, ~1600px wide
- `<video autoplay muted loop playsinline preload="none" poster="...">`
- Poster is a WebP still from frame 0 — **the poster is the LCP element**, so it must
  be optimised like any hero image
- Explicit `aspect-ratio` on the container so nothing shifts
- `prefers-reduced-motion: reduce` → poster only, video never loads
- Save-Data / slow connection → poster only

Per-niche art direction:
- **Restoration** — slow-orbiting water droplet with caustics; or a thermal/moisture
  scan sweeping a wall section. Cool blues cut by the safety-amber accent.
- **Medical** — soft abstract forms, gentle DOF, cellular or molecular motifs. Very
  slow drift. Nothing clinical or stock-medical.
- **Combat / fitness** — brushed metal and forged-steel geometry, hard rim lighting,
  slow rotation, heavy contrast. Or a dust/particle field in a single shaft of light.

### Tier 2 — Lightweight real-time (accents only)

When something genuinely needs to respond:

- **Fragment-shader canvas** (~5 KB, no library) — animated aurora/gradient fields,
  flowing noise, subtle displacement. Enormous perceived production value per byte.
- **Rive** — vector, GPU-accelerated, tiny, genuinely interactive. Better than 3D
  for animated icons, process diagrams, and logo states.

Both lazy-init on `IntersectionObserver`, pause when off-screen, and never run above
the fold on mobile.

### Tier 3 — True interactive 3D (paid add-on)

Spline or three.js with real interaction. Reserve this for clients who pay for it.

Non-negotiable guardrails:
- Lazy-load on intersection, never in the initial bundle
- Container has reserved dimensions before load — zero CLS
- Static poster shown until the scene is interactive
- Mobile falls back to the Tier 1 video
- Hard budget: 1.5 MB total, and it must still pass the CWV gate

If it cannot pass the gate, it does not ship. No exceptions for "the client loves it."

---

## The 3D asset library

Build these once, reuse across every site. Stored as source scenes plus rendered
outputs so re-colouring to a client's brand is a render, not a remodel.

```
assets/3d/
  restoration/  droplet-orbit/  thermal-sweep/  particle-dust/
  medical/      soft-forms/     molecule-drift/ light-field/
  combat/       forged-geo/     metal-shard/    dust-shaft/
  shared/       mesh-gradients/ noise-tiles/    shader-snippets/
```

Each in: `.spline`/`.blend` source · 6–10s AV1 + VP9 loop · WebP poster ·
2× still renders for section backgrounds.

**Render each in the three skin accent colours up front.** Then applying a client's
brand colour to their hero is picking a file, not opening Blender.

---

## Where depth goes (and where it must not)

| Section | Depth | Notes |
|---|---|---|
| Hero | 1–2 | Poster is LCP. Video is decoration. |
| Trust bar | 0 | Must be instantly legible. |
| Service grid | 0–1 | Glass cards + hover tilt. |
| Stats band | 1 | Dark section, gradient + grain. |
| Before/after | 0 | The photos are the effect. Do not compete with them. |
| Testimonials | 0–1 | Glass card at most. |
| Pricing | 0–1 | Rim light on the featured tier only. |
| Contact / form | **0** | Never. Conversion surface stays boring and fast. |
| Footer | 0–1 | Fine place for a subtle gradient. |

The discipline that separates expensive from tacky is **restraint**: one dramatic
moment per page, usually the hero, and everything after it is calm. A site with
depth everywhere reads as a template. A site with one great hero and disciplined
whitespace reads as $10k.

---

## The "$10k look" checklist

Depth is one ingredient. These matter as much and cost nothing:

- **Type scale with real contrast** — hero headline at 4–6rem against 1rem body.
  Timid type is the number one tell of a cheap site.
- **Two fonts, maximum.** One is often better.
- **One accent colour, used sparingly.** Accent on CTAs and almost nothing else.
- **Generous whitespace** — section padding of 6–10rem desktop. Cramped = cheap.
- **A consistent 8pt grid** for every spacing value.
- **Slow, subtle motion** — 400–700ms, ease-out, small distances. Fast bouncy
  animation reads as amateur.
- **At least one full-bleed dark section** to create rhythm and depth.
- **Real photography.** The single biggest differentiator. Obvious stock undoes
  everything else — which is why the pre-graded image packs are colour-treated to
  each skin, and why swapping in the client's real photos is the top priority during
  the review week.
- **Custom iconography**, one consistent stroke weight. Never mixed icon sets.
</invoke>
