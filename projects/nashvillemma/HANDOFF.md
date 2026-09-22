# Nashville MMA: session handoff

Written 2026-09-17 on branch `claude/nashville-mma-training-camp-f5sh30`.

Every number and path below was checked against the working tree on that date.
Where something is unknown, it says so. Nothing here is inferred from a previous
handoff.

> **Why this file was rewritten.** The prior handoff described a repo that does
> not exist. It named six build scripts and two data files that have never been
> in this repo's history (`build_all.py`, `render_nav.py`, `render_reviews.py`,
> `render_slideshow.py`, `fetch_gbp_reviews.py`, `reviews.json`,
> `coach_programs.json`), three commit hashes that are not valid objects here,
> and a branch that does not exist. It also claimed 47 built pages with zero
> dead links. The real number is 16 built pages with 5 dead internal links.
> Treat any older handoff as unreliable.

---

## 1. What this is

Rebuilding **nashvillemma.com** (Nashville MMA Training Camp, 1504 Elm Hill
Pike) off the 97Display vendor platform onto a static site for Hostinger.

No framework. There is no `package.json` anywhere in this project: no Node, no
React, no TypeScript, no Tailwind, no shadcn. Python reads Claude Design
artboards and emits plain HTML plus one shared CSS file and one JS file.

If a component arrives that assumes React or Tailwind, it cannot be dropped in.
Port the effect by hand instead.

## 2. Build

```
cd data && python3 build_site.py
```

That is the whole build. It reads the artboards and writes `site/`.

Other scripts in `data/`, none of which `build_site.py` calls:

| Script | What it does |
|---|---|
| `build_classes.py` | regenerates `classes.json` from the harvest. Running it discards hand edits to the schedule |
| `build_program_pages.py` | generates the `design-pages/Program-*.dc.html` artboards |
| `render_schedule.py` | schedule grid rendering |
| `bundle_site.py` | packs `site/` into a single preview artifact |

`build_site.py` prints a "linked but not built" list at the end. Read it. That
list is the dead-link report and it is currently not empty.

## 3. Where things come from

| Path | Owns |
|---|---|
| `design/Homepage.dc.html` | the homepage. **Source of truth.** `site/index.html` is generated from it, so never edit `site/` directly |
| `design/HomepageMobile.dc.html` | homepage mobile artboard. The only mobile artboard that exists |
| `design-pages/Schedule.dc.html` | the schedule page |
| `design-pages/Program-*.dc.html` | the 14 program pages |
| `data/classes.json` | 86 classes |
| `data/programs.json` | program page definitions |
| `data/generated-pages.json` | build manifest |
| `kernel.json` | the locked brand kernel extracted from the client's 97Display site |
| `content/` | the full harvest, markdown, 1 file per source page |
| `source/pages/` | the raw harvested HTML |
| `content/overrides/` | rewritten copy. **2 files only**: `open-gym.md`, `sports-performance.md` |

## 4. What is actually built

16 HTML files in `site/`:

- `index.html`
- `schedule.html`
- `programs/` : boxing, jiu-jitsu, kids-brazilian-jiu-jitsu, kids-fitness,
  kids-martial-arts, mixed-martial-arts, mma-fight-team, muay-thai, open-gym,
  personal-training, self-defense, sports-performance, womens-classes, wrestling

There are **no** coach pages, no about, no FAQ, no contact, no reviews page, no
events page, no recovery page. The content for them is harvested and sitting in
`content/`, but nothing renders it.

### Dead internal links, as of this build

`about.html`, `contact.html`, `events.html`, `programs/index.html`,
`recovery.html`

Four of those are in `NAV` in `data/build_site.py`, so they are in the header of
every page. This is the most visible defect on the site right now.

## 5. The menu

`NAV` in `data/build_site.py` currently reads:

```
About  Fitness  Programs  Kids Programs  Schedule  Recovery  Events & Sponsorships
```

This is still close to the vendor's structure. No rename has happened. The
string `strength-training` appears nowhere in the repo, and `sports-performance`
still has that slug. If a rename is wanted, it has not been done.

## 6. Motion: JavaScript, never CSS animation

This rule is real and documented in
`.claude/skills/bmfg-gym-sites/references/motion.md`, which is committed to this
repo. Ben's browser pauses CSS animations in low-power mode, so a `@keyframes`
element sits frozen on his screen while working everywhere else. Reduced-motion
emulation does not reproduce it.

So anything that must visibly move is driven by `requestAnimationFrame`.

Verify before claiming it works:

```js
getComputedStyle(el).animationName === 'none'   // must be true
```

and sample the changing property twice, a second or more apart, to prove it
actually moves.

`design/Homepage.dc.html` has one rAF loop near the bottom that drives every
`.dg` layer from `data-` attributes, so one loop covers many elements at
different phases.

### The gold band

The slogan section ("We build champions!") has three stacked `.dg` gold layers.
Each one drifts on a sine, and each cross-fades its own opacity on a second,
slower sine. The cross-fade is what makes the gold appear to change colour
rather than just slide around. Both transform and opacity are GPU composited,
so three layers cost about what one did.

Tunable per layer, straight off the element:

| Attribute | Meaning |
|---|---|
| `data-ax` / `data-ay` | drift amplitude in px, x and y |
| `data-per` | drift period in seconds. Lower is faster |
| `data-ph` | drift phase offset, keeps layers out of lockstep |
| `data-oper` | colour cross-fade period in seconds |
| `data-oph` | cross-fade phase offset |
| `data-omin` / `data-omax` | opacity floor and ceiling for that layer |

Amplitude and size are coupled, per the motion reference: a big soft glow moving
a short distance reads as alive, a small bright glow moving a long distance
reads as a bug. 35px of travel read as completely static. 300px+ turned it into
a dot flying across the screen. The current values sit between those.

## 7. Reviews: what is real

**The three reviews on the homepage are real.** Both the text and the
attribution trace to `content/reviews.md` and `source/pages/reviews.html`:
brandon arias, Pat Crumpton, Zakkery Root. Each is verbatim from the harvest,
truncated with an ellipsis to fit the card.

The vendor rendered every review as an **image**, with the reviewer's name only
in the `alt` text. So of **62** named reviews in the harvest, only **38** have
body text that survived. The other 24 are a name and nothing else. None of that
image text was readable by Google or any AI answer engine, which is a real SEO
gain from moving to plain text.

The gym has roughly 526 reviews at 4.9 overall. That figure came from the client
and is not verified in this repo.

**Never write review text.** Fabricating a testimonial attributed to a named
real person, for a business with a public Google listing, is not an option.

### Fetching more

There is no fetch script in the repo. If one is written, note what is actually
reachable from this environment, measured 2026-09-17:

| Host | Result |
|---|---|
| `nashvillemma.com` | **200, reachable** |
| `fonts.googleapis.com` | 200 |
| `mybusiness.googleapis.com` | responds (404 on a bare root path, so not blocked) |
| `places.googleapis.com` | responds (404 on a bare root path, so not blocked) |
| `www.google.com` | connection fails |
| `maps.google.com` | connection fails |

So the Google Business Profile API is reachable and needs a token. Scraping
google.com from here is not possible, and scraping Google results would be
against their terms in any case. The API is the route.

## 8. Known gaps

- 5 dead internal links, 4 of them in the site-wide nav (section 4)
- 12 of the 14 program pages still carry vendor copy. Only `open-gym` and
  `sports-performance` have overrides
- No lead form is wired to anything. `openForm()` opens a modal that posts
  nowhere. Leads currently go nowhere. This is the biggest functional gap
- Meta descriptions are harvested into the content front matter and unused
- Mobile artboards exist for the homepage only
- No coach pages, though 16 instructor files are harvested in `content/`
- There is no crawl or link-check script. `build_site.py`'s own
  "linked but not built" output is the only check that exists

## 9. Rules for copy

- **No em dashes anywhere.** Site copy, docs, UI text, commit messages. Use a
  comma, period or colon
- "Sign up", never "register"
- Copy is the client's. He wrote most of the original site's words. Do not
  tighten or improve his sentences. Rewrites happen page by page, on request
- Never invent facts about real people: coach credentials, sponsor names,
  partner businesses. If it is not in a source you can point at, mark it and ask
- His voice, from his own FAQ answers: exclamation points, direct instructions,
  warm, plain words, short paragraphs, no metaphors

## 10. Working rules

- **Do not add anything that was not asked for.** Not a section, not a block.
  If something seems worth adding, say so and let Ben decide
- When feedback is ambiguous about scope, ask before building. One question
  costs a minute
- Square panels, rounded buttons: `--cornerRadius: 0px`, `--buttonRadius: 8px`.
  Rounded panels read as AI-generated
- Do not pipe build output to `/dev/null`
- Verify in a real browser before saying something is done. Chromium is at
  `/opt/pw-browsers/chromium-1194/chrome-linux/chrome`. Note that Google Fonts
  throws `ERR_CERT_AUTHORITY_INVALID` in Chromium here because the sandbox proxy
  CA is not in its trust store. That is an environment artifact, not a site bug,
  and `--ignore-certificate-errors` clears it for screenshots
