# Nashville MMA — session handoff

For whoever picks this up next. This is not build documentation; the code is
readable and `data/build_all.py` runs everything. This is the context that is
**not** in the repo: what the client wants, what he has rejected, and where the
previous session went wrong so you do not repeat it.

Written 2026-09-17. Branch `claude/website-download-design-jukgeo`.
Preview artifact: https://claude.ai/artifact/QtSo866CTUqKxEQGTGk67a (Version 19)

---

## 1. Read this first

**Ben owns a web agency (Growth Factor) and the gym is his client.** He judges
by eye, on his desktop, and he is direct when something is wrong. He is usually
right. When he says something looks bad, the fault is almost always real.

**The single most expensive mistake in this project has been over-interpreting
his feedback.** Three concrete instances, all mine:

1. He said *"the footer was remade, and it was terrible."* I read that as
   "redesign the footer" and replaced its map with a photo and four link
   columns. He meant the opposite — the restored footer was the good one and
   the remaking was the problem. Cost: two rounds.
2. He asked for *slideshows* and *a smaller calendar that looks like the main
   one*. I added both **to the program page**, plus a coaches section. He had
   not asked for anything to be added to that page. Cost: a full revert.
3. He asked *"is the entire page a placeholder?"* about a page that did not
   connect to anything. I answered about the footer. Cost: a round.

**The rule that follows from this: when feedback is ambiguous about scope, ask
before building.** One clarifying question costs a minute. Guessing wrong costs
an hour and his patience. He has never objected to being asked; he has objected
repeatedly to being handed the wrong thing.

**Do not add anything he did not ask for.** Not a section, not a block, not a
"while I was in there". If you notice something worth adding, say so in chat
and let him decide.

---

## 2. What the project is

Rebuilding **nashvillemma.com** (Nashville MMA Training Camp, 1504 Elm Hill
Pike) off the 97Display vendor platform onto a static site for Hostinger.

- 47 pages, all generated from data and markdown
- No framework. No Node, no Tailwind, no TypeScript, no React. Python scripts
  emit plain HTML plus one shared CSS file and one JS file.
- `site/` is the deployable output. `design/` and `design-pages/` hold the
  Claude Design artboards the output is lifted from.

### Build

```
cd data && python3 build_all.py          # everything, in order
python3 build_all.py --reharvest         # ALSO regenerates classes.json
```

`build_all.py` deliberately does **not** run `build_classes.py` by default,
because that regenerates `classes.json` from the original harvest and would
silently discard any hand edit to the schedule.

### Where things come from

| File | Owns |
|---|---|
| `data/classes.json` | all 86 classes. Edit here; the master grid and every program page follow |
| `data/reviews.json` | 74 real Google reviews, tagged by rule from their text |
| `data/programs.json` | the 14 program pages: slug, source content, hero, coach |
| `data/coach_programs.json` | which programs each of the 16 coaches teaches |
| `data/render_nav.py` | the menu **and** the footer. One source for both |
| `data/render_schedule.py` | master week grid + per-program schedule |
| `data/render_reviews.py` | review marquee, topic weighting |
| `data/render_slideshow.py` | the coverflow, made reusable. Used on the 16 coach pages only |
| `content/overrides/*.md` | pages whose copy has been rewritten (5 so far) |

---

## 3. Hard rules — these have all been learned the hard way

**Motion must be JavaScript rAF, never CSS animation.** Ben's browser pauses
CSS animations in low-power mode, so a CSS-animated element sits frozen on his
screen while it works everywhere else. This has bitten the project three times:
the gold gradient drift, the review marquee, the footer map pin. Verify with
`getComputedStyle(el).animationName === 'none'` and by sampling the transform
twice.

**No star ratings.** The gym is at 4.9. Five-star rows came out and stay out
until they hit 5.0 at 1,000 reviews.

**Square panels, rounded buttons.** `--cornerRadius: 0px`, `--buttonRadius:
8px`. Rounding panels is one of the things he calls "AI-looking".

**Never invent facts about real people.** Coach credentials, sponsor names,
partner businesses, reviews. If it is not in a source you can point at, mark it
in gold italic (`class="ph"`) and ask. There are four such placeholders live
right now (section 6).

**Copy is the client's.** He wrote roughly 90% of the original site's words.
Do not tighten or "improve" his sentences. The rewrites in
`content/overrides/` were explicitly requested, page by page.

**"Sign up", never "register".** His rule, 2026-09-17.

**Phone number appears twice per page — header and footer, both chrome.** A
third mention in body copy is too many. Three pages still carry it in his own
copy (contact, faq, sponsors); that is his writing and was left alone.

**Verify in a real browser before saying it is done.** Not "the markup looks
right". Load it and probe. The crawl script checks 47/47 pages reachable, 0
dead links, 0 broken images, 0 JS errors — but note that a crawl passing does
**not** mean a page is fine (see section 5).

---

## 4. His voice, for any copy you write

From his own FAQ answers: exclamation points, direct instructions, warm, plain
words, colon-lists, zero metaphors. Short paragraphs. He rejected an earlier
draft of mine as "too AI" because every paragraph had a clever turn in it.

Do not write: "Thai pads are cardio you cannot fake your way through."
Do write: "You will sweat! Bring a water bottle and leave your shoes at the
edge of the mat."

---

## 5. Things that look fine and are not

**A crawl passing does not mean a page is connected.** Dead-end pages resolve
perfectly. The 16 coach pages had exactly **one** inbound link each while every
crawl came back clean. Measure inbound links per page, not just whether links
resolve.

**A build script reporting success does not mean it ran.** `build_site.py` was
silently not running `render_schedule.py` at all, so the master schedule was
frozen at whatever it was the day it was generated while program pages tracked
`classes.json`. Prove data flows by changing one row and rebuilding.

**Do not pipe build output to /dev/null.** A `NameError` hid that way for a
whole round.

**The preview bundle has a 16MB publish limit.** `bundle_site.py` encodes each
asset once into an `ASSETS` map and references it by token; inlining data URIs
at every use site blew past the limit once coach photos appeared on many pages.

---

## 6. Open items — waiting on Ben

| Item | Where |
|---|---|
| GoHighLevel events embed snippet | `events.html` — frame is built, panel is a placeholder |
| Recovery Partners copy | `recovery-partners.html` — nothing invented |
| Tim Sumich's actual sport and level | strength-training page coach block |
| Real privacy policy and terms text | `privacy.html`, `terms.html` |
| A photo for Dedrek Sanders | coaches |
| ~500 more Google reviews | see below |

### The Google reviews situation

The gym has ~526 reviews at 4.9. The site currently uses **74**, recovered from
the vendor harvest — the vendor had rendered every review as an **image**, so
none of that text was readable by Google or any AI answer engine. As plain text
it now is.

Ben wants many more, weighted toward **boxing** and **kids jiu jitsu**.

**You cannot scrape them from this environment.** The egress proxy answers 403
to google.com, maps.google.com, yelp.com, every third-party scraper API, and
even nashvillemma.com. What *is* reachable is `*.googleapis.com`, and the
Business Profile reviews endpoint answers 401 rather than being blocked — so
the official API works from here with a token from Ben.

`data/fetch_gbp_reviews.py` is written and ready. It needs `GBP_TOKEN` in the
environment. Instructions for getting one are in its docstring.

**Do not write review text.** Fabricating testimonials attributed to named real
people on a business with a public Google listing is not an option, whatever
the pressure.

---

## 7. Current state of the menu

Renamed from the vendor's structure at his request:

```
About(7)  Martial Arts(8)  Kids Classes(3)  Strength Training(3)
Schedule  Recovery(2)  Events  Sponsors
```

"Fitness" became "Strength Training"; the `sports-performance` page was renamed
`strength-training`. Program page eyebrows name the section they sit under, so
the page agrees with the menu you used to reach it.

Dropdowns: hover opens on a device that can hover, and the trigger is a real
link so clicking goes to that section's landing page. On touch, the first tap
opens. **Do not also bind click-to-toggle** — that was the original "the
Programs tab does not open" bug, where hover opened the panel and the click
immediately closed it.

---

## 8. What was reverted, and why it stays reverted

`85a51cf` reverted the program pages to `c29f080`. The coaches slideshow, the
coach card grid and the mini week grid are **gone from program pages on
purpose**. His words: *"Can't just put 40 pages on one page and call it fixed."*

`f0c8c18` reverted `render_nav.py` to `c29f080`, restoring the footer with the
map panel. The photo-and-link-columns version is not wanted.

`render_slideshow.py` is the homepage coverflow extracted into a reusable
component. It is **still live on the 16 coach pages** ("What they coach" and
"More coaches"), because he only objected to the program page and named no
others. He has not given a verdict on the coach pages either way — if he
objects to those next, the same removal applies. If he asks for a slideshow
somewhere new, ask **where** before putting it anywhere.

---

## 9. Still unfinished, and he knows

- 13 of the 14 program pages still carry vendor-written copy. Only Muay Thai,
  Recovery, Strength Training, Open Gym and Sports Performance were rewritten.
  He gated the rest on reviewing Muay Thai and has not given that verdict yet.
- No lead form is wired to anything. The popup form has no action; leads
  currently go nowhere. This is the biggest functional gap on the site.
- Meta descriptions are unused. 56 are sitting in the harvest front-matter.
- Mobile artboards exist only for the homepage.
