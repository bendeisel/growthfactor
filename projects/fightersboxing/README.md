# Fighters Boxing Gym (Fighters Nashville)

Sister project to Nashville MMA: that one is the **dark** site, this is the
**light** one, and the two will interlink through mirrored "Our Gyms" pages.

- `kernel.json` — locked brand kernel, measured from the client's WordPress
  build (Ring theme + Elementor). Light ground, `#181817` ink, `#CC0000`
  logo-ring red, Jost / Didact Gothic / Josefin Sans.
- `source/` — verbatim copy inventory (`copy.md`, the 99% lock) and the raw
  homepage capture (`capture-mobile.html`) from Ben's browser-save zip. The
  session egress proxy blocks the dev domain, so the capture is the record.
- `site/` — the Astro build (static output per
  `.claude/skills/house-style/references/hostinger-delivery.md`).
  `npm install && npm run build` in `site/`; deploy `site/dist/`.

Status: homepage built (first pass). Remaining pages pending.

Standing client instructions:
- Popup lead form on every request CTA — the same LeadConnector "New Trial
  Form" (`link.growth-factor.ai/widget/form/0maCMu9uqM7cqIfqR9Mb`) the WP
  build uses.
- Hero: taller than the WP build, photos crossfading, more rounding than
  Nashville MMA (kernel 20px panel radius on all photos).
- Buttons: measured pill spec plus a red arc that rotates around the
  outside — the logo's red ring in motion.
- Production domain not yet confirmed; astro.config + robots/sitemap assume
  fightersnashville.com. Confirm with Ben before launch.

Handover flags (mechanical, copy untouched — details in `source/copy.md`):
missing dashes in two sentences, live sparring-photo alt says "nashvile-mma",
pre-footer lime `#B6D40E` replaced with kernel white/red.

Needed from client: more gym photos for the hero rotation (capture had only
two usable shots), and the hero background video (`fbg-header.mp4`) if we
ever want it back — not in the zip.
