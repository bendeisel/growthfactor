# Inner pages: WordPress export findings (2026-08-26)

Source: `fightersnashville.WordPress.20260826.xml`, Ben's Tools > Export
download. 16 real pages exist. Status per page:

## Real, finished content (ready to build as-is)
- **Coaches** — real names/roles: Ernest Rodriguez, Sena Agbeko, Jeremiah
  Cline, Mindy Vernier, Steve Vernier, Nick Hicks, Evan Carr, Kayla
  Trotter, Dr. Christy Halbert (Founder, Director)
- **Schedule** — a real full weekly class schedule
- **Boxing Classes** (the index/overview page) — real intro copy
- **What to Expect** — real, detailed first-visit copy

## Mixed: real copy buried in leftover theme demo furniture
**Beginners Boxing Class, Youth Boxing Class, Competition Team Training**
all follow the same pattern: three genuine, finished paragraphs of
page-specific copy (headline + two subheads, all real), sandwiched inside
unfinished "Ring" theme CrossFit-demo scaffolding that was never
customized for a boxing gym:
- fake hero tagline "Hello, we are power / The best CrossFit experience
  for explosive power"
- generic "Personal trainings / Group trainings / Beginners' programs /
  Family programs" service cards, Lorem Ipsum body text, linking to
  `/services/...` URLs that don't exist on this site
- "CrossFit programs" 3-up grid (Sports nutrition / Online training /
  Rehabilitation & recovery), Lorem Ipsum
- a "Pice table" [sic, theme typo] pricing table (Basic $60 / Standard
  $80), Lorem Ipsum
- a 4-city contact list (New York/Boston/LA/Austin, placeholder phone
  numbers), leftover multi-location demo furniture
- (Competition Team Training only) two dynamically-pulled blog post
  teasers, not page copy

**Decision: ship the three real paragraphs verbatim, drop everything
else.** The dropped material was never finished or customized, not a
deliberate design choice, same class of judgment call as the empty
homepage marquee or the unconfigured lime accent color. Flagged here for
Ben to override if any of it (a pricing table, especially) was actually
wanted.

**Our Gyms** — the first ~2/3 of the page is real, well-written, and
directly matches the "Our Gyms" concept from the project kickoff (the
light/dark interlink page between Fighters and Nashville MMA): intro,
"Fighters Boxing Gym" section, "Nashville MMA Training Camp" section, the
"Championship Package" cross-sell, and a closing "One Community, Two
Legends" section. The bottom third (a testimonials block with fake names
Mark Stevens/Jenny Chanson/Hank Smith and Lorem Ipsum quotes, plus a
Basic/Standard/Advanced pricing table) is the same unfinished theme demo
pattern. Not yet built; when we get to it, ship the top real content,
drop the bottom.

## Not ready: needs real content from Ben, nothing to build yet
- **FAQs** — the dev-site export has real-looking questions ("How do I
  apply for a membership?", "Are there training classes for kids?", "What
  equipment do I need for boxing?") but every answer is Lorem Ipsum.
  Ben says his staff wrote the real FAQs on the production site,
  fightersnashville.com/faqs/. That domain is ALSO blocked by this
  session's egress proxy, and the page is not indexed in search, so the
  real answers still have to come from Ben: either a WordPress export from
  the production site (same Tools > Export flow) or pasted text.

## Mechanical fixes applied (per the standing em-dash rule + broken links)
- Beginners: "You'll master the essentials — stance, footwork, defense,
  and proper punching mechanics — under the guidance of" → colon + comma:
  "essentials: stance, footwork, defense, and proper punching mechanics,
  under the guidance of"
- Beginners: "You don't need to be in fighting shape to start — you just
  need the will to show up." → period: two sentences.
- Youth: "is more than just a workout — it's a foundation for life." →
  period: two sentences.
- Youth: "Read More" originally linked to `/about-us/`, which does not
  exist as a real page (the nav's "About Us" is a dropdown wrapper, not a
  page). Repointed to `/what-to-expect/` (same fix Beginners' own Read
  More already uses). Flag for Ben: confirm this is the right target.
- Competition Team: "is the real deal — a program designed for..." →
  colon: "is the real deal: a program designed for..."
- Competition Team: "not everyone chooses to compete — and that's
  perfectly fine" → comma (the "and" already carries the conjunction).
- Competition Team: "The atmosphere is focused, respectful, and intense
  exactly what you'd expect from a real fight gym" reads like a missing
  comma before "exactly", not an em dash. Left verbatim per the copy
  lock's mechanical-fixes-only rule; flagged, not fixed.

## Images
Still waiting on the `wp-content/uploads` zip for full-resolution photos.
For now the three class pages reuse the AI-generated class-card photos
already on the homepage (boxing-basics.jpg, youth-boxing.jpg,
competition-team.jpg) as their hero images, which is a clean fit since
Ben asked for exactly this: one page-specific photo per class page,
video reserved for the homepage only.

## Template pattern (rev 2, per Ben 2026-08-26)
First pass used a photo header band on each page, mirroring the old WP
site. Ben rejected it: the band read badly (especially on mobile, where it
filled the screen and pushed the H1 out of view) and the padding was off.
Revised pattern, now `src/layouts/ClassPage.astro`:
- **No header band.** The H1 is the first thing on the page, under a small
  red "Boxing Classes" eyebrow (reuses the existing nav string, no new
  copy), so the page name is the first thing read.
- **Alternating splits.** Each copy block with a photo renders as a split
  section, photo beside the text, sides alternating down the page, in the
  same tinted mat frames as the homepage (warm mat on white ground, then
  white mat with shadow on warm ground).
- **Centered closer.** A copy block with no photo renders centered and
  carries the GET STARTED button, ending the page.
- **Ambient red fluid gradient** on every section, same tuning as the
  homepage.
- Cross-page ticker at the bottom: all four class names, current page
  dimmed and underlined instead of linked, the other three link to their
  own pages (not homepage anchors) for real internal linking.
- Padding: page head and first split are deliberately tightened so the H1
  and the first heading read as one unit; sections after that use the
  standard homepage section rhythm.

Pages are now data-only. A class page supplies a title, description, H1,
and a list of `{ heading, body, readMore?, image? }` sections; the layout
does the rest, so Youth and Competition stamp out in minutes.

New shared files:
- `src/layouts/ClassPage.astro` (the template)
- `src/data/classes.js` (single source for the class list, used by the
  homepage and every class page)
- `src/components/ClassTicker.astro` (the reusable ticker)
- the split-section and mat-frame CSS moved out of the homepage into
  `src/styles/global.css` so the homepage and inner pages share one
  definition and cannot drift apart

Next: Youth Boxing Class and Competition Team Training, same pattern,
their own real copy, awaiting Ben's sign-off on this first one.

## Rev 3 (2026-08-26, Ben's feedback on the first template)

**Broken ticker in the artifact preview (fixed).** The class page's ticker
rendered as jumbled unstyled text in the published artifact while the real
built page was fine. Cause: `astro.config.mjs` sets
`inlineStylesheets: 'auto'`, so Astro inlines small component-scoped
stylesheets into a `<style>` block in the page `<head>` instead of the
external `_astro/*.css` file. The artifact packagers only read the
external CSS, silently dropping every scoped rule (the whole ticker).
Both packagers now also collect the inline `<style>` blocks. Worth
remembering for any future page: a component whose styles are small
enough to inline will lose them in the artifact unless the packager
collects them.

**Masters Boxing removed everywhere** (class discontinued). Gone from
`src/data/classes.js`, which removes it from the homepage hero list, the
homepage ticker, the homepage card stack (now 3 cards), and every class
page's cross-nav ticker. The dead `heroClasses` filter in index.astro is
gone too. Its photo was NOT deleted: it is a good generic ring shot, so it
moved to `public/img/ring-facing-off.jpg` and is now the homepage's
section 1 photo.

**Photo repetition fixed.** `training-mitts-800.jpg` was on the homepage
body AND the Beginners page body. Now:
- homepage section 1: `ring-facing-off.jpg` (the freed Masters photo)
- homepage section 2: `sparring-1600.webp`
- Beginners section 1: `training-mitts-800.jpg`
- Beginners section 2: `classes/boxing-basics.jpg`
No body photo repeats across pages. The class-card thumbnails on the
homepage still preview their own class page, which is intentional
continuity rather than repetition.
NOTE ON SCARCITY: there are only 6 photos total and 3 class pages needing
2 each. Youth and Competition can each get one unique photo, but a second
one per page will repeat something unless Ben sends more.

**Header redesigned (rev 3).** The small red "Boxing Classes" eyebrow is
gone (Ben: it should not just randomly say that at the top). The page name
is now a two-line poster lockup: line one in near-black on the light
ground, line two knocked out white on a red slab that bleeds the full
width of the screen, with the ambient red fluid running behind it at
higher intensity (0.7 opacity vs 0.5 in the body) so the header moves
without a photo. Type is much bigger: clamp(40px, 8.4vw, 104px), Archivo
900. Pages now pass `h1Lines` as a two-item array, e.g.
['BEGINNERS', 'BOXING CLASS'], so each page controls its own break.
The fluid host now reads `data-fluid-opacity` / `data-fluid-pixel` so any
section can tune the gradient.

## Rev 4 (2026-08-26): all three class pages built

Restructured the template to match the shape the client actually used on
all three class pages: a lead pitch (headline + paragraph + Read More),
then two sub-blocks that were side-by-side `<h4>` items in the original.
So the template is now: poster header, lead split with one photo, the two
sub-blocks side by side on the warm ground, a centered CTA, the ticker.

This also resolves the photo shortage. One photo per page means each class
page opens with its own class-card photo (card previews page, page opens
with it larger) and nothing repeats anywhere:
- homepage: `ring-facing-off.jpg`, `sparring-1600.webp`
- Beginners: `classes/boxing-basics.jpg`
- Youth: `classes/youth-boxing.jpg`
- Competition: `classes/competition-team.jpg`
- spare, unused: `training-mitts-800.jpg`
If more photography arrives, the pair section can become a second split on
every page at once.

Pages live:
- `/beginners-boxing-class/`
- `/youth-boxing-class/`
- `/competition-team-training/`

One link added (a link, not copy): Competition's entry requirements say
"we recommend taking a Boxing Basics Class first", so those words now link
to `/beginners-boxing-class/`.

Read More targets still point at pages that do not exist yet
(`/what-to-expect/` on Beginners and Youth, `/our-gyms/` on Competition).
Those are the client's own link targets and both pages are planned, so
they are left as-is and will resolve as the build continues.

## Reviews: what can and cannot be sourced (2026-08-26)
Ben asked for real names on the review cards. Current state: one named
Google review (Dustin Austin) plus two testimonials the client's own
production site publishes without names.

Searching cannot get more reliably. Public search surfaces Yelp snippets
(e.g. "Jesse M.", "Daniel S.") but only as truncated fragments, and Yelp
initials are not Google names. Publishing a partial fragment under a
partial name would be inventing attribution, so it is not being done.
To get real named Google reviews the options are:
1. Ben pastes 3 to 5 reviews (name + full text) from the Google Business
   Profile dashboard. Fastest, zero setup.
2. Google Places API with a key, which returns author names and text
   programmatically. Worth doing anyway if the maintenance agent is going
   to refresh reviews on a schedule.
3. Unblock the egress proxy for the Google Business Profile URL.

SEO note for the record: on-page reviews mainly help conversion and give
AI crawlers named, specific evidence to quote. They do NOT feed Google's
star ratings, and self-serving `Review`/`AggregateRating` schema on a
business's own site is against Google's structured-data guidelines, so
that markup stays off. The reviews that move local ranking are the ones on
the Google Business Profile itself.

## Schedule page and the synced calendar (2026-08-27)
Ben: "I want to add the synced calendar just like you have on Nashville MMA
Training Camp."

How Nashville MMA does it (read out of the NMMA Page Templates canvas):
one schedule dataset feeds two surfaces. The Schedule page renders the
whole week, and every program page renders the same data filtered to that
program, marked in the canvas as GENERATED:grid and GENERATED:cards. The
sync is that nothing is typed twice.

Fighters now works the same way, from `site/src/data/schedule.js`:
- `/schedule/` the full week board, with filter chips per program
- class pages a "Class times" strip filtered to that page's own class
- `/schedule.ics` a subscribe feed, one weekly repeating event per session

So a schedule change is one edit in one file. The board, all three class
pages and every member's subscribed phone calendar move together.

Deliberately NOT Nashville MMA's layout. NMMA uses a shared time rail with
seven day columns because it runs 90+ classes a week. Fighters runs two to
five sessions a day, so that matrix would be mostly empty white space.
Fighters gets a day-card board instead: seven cards, red rule under each
day name, sessions as time + name on a red tick, deep rounding, light
ground. The eighth cell of the 4x2 grid is the subscribe panel, on the
dark ground, so the grid closes and the feed sits where people are already
reading times.

The .ics is the part that earns the word synced. Subscribe once in Google
Calendar, Apple Calendar or Outlook and the gym's week is in your phone;
REFRESH-INTERVAL is 12 hours, so a redeploy reaches subscribers the same
day. Times carry a spelled-out America/Chicago VTIMEZONE, so daylight
saving is correct without the reader's calendar guessing.

Source of the times: the client's own Schedule page in the WordPress
export. Transcribed as published, with these notes.

TWO THINGS FOR BEN TO CONFIRM (both flagged in schedule.js):
1. Saturday open gym reads "2AM-12PM" on the client's page. Almost
   certainly a typo, since weekday mornings are 7AM-10AM. Kept verbatim
   rather than guessed at. Fix the one line and every surface follows.
2. Sessions the client published with a start time only (Boxing Basics,
   Competition Team Training, both sparring classes, Kardio KO, IBAN
   Youth) get a 60 minute default length in the .ics only. Real lengths
   welcome.
Two more worth a look:
3. Youth boxing has exactly one session in the client's grid, "IBAN Youth"
   Saturday 12PM, so the youth page's Class times strip shows one card.
   If youth trains more often than that, the client's grid is missing it.
4. "Foundational Sparring" (Thursday 6PM) is tagged to both Boxing basics
   and Competition team, because the name reads foundational but the slot
   sits in the competition block. Confirm which page owns it.

Mechanical fixes, logged: "Bsics & Kardio KO" spelled correctly; the em
dash in "a true boxing gym-designed for those serious about the sport"
became a comma (Ben's standing rule). The client's grid has no Sunday row,
so Sunday renders "No sessions".

Copy on the page is the client's: "Boxing Schedule / at Fighters Boxing
Nashville", then "Train Like a Pro" and "The Benefits of Open Gym at
Nashville's Best Boxing Gym" with both paragraphs verbatim. The page takes
the last unused photo, `training-mitts-800.jpg`, so nothing repeats
site-wide.

Two refactors that came with it:
- the poster header moved out of ClassPage into
  `components/PageHeader.astro`, so the schedule page and every future
  page share one header instead of copies drifting apart. It takes an
  optional sub-line, which is how "at Fighters Boxing Nashville" sits
  under the slab.
- the class ticker now prints a diamond after every item, not between
  them, so the seam where the loop repeats no longer shows a gap.

## Adults and kids split apart (2026-08-27, Ben round 2)
Ben: "Saturday class should just be boxing basics. I do want the kids'
schedule just on the kids' page. Maybe we have an adult schedule page and
then just the kids' class page on the schedule page and also on the kids'
page itself. Make them auto-sync."

Three changes, all in the one dataset:
1. Saturday 9AM is now **Boxing Basics**. The client's page called it
   "Bsics & Kardio KO"; per Ben it is just boxing basics.
2. Sessions carry an `audience`, adult or youth. The week board on
   /schedule/ is the adult week only. The kids classes get their own block
   below it, in a panel, with links to the youth page and to their own
   feed. The same cards render on the youth page itself.
3. Two feeds instead of one: `/schedule.ics` for the adult classes,
   `/youth-schedule.ics` for the kids. An adult subscribing does not get
   kids classes in their phone, and a parent gets only the kids block.
   Both are built by `site/src/lib/ics.js` from the same dataset.

Also, Foundational Sparring (Thursday 6PM) now belongs to the competition
page only, not both. It sits in the client's competition block next to
Competition Sparring. One word from Ben moves it to basics.

What syncs where, all from `site/src/data/schedule.js`:
- /schedule/ adult board, filter chips for boxing basics, competition
  team and open gym, plus the kids panel
- /beginners-boxing-class/ boxing basics only, 5 days
- /competition-team-training/ competition classes only, 3 days
- /youth-boxing-class/ kids only, and the same cards as the kids panel
- /schedule.ics and /youth-schedule.ics the two subscribe feeds

The day cards are one component (`components/SessionCards.astro`), so a
class's times look identical on the schedule page, its class page and any
page built later.

## The schedule moves into Sanity (2026-08-27, Ben round 3)
Ben: "I don't want to sync to calendar button. I want it to automatically
sync back to the main calendar. That way we can create, on the backend in
Sanity, the customer can just change the schedule and it changes on all the
pages not just one."

So the .ics subscribe feeds and both sync buttons are gone, and the schedule
now lives in a CMS the gym edits. Full map in CMS.md, setup steps in
cms/README.md. In short:

- one document per class in Sanity, edited by the gym, Publish and done
- the build reads Sanity and writes the times into the HTML, so the pages
  stay static files, crawlable, and correct with JavaScript off
- on page load the page re-checks Sanity through its CDN and re-renders in
  place only if something changed, so a Publish reaches the live site
  without waiting for a deploy
- with no Sanity project configured the build logs one line and uses the
  committed copy of the week, so anyone can clone the repo and build

The plumbing:
- `site/src/lib/schedule-source.js` the query, plus validation that drops
  any half-broken document rather than letting it take a page down
- `site/src/lib/render-schedule.js` one renderer used at build time and in
  the browser, so a live update produces exactly the built markup
- `site/src/scripts/schedule-live.js` the on-load re-check, wired in
  Base.astro and a no-op on pages with no schedule
- `cms/schemaTypes/classSession.ts` the Studio schema, in plain language:
  class name, day, start, optional end, adults or kids, and which pages it
  appears on
- `cms/seed.ndjson` today's 22 classes, so the client's schedule lands in
  Sanity with one import command instead of 22 hand entries

The eighth cell of the board was the subscribe panel; it is now a call to
action ("New here?") that opens the lead form. That short paragraph is the
one piece of copy on these pages I wrote rather than the client.

Verified with the live path faked in Playwright: an edited schedule
re-renders the board, the kids block and each class page from the one
change; an invalid document is dropped; the filter chips still work after a
re-render; a program with no classes left hides its block instead of showing
an empty heading; and with the request blocked, the built-in times stand.

## Grid layout, Saturday basics fix, and the FAQ page (2026-08-27, Ben round 4)
Ben: "For the schedules, just like Nashville MMA, I want the 6 p.m. to be
beside the 6 p.m. I would rather it not be blocky and take a whole page
either. It should be one piece. Do we not have a boxing basics on Saturday
morning? I think you had it called Boxing and KO, but it's just Boxing
Basics now. Also, instead of building a blog page, let's build a dynamic
FAQ that actually answers all the questions from Reddit and stuff that are
around Nashville so that we can rank higher in AI and SEO in general for
the whole city."

**Schedule became a true aligned grid.** The day-card board (Ben round 2)
put every class in its own box; Ben wanted what Nashville MMA does, a
single grid where the same hour lines up across every day. Rebuilt as
`matrix()` in schedule.js: one row per start time that actually has a
class (not one row per hour of the day, so the grid stays compact instead
of mostly empty), seven day columns, time rail down the left. 6 PM Monday
now sits directly across from 6 PM Wednesday and Friday. Renders through
`renderMatrix()` in the shared renderer, same as before: one markup path
for the build and for a live Sanity re-check. Filtering now hides whole
time rows when nothing in them matches the chip.

Saturday: already fixed to Boxing Basics on 2026-08-27 (Ben round 2). Ben
asked again in this message, so it is confirmed twice over. It reads
Boxing Basics, 9 AM, in schedule.js and on the built grid.

Class-page and kids blocks became a compact list (`renderList()` /
`SessionList.astro`, renamed from the old day-card `SessionCards`): day
name, then its times inline. No card grid taking up a page height for one
or two classes.

**FAQ page**, `/faqs/`, replaces the planned Boxing Blog (already absent
from nav; nothing to remove). 22 questions across five sections (starting
from zero, the classes, kids and teens, competing, visiting the gym),
built from real search demand around Nashville boxing (cost, first class,
gear, sparring, kids' age, USA Boxing registration) plus what the client's
own copy already answers on the class pages. FAQPage JSON-LD generated
from the same list shown on the page, so structured data can never claim a
question the page does not display. Client-side search filters by
question and answer text; a hit auto-opens. Same Sanity-or-fallback
pattern as the schedule: `cms/schemaTypes/faqItem.ts`,
`cms/faq-seed.ndjson` with all 22 seeded, `site/src/lib/faq-source.js`.
One difference from the schedule: no live browser re-check, since FAQ
answers change far less often than class times and a page whose whole job
is being read and quoted does not need to ship its content twice (once in
HTML, once in a JS bundle).

**Three answers need Ben's own numbers before they are fully trustworthy**,
flagged with `needsGymInput` in faqs.js and left as honest "call us" rather
than invented figures:
1. Cost. I gave the market range from public sources instead of the gym's
   real rates. Send current pricing and trial terms.
2. Whether the youth schedule is really just Saturday noon.
3. Whether private / personal training sessions are offered at all.

Also folded the schedule's URL-building into `site/src/lib/sanity.js`, one
place both the schedule and the FAQs use, rather than writing the same
apicdn URL logic twice.

Local grounding for the FAQ (not the client's copy, my own research,
verified real): 405 42nd Ave N sits in the Charlotte Avenue corridor
between Sylvan Park and The Nations, near the I-40 exit at 46th Ave, with
a WeGo stop at 42nd Ave. USA Boxing membership requires a yearly sports
physical and an athlete passbook; registration opens at age 8, which is
also this gym's youth boxing minimum.

## Two missing youth sessions added (2026-08-27, Ben round 5)
Ben: "You only have the Saturday kids class or youth class listed. There
are Monday and Wednesday evenings on our schedule on our website. 4:30."

The client's WordPress export only carried one youth session (Saturday
IBAN Youth, noon), so that was all that made it into schedule.js. Ben
confirmed two more directly: Youth Boxing, Monday and Wednesday, 4:30 PM.
Added with no end time, matching how most other sessions on this page are
recorded (start only). `cms/seed.ndjson` regenerated to match (24
documents now, was 22).

## One grid, everywhere, and 6/7 AM Boxing Basics added (2026-08-27, Ben round 6)
Ben: "Before you do that make sure the schedule, the main schedule, is
awesome. All the times line up and everything looks good but every other
page seems like it has a different schedule and they're not accurate...
There's 6:00 AM and 7:00 AM boxing basics. We need those on the schedule.
We need the schedules to be uniform... I want them all to be the same.
Just like the one on the scheduling page that you made is dope."

**Tried to pull the real schedule from fightersnashville.com directly, as
asked.** Confirmed again: this build's network access is blocked from that
domain (same block noted earlier in this project). No newer WordPress
export exists than the 2026-08-26 one already in
`source/wp-export/`. Re-checked that export's raw markup line by line (it
has no real `<table>`, the "Time / Day: 7AM...5PM" header row is a separate,
unlinked Elementor list from the actual class cells, so column position
never mapped to time; the true time for each session is the text inside
that session's own cell, which is what schedule.js already encoded).

**6 AM and 7 AM Boxing Basics, Monday through Friday, added per Ben's
direct statement**, since neither the live site nor a newer export was
reachable. The 2026-08-26 export only had one weekday morning session
(Monday, 7 AM); the other four weekdays had no 7 AM Boxing Basics in that
export at all. Applied uniformly across all five weekdays since Ben did
not name specific days. **Flagged in schedule.js for Ben to confirm**: if
it is not literally every weekday, one line changes it.

**Every schedule surface is now the same component.** The card-grid
"day-cards" and the "compact list" strips (both built in earlier rounds)
are gone. `components/ScheduleGrid.astro` is the one grid: a time rail
down the left, seven day columns, one row per time actually in use. It is
used by:
- the adult week board on `/schedule/` (with the filter chips)
- the kids block on `/schedule/`, now full width instead of the old
  narrow side-by-side panel, so it reads as the same schedule rather than
  a smaller different-looking thing
- each class page's "Class times" section, filtered to that page's own
  program
- the youth class page, filtered to the youth program

Same hour, same row, on every one of them: 6 AM lines up with 6 AM, 7 AM
with 7 AM, across every day and every page. `SessionList.astro` (the
compact list component from the previous round) is deleted; nothing used
it once ScheduleGrid replaced it everywhere.

`cms/seed.ndjson` regenerated to match (33 documents, was 24).

## Six pages built: Coaches, What to Expect, Boxing Classes, Contact Us, Privacy Policy, Terms & Conditions (2026-08-27, Ben round 7)
Ben: "It looks like we still need to build the coaches page. Are there any
other pages we need to build? If you have another page, build it."

Scanned every nav link and every "Read More" target site-wide. Before this
round, `/boxing-classes/` (the "Boxing Classes" nav parent itself, not just
its three children), `/coaches/`, `/what-to-expect/`, `/contact-us/`,
`/privacy-policy/`, and `/terms-conditions/` were all dead links, on every
page, since the header and footer link to them from anywhere on the site.
All six now resolve. The only remaining dead link site-wide is
`/our-gyms/`, correctly held back pending the Nashville MMA interlink.

**Coaches** (`/coaches/`, `data/coaches.js`). Nine real coaches from the
client's WordPress export (cpt_team post type): name, role, and credentials
copied verbatim from each coach's own bio page. Dr. Christy Halbert
(Founder & Director, 2012 Olympic Coach for Team USA, IWBHF Inductee) leads
with her own bio paragraph; the other eight are Kayla Trotter, Evan Carr,
Nick Hicks, Steve Vernier, Mindy Vernier, Jeremiah Cline, Sena Agbeko, and
Ernest Rodriguez (WordPress slug `jake-lawrence`, real name confirmed
earlier in this project). Instagram links included only where the coach's
own page carried one (Steve Vernier, Mindy Vernier, Sena Agbeko); the other
six have none in the source, so none is shown.

Two things deliberately left out, both flagged: every coach's bio page
carried identical "Practice 80% / Championships 90% / Experience 88%"
progress bars, which is the page builder's demo default repeated
unchanged across all nine people, not a real measurement, so it is not
shown. No photos: the coach headshots live in the client's media library
on the dev domain (floralwhite-woodcock-644453.hostingersite.com), which
this build cannot reach. Cards show the coach's initials in an accent
roundel instead of a stock photo standing in for a named person. **Ben:
send the real headshots (or the wp-content/uploads zip) and they replace
the initials directly, filename per coach slug in coaches.js.**

**What to Expect** (`/what-to-expect/`). The page both class-page "Read
More" links have pointed at since the project's first inner-page round.
Client's own four-step first-visit copy, verbatim: Arrive Early & Get Set
Up, Gear Up & Learn the Basics, It's Go Time, You're Part of the Team Now.
Six em dashes replaced with commas or periods (Ben's standing rule),
logged in copy.md. Links out to the new Coaches page, matching the
client's own "Meet the Coaches" teaser on this page. No photo: every real
photo in `public/img` is already placed on another page (see the photo
assignment log elsewhere in this file), and a repeated photo is worse than
none. A fresh shot for this page's intro would be welcome.

**Boxing Classes** (`/boxing-classes/`). The hub the header's "Boxing
Classes" nav item has linked to directly since round one. Client's own
pitch copy for each of the three classes, condensed from their full class
pages, each linking through to it. One repair, logged in copy.md: the
Boxing Basics paragraph opened mid-sentence on the client's own live page
("that teaches the fundamentals stance, footwork..."), almost certainly
the same dash-stripping issue flagged for other pages in this project.
Repaired to a complete sentence ("Perfect. This class teaches the
fundamentals: stance, footwork...") rather than left broken or invented
whole. Uses each class's own thumbnail photo, same as the homepage's
existing class-card slideshow already does; this is a hub previewing its
own sub-pages, not a case of the site-wide no-repeat rule.

**Contact Us** (`/contact-us/`). The client's export for this page was
mostly page-builder demo junk: an "01. New York / 02. Boston / 03. Los
Angeles / 04. Austin" fake office block with placeholder phone numbers and
`info@email.com`, plus a Contact Form 7 duplicate of the lead popup. None
of it kept. Real content kept: phone, email, and the same map as the
footer, given room to breathe as its own page since "Contact Us" is a real
footer link now.

**Privacy Policy** and **Terms & Conditions** (`/privacy-policy/`,
`/terms-conditions/`). Client's own boilerplate, verbatim, no em dashes to
fix. Both explicitly cover Fighters Boxing Gym and Nashville MMA Training
Camp together, the client's own choice (shared ownership), kept as
published rather than split into two separate policies. Share one new
layout, `layouts/LegalPage.astro`, since both pages are the same shape:
numbered sections under a poster header.

`components/ClassTicker.astro`, `ScheduleStrip.astro` and the schedule
pages already linked to these six destinations; no other file needed a
link added, only the destinations themselves.

## Our Gyms built: the last remaining page (2026-08-27, Ben round 8)
Ben confirmed the site was otherwise complete, then: "Yeah basically it'll
just be the upside down version of the current our gym page."

"The current our gym page" is the client's own real WordPress page
(`our-gyms`, in the 2026-08-26 export), the only Our Gyms page that
currently exists anywhere (Nashville MMA has no built site yet, design
canvas only, per `projects/nashvillemma/`). Read "upside down" as the
project's own founding brief: Fighters light, Nashville MMA dark, an Our
Gyms page on each that mirrors the other. Since there is no live Nashville
MMA page to literally flip, the mirroring is expressed on this page itself
instead of deferred: the Nashville MMA section renders in their own real
kernel colors (black ground, `#D7AD56` gold, pulled from
`projects/nashvillemma/kernel.json`), sitting inside Fighters' otherwise
all-light page as a deliberate dark inset. The Championship Package
section, the one piece of content genuinely about both gyms together, is
split light/dark down the middle, literally the two brands meeting. When
Nashville MMA's own site is built, its `/our-gyms/` page is the dark
mirror of this one: same real content, Nashville MMA leads, Fighters sits
in the inset.

Real content, from the client's export: the two-gym hero pitch, the
Fighters section (matches the client's own real pitch, and the coach
teaser here, Halbert/Trotter/Carr, matches `data/coaches.js` exactly,
confirming that file), the Nashville MMA section, the Championship Package
(a real cross-membership offer: boxing rings and heavy bags on the
Fighters side, MMA cages, grappling mats and the Recovery Room on the
Nashville MMA side, a shared fitness gym across both), and the closing
"One Community. Two Legends." pitch.

Four em dashes repaired (comma, period, or colon, never invented content):
"Each gym stands strong on its own: world-class training, expert coaches,
and championship results. But together..." (one spot had two missing
dashes bracketing a parenthetical, split into two sentences with a colon);
"...for all skill levels, from beginners..."; "...has to offer, all under
one membership."; "...a shared mission: to help every athlete...".

Two things dropped as page-builder demo content, not real: three Lorem
Ipsum testimonials under fake names (Mark Stevens, Jenny Chanson, Hank
Smith, the exact same three names already rejected as review sources
earlier in this project); a "Basic $60 / Standard $80 / Advanced $95"
pricing tier block, Lorem Ipsum body text under each price, obvious theme
defaults, not this gym's real pricing (same open question already flagged
for the FAQ page).

No new photos: same problem as every other page this round, the client's
media library is unreachable. The coach-teaser here reuses the initials
treatment from the Coaches page rather than a stock photo standing in for
Halbert, Trotter or Carr.

This closes every planned page. The only remaining dead link anywhere on
the site was `/our-gyms/` itself; it now resolves. Nothing else is
pending except real coach photos, real pricing, and whatever Ben decides
about the Sanity CMS setup for the schedule and FAQs.

## Intermediate Boxing added (2026-09-03, Ben round 9)
Ben: "we need to add in the intermediate boxing. it has 2 classes per
week."

Checked the WordPress export for any real Intermediate content first: one
unrelated stray hit for the word, nothing describing a class. Unlike every
other class page on the site, there is no client copy to draw from here,
so this page's pitch (`intermediate-boxing-class.astro`) is mine, written
to make only claims the site's own structure already supports, a step
between Boxing Basics and Competition Team Training, no invented
instructor names or specific curriculum promises. **Ben: send real copy
whenever you have it, and it replaces this directly.**

Two things placed as flagged guesses, both easy to correct in one file:
1. **Days and times.** Ben gave a frequency (two a week) but not which
   days or times. Placed in the only fully open weekday evening slot on
   the board, Tuesday and Friday 5:45 PM, where Competition Team Training
   does not run. Flagged with `verify: true` on both sessions in
   schedule.js. **CONFIRM WITH BEN the real schedule.**
2. **Photo.** No fresh photo exists (every real photo on the site was
   already placed on another page). Reuses `training-mitts-800.jpg`, its
   third placement now (also the Schedule page's Open Gym section and the
   homepage card-stack). A fresh photo for this class would be welcome.

Wired everywhere a class needs to exist, matching the pattern the other
three follow:
- `data/classes.js`: added between Boxing Basics and Competition Team
  (the natural progression order), which the homepage card-stack and
  every ticker read from automatically.
- `data/schedule.js`: new `intermediate` program, two sessions.
- `components/Header.astro`: added to the Boxing Classes dropdown.
- `pages/boxing-classes.astro`: added its pitch to the hub.
- `cms/schemaTypes/classSession.ts` and `cms/seed.ndjson`: the CMS now
  offers Intermediate Boxing as a program option (35 seed documents, was
  33) and the schedule/class-times grid on every page (main board,
  Beginners, Competition, this new page) automatically includes it since
  they all read the one shared dataset.

One bug caught in review: the page's "Who It's For" heading used the
`&rsquo;` HTML entity, correct for the `body` fields (rendered via
`set:html`) but wrong for a plain-text `heading` field (Astro escapes it
literally, showing `&rsquo;` on the page instead of an apostrophe).
Replaced with a literal curly apostrophe character. Worth remembering for
any future heading string with a contraction.
