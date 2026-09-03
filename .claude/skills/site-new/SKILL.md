---
name: site-new
description: Build a website from scratch for a client who does not have one. Use when there is no existing site to work from and the identity has to be assembled from research and whatever material the client has: "build them a site from nothing", "they have no website", "they just have an Instagram and a logo", "new build for this gym". Researches their social accounts, Google Business Profile, logo and print material, combines that with whatever Ben and the client supply, and builds the whole site. Not for a client who already has a site (site-redesign) and not for one supplying a reference site to imitate (site-match).
---

# Routine: build from scratch

No site to extract from, so identity gets assembled from real material instead
of being invented. That distinction is the whole routine: greenfield means
*sourced from elsewhere*, not *made up*.

Read `../site-factory/SKILL.md` first. This file covers intake and the kernel.

## Step 1 — Ask before researching

What Ben and the client already have outranks anything findable, and asking
first often makes half the research unnecessary. Get: the logo in the best
form they have, brand colours if anyone ever wrote them down, photography,
their hours and phone and address, service or class names as they name them,
and anything they have already told Ben in conversation.

## Step 2 — Research, in order of how deliberately the colour was chosen

The full checklist is in `../site-factory/references/intake.md`. The ranking:

1. **The logo, best available form.** Vector (`.svg`, `.ai`, `.eps`, `.pdf`)
   gives exact fills — read an SVG's fills directly. A raster logo gets
   sampled once, and the hex is written down and frozen from that moment.
2. **Google Business Profile.** Name, address, phone, hours, categories,
   rating and review count, and the photos — often the only real photography
   that exists. The NAP here must match the site's `LocalBusiness` schema
   exactly, because a mismatch actively hurts local ranking.
3. **Social accounts** — Instagram, Facebook, TikTok, YouTube. Take bio copy,
   recurring colours, the actual photographs, how they name their own services,
   and their tone. Profile and cover art are a colour cross-check only; they
   are frequently off-brand.
4. **Print and signage**, if they can photograph it. Print is usually spec'd to
   a Pantone or CMYK value someone chose on purpose, which beats anything
   sampled off a screen. Shoot flat, in shade.
5. **Competitors in the same city** — for divergence, not inspiration. Note
   what they look like so the build does not land on it.

Record every source with its URL and the date in `projects/<slug>/intake.md`.
Six weeks later, when the client disputes a phone number, that citation is the
difference between checking and guessing.

## Step 3 — Assemble the kernel, then freeze it

Write the faces, the hexes, and the motif vocabulary into
`projects/<slug>/kernel.json` by hand — there is no stylesheet to mine, so the
extractor has nothing to read. From the moment it is written it is frozen
exactly as an extracted kernel would be. Every later edit re-reads the file
instead of re-deriving from memory, which is what stops a fourth-round tweak
from drifting off the first-round decision.

State it in one line and wait for confirmation before building.

**If research genuinely produces nothing** — no logo, no print, no usable
social art — this is house-style's Case 3. Do not silently invent a direction.
Put 2 to 4 low-fidelity direction sketches on a design canvas (see the `design`
skill), let the client pick, and the pick becomes the frozen kernel.

## Step 4 — Copy, and the honest limit of this routine

House-style freezes copy at 99%, which assumes there is client copy. Here
there is not, so:

- Use the client's own real words where they exist — Google Business Profile
  description, social bios, print, what they said in intake — quoted or lightly
  assembled, with the source noted.
- Where no source exists, leave a marked gap:
  `<!-- GF-TODO: class schedule — not published anywhere. Ben to supply. -->`

Do not write plausible marketing prose to fill the hole, and never invent a
checkable fact — a class time, a price, years in business, a staff
credential. Everything on a small-business site is verifiable by the client in
about four seconds, and one invented number costs more trust than the build
earns. `split_pages.py` counts `GF-TODO` markers and `deploy_production.sh`
refuses to ship with them open, so a gap cannot quietly become permanent.

## Then: the spine

Steps 3 to 8 of `../site-factory/SKILL.md`. Two notes specific to greenfield:

- **The motif inventory has no site to read**, so it comes from the logo and
  print material and gets written down explicitly. It is frozen as soon as it
  is written.
- **The axes carry more weight here** than on any other routine, because the
  client supplies identity but not structure. Pick deliberately against the
  shipped log rather than defaulting, and be especially wary of the banned
  defaults — an empty brief is exactly the vacuum that fills with a centered
  hero and a three-column feature grid.
