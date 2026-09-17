# Build brief: BJJ Curriculum + Lineage pages

**Client:** Nashville MMA Training Camp (nashvillemma.com)
**Project dir:** `projects/nashvillemma/`
**Brief owner:** Growth Factor AI
**Status:** ready to build, blocked on client intake (section 7)

---

## 1. What you are building and why

Two new pages for the Brazilian Jiu-Jitsu program. They are not general content
pages. Each one exists to win a specific thing:

| Page | Job |
| --- | --- |
| **Curriculum** | Rank for "what do you learn in bjj" style queries, and be the most complete syllabus published by any gym in Nashville. Converts researchers who are comparing schools. |
| **Lineage** | Make the "true authority in Nashville since 2002" claim *checkable*. This is the page a three-year-old competitor physically cannot produce. |

Strategic background lives in `projects/nashvillemma/bjj-strategy/strategy.html`.
Read it if you want the full picture, but this brief is self-contained.

The short version of the problem: at least four live pages currently target the
same jiu jitsu keyword, so nothing compounds, and gyms with "Jiu Jitsu" in their
legal name outrank a 24-year-old academy with 485 reviews. These two pages are
the authority half of the fix.

---

## 2. Read before you write a single line

In this order. Do not skip.

1. **`.claude/skills/house-style/SKILL.md`**: the four locks. Non-negotiable.
2. **`.claude/skills/house-style/references/worked-example-nashvillemma.md`**:
   this exact client, kernel and motif inventory already done for you.
3. **`.claude/skills/house-style/references/hostinger-delivery.md`**: the build
   target and the per-site SEO defaults.
4. **`projects/nashvillemma/kernel.json`**: the measured brand kernel.
5. **`projects/nashvillemma/README.md`**: standing client instructions.

---

## 3. Hard rules

### 3.1 Do not invent facts. This is the one that matters.

Both pages are authority pages. Their entire value is that a reader can verify
them. **A hallucinated professor name, an invented promotion year, or a made-up
belt requirement destroys the exact thing these pages exist to build**, and on a
lineage page the BJJ community will catch it fast and publicly.

So:

- Every name, date, belt rank, lineage link and syllabus item comes from client
  intake (section 7). Nothing comes from you.
- Where intake is missing, ship a visible `{{PLACEHOLDER: description}}` token.
  Do not write plausible filler around the gap.
- Do not pull lineage from web search and assume it maps to this academy.
  Lineage claims are specific to the individual, and there is a known
  Bryan / Brian Tidwell spelling split across sources.
- Do not invent statistics. No "thousands of students", no round numbers,
  no "the most respected" unless the client supplied it as their own words.

### 3.2 Copy is frozen at 99%

Standing client instruction. Client-supplied copy ships verbatim. The 1% is
mechanical repair only (a genuine typo, doubled word, encoding artifact).
Anything you want to reword goes in a list at handover, not into the page.

For the new prose that has no client source, write plainly and factually, then
flag every such block at handover so the client can approve or replace it.

### 3.3 Amplify, never import

If a change needs a typeface, hex or shape the site does not already use, it is
out of scope. For every visual decision, name the existing motif it came from.

### 3.4 Three unresolved data conflicts

Do not pick one yourself. Use a placeholder and flag it:

- **Founding year:** site says established 2002. Client says "25 years", which
  reads as 24 from 2002. **Recommended copy is "since 2002"** because it is
  checkable and never goes stale. Needs client sign-off.
- **Facility size:** quoted as both 30,000 and 40,000 sq ft across the site.
- **Class count:** quoted as both "80+ weekly classes" and "90+ classes". The
  project README lists 90+ as the approved figure, but the live site says 80+.

---

## 4. Kernel and motifs

Full detail in `kernel.json` and the worked example. Summary so you do not
mis-set anything:

```
faces    Bebas Neue      h1-h6, caps by nature
         Montserrat      400 / 700 / 900, body 16px / 1.6
ground   #131313         header + footer
         #171820         alternate section
         #1E1E29         cards + form inputs
         #000000         hero base
accent   #D7AD56         primary gold
         #C0883A         buttons
         #C59543         slogan band
detail   #303030         separators
geometry cornerRadius 0px · buttonRadius 8px · dotCorner 80px
rhythm   sectionGap 80px (30px phone) · sectionBoxed 1600px
```

**Motif guidance specific to these two pages.** The client's numbered-disc
device (120x120, 80px radius, `#000` ground, 70px Bebas numeral) is the site's
most distinctive owned element and it currently appears in exactly one section.
Both of these pages are natural homes for it, because both have genuine
sequence in their content:

- Curriculum: belt levels are an ordered progression.
- Lineage: generations are an ordered chain.

This passes the name-the-motif test. Use it. Do not reach for a generic
three-column icon grid, and do not number anything that is not actually a
sequence.

---

## 5. Page 1: Curriculum

```
URL      /classes/brazilian-jiu-jitsu/curriculum
Title    Brazilian Jiu Jitsu Curriculum | Nashville MMA Training Camp
Length   1200 to 1800 words of real content
Parent   /classes/brazilian-jiu-jitsu
```

Meta description: what a student actually learns, belt by belt. Written as a
reason to click, not a keyword list.

### Required sections

1. **What the program is built around.** The Matrix Jiu-Jitsu system as taught
   by Bryan Tidwell. Client-supplied description of the approach.
2. **Belt progression, white through black.** One block per belt. Each carries:
   - typical time at that belt at this academy
   - core techniques and positions introduced
   - what the student is expected to demonstrate to advance
   - stripe criteria if the academy uses them
3. **Gi and no-gi.** Both named and explained separately. Roughly half of
   searchers only want one of them, and competitors rarely separate the two.
4. **Class formats.** Fundamentals, all-levels, open mat, competition training.
   What happens in each, and who each is for.
5. **How promotion actually works at this academy.** Who evaluates, how often,
   what the standard is. This is the section that separates a real curriculum
   page from a marketing page.
6. **FAQ**, 5 questions minimum. Answer inside the first 40 words of each, then
   expand. The opening 40 words are what gets quoted in an AI answer.

### Required links out

- Up to `/classes/brazilian-jiu-jitsu` (the hub)
- To `/classes/brazilian-jiu-jitsu/lineage`
- To `/instructors/bryan-tidwell`
- To the BJJ-filtered schedule
- One trial CTA opening the popup form

---

## 6. Page 2: Lineage

```
URL      /classes/brazilian-jiu-jitsu/lineage
Title    Our Jiu Jitsu Lineage | Nashville MMA Training Camp
Length   900 to 1400 words
Parent   /classes/brazilian-jiu-jitsu
```

> **Path note:** the strategy doc wrote this as `/jiu-jitsu/lineage`. Use the
> path above instead. Keeping the whole cluster under
> `/classes/brazilian-jiu-jitsu/` is the point of the consolidation work, and a
> second top-level path would recreate the problem we are fixing.

### Required sections

1. **The lineage chain.** Named professor by professor, tracing Bryan Tidwell's
   promotion back through his instructors. Present it as a visual chain, not a
   paragraph. This is the numeral-disc moment.
2. **The Matrix Jiu-Jitsu Association.** Tidwell is its founder and head black
   belt. Frame it accurately: competitors in this market are affiliates of
   someone else's lineage, this academy founded its own. Link out to the
   association site once it exists.
3. **Black belts promoted since 2002.** Name and year. This is the single
   strongest authority claim a BJJ academy can publish and almost nobody does
   it. **Entirely client-supplied.**
4. **Timeline from 2002.** What the academy was, what it became. Client-supplied
   milestones only.
5. **Notable competition results**, by year. Client-supplied.

### Required links out

- Up to `/classes/brazilian-jiu-jitsu`
- To `/classes/brazilian-jiu-jitsu/curriculum`
- To every coach bio named on the page
- Outbound to IBJJF, Tapology and the association site where they corroborate a
  claim made on the page. Outbound links to corroborating authorities are a
  feature here, not a leak.

---

## 7. Client intake required before publish (BLOCKING)

Send this to the gym. Nothing in sections 5 and 6 can be completed without it,
and guessing any of it defeats the purpose of both pages.

**Lineage**
1. Bryan Tidwell's full lineage chain, professor by professor, as far back as he
   traces it.
2. Year and promoting professor for each of his belt ranks.
3. Confirm the spelling: Bryan or Brian. Tapology has it one way, the site the
   other.
4. Every black belt promoted by the academy since 2002, with year.
5. What the Matrix Jiu-Jitsu Association is, when founded, and any affiliate
   academies.
6. Notable competition results worth listing, by year.

**Curriculum**
7. The actual belt-by-belt syllabus as taught. Whatever form it exists in now,
   even a whiteboard photo.
8. Stripe criteria, if used.
9. Typical time at each belt at this academy.
10. Who evaluates promotions and how often.
11. How gi and no-gi are split across the weekly schedule.

**Settle the conflicts**
12. Founding year for public copy. Recommend "since 2002".
13. Facility square footage: 30,000 or 40,000.
14. Weekly class count: 80+ or 90+.

**Assets**
15. Real photos: mat room, promotions, competition, coaches. No stock.
Stock photography on an authority page reads as a gym with nothing to show.

---

## 8. Shared technical requirements

Per `hostinger-delivery.md`, plus these page-specific additions.

**Schema (JSON-LD)**

- Curriculum: `Course` with `syllabusSections`, `educationalLevel`, and an
  `Offer` for the free trial. Plus `FAQPage` and `BreadcrumbList`.
- Lineage: `AboutPage`, plus a `Person` entity for every named coach carrying
  `sameAs` to Tapology, IBJJF, Smoothcomp and social. Plus `BreadcrumbList`.
- Both: no `AggregateRating` unless genuine reviews are rendered on that page.
  Self-serving markup gets rich results stripped.

**Build**

- Astro, static out, per the house stack. Components while authoring, plain
  HTML/CSS/JS delivered.
- Popup lead form on every request CTA (standing client instruction), vanilla
  JS, no framework dependency.
- One `<h1>` per page, keyworded `<h2>`s, canonical, per-page meta, sitemap
  entries.
- Images sized, compressed and alt-texted at build time. Alt text describes
  what is happening, not "jiu jitsu class".
- Real HTML content. Nothing client-rendered, no text baked into images.

**Banned by default** (per SKILL.md, unless the kernel genuinely has it)

Inter / Roboto / Poppins, the shadcn slate-and-rounded-card look, gradient or
aurora heroes, glassmorphism, the centered-hero-with-stock-photo, the reflex
three-column icon grid, emoji as icons, and decorative statistics.

---

## 9. Definition of done

- [ ] Both pages built, responsive, Lighthouse green on mobile
- [ ] Zero `{{PLACEHOLDER}}` tokens remaining
- [ ] Every fact traceable to client intake, nothing invented
- [ ] Schema validates in Rich Results Test and the Schema.org validator
- [ ] Every required internal link in place, hub links back down to both pages
- [ ] Self-audit written per SKILL.md step 5, including the name-the-motif
      answer for each visual decision
- [ ] Handover list of any copy you wanted to change but did not
- [ ] Shipped-log row appended (`.claude/skills/house-style/data/shipped-log.csv`)
