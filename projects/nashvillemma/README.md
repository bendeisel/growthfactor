# Nashville MMA Training Camp

- **Live canvas (design source of truth):** https://claude.ai/code/artifact/3e08f59d-8410-4071-a4e5-5c57c1dcd37c
- `kernel.json` — the locked brand kernel, extracted from the client's 97Display site.
- `design/` — the canvas working files. Any Claude session can re-seed the canvas
  from these (or `--extract` fresh copies from the artifact URL if someone has
  edited it in the GUI since).
- `assets/gymhero.mp4` — the client's hero video, full quality (1920x1080, 12.4s,
  7.5MB). This is the file the production build uses. The design artboards carry
  smaller embedded copies (960/640px, VP9+H.264) purely for the mockup.
- Status: homepage design in review with leadership. Remaining pages pending the
  approved sitemap. Build target: static site on Hostinger per
  `.claude/skills/house-style/references/hostinger-delivery.md`.
- Standing client instructions: popup lead forms on all request CTAs; copy is
  frozen at 99%; hero stays full-height (background video); "90+ classes" is the
  approved figure.
