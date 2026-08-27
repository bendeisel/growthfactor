# Where the schedule comes from

One schedule, edited by the client in Sanity, rendered everywhere on the
site. Setup steps live in `cms/README.md`; this is the map.

```
Sanity (client edits, presses Publish)
   |
   |-- at deploy time ---> Astro reads it and writes the times into the HTML
   |                       (static, crawlable, works with no JavaScript)
   |
   '-- on page load -----> the page re-checks Sanity and re-renders in place
                           if it changed, so a Publish shows up immediately
```

Where it lands:

| Surface | Shows |
| --- | --- |
| `/schedule/` | the adult week board, filterable, plus the kids block |
| `/beginners-boxing-class/` | boxing basics only |
| `/competition-team-training/` | competition classes only |
| `/youth-boxing-class/` | the kids classes, same cards as the kids block |

The files:

- `site/src/data/schedule.js` the week's shape, the time helpers, and the
  committed copy of the schedule that the build falls back to
- `site/src/lib/schedule-source.js` the Sanity query, used by the build and
  by the browser
- `site/src/lib/render-schedule.js` one renderer for both, so a live update
  produces exactly the markup that was built
- `site/src/scripts/schedule-live.js` the on-load re-check
- `site/src/components/ClassCalendar.astro` the week board
- `site/src/components/SessionCards.astro` the day cards
- `site/src/components/ScheduleStrip.astro` the class-page block
- `cms/` the Sanity schema and a seed file with today's schedule

No credentials are needed to build the site. Without
`PUBLIC_SANITY_PROJECT_ID` the build logs one line and uses the committed
copy of the week, which is the real schedule as of 2026-08-27.
