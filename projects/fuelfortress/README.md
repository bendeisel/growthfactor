# Fuel Fortress Nashville

24 hour weightlifting gym, 412 Davidson Street, on the line between downtown
Nashville and East Nashville. Four locations across Kentucky and Tennessee, so
copy that talks about access has to mean all four, not this one.

## One artifact, the whole site

https://claude.ai/code/artifact/3d3013c1-ef40-43f2-969b-2bf50799ea05

Six pages: home, equipment, the gym, add-ons, membership, kickboxing. Real
copy throughout, taken from the client's own site and their Google reviews.

## The build is finished. The media is not.

Every photo and video in it is a **named placeholder slot**, not a missing
file. The build recorded the filename it expects and, where it knew, the
original file it came from. `media-manifest.csv` is that list: 21 files.

Drop them in `source/img/` and `source/video/` under the target names in the
manifest, and they replace the placeholders outright. The slots exist so a
missing photo is visible rather than a silent gap, which is why the page does
not look broken without them, it looks unfinished on purpose.

```bash
# what is still missing, once files start landing
python3 - <<'EOF'
import csv, os
for r in csv.DictReader(open('projects/fuelfortress/media-manifest.csv')):
    p = os.path.join('projects/fuelfortress/source', r['target'])
    print(('have ' if os.path.isfile(p) else 'NEED '), r['target'],
          '  <-', r['original'] or '(no original recorded)')
EOF
```

The originals look like drone footage from one shoot: `0308-2.mp4` for the
hero and ten `dji_mimo_20260309_*` stills for the gallery. The eleven
equipment, gym, sauna, add-on, membership and kickboxing shots have no
original recorded, so those need picking or shooting.

## Open

- **All 21 media files.** Ben is re-pulling them. Nothing else blocks this site.
- **The site is not in code yet.** The artifact is the only copy, so it cannot
  be regenerated, previewed or shipped. It needs converting to a real build in
  `site/` per `design-to-code`, which is the next job after the media lands.
- **Combine question.** Ben mentioned an earlier first page and wanting the two
  combined. Only one Fuel Fortress artifact exists, so the earlier one needs
  finding or describing before anything gets merged.

## Kernel

`kernel.json`, lifted verbatim from the published build's `:root`. Ground
`#090909`, near-black with hairline rules, Bebas Neue condensed caps over DM
Sans body. Hard corners everywhere except the pricing cards, which are the one
soft-cornered thing on the site and are meant to lift off the page.

## Standing client facts

- From $84.99 a month annual, $104.99 month to month, $25 day pass.
- Membership covers the floor, the sauna, kickboxing and 24 hour access at all
  four locations. Personal training and ready-made meals cost extra. That is
  the whole list.
- No class timetable and no programs. The exception is Teryn's kickboxing twice
  a week, included with membership. She is a former fighter and an owner.
- 5.0 from 8 Google reviews at the Nashville location. All eight are quoted on
  the site, verbatim, with names.
- Staffed hours Mon to Fri 8 to 8, Sat 8 to 4, Sun 11 to 4. Members get in any
  hour with the QR code issued at signup.
