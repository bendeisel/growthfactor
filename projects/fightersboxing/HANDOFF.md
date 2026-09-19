# Fighters Boxing Gym: handoff

For a fresh Claude thread. Everything here was verified on 2026-09-19.

**Start by reading:** this file, then `START-HERE.md` (Ben's plain-language
status), then `source/copy.md` (every content decision and why).

---

## One-line status

The site is **built, verified, and packed**. It is **not live**. It is
waiting on Ben for three things, none of which are code.

---

## The canonical links

| What | Where |
| --- | --- |
| **The site artifact** | https://claude.ai/artifact/PWE2Pk6S3Q25PuBunKtiy7 |
| Same, old URL format | https://claude.ai/code/artifact/b63da56b-ce01-4f89-9ac0-53d04def5bb2 |
| Branch | `claude/fighters-boxing-homepage-6bqrc0` |
| PR | https://github.com/bendeisel/growthfactor/pull/25 (open, draft) |
| Upload-ready zip | `projects/fightersboxing/fighters-website.zip` (git-ignored, regenerate) |

The artifact is titled **"Fighters Boxing Gym | Full Site"**. That naming
convention (`<Client> | Full Site`) is now a rule in the site-factory
skill. Do not publish anything else for this client.

### Trap: there are stale Fighters artifacts in Ben's gallery

Eight superseded per-page artifacts from August still exist, plus one
retired notice. **A published artifact cannot be deleted from a session**
(no tool can: `delete_asset` removes a file inside one, `ArtifactData`
delete removes a database row). Only Ben can delete them, by hand, at
claude.ai/code/artifacts. He has the list and intends to.

One of them was renamed on 2026-09-10 to "Fighters Boxing Gym Site",
which bumped the August build above the September one in the gallery and
made Ben open the wrong site. It is now republished as a retired notice.
**If a Fighters artifact turns up that is not the link above, it is not
current.**

---

## What is built

31 pages, one artifact, one Astro project.

- Home, Boxing Classes hub, 4 class pages (Beginners, Intermediate,
  Competition Team, Youth)
- Coaches, Schedule, FAQs, What to Expect, Our Gyms, Contact
- Privacy Policy, Terms
- **Boxing Blog**: index at `/boxing-blog/` plus **16 SEO posts**
  (rebuilt 2026-09-19, see below)

SEO in place: unique title and meta description on all 31 pages,
`SportsActivityLocation` schema sitewide, `FAQPage` (22 Q&As),
`BlogPosting` on each post with an Organization author, generated
`sitemap.xml` (31 URLs), robots, and `.htaccess` carrying two 301s.

---

## What Ben still owes us

In priority order. **None of these block a launch except by choice.**

1. **The nine coach photos.** The Coaches page shows initials instead of
   faces. The files exist on the client's live site. Exact filenames are
   in `SEO-PLAN.md` Part 8 (`Image-01-1.jpg` through `Image-09-1.jpg`,
   mapped to coaches). This environment cannot fetch them, see below.
2. **Real pricing.** Escalated: the blog now has a post targeting "what do
   boxing classes cost in Nashville" and it cannot state a number, because
   the gym has never given us one. It routes to the phone instead. This is
   now costing a page rather than one FAQ answer.

   (*Billy Falco is no longer an open question. The post announcing him
   was retired on 2026-09-19 and 301s to `/coaches/`, so the site makes no
   claim about him. If he is coaching, he just needs adding to the Coaches
   page like anyone else.*)
3. **Confirm the production domain.** `fightersnashville.com` is assumed
   from `astro.config.mjs`, never confirmed.
4. **Hostinger API token**, only if he wants us to deploy rather than
   doing it himself. Optional: the zip plus File Manager needs no token.
5. **Google Business Profile access**, for the SEO work that actually
   moves leads.

---

## Facts that will save you an hour

### The network blocks the client's domains

`fightersnashville.com`, the Hostinger staging domain
(`floralwhite-woodcock-644453.hostingersite.com`) and `boxingresource.com`
are **all blocked by this environment's egress proxy**. Tried with curl
and WebFetch, both fail. Do not plan around fetching them. Ask Ben for a
screenshot or a browser-save zip instead; a screenshot is how the
schedule finally got settled.

### The schedule is correct now. Do not "fix" it.

`site/src/data/schedule.js` was corrected on 2026-09-08 against a
**screenshot of the gym's own schedule graphic**, which supersedes the
2026-08-26 WordPress export. The export was materially out of date. 29
sessions, nothing flagged `verify`.

Things that look wrong but are right:
- 6 AM Boxing Basics runs **Monday and Wednesday only**
- 7 AM Boxing Basics runs **Tuesday and Thursday only**
- Intermediate Boxing is **Tuesday and Thursday 5:45 PM** (an earlier
  guess of Tue/Fri was wrong and is fixed everywhere except possibly old
  PR text)
- Competition Team runs Mon, Wed **and Thu**
- Friday has no morning class at all
- Saturday open gym is 9 AM to 12 PM (the export's "2AM" was their typo)
- There is no Sunday column because the gym is closed, and closed days
  are dropped from the grid by `matrix()`

### Blog URLs must stay at root level

Posts live at `/mindset-matters/` and so on, **not** under `/blog/`. That
is exactly where WordPress served them, and keeping it is the only reason
existing backlinks still resolve. The index is `/boxing-blog/` because that
was their real archive URL. `/blog/` was an empty page on their site.

### The blog was rebuilt on 2026-09-19. Read this before touching it.

It is no longer the client's ported copy. Ben's instruction: SEO blogs
answering what people search, and **Christy Halbert's name off the blog**
(she stays on `/coaches/` and `/our-gyms/`). Every old post had ended with
the same founder-bio blockquote.

- **16 posts of original copy.** `site/src/data/posts.js` is now
  **hand-authored**. Its header carries the rules. Read them before editing.
- `source/build_posts.py` **refuses to run** without `--force`. It would
  regenerate posts.js from the WordPress export and wipe all 16, putting
  the founder blockquote back. It is kept only as the port's record.
- **8 original slugs unchanged**, so their backlinks still resolve.
- **2 retired with 301s** in `site/public/.htaccess`: the Billy Falco
  announcement to `/coaches/`, Jake Paul vs Tyson to
  `/5-steps-to-start-boxing-at-any-age/`.
- **No human byline.** Schema author is the Organization, by design.
- **No invented facts**, and no prices anywhere: see the ledger.

Full reasoning, the slug-to-query table and what is still open:
`source/copy.md`, round 20.

The 25 draft posts in the export are Ring-theme lorem ipsum about samurai
katanas and CrossFit. They were dropped deliberately. Do not "restore"
them.

### Ship the Astro build, not the split_pages output

`split_pages.py` emits flat files (`mindset-matters.html`), which would
break every blog backlink. The deploy zip is built from
`site/dist/`, which produces clean directory URLs. The shell
(`site.html`) is the review surface only.

### Rank Math does not apply

Ben has Rank Math set up and assumed it covers this site. It is a
WordPress plugin and this build is Astro. Everything it would prompt for
is already written into the code. He has been told; do not re-litigate.

### House style

`CLAUDE.md`: **never an em dash**, anywhere, including commit messages.
Ben is on Windows, so Windows paths and shortcuts only.

---

## Commands

From `projects/fightersboxing/`:

```
cd site && npx astro build && cd ..   # 25 pages into site/dist/
python3 build_shell.py                # dist -> site.html (the shell)
python3 build_preview.py              # -> site.preview.html (base64, for the artifact)
python3 source/build_posts.py         # regenerate blog data from the WP export
```

Publish the artifact by republishing `site.preview.html` to the URL
above. Rebuild the zip from `site/dist/`.

`site.preview.html`, `fighters-website.zip` and `retired-stub.html` are
git-ignored on purpose. Regenerate rather than committing them.

---

## Where things live

```
projects/fightersboxing/
  START-HERE.md        Ben's plain-language status. Written for him, not us.
  HOSTINGER-SETUP.md   Click-by-click upload steps, no API token needed
  SEO-SIMPLE.md        SEO in one page, for Ben
  SEO-PLAN.md          Full SEO plan, incl. the coach photo filenames
  CMS.md               Sanity setup
  SELF-AUDIT.md        house-style Step 5
  kernel.json          Brand kernel: typefaces, hexes, radii, motifs
  site/                The Astro project (source of truth)
  cms/                 Sanity schema + seed (29 sessions, 22 FAQs)
  source/              WP export, copy.md, inner-pages.md, build_posts.py
  build_shell.py       dist -> GF-CHROME shell
  build_preview.py     shell -> artifact copy
```

`source/copy.md` is the content ledger: every verbatim quote, every
dropped demo block, every em dash replaced, every open flag, by round. If
you are about to change client copy, read it first.

---

## Open threads Ben raised, not yet started

- **Nashville MMA has the same artifact split** we just untangled here:
  "Nashville MMA Website", "Nashville MMA | Full Site" and "NMMA Page
  Templates" all exist and nobody has established which is current. Ben
  was offered this and has not answered yet.
- **Boxing Resource Center (boxingresource.com)**, the 501(c)(3) parent
  of Fighters, founded 2001 by Dr. Christy Halbert. Ben wants it rebuilt
  and cross-linked with Fighters and Nashville MMA. Nothing exists yet.
  It is a `site-redesign` and needs a capture of their site first, which
  this environment cannot fetch. Flagged for him: a nonprofit taking
  sponsorships has tax questions (sponsorship acknowledgment versus paid
  advertising) that whoever files their 990 should look at before
  sponsor tiers get built.
- **The three-site interlinking plan** is legitimate because the
  relationships are real. Describe the actual relationship rather than
  stuffing anchor text, and mark any paid sponsorship link
  `rel="sponsored"`.
