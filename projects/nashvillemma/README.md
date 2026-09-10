# Nashville MMA Training Camp

## One artifact, the whole site

https://claude.ai/code/artifact/c17104b0-28ad-4c03-bcec-f06c74440859

Every page of the site lives in that one artifact, switched by the nav: 44
pages, the hero video and all photography embedded, nothing loaded from a
path that only resolves on our machines. It replaced the two design canvases
(a homepage canvas and an inner-page canvas), which were separate artifacts
per stage of the work and could not be reviewed as a site.

The rule is in `site-factory`: one artifact per site, redeployed to the same
URL, never one artifact per page. Working files stay split by stage in
`design/` and `design-pages/`, and that is fine. The artifact is not.

## Contents

- `kernel.json` — the locked brand kernel, extracted from the client's 97Display site.
- `design/` — homepage artboards: desktop, mobile, brand reference, hero
  explorations. The source the homepage was built from.
- `design-pages/` — inner-page artboards: schedule, program detail, and the
  stamp every program page was cut from.
- `content/` + `source/` — the full-site harvest (56 pages, 115 images). Every
  word placed on an inner page comes from here, so the 99% copy lock holds by
  construction.
- `assets/gymhero.mp4` — the client's hero video, full quality (1920x1080, 12.4s,
  7.5MB). This is the file the production build uses. The design artboards carry
  smaller embedded copies (960/640px, VP9+H.264) purely for the mockup.

## Status

- All 44 pages built and in the artifact: homepage, schedule, 14 program pages,
  coaches index plus 16 coach pages, about, contact, reviews, FAQ, events,
  recovery, sponsors, blog, privacy, terms.
- Copy on every page comes from `content/`, so the 99% copy lock holds by
  construction.
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

## Class data is single-source

`data/classes.json` is the only place a class time or name exists. Every
schedule view is generated from it by `data/render_schedule.py`:

- the master schedule grid (all 86 classes, aligned by start time)
- each program page's own class times (filtered by program tag)

Program tags are derived from class names by rule, not typed per page, so
renaming a class can't leave a program page showing the old name. Change a Jiu
Jitsu class once and it moves on both the master schedule and the Jiu Jitsu
page — which is the behavior the client asked for.

```bash
python3 projects/nashvillemma/data/build_classes.py     # rebuild classes.json
python3 projects/nashvillemma/data/render_schedule.py \
        projects/nashvillemma/design-pages              # re-render every view
```

The artboards carry `<!-- GENERATED:… -->` markers; the renderer replaces only
what is between them, so hand-designed layout around the schedule is preserved.
In the production Astro build this same JSON becomes a content collection and
the templates do the same filtering at build time.
