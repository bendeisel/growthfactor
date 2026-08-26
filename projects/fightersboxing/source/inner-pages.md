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
- **FAQs** — real-looking questions ("How do I apply for a membership?",
  "Are there training classes for kids?", "What equipment do I need for
  boxing?") but every answer is Lorem Ipsum. Cannot build this page until
  real answers exist; not writing them ourselves per the copy lock.

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

## Template pattern (shipped on Beginners Boxing Class, page 1 of 3)
- Same Header/Footer/LeadPopup as the homepage
- Hero: photo band (not video), lightened radial scrim, page H1, one
  GET STARTED button
- Body: the page's real copy in a single column (headline + 2 subheads),
  ambient fluid gradient background, second GET STARTED button at the end
- Cross-page ticker at the bottom: all four class names, current page
  shown dimmed/underlined instead of linked, the other three link to
  their own pages (not homepage anchors) for real internal linking
- New shared files: `src/data/classes.js` (single source for the class
  list, used by the homepage and every class page) and
  `src/components/ClassTicker.astro` (the reusable ticker)

Next: Youth Boxing Class and Competition Team Training, same pattern,
their own real copy, awaiting Ben's sign-off on this first one.
