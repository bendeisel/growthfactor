# Build Pipeline — intake to live

## The seven steps

```
1. INTAKE        form → client.json                        client does it   ~15 min
2. PROVISION     clone base snapshot → staging URL         1 command        ~3 min
3. SELECT        skin + layout                             human, 1 min     ~1 min
4. ASSEMBLE      Claude Code + Novamira → Bricks           agent            ~10-20 min
5. GATE          Playwright + Lighthouse + checklist       automated        ~3 min
6. POLISH        human taste pass                          human            ~20 min
7. REVIEW        staging + annotation → edit rounds        client            ≤1 week
8. PROMOTE       staging → production, DNS, tracking       1 command        ~10 min
```

Everything except steps 1, 3, 6 and 7 is machine work.

---

## Step 1 — Intake

A single form that writes `client.json`. It must be short enough that the client
actually finishes it in one sitting — that is the real design constraint.

Required to start a build: business name, phone, address, service areas, top 5
services, hours, logo, brand colours (or "you choose"), 3+ testimonials, and the
one-sentence answer to "why do people pick you over the guy down the road."

Everything else is enrichment and can arrive during the review week.

Validate against `schemas/client.schema.json` before provisioning. **Do not start a
build on incomplete intake** — it is the single most common cause of a two-hour
build becoming a two-day build.

## Step 2 — Provision

The base snapshot is a complete WordPress install: Bricks + child theme + the full
design system + all components + plugins + settings + the image packs. It is
maintained as a versioned artifact, not rebuilt.

Clone it via the host's one-click staging clone (Kinsta / WP Engine / Flywheel /
SiteGround all have this) or WP STAGING. A clone is 1–3 minutes; a build from
scratch is hours. This step is the whole reason the timeline works.

Then `wp search-replace` the URLs, and register the staging URL with Novamira —
remember it binds per-URL and stays dormant on live domains.

## Step 3 — Select

Human picks skin + layout. One minute of judgement, and it is judgement worth
paying for — matching layout to business character is where taste earns its keep.

## Step 4 — Assemble

Claude Code, with the Novamira MCP server connected to the staging site:

1. Load `skins/<skin>.json` → write Bricks global variables
2. Load `layouts/<layout>.json` → the section map
3. Load `client.json` → the data
4. Generate copy: `client.json` + `content/voice/<niche>.md` → one pass per section
5. Select images from `assets/images/<niche>/` matched to the skin grade
6. Instantiate each section as a Bricks component with its variant and slot content
7. Generate service-area pages from `services[] × service_areas[]`
8. Wire forms, tracking, schema.org, sitemap, redirects

Output is a native Bricks document — fully editable in the builder, which is what
makes steps 6 and 7 fast.

## Step 5 — Automated gate

`scripts/qa.mjs` runs Playwright + Lighthouse against staging. Nothing reaches a
client until it passes. See `qa/checklist.md`.

## Step 6 — Human polish

15–30 minutes. The agent reliably gets to 90%; this is the 10% that reads as
expensive. Look for: awkward line breaks in headlines, an image that fights the
skin, a section that should be dark, spacing that got rhythmically monotonous,
copy that sounds generated.

**Do not skip this.** It is the difference between the library producing $10k sites
and $800 sites.

## Step 7 — Review (see `docs/EDIT-LOOP.md`)

## Step 8 — Promote

Staging → production, DNS, SSL, analytics, GBP link, sitemap submit, form
deliverability test. Note Novamira goes dormant on the live domain — after promotion,
further changes go through staging again. That is a feature: production never gets
edited live.
</invoke>
