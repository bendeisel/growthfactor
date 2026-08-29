# Fuel Fortress Nashville

- **Homepage preview (artifact):** https://claude.ai/code/artifact/3d3013c1-ef40-43f2-969b-2bf50799ea05
- `kernel.json`, the locked brand kernel, extracted mechanically from the client's
  WordPress/Elementor database dump (not read off a screenshot).
- `site/`, the build, on Growth Factor's static Hostinger stack per
  `.claude/skills/house-style/references/hostinger-delivery.md`.
- Status: **six pages built.** `index`, `equipment`, `gym`, `addons`, `membership`,
  `kickboxing`. Every page carries its own FAQ. Content rewritten with the client to
  remove claims that were not true of the Nashville location.
- `site/build.py` assembles the pages from one shared layout and emits plain static
  HTML plus `sitemap.xml`. Run `python3 build.py` after editing content. It also
  emits the single-file review preview when `PREVIEW_OUT` is set.

## Source

`u213629895_YBpXO.fuelfortressnashvillecom.20260829182046.sql.gz`, WordPress 6.x,
Elementor Pro 3.35.1, hello-elementor theme, on Hostinger. 7 published pages,
203 media attachments, 1,189 Elementor payloads. Parsed offline; the live site and
Instagram are both unreachable from the build environment (see Assets below).

## What changed in the copy, and why

Copy is normally frozen at 99%. It was **deliberately unfrozen for this project** , 
the client commissioned a content change because the live site made claims that are
false for the Nashville location. Every change below traces to an explicit client
instruction in the session, not to editorial preference.

**Removed as untrue**
- "Customized programming included with every membership" (personal training), PT
  is a paid add-on, never included. This was the single most important fix.
- "Custom Plans Included, Every membership includes nutrition and programming."
- "Private Saunas · Hot-stone saunas in both men's and women's locker rooms", there
  is one sauna, it is not hot-stone and not private.
- "Combat Sports Training Area · Dedicated space for Kickboxing and combat
  conditioning classes", client's read is that this was copied off the original
  Fuel Fortress site by the previous developer.
- The "Programs & Services / Nashville Training Programs for Every Goal" section , 
  there are no programs. Replaced by **The Gym**, describing what is in the building.
- 47 combat-sport template icons (gloves, pads, referee, gum shield, shin pads) that
  shipped with the source template and describe a martial arts gym, not this one.

**Deduplicated**, the source homepage carried three near-identical copies of the
Problem block, the Difference block and the Why block, plus two of the services
block. Kept one of each, using the client's latest variant where they differed.

**Repositioned**, equipment is now the lead section rather than a bullet in a
feature grid, per "we have the best equipment in Nashville, highest grade equipment."

**Added**, an **Add-Ons** section (client's structure) holding personal training and
ready-made meals, both stated plainly as costing extra. Kickboxing sits there too as
a free recreational extra run by Taryn, with its own page to follow.

**Kept verbatim**, the ticker slogans, the four Problem items, pricing and discount
terms, "Train hard. Recover strong. Perform better.", the areas-served list, and all
Google review text.

## SEO

Client's priority terms: *weightlifting Nashville*, *weightlifting*, *East Nashville*
(the gym sits between downtown and East Nashville and draws commuters), and *sauna*
(currently ranking ~30th). Title, meta description, H1 eyebrow, the sauna section and
the location section are all built around these. `ExerciseGym` structured data
carries the real NAP, areas served, and the genuine 5.0/8 Google rating.

## Why the media is missing

A WordPress `.sql` export contains the **database only**. Media files live on disk
under `wp-content/uploads/` and are never included in a SQL dump, which is why the
dump gives filenames, alt text and dimensions but no images. To get them the client
needs a **files** backup rather than a database one: Hostinger File Manager,
compress `wp-content/uploads/2026/03/`, and send the zip. The same applies to the
hero video.

Fetching them directly is also impossible from this environment: both
`fuelfortressnashville.com` and Instagram are blocked by the network egress proxy,
retested with the client's explicit permission.

## Assets, outstanding

The build environment cannot reach `fuelfortressnashville.com` or Instagram (both
blocked by the network egress proxy), so **no image or video files could be
downloaded**. Every photo and video position is a marked slot naming the file that
belongs there; dropping real files into `site/img/` and `site/video/` and swapping
the commented-in `<img>` / `<video>` tag completes it.

Needed from the client:
1. The hero background video (source: `0308-2.mp4`), resized for web , 
   1920×1080 max, H.264, target under ~6 MB, muted, plus a poster frame.
2. The 10 gallery photos (`dji_mimo_20260309_*`, the March 9 2026 shoot).
3. A photo of the actual sauna.
4. Instagram photos, if they want any beyond the above.

**Provenance warning:** the homepage's own photography is clean, every image on it
comes from the single 2026-03-09 shoot, which post-dates the Nashville opening. But
the **About** and **Contact** pages pull `dji_mimo_20241121_*` and
`dji_mimo_20250912_*`, both of which pre-date Nashville opening and are almost
certainly other Fuel Fortress locations. Those must not be carried over.

## Two deliberate exceptions to the hard-edge rule

The kernel's radius pairing is containers-square, actions-8px. The pricing cards
break it on purpose at the client's request: 14px corners and a pill badge, so the
one commercial moment lifts off a page that is otherwise all hard edges. Everything
else stays square. Easy to revert by dropping `border-radius` on `.plan`.

Second: `.plan-feats` lists only what actually differs between plans. Every plan,
day pass included, gets the whole gym, so listing the same six amenities three times
would be noise rather than information.

## Contrast

Body copy previously sat on `#666666`, which is roughly 3.6:1 on the `#090909`
ground and genuinely hard to read. Fine print, FAQ answers and plan copy are now
white or `#C8C8C8`. Both are kernel values.

## Band color

Alternating bands and the fixed header share `#232323`, taken from the client's own
Elementor data (389 occurrences). An earlier revision had the header on an
improvised `#202020`, which was a drift: it was never in the kernel. Corrected, so
the header and the alternating sections are now the same declared value.

## Staffed hours

Taken from the live site's own footer template (post 22): Mon to Fri 8:00 AM to
8:00 PM, Saturday 8:00 AM to 4:00 PM, Sunday 11:00 AM to 4:00 PM. The gym itself is
open 24 hours to members.

## Instant signup

Members join online at any hour, receive a QR code immediately, and scan in the same
night. This resolves the earlier keytag-vs-fob ambiguity and is now its own section , 
"Join at 2am. Train at 2:15." The step numerals are used because this genuinely is a
sequence. The QR graphic is an abstract inline SVG glyph, deliberately not a scannable
code.

## Open questions for the client

1. **Olympic lifting**, the banner keywords cover weightlifting, powerlifting and
   bodybuilding. "Olympic weightlifting" also surfaces as a Nashville search term but
   is left out until we confirm there are platforms and bumper plates for it.
2. **Square footage and year established**, the source has animated counters that
   read `0K+ ft` and `Est. 0`, i.e. the real numbers were never entered. Left out
   rather than invented; the proof strip uses three verifiable facts instead.
4. **Branded email**, using `fuelfortress615@gmail.com` as instructed until the
   branded address exists. One constant in `lead.php`, one line in the footer.

## Dark mode and the hero animation

The page is dark throughout. The earlier build alternated `#090909` bands with
`#F5F5F5` ones; the client read those light bands as the page switching to light
mode, so the color stance moved from *alternating high contrast* to *dark-dominant*.
`#F5F5F5` now appears exactly once, on the featured membership card, the single
light moment lands on the primary action.

The hero children fade up in sequence on load, porting the timing from a
framer-motion hero the client liked (0.1s delay, 0.15s stagger, 0.5s ease-out, 20px
rise) into plain CSS transitions with staggered `transition-delay`. The credential
plate follows. `prefers-reduced-motion` disables all of it. **Only the motion was
taken**, the source component's pill badge, gradient-clipped text, icon set and
placeholder statistics were not, since lock 3 permits amplifying what the site has
and forbids importing what it doesn't.

## Stack note

This is a static HTML/CSS/JS site, deliberately framework-free per
`references/hostinger-delivery.md`, so the house components drop into a template
platform unchanged. There is no `package.json`, React, TypeScript or Tailwind here,
and adding them would break that delivery model. React components sourced from
shadcn/ui are therefore treated as **design reference to port**, not as code to
install.

## Step 5 self-audit (house-style)

- **Did any word change?** Yes, extensively, but only under explicit client
  instruction, itemised above. Nothing was reworded for taste.
- **Is every hex and face in the kernel?** Yes. 13 hexes, all from the frequency
  count in `kernel.json`; Bebas Neue and DM Sans only. No color was introduced.
- **Which existing motif is each decision from?** Eyebrow-with-rule → the site's
  10px/0.3em eyebrow, used on every section already. Numbered index and the equipment
  rail's `01–04` → the `01–04` Problem list. Credential plate hairlines → the ticker's
  own top/bottom rules. Alternating black/off-white bands → the existing `#090909`/`#F5F5F5`
  section grounds. Grayscale-to-color hover → the existing gallery hover filter.
  Mosaic with double-width 1st and 6th → the existing gallery flex rule. Hard 0px
  corners with pills reserved for dots → the existing radius pairing. Ticker → kept
  outright. Middot kickers → the existing "Recovery · Wellness" separators.
- **Which two axes differ from same-vertical neighbours?** Four of five differ from
  Nashville MMA Training Camp: structure (F dense mosaic vs E editorial rail), type
  stance (4 condensed caps vs 1 extreme contrast), color stance (alternating high
  contrast, no accent, vs duotone gold), rhythm (interlocked vs punctuated). Bebas
  Neue is shared and cannot change, it is Fuel Fortress's own face.
- **Would this be mistaken for the last three sites shipped?** No. The absence of any
  accent color is the distinguishing feature and is the client's own palette.
