---
name: site-match
description: Build a site that borrows another site's structure while keeping the client's own brand. Use when the client supplies an example site they want theirs to be like, plus their own brand material: "they want it like this site", "make it like competitor.com but with our colors", "here's a site they love, here's their logo", "combine this reference with their brand". Takes structure and section flow from the reference and identity from the client's kernel. Not for redesigning a site the client already owns (site-redesign) and not for a build with no reference at all (site-new).
---

# Routine: reference plus brand

Two inputs with strictly separate jobs, and keeping those jobs apart is the
entire routine:

- **The reference site** gives **structure**: section order, page spine,
  density, rhythm, what the hero does, how the nav behaves.
- **The client's own material** gives **identity**: typefaces, hexes, logo,
  motifs.

Cross those wires and you have built the client a copy of someone else's site,
usually a competitor's.

Read `../site-factory/SKILL.md` first. This file covers intake and the kernel.

## Step 1 — Ask what they actually like about it

"I like this site" almost always means one specific thing: the big video hero,
the way the pricing table reads, the booking flow, how the class schedule is
laid out. Ask, and write the answer in `projects/<slug>/intake.md`.

This matters because structuring around their real answer produces a site they
are happy with, while mirroring the whole reference produces a site that
happens to resemble it. The first is the job.

## Step 2 — Read the reference for structure only

Save a copy the same way as a redesign, into `projects/<slug>/reference/`.
Then write down, explicitly, what you are taking:

- section order, top to bottom, and what each section is *for*
- the page spine (which of the eight structures in
  `../house-style/references/axes.md` it is)
- density and rhythm
- how the hero carries its weight — height, whether it has a form in it,
  whether it uses motion
- what the nav does, and where the primary action sits

**Do not run the kernel extractor on the reference.** There is no legitimate
use for its hexes or faces, and having them in a file next to the build is how
they end up in the build.

## Step 3 — Kernel from the client, per site-new

Logo first, then Google Business Profile, socials, print. Same ranking and
same rules as `site-new` Step 2 — the checklist is in
`../site-factory/references/intake.md`. Write it to
`projects/<slug>/kernel.json` and freeze it.

## Step 4 — State the split before building

This is the routine where expectations diverge most, so say it in one line and
get agreement:

> Taking the layout and section flow from `<reference>`, with your Bebas Neue
> and `#D7AD56` gold on `#131313` — so it reads like their structure in your
> brand, not like their site.

## Step 5 — Check divergence against the reference too

Normally the divergence check runs against the shipped log. Here it also runs
against the reference itself, and it matters most when the reference is a
competitor in the same city and vertical — which is the usual case, because
that is whose site the client has been looking at.

If the client's kernel and the reference's structure would land close enough
to be mistaken for it, change structure, not identity: a different spine, a
different density, a different rhythm. Same section *order* is fine; the same
overall impression is not.

## Then: the spine

Steps 3 to 8 of `../site-factory/SKILL.md`.

## The conversation to have if they want a straight copy

Sometimes the real request is "make it look exactly like theirs". Say plainly,
once, what that costs: their brand becomes invisible, they land on their
competitor's identity, and anyone who knows the competitor reads their site as
the cheaper version of it. Offer the structural match instead.

If they still want it after hearing that, it is their business and their call —
build it, note the decision in the shipped-log row, and keep their kernel
wherever it does not fight the request.
