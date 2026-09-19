# Fuel Fortress Nashville: website handover

Prepared by Growth Factor. Branch `claude/fuel-fortress-nashville-site-84vfh7`,
pull request [#15](https://github.com/bendeisel/growthfactor/pull/15).
Live preview: https://claude.ai/artifact/8ZEUhvvz73f4DszLrwPjo2

---

## What was built

Six pages, each its own HTML file, replacing a WordPress and Elementor site.

| Page | File | Purpose |
| --- | --- | --- |
| Home | `index.html` | Overview, gallery, reviews, location, FAQ |
| Equipment | `equipment.html` | The four brands, interactive rail, equipment FAQ |
| The Gym | `gym.html` | Floor, sauna, 24 hour access, kickboxing |
| Add-Ons | `addons.html` | Personal training and meals, both priced separately |
| Membership | `membership.html` | Pricing, what is included, signup, reviews |
| Kickboxing | `kickboxing.html` | Teryn, what the sessions are |

Every page carries its own FAQ. There are 35 questions in total, all answered from
facts verified in the existing site's database. The old site had no FAQ anywhere.

## What changed in the content, and why

Copy is normally frozen. It was deliberately unfrozen here because the live site
made claims that are not true of the Nashville location.

**Removed as untrue**

- "Customized programming included with every membership." Personal training is a
  paid add-on and is now stated that way in three places.
- "Every membership includes nutrition and programming."
- "Private hot-stone saunas in both men's and women's locker rooms." There is one
  sauna, it is not hot-stone and not private.
- "Combat Sports Training Area" and kickboxing described as classes.
- The entire "Programs and Services" section. There are no programs. Replaced by
  **The Gym**, which describes what is actually in the building.
- 47 combat-sport template icons that describe a martial arts gym, not this one.

**Deduplicated.** The old homepage carried three near-identical copies of the
Problem block, the Difference block and the Why block. One of each survives.

**Repositioned.** Equipment moved from a bullet in a feature grid to the lead
section, and has its own page.

**Kickboxing** is presented as included with membership, run by Teryn, a former
fighter and one of the owners. An outstanding workout on its own, with real
striking instruction available for anyone who wants it.

**Meals** copy is drawn from the client's own database: Fuel Nutrition, the Bowling
Green meal prep company Josh and Kaitie launched in 2018, macro-balanced meals,
recipe testing and supplier relationships at scale.

## Design

Extracted mechanically from 2,099 Elementor records rather than eyeballed.

- **Typefaces:** Bebas Neue (display), DM Sans (body).
- **Palette:** entirely achromatic. Ground `#090909`, lifted bands and header
  `#232323`, one light value `#F5F5F5` used once, on the featured membership card.
  There is no accent color and that is deliberate, it is the most distinctive thing
  about the identity.
- **Corners:** square everywhere except the pricing cards, which are rounded on
  purpose so the commercial moment lifts off the page.
- **Motion:** staggered hero entrance, an interactive equipment rail, a staggered
  review deck, and a trail grid that follows the cursor sitewide and drifts on its
  own when idle. All of it respects `prefers-reduced-motion`.

## SEO

Built around the priority terms: weightlifting Nashville, powerlifting,
bodybuilding, free weights, 24 hour gym, gym with a sauna, and East Nashville.
Those appear in headings and body copy, not just in the scrolling banner.
`ExerciseGym` structured data carries the real address, phone, areas served, opening
hours and the genuine 5.0 rating from 8 Google reviews.

---

## Photos and video

Every image slot points at the photos already sitting in
`wp-content/uploads/2026/03/` on the Hostinger account. The site deploys to that
same account, so the files never need to move.

**The preview link cannot show them.** Claude's artifact viewer blocks images from
other domains as a security policy. The deployed site is unaffected.

**Still needed**

1. Photos of the actual equipment for the four brand panels on the equipment page.
   There are no Arsenal, Atlantis, Hammer Strength or Rogers Athletic photos in the
   library, so those slots are deliberately empty rather than mislabelled.
2. A photo of the sauna.
3. A decision on the hero video, see below.

**Do not reuse:** the drone shots dated `20241121` and `20250912` pre-date the
Nashville opening and are likely other Fuel Fortress locations. The About and
Contact pages of the old site use them.

### The hero video

The hero currently plays `snaptik_7606791376570682637_v3.mp4` (0.6 MB), the clip the
old homepage used. `0308-2.mp4` is **142 MB**, which is far too heavy for an
autoplaying background.

To use the better footage, compress it first:

```
python3 compress_video.py 0308-2.mp4
```

That writes `hero.mp4` and `hero-poster.jpg`. Upload both to
`wp-content/uploads/2026/03/` and the hero can be pointed at them. HandBrake's
"Web Optimized" preset does the same job if you prefer a GUI.

---

## Deploying

Static HTML, CSS and vanilla JavaScript. No build step, no framework, no database.

1. Upload the contents of `site/` to `public_html/`.
2. Keep `wp-content/uploads/2026/03/` in place, the pages reference it.
3. `lead.php` handles form submissions. Change `LEAD_TO` at the top when the
   branded email address exists. It currently sends to
   `fuelfortress615@gmail.com`.
4. Add `sitemap.xml` to Google Search Console.

To edit content, change `build.py` and run `python3 build.py`. That regenerates all
six pages and the sitemap from one shared layout, so the header, footer and nav stay
consistent. Editing the HTML directly works too, but changes to shared parts have to
be repeated on every page.

### Scripts

| Script | What it does |
| --- | --- |
| `build.py` | Regenerates the six pages and `sitemap.xml` |
| `prep_assets.py` | Resizes and converts photos, fills slots by filename |
| `compress_video.py` | Compresses a video for web, no ffmpeg install needed |
| `drive_unpack.py` | Decodes a Google Drive download |
| `drive_tar_extract.py` | Streams media out of a Hostinger backup archive |

---

## Open questions

1. **Olympic lifting.** It ranks as a Nashville search term and is currently left
   out. Are there platforms and bumper plates for it?
2. **Square footage and year established.** The old site's counters read `0K+ ft`
   and `Est. 0`, so the real numbers were never entered. Left out rather than
   invented.
3. **Branded email.** Using `fuelfortress615@gmail.com` until it exists. One
   constant in `lead.php`, one line in the footer.
4. **Equipment photos.** See above.

## Facts used, for checking

- 412 Davidson St, Nashville, TN 37213
- (615) 562-3966
- Open 24 hours to members. Staffed Mon to Fri 8:00 AM to 8:00 PM,
  Saturday 8:00 AM to 4:00 PM, Sunday 11:00 AM to 4:00 PM
- Day pass $25, annual $84.99/mo, month to month $104.99/mo
- Family membership includes two members, additional members $40/month
- Military, first responder and student discounts with valid ID
- One membership covers all four locations across Kentucky and Tennessee
- Equipment: Arsenal Strength, Atlantis, Hammer Strength, Rogers Athletic
- 8 Google reviews, all five stars
