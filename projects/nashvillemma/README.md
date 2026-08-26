# Nashville MMA Training Camp

## Two canvases — keep them separate

Homepage work and inner-page work live in **different artifacts** so that version
history stays readable. A version bump on one never means "the other changed".

| Canvas | Artifact | Working files |
| --- | --- | --- |
| Homepage (desktop + mobile, brand reference, hero explorations) | https://claude.ai/code/artifact/3e08f59d-8410-4071-a4e5-5c57c1dcd37c | `design/` |
| Inner pages (schedule, program detail, and the rest as they land) | https://claude.ai/code/artifact/ca0d293b-96fd-43a5-ab2e-be808652dfac | `design-pages/` |

Never add an inner-page artboard to the homepage canvas, and never repoint the
homepage canvas's `launch` page at anything but the homepage.

## Contents

- `kernel.json` — the locked brand kernel, extracted from the client's 97Display site.
- `design/` — homepage canvas working files. Any Claude session can re-seed the
  canvas from these (or `--extract` fresh copies from the artifact URL if someone
  has edited it in the GUI since).
- `design-pages/` — inner-page canvas working files. Same re-seed workflow.
- `content/` + `source/` — the full-site harvest (56 pages, 115 images). Every
  word placed on an inner page comes from here, so the 99% copy lock holds by
  construction.
- `assets/gymhero.mp4` — the client's hero video, full quality (1920x1080, 12.4s,
  7.5MB). This is the file the production build uses. The design artboards carry
  smaller embedded copies (960/640px, VP9+H.264) purely for the mockup.

## Status

- Homepage design in review with leadership.
- Inner pages: schedule and Brazilian Jiu Jitsu built with real content. The
  program-detail layout is the stamp for all 13 program pages. Still to design:
  coaches index, FAQ, about, contact, reviews — content for all of them is
  already harvested.
- Nav labels and URLs are wired once the approved sitemap lands. Pages may be
  renamed, moved or added; none will be removed.
- Build target: static site on Hostinger per
  `.claude/skills/house-style/references/hostinger-delivery.md`.

## Standing client instructions

- Popup lead forms on all request CTAs.
- Copy is frozen at 99%.
- Hero stays full-height (background video).
- "90+ classes" is the approved figure.

## Copy quirks preserved verbatim (flagged, never fixed)

- Friday's 11:30 AM No-Gi class ends at "12:30 AM" on the live site.
- The schedule mixes "Gi" / "No-Gi" / "No Gi" spellings across days.
- Two kids' classes on Thursday run the day and age together: "Jiu-Jitsu(ages 6-10)".
