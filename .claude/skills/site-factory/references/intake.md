# Intake

What each build routine needs before Step 3, and — the part that matters —
what to do about a gap instead of filling it in.

## The rule about gaps

**A missing fact is reported, never invented.** Everything on a small-business
site is checkable by the client in about four seconds, and one invented class
time or made-up "15+ years experience" costs more trust than the whole build
earns. This is the same instinct behind house-style's ban on decorative
statistics, applied to intake.

Mark a genuine gap in place and carry it to handover:

```html
<!-- GF-TODO: class schedule — not on site, socials, or GBP. Ben to supply. -->
```

`split_pages.py` counts `GF-TODO` markers and prints them, so a build cannot
reach production with unanswered holes nobody remembers.

## Copy, per routine

House-style freezes copy at 99%. That lock assumes there *is* client copy,
which is true for redesign and match, and false for greenfield.

- **Redesign / match:** the client's existing words, verbatim. Mechanical
  repairs only.
- **Greenfield:** copy comes from the client's own real material — Google
  Business Profile description, social bios, print, what they and Ben said in
  intake — quoted or lightly assembled, with the source noted. Where no source
  exists, write a clearly-marked `GF-TODO` placeholder rather than plausible
  marketing prose. Growth Factor writes copy with the client, separately; a
  build that quietly authors it hands them a site making claims they never made.

## site-redesign

The site is the source of truth for identity, so get a real copy of it, not
screenshots.

1. **A full local copy.** `wget --mirror --convert-links --page-requisites
   --no-parent https://client.com`, `httrack`, or saveweb2zip for a
   non-technical handoff. The stylesheet is the point — it carries exact values
   that a screenshot only approximates.
2. **The kernel**, mechanically:
   `python3 ../house-style/scripts/extract_kernel.py ./download --palette -o kernel.json`
3. **Every page and its URL.** The path map decides `data-file` names and
   whether ship needs redirects for changed paths.
4. **Screenshots as a cross-check only** — useful for what the CSS cannot
   show (hover states, a carousel mid-motion), never as the colour source.
5. **What is actually broken.** Illegible text, a dead form, a 13-item
   carousel showing one item. These are the wins worth naming at handover.

If the site is JS-rendered and `wget` gets an empty shell, say so and take
screenshots plus a DOM dump instead of pretending the kernel is extracted.

## site-new

No site, so identity is assembled from whatever real material exists, ranked
by how deliberately the colour was chosen (see house-style
`references/extraction.md`).

1. **What Ben and the client supplied.** Highest priority, always. Ask before
   researching, because it makes half the research unnecessary.
2. **Logo, best available form.** Vector (`.svg`, `.ai`, `.eps`, `.pdf`) gives
   exact fills — read them directly. A raster logo gets sampled, once, and the
   hex is written down and frozen.
3. **Google Business Profile.** Name, address, phone, hours, categories,
   review count and rating, and the photos — often the only real photography
   available. NAP here must match the site's `LocalBusiness` schema exactly.
4. **Social accounts** — Instagram, Facebook, TikTok, YouTube. Take: bio copy,
   profile and cover art, recurring colours, the actual photos, class or
   service names as the business names them, and tone. Treat profile art as a
   colour cross-check only; it is frequently off-brand.
5. **Print and signage**, if they can photograph it. Print is usually spec'd to
   a chosen Pantone or CMYK value, which beats anything sampled from a screen.
6. **Competitors in the same city** — for divergence, not inspiration. Note
   what they look like so the build does not land on it.

If steps 2 through 5 genuinely produce nothing, this is house-style's Case 3:
greenfield. Do not silently invent a direction — put 2 to 4 low-fidelity
direction sketches on a design canvas, let the client pick, and the pick
becomes the kernel, frozen exactly as an extracted one would be.

## site-match

Two inputs, and keeping their roles apart is the whole job.

1. **The reference site** the client wants to be like. Save a copy the same
   way as a redesign. From it, take **structure only**: section order, page
   spine, density, rhythm, how the hero carries its weight, what the nav does.
2. **The client's own brand material.** From it, take **identity**: typefaces,
   hexes, logo, motifs. Same sources and same ranking as `site-new`.
3. **What specifically they like about the reference.** Ask, and write the
   answer down. "I like this site" usually means one thing — the big video
   hero, the pricing table, how the booking flow reads. Structure that answers
   it, rather than mirroring the whole page.

Then state the split back to the client in one line before building, because
this is the routine where expectations diverge most:

> Taking the layout and section flow from `<reference>`, with your Bebas Neue
> and `#D7AD56` gold on `#131313` — so it reads like their structure in your
> brand, not like their site.

**Never import the reference's typefaces, colours, or logo treatment.** That is
house-style's Lock 3, and it is also the difference between a site that
resembles a competitor and a site that is a copy of one. If the client's real
request is "make it look exactly like theirs", say plainly that it makes their
brand invisible and lands them on their competitor's identity, offer the
structural match instead, and if they still want it, that is their call.

## Recording intake

Everything gathered goes in `projects/<slug>/`:

```
projects/<slug>/
├── kernel.json      the frozen kernel
├── intake.md        sources, with URLs and dates, and open GF-TODOs
├── reference/       the saved reference copy (site-match)
├── download/        the saved client site (site-redesign)
└── img/             logos and photography, sized
```

`intake.md` cites where each fact came from. Six weeks later, when the client
disputes a phone number, that citation is the difference between checking and
guessing.
