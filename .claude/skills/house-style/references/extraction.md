# Extracting a brand kernel

The kernel is the set of values a redesign may not invent: exact typefaces,
exact hexes, and the structural motifs already in use. Extract it mechanically
so nothing gets approximated — approximation is where drift begins.

## Case 1 — The client has a live site (most jobs)

Get a full copy first, then read it locally. A saved copy beats a screenshot
because it carries the stylesheet, and the stylesheet carries exact values.

```bash
# Any of these produce a directory the extractor understands:
#   saveweb2zip.com  (browser, easiest for non-technical handoff)
#   wget --mirror --convert-links --page-requisites --no-parent https://client.com
#   httrack https://client.com
python3 scripts/extract_kernel.py ./client-download --palette -o kernel.json
```

Read the output in this order of confidence:

1. **`tokens` / `token_colors`** — CSS custom properties the client's own
   stylesheet declares. Highest confidence available: the vendor wrote these
   down as the site's theme contract.
2. **`typefaces.webfonts_loaded`** — faces actually fetched from a font host.
   More reliable than `declared`, which includes fallback stacks and icon
   fonts.
3. **`section_variants_used`** — which archetypes the site is on now.
4. **`top_css_colors`** — frequency-ranked hexes; useful when there are no
   custom properties to read.
5. **`image_palette`** — sampled from the largest content images. Treat as a
   cross-check, never as the source of truth. Third-party icons carry other
   companies' colors, and photography skews toward whatever the room was lit
   like.

Then confirm with the user in one line: "matching your existing site — Bebas
Neue over Montserrat, `#D7AD56` gold on `#131313`, square panels with 8px
buttons." A wrong kernel caught here costs a sentence; caught after the build
it costs the build.

## Case 2 — No site, but existing brand material

Rank sources by how deliberately the color was chosen:

1. **Brand guidelines PDF or a logo in vector form** — if there is an `.ai`,
   `.eps`, `.pdf`, or `.svg` logo, the fills are exact. Read an SVG directly;
   for the rest, `references/` in the `pdf` skill can extract.
2. **Printed collateral** — business cards, flyers, banners. Print work is
   usually spec'd to a Pantone or CMYK value someone chose on purpose.
3. **Signage and vehicle wraps** — photograph flat, in shade, then sample.
   Reliable for hue, unreliable for exact value.
4. **Social profile art** — convenient and often off-brand. Cross-check only.

Sample a raster logo with the extractor's palette mode on a directory
containing just that file, or eyedrop it. Either way, write the hex down and
treat it as fixed from then on.

## Case 3 — Genuinely greenfield

No site, no logo, no print. This is the minority of jobs and the only case
where the axes kit supplies the palette rather than the client.

Here, do not silently invent a direction. Offer 2–4 low-fidelity direction
sketches on a design canvas and let the client pick — see the `design` skill
for the canvas mechanics. Once they pick, that combination becomes the kernel
and every later edit is locked to it exactly as if it had been extracted.

## Recording the kernel

Keep `kernel.json` with the project. Every later edit re-reads it rather than
re-deriving from memory, which is what keeps a fourth-round tweak from drifting
away from the first-round decision.

State the kernel explicitly in any handover, because it is the contract the
client can hold you to:

```
Kernel — Nashville MMA
  faces    Bebas Neue (display, caps) / Montserrat 400·700·900 (body)
  ground   #131313 header+footer, #171820 alt section, #1E1E29 cards+inputs
  accent   #D7AD56 primary, #C0883A buttons, #C59543 slogan band
  detail   #303030 separators, #CC9900 inline emphasis
  geometry panels 0px radius, buttons 8px radius, number discs 120px
  motifs   3px gold hairline, oversized numerals, bordered word band
```
