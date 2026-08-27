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
