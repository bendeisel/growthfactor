# FBG launch SEO: fightersnashville.com, WordPress to Astro

Companion to `projects/nashvillemma/` launch work. Same discipline, different
platform: NMMA migrates off 97Display, FBG migrates off **WordPress** (Ring
theme + Elementor) onto the house Astro stack.

Every step is tagged **[YOU]** or **[CLAUDE]**.

- **[YOU]** means a browser, an account login or an app on your machine.
- **[CLAUDE]** means code, config or data work. A copy-paste prompt is included.

Work top to bottom. Do not skip phase 1.

**Read first:** `.claude/skills/house-style/SKILL.md`,
`.claude/skills/bmfg-gym-sites/SKILL.md`,
`.claude/skills/house-style/references/hostinger-delivery.md`,
`projects/fightersboxing/README.md`, `projects/fightersboxing/kernel.json`.

---

## The three things that will break this launch

Read these before anything else. Each is specific to FBG and each is already true.

### 1. The WP export in this repo is the STAGING site, not the live site

`source/wp-export/fightersnashville.WordPress.20260826.xml` has
`base_site_url = https://floralwhite-woodcock-644453.hostingersite.com`. It is
the rebuild, not production.

It therefore **cannot** be used as the legacy URL inventory. Eight of the
client's real, live, indexed posts do not exist in it at all:

```
/how-to-shadow-box/
/amateur-boxing-in-tennessee/
/5-mindfulness-tips-and-techniques/
/better-boxing-during-a-pandemic/
/nashville-boxing-season-starts-now/
/black-friday/
/dr-christy-halbert-iwbhf-induction/          <- likeliest backlink holder
/high-performance-clinic-for-competitive-boxers/
```

Launch from the staging content as-is and all eight return 404. Phase 1 exists
to stop that.

### 2. The staging build carries ~90 items of Ring theme demo content

Counted from the export:

| Type | Count | What it actually is |
| --- | --- | --- |
| `cpt_services` | 25 | Karate, katana training, greco-roman, folk style, advanced MMA |
| `cpt_portfolio` | 29 | "royal-combat-club", "land-of-fighters", "left-sidebar", "right-sidebar" |
| `tribe_events` | 11 | "invitational-karate-tournament", "spike-for-glory" |
| `post` (draft) | 25 | Muay Thai, samurai, CrossFit, wrestling demo articles |

None of it is this client's. A boxing gym publishing karate and katana pages
destroys topical relevance, and `left-sidebar` is a theme artifact. It must
never reach production, and the staging domain must not be indexable while it
exists.

### 3. The new URL structure does not match the old one, and /about/ is gone

Old live URLs include `/about/`, `/staff/`, `/contact/`,
`/boxing-class-schedule/`, `/boxing-clinics/`. The Astro route list has
`/coaches`, `/contact-us`, `/schedule` and **no About page at all**. `/about/`
is one of the few URLs that demonstrably attracts links. Either build an About
route or redirect it somewhere that genuinely answers the same intent.

---

## Phase 0: Tools and access

**[YOU] Install Screaming Frog.** screamingfrog.co.uk/seo-spider. Free tier
covers 500 URLs, which is more than this site needs.

**[YOU] Confirm access to all six.** Search Console (for
`fightersnashville.com`, both the http and https properties if they exist), GA4,
Google Business Profile, Hostinger hPanel, the live WordPress admin, and the
domain registrar / DNS.

**[YOU] Verify fightersnashville.com in Ahrefs Free.**
ahrefs.com/webmaster-tools. This is where the backlink list comes from.

**[YOU] Confirm the production domain.** `astro.config.mjs` currently carries a
TODO on this. Nothing else in this runbook is safe until it is settled.

---

## Phase 1: Baseline the LIVE site. Do this before anything changes.

The staging export does not substitute for this. See breaking thing #1.

**[YOU] Export six things:**

| Source | Export | Used for |
| --- | --- | --- |
| Search Console | Pages, all indexed, 16 months | The real URL inventory |
| Search Console | Links, top linked pages | Which URLs hold equity |
| Search Console | Queries, 16 months | Ranking baseline |
| GA4 | Landing pages + conversions, 12 months | Which pages earn leads |
| Ahrefs Free | Referring pages, all | The redirect map |
| Live WP admin | A fresh export of the **live** site | The true post and page list |

**[YOU] Crawl the live site.** Screaming Frog against
`https://fightersnashville.com`. Then crawl again against
`http://fightersnashville.com`. The audit found the site indexed on **both**
protocols, so you need both inventories. Export Internal > All as CSV each time.

**[YOU] Screenshot** GBP insights and the current review count (last seen: 4.8
across 200+ reviews).

**[CLAUDE] Build the master URL list.**

> I have the exports in `projects/fightersboxing/migration/baseline/`: two
> Screaming Frog crawls (http and https), GSC Pages, GSC Links, GSC Queries, GA4
> landing pages, an Ahrefs referring-pages export, and a fresh live WordPress
> XML. Dedupe into one master URL list as CSV. Columns: url, protocol,
> status_code, post_type, title, sessions_12mo, conversions_12mo,
> referring_domains, indexed_yes_no. Sort by referring_domains then sessions,
> descending. Flag any URL with a referring domain or a conversion as
> must_redirect. Separately list every URL present on live but absent from
> `source/wp-export/fightersnashville.WordPress.20260826.xml`, because those are
> the ones at risk of silently 404ing.

---

## Phase 2: Purge the demo content and lock the build config

**[CLAUDE] Confirm nothing demo-derived is in the Astro build.**

> Grep `projects/fightersboxing/site/src` for any content originating from the
> Ring theme demo set: services slugs (karate, katana, greco-roman, folk-style,
> freestyle, advanced-mma, kata-and-kumite), portfolio slugs (left-sidebar,
> right-sidebar, royal-combat-club, land-of-fighters), event slugs, and the 25
> demo draft post slugs. Report anything found. Also confirm no route emits
> `/services/`, `/portfolio/` or `/event/` paths.

**[YOU] Noindex the staging domain.** Confirm
`floralwhite-woodcock-644453.hostingersite.com` returns
`X-Robots-Tag: noindex` or is password protected. Then search
`site:floralwhite-woodcock-644453.hostingersite.com` in Google. If anything is
indexed, remove it via Search Console before launch.

**[CLAUDE] Fix the Astro config.**

> In `projects/fightersboxing/site/astro.config.mjs`, change `trailingSlash`
> from `'ignore'` to `'always'`. The legacy WordPress URLs all carry trailing
> slashes and `'ignore'` lets both forms resolve, which is duplicate content.
> Add `@astrojs/sitemap` and remove the hand-maintained
> `site/public/sitemap.xml` so the sitemap is generated rather than drifting.
> Confirm the base layout emits a self-referencing canonical from `Astro.url`,
> per-page title and meta description props, and a JSON-LD slot. Add a 404
> route if one does not exist. Then show me the full route list the build
> produces.

**[YOU] Check that route list** against the legacy inventory from phase 1. Every
legacy URL must have either a matching route or a redirect target. Decide the
About question here.

---

## Phase 3: Redirect map

This is the part that protects the rankings. Do not rush it.

### Known legacy mappings

Confirm each against the phase 1 inventory before shipping. Destinations assume
trailing slashes per the config change above.

| Legacy URL | Action | Destination |
| --- | --- | --- |
| `/about/` | 301 | New About route, or `/coaches/` if About is not built |
| `/staff/` | 301 | `/coaches/` |
| `/contact/` | 301 | `/contact-us/` |
| `/boxing-class-schedule/` | 301 | `/schedule/` |
| `/boxing-clinics/` | 301 | Events page, or `/schedule/` until one exists |
| `/boxing-blog/` | keep | Blog hub retained, linked from the footer |
| `/author/halbert/` | 301 | `/coaches/` |
| `/black-friday/` | 301 | `/contact-us/` |
| `/jake-paul-vs-mike-tyson/` | 301 | `/boxing-blog/` |
| `/better-boxing-during-a-pandemic/` | 301 | `/schedule/` |
| `/nashville-boxing-season-starts-now/` | 301 | Events page or `/schedule/` |
| `/billy-falco-named-interim-head-coach.../` | 301 | `/coaches/` (superseded, see phase 4) |
| `/7-reasons-to-start-boxing-in-the-new-year/` | 301 | `/5-steps-to-start-boxing-at-any-age/` |
| `/boxing-football-3-ways-theyre-similar/` | 301 | `/5-steps-to-start-boxing-at-any-age/` |
| `/5-mindfulness-tips-and-techniques/` | 301 | `/mindset-matters/` |

### URLs that keep their exact address

Preserving a URL is the only migration action with zero risk attached. These
ship at the same path on Astro and need no redirect:

```
/how-to-shadow-box/
/10-ways-to-protect-yourself-when-boxing/
/5-critical-ways-to-protect-your-hands/
/5-steps-to-start-boxing-at-any-age/
/amateur-boxing-in-tennessee/
/mindset-matters/
/dr-christy-halbert-iwbhf-induction/
/8-nasty-career-traps-to-avoid-for-pro-boxers/
/make-non-contact-boxing-more-fun/
```

Five of these are not in the staging export. They have to be recovered from the
live site (phase 1) and rebuilt as Astro routes.

**[CLAUDE] Draft the map.**

> Using the master URL list, build
> `projects/fightersboxing/migration/redirects.csv`: old_url, new_url, reason.
> Include both http and https variants of every legacy URL, because the site is
> indexed on both. Rule-level redirects for `/services/`, `/portfolio/`,
> `/event/`, `/author/`, `/category/`, `/tag/`, date archives, `/feed/`,
> attachment pages and `?replytocom` parameters, all to the closest relevant
> page. Explicit one-to-one rows for every URL flagged must_redirect. Never a
> blanket redirect to the homepage. Then generate `.htaccess` from it: 301 only,
> no chains, force https, and a single canonical host.

**[YOU] Review every hand-picked row.** You know the gym, I do not. A wrong
target is worse than no redirect.

---

## Phase 4: The leadership transition content

This is FBG-specific and it is both an accuracy problem and the biggest link
opportunity on the account. Do not skip it and do not guess at any of it.

### What changed

- **Christy Halbert** founded the gym and is no longer the owner or a full-time
  coach. She fills in and oversees the coaches. She is Executive Director of the
  **Boxing Resource Center**, the nonprofit Growth Factor partners with on
  fundraising events and programs.
- **Evan Carr** is the new head coach. The live site lists him under
  `/team/evan-carr/` and a data broker has him as USA Boxing certified.
- The live post `/billy-falco-named-interim-head-coach.../` is **stale and now
  wrong**. It is currently the freshest leadership signal on the domain, which
  means answer engines are being told the wrong thing.

### Blocking intake, needed before any of this is written

```
{{PLACEHOLDER: Evan Carr's exact title, full credentials, USA Boxing
  coach level, competitive record, years at FBG, and bio in his own words}}
{{PLACEHOLDER: Halbert's exact current title at FBG, in the words she
  wants used, e.g. "Founder" vs "Founder and Coaching Director"}}
{{PLACEHOLDER: the precise legal and operational relationship between
  Fighters Boxing Gym and Boxing Resource Center as of today}}
{{PLACEHOLDER: correct primary phone. Live site shows 615-487-2502,
  directories show (629) 289-2988}}
{{PLACEHOLDER: correct primary email. info@, support@ and a third are
  all in circulation}}
```

**The relationship question is not optional.** The Boxing Resource Center site
and its GuideStar profile (EIN 75-3055338) currently describe FIGHTERS as BRC's
own training facility. If ownership has changed, that public description is
stale and is actively teaching search and answer engines the wrong structure.
Whatever the answer is, both sites have to tell the same story.

### Pages to build once intake lands

| Page | Job |
| --- | --- |
| `/coaches/` (exists) | One entry per coach with real credentials. Evan Carr leads. |
| `/coaches/evan-carr/` | A real bio page. The head coach needs his own indexable entity. |
| New About route | The founding story, the transition, and the nonprofit relationship, told once and accurately. |
| `/our-gyms/` (exists) | Already planned as the NMMA mirror. Add the BRC relationship here or on About, whichever is true. |

**[CLAUDE] Write the transition announcement, after intake.**

> Using only the client-supplied intake in
> `projects/fightersboxing/source/intake-leadership.md`, write a post announcing
> the coaching structure: Evan Carr as head coach, Halbert's continuing role,
> and the Boxing Resource Center relationship. Invent nothing: no credentials,
> no dates, no titles that are not in the intake. Copy stays frozen at 99% on
> anything client-supplied. Publish at a new slug, and 301 the Billy Falco post
> to it. Flag every sentence I wrote myself at handover.

---

## Phase 5: Schema

Per `hostinger-delivery.md`, plus these FBG additions.

- **`LocalBusiness`** (or `SportsActivityLocation`) on every page, NAP matching
  the Google Business Profile exactly. One phone, one email, one brand string.
- **`Person`** for every coach, with `sameAs` to USA Boxing, BoxRec, Tapology
  and socials where they genuinely exist. Evan Carr and Christy Halbert first.
- **`Organization`** for Fighters, with an explicit relationship property
  pointing at the Boxing Resource Center once the relationship is confirmed.
- **`FAQPage`** on `/faqs/` and on the how-to posts.
- **`Event`** for fight nights and clinics once there is a real events page.
- **No `AggregateRating`** unless genuine reviews render on that page.

Brand string: pick one. The live site currently uses **five** variants across
its own title tags, including the singular-form typo "Fighter Boxing Gym".

---

## Phase 6: Pre-launch QA

**[CLAUDE] Build and serve locally.**

> Run `npm run build` then `npm run preview` in
> `projects/fightersboxing/site/`, and tell me the local URL.

**[YOU] Crawl the preview.** Screaming Frog against the preview URL:

- [ ] Every page returns 200
- [ ] Every page has exactly one canonical, pointing at itself
- [ ] Zero redirect chains, zero 404s, zero orphan pages
- [ ] Every title and meta description unique
- [ ] No title contains a typo. The live site shipped "Faciltiy" and "FIghting"
- [ ] Blog hub reachable from the footer on every page
- [ ] Every retained post route resolves at its exact legacy path

**[YOU] Validate schema.** Rich Results Test on the homepage, a coach page and
an FAQ page.

**[YOU] Test the lead form for real.** Submit the LeadConnector popup on a
request CTA. Confirm the email lands in an inbox a human checks. Do it again
after launch.

**[YOU] Mobile check.** Click-to-call uses the confirmed number, popup opens and
submits, hero video does not block render, nothing overflows sideways.

**[CLAUDE] Final pre-flight.**

> Grep the whole `dist/` folder for: any noindex meta tag, any
> `hostingersite.com` staging URL, any localhost reference, any
> `{{PLACEHOLDER}}` token, any em dash, and any demo-content slug from phase 2.
> Report everything you find.

---

## Phase 7: Launch day

Tuesday or Wednesday morning. Never a Friday. Not in December.

**[YOU] Upload** `dist/` contents plus `.htaccess` to Hostinger. The `.htaccess`
ships in the same upload as the site, not after.

**[YOU] In the first hour:**

- [ ] Load 10 pages on the live domain
- [ ] Test 10 old URLs, on **both** http and https, and confirm single-hop 301s
- [ ] Confirm https is forced and HSTS is on, killing the protocol split
- [ ] Submit a real test lead through the form
- [ ] Confirm GA4 is recording

**[YOU] Then:**

- [ ] Submit the new sitemap in Search Console
- [ ] Remove the old sitemap
- [ ] Request Indexing by hand on the top 20 pages
- [ ] Update the Business Profile website link
- [ ] Update the website URL on Yelp, Facebook, Instagram, USA Boxing, and the
      Boxing Resource Center site
- [ ] Push the single confirmed NAP to every citation

Do not change GBP categories the same week. Separate them by two to three weeks
so you can attribute any movement.

---

## Phase 8: After

**[YOU] Days 1 to 7:** Search Console Pages report daily for new 404s. Submit a
test lead daily. Patch anything that appears.

**[YOU] Week 2:** confirm old URLs are leaving the index and new ones entering,
and that the http variants are collapsing into https.

**[YOU] Week 4:** re-pull the GSC Links report and confirm equity is landing on
the new URLs, especially anything that pointed at `/about/` or the Halbert
induction post.

**[YOU] Week 8:** compare queries and conversions against the phase 1 baseline.

Then move to `ongoing-seo.md`.

---

## The three rules that matter most

1. **Never let a URL with a backlink return 404.** A 301 to a relevant page
   keeps the equity. A blanket redirect to the homepage throws it away, because
   Google reads an irrelevant redirect as a soft 404.
2. **Nothing from the Ring theme demo set ships.** Not a service, not a
   portfolio item, not an event, not a draft post.
3. **Test the form the hour you launch, and daily for a week.** More leads are
   lost to a silently broken form than to any ranking dip.
