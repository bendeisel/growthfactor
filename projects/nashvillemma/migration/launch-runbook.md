# Launch runbook: nashvillemma.com to Hostinger

Every step is tagged **[YOU]** or **[CLAUDE]**.

- **[YOU]** means a browser, an account login or an app on your machine. Nobody
  can do it for you.
- **[CLAUDE]** means code, config or data work. A copy-paste prompt is included.

Work top to bottom. Do not skip phase 1.

---

## Phase 0: Tools and access

**[YOU] Install Screaming Frog.** screamingfrog.co.uk/seo-spider. Free tier
covers 500 URLs, which is more than this site needs. Buy the £199/yr licence
only when you want saved crawls, scheduling or JS rendering.

**[YOU] Confirm access to all five.** Search Console, GA4, Google Business
Profile, Hostinger hPanel, domain registrar and DNS. You said you have the
domain and Console. Verify the other three before you give 97Display notice.

**[YOU] Verify nashvillemma.com in Ahrefs Free.** ahrefs.com/webmaster-tools.
Free, unlimited sites. This is where the backlink list comes from.

---

## Phase 1: Baseline. Do this before anything changes.

Without this you cannot prove the migration worked, and you cannot build the
redirect map.

**[YOU] Export five things:**

| Source | Export | Used for |
| --- | --- | --- |
| Search Console | Pages, all indexed, 16 months | The real URL inventory |
| Search Console | Links, top linked pages | Which URLs hold equity |
| Search Console | Queries, 16 months | Ranking baseline |
| GA4 | Landing pages + conversions, 12 months | Which pages earn leads |
| Ahrefs Free | Referring pages, filter `/blog/` | The blog redirect map |

**[YOU] Crawl the live site.** Screaming Frog, enter `https://nashvillemma.com`,
Start. Export Internal > All as CSV.

**[YOU] Screenshot** GBP insights and the current review count.

**[CLAUDE] Build the master URL list.**

> I have five exports in `projects/nashvillemma/migration/baseline/`: a
> Screaming Frog crawl, GSC Pages, GSC Links, GA4 landing pages, and an Ahrefs
> referring-pages export. Dedupe them into one master URL list as CSV. Columns:
> url, status_code, title, sessions_12mo, conversions_12mo, referring_domains,
> indexed_yes_no. Sort by referring_domains then sessions, descending. Flag any
> URL with a link or a conversion as must_redirect.

---

## Phase 2: Build config

**[CLAUDE] Lock the Astro config and base layout.**

> In the nashvillemma Astro project set `trailingSlash: 'always'` and `site:
> 'https://nashvillemma.com'` in astro.config.mjs, and add @astrojs/sitemap.
> In the base layout add a self-referencing canonical using Astro.url, per-page
> title and meta description props, and JSON-LD slots. Create 404.astro. All
> page filenames lowercase. Then show me the route list the build produces so I
> can check it against the approved 18-page architecture.

**[YOU] Check that route list** against section 06 of the audit. Every URL
lowercase, no city suffixes, no `/services` prefix.

---

## Phase 3: Redirect map

This is the part that protects the rankings. Do not rush it.

**[CLAUDE] Draft the map.**

> Using the master URL list, build a redirect map CSV: old_url, new_url, reason.
> Rule-level redirects for the `/services` prefix, the city suffixes, the
> `/Home/` paths and the root query parameters. Explicit one-to-one rows for
> every URL flagged must_redirect, especially `/blog/` posts with referring
> domains. Pick the closest topically relevant target, never a blanket redirect
> to the homepage. Then generate the .htaccess from it. 301 only, no chains.

**[YOU] Review every hand-picked row.** You know the gym, I do not. A wrong
target is worse than no redirect.

---

## Phase 4: Pre-launch QA

**[CLAUDE] Build and serve locally.**

> Run `npm run build` then `npm run preview`, and tell me the local URL.

**[YOU] Crawl the preview.** Screaming Frog against `http://localhost:4321`.
Check four things:

- [ ] Every page returns 200
- [ ] Every page has exactly one canonical, pointing at itself
- [ ] Zero redirect chains, zero 404s, zero orphan pages
- [ ] Every title and meta description unique

**[YOU] Validate schema.** Paste 3 page URLs into Google's Rich Results Test.

**[YOU] Test the lead form for real.** Submit it. Confirm the email lands in the
inbox a human actually checks. Do this again after launch.

**[YOU] Mobile check.** Click-to-call works, popup form opens and submits,
nothing overflows sideways.

**[CLAUDE] Final pre-flight.**

> Grep the whole dist/ folder for any noindex meta tag, any staging URL, any
> localhost reference, and any placeholder text. Report anything you find.

---

## Phase 5: Launch day

Tuesday or Wednesday morning. Never a Friday. Not in December.

**[YOU] Upload** `dist/` contents plus `.htaccess` to Hostinger via hPanel Git
deploy or SFTP. The `.htaccess` ships in the same upload as the site, not after.

**[YOU] In the first hour:**

- [ ] Load 10 pages on the live domain
- [ ] Test 5 old URLs and confirm they 301 to the right place
- [ ] Submit a real test lead through the form
- [ ] Confirm GA4 is recording

**[YOU] Then:**

- [ ] Submit `sitemap-index.xml` in Search Console
- [ ] Remove the old sitemap from Search Console
- [ ] Request Indexing on the top 20 pages, by hand
- [ ] Update the Business Profile website link
- [ ] Update the website URL on Yelp, Facebook, Instagram, Tapology, BJJMetrics

Do not change GBP categories the same week. Separate them by two to three weeks
so you can attribute any movement.

---

## Phase 6: After

**[YOU] Days 1 to 7:** Search Console Pages report daily for new 404s. Submit a
test lead daily. Patch anything that appears.

**[YOU] Week 2:** confirm old URLs are leaving the index and new ones entering.
Your total indexed count will drop from 84-plus to around 18. That is the goal,
not a problem.

**[YOU] Week 4:** re-pull the GSC Links report and confirm equity is landing on
the new URLs.

**[YOU] Week 8:** compare queries and conversions against the phase 1 baseline.

**[CLAUDE] Monthly:**

> Compare this month's GSC and GA4 exports against the phase 1 baseline in
> `projects/nashvillemma/migration/baseline/`. Report movement by page and by
> query, flag anything that lost position, and tell me what you would do next.

---

## The two rules that matter most

1. **Never let a URL with a backlink return 404.** A 301 to a relevant page
   keeps the equity. A blanket redirect to the homepage throws it away, because
   Google reads an irrelevant redirect as a soft 404.
2. **Test the form the hour you launch, and daily for a week.** More leads are
   lost to a silently broken form than to any ranking dip.
