# Furst Place MMA — research, divergence, and plan

## Step 0 — Divergence check (house-style Lock 4)

`shipped-log.csv` has two rows, both **Nashville MMA Training Camp**, martial arts
gym, Nashville TN. Furst Place is in **Hendersonville, TN — about 18 miles away**.
Same vertical, same metro, inside the 100-mile radius. This is the exact case the
log exists to catch: these two gyms compete for overlapping Sumner/Davidson County
search traffic, and a visible resemblance would be noticed by both owners.

Logged Nashville MMA values to steer away from:

| Axis | BEFORE row | UPGRADE row |
| --- | --- | --- |
| Type pairing | Bebas Neue + Montserrat | Bebas Neue + Montserrat |
| Type stance | 4 condensed caps dominant | 1 extreme contrast |
| Color stance | dark-dominant + accent | duotone |
| Structure | A full-bleed bands | E editorial rail |
| Accent / ground | #D7AD56 / #131313 | #D7AD56 / #131313 |

At least two of {type pairing, color stance, structure} must differ from **both**
rows.

**Structure is locked now: not A, not E.** That is a free, safe divergence and it
happens to be exactly what the client asked for (no banner — a banner *is* the
full-bleed A band). Direction is **C split-screen**, detail below.

Type pairing and color stance are kernel-derived and therefore **frozen until the
backup is in hand**. Furst Place is WordPress-on-Hostinger, a different platform
from Nashville MMA's 97Display, so the faces are likely already different — but
that gets *measured*, not assumed. If the kernel comes back Bebas + gold + near
black, structure alone will not satisfy the check and we deliberately push the
second divergence into color stance.

## The no-banner concept

The brief: every Growth Factor site opens on a banner, this one shouldn't, and it
should read like an MMA gym rather than a marketing page.

**Concept — "The Mat Split."** The homepage opens on a full-height 50/50 split:
**STAND-UP** on one side, **GROUND** on the other. Those are the two things Iron
Mike actually teaches, so the gym's whole curriculum *is* the layout. Hovering or
tapping a side drives it toward that discipline's programs.

Why it works here:

- It is honest. A three-column program grid would have begged for a fourth tile,
  which is how Wrestling ended up advertised on a site that does not teach it.
  A two-way split can only ever say two things.
- It is an MMA idea, not a web idea. Stand-up vs. ground is how fighters describe
  the sport to each other.
- It replaces the banner without replacing it with *nothing* — the hero still
  carries a photograph, it just carries two, doing structural work.
- It is buildable as portable vanilla JS/CSS per the house default, so it drops
  into a template platform later as a custom block.

Paired with it: a **sticky "on the mat today" rail** carrying the day's class
times. A real gym has a schedule on the wall; a real prospect wants to know when
they can show up. This is the single highest-intent piece of information on the
site and it is currently buried.

Caveat recorded honestly: the *specific* visual devices — rule weights, corner
treatment, numerals, the mark — must be amplified from the client's existing
motifs under Lock 3. The split is a Step-3 structural axis choice, which is
legitimately allowed to come from outside the client. Everything decorating it is
not, and stays open until the kernel is extracted.

## SEO architecture

The current site is thin and generically titled. The rebuild should carry:

**Local / entity**
- `SportsActivityLocation` JSON-LD (a `LocalBusiness` subtype — more specific and
  better-suited than plain `LocalBusiness`) with geo coordinates, `openingHours`,
  `telephone`, `priceRange`, and `sameAs` → Instagram.
- NAP rendered as real crawlable text in the footer of every page, byte-identical
  to the Google Business Profile.
- Embedded map on the contact page; `hasMap` in the schema.

**Program pages** — one indexable page each, replacing thin tiles:
- `/programs/mixed-martial-arts/`
- `/programs/kickboxing/` *(already exists — preserve the URL, do not break it)*
- `/programs/no-gi-jiu-jitsu/`
Each gets its own `Course`/`Service` schema, its own photography, and its own
title targeting "<discipline> in Hendersonville, TN".

**Areas-we-serve** — the previous builder started this pattern at
`/areas-we-serve/hendersonville/`; keep the URL and extend across Sumner County
and the north Davidson line: Gallatin, Goodlettsville, Hendersonville, Madison,
White House, Portland. These earn their keep only with genuinely distinct copy —
duplicated doorway pages are a liability, so they get written, not spun.

**Schedule** — mark the class timetable up as structured data rather than a flat
image or PDF. This is also what feeds the sticky rail above, so the SEO artifact
and the conversion artifact are the same object.

**FAQ schema** on the highest-intent questions, which are already answered on the
live site: first class free, no contract, no experience needed, what to wear to
no-gi.

**Titles** — the live homepage title is generic. Target pattern:
`Mixed Martial Arts Gym in Hendersonville, TN | Furst Place MMA`, with the
program and area pages varying the head term rather than repeating it.

**Redirects** — the old URL set must be mapped before launch. Cannot be completed
until the DB is in hand; the two URLs confirmed so far are noted above.

## Getting the backups in

The Drive backups exist and are correctly named — the `Fuel Fortress` files are a
genuinely separate site in a separate folder, so nothing is mislabelled.

`Furst Place MMA/` in Drive contains:

| File | Size | What it gives us |
| --- | --- | --- |
| `...-db.gz` | 354 KB | **all page copy**, image filenames, redirect map, theme options |
| `...-uploads.zip` | 6.8 MB | **the photographs** |
| `...-themes.zip` | 14 MB | CSS — the brand kernel (faces, hexes) |
| `...-plugins.zip` | 41 MB | not needed |
| `...-others.zip` | 487 KB | not needed |

**Why I could not just pull them myself:** two independent walls.

1. `furstplacemma.com` is blocked outright by the organization egress policy, so
   scraping the live site for photos and copy is not available.
2. The Drive connector hands files back as **base64 inline in the tool result**.
   The 6.8 MB uploads zip becomes ~9 MB of text (~2.4M tokens), and I would then
   have to retype all of it to land it on disk. `drive.google.com` itself is also
   blocked at the proxy, so there is no direct download path.

**The route that works:** `github.com` is reachable and this repo is already
wired up. Files committed to the repo arrive on disk with zero context cost.
6.8 MB is comfortably inside GitHub's limits.

Put `db.gz`, `uploads.zip`, and `themes.zip` in
`projects/furstplacemma/backup/` on any branch and push. That is all three
blockers cleared in one step.
