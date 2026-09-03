---
name: site-ship
description: Deploy an approved build to the client's own production domain on Hostinger. Use after the client has approved a preview: "the client approved it, put it live", "ship spiders boxing", "push this to their domain", "launch the fighters site", "deploy to Hostinger". Splits the artifact into indexable pages with canonical and sitemap, zips it, uploads it, and calls Hostinger's deploy endpoint. Not for publishing a preview for approval (site-preview).
---

# Routine: ship to production

The client approved the preview. This puts it on their domain.

The deploy endpoint **replaces the entire contents of the target website and
cannot be undone**, so this routine is deliberately the least automatic one in
the set. Read `../site-factory/references/hostinger-api.md` and
`../site-factory/references/preview-hosting.md` before the first run.

## Step 1 — Confirm it is actually approved

Approved means the client saw the preview and said yes. Check the registry:

```bash
python3 ../site-factory/scripts/registry.py get <slug>
python3 ../site-factory/scripts/registry.py set <slug> --status approved
```

If the row still says `building`, it has not been previewed, and shipping it
sends an unreviewed site to a live domain.

## Step 2 — Confirm the target domain exists on the account

```bash
./hostinger.sh websites
```

The client's domain must be listed, with a `username`. If it is not there yet,
the domain needs adding to the hosting plan first — DNS and SSL take a few
minutes to settle, so do that before rather than during the launch.

If it is a new website: `POST /api/hosting/v1/websites` creates one
(`{domain, order_id, datacenter_code}`), and creation takes minutes — poll
`hostinger.sh websites` until it appears.

## Step 3 — Ship

```bash
./deploy_production.sh <slug> projects/<slug>/site.html clientdomain.com \
  --assets projects/<slug>/img --include projects/<slug>/php
```

The script:

1. splits with `--base https://clientdomain.com`, so every page gets a
   canonical link and the build gets a real `sitemap.xml` and `robots.txt`
2. **refuses to ship if any page still carries `noindex`**, or if `robots.txt`
   is disallow-all — shipping a site that tells Google to ignore it is a
   silent, total SEO failure and the single worst launch bug available
3. **refuses to ship with open `GF-TODO` markers**, so an unanswered intake
   gap cannot quietly become permanent (`GF_YES=1` overrides, deliberately)
4. zips, uploads the zip, and calls deploy — confirming interactively first,
   because the call is destructive
5. sets the registry row to `status=live` with the production domain

`--include` is where `lead.php` goes. A static site's one dynamic need is lead
capture; the handler and the client's email address are in
`../house-style/references/hostinger-delivery.md`. **Submit the form once
after launch and confirm the email arrives.** Leads are the product the client
is paying for, and a silently failing `mail()` is the worst bug this business
can have.

## Step 4 — After launch

- **Redirects**, if any path changed from their old site. `hostinger.sh` has
  the redirects endpoint. Skipping this discards rankings they already had.
- **Cache**, if a change does not appear: `./hostinger.sh cache-clear <domain>`.
- **The preview URL still works.** Production is a separate website, so
  launching touched nothing under `previews/`. The registry row keeps both
  URLs, which is what makes the preview path the stable address for a build
  from first draft to after launch.
- **Log it.** Append the shipped-log row per house-style Step 6, if the build
  routine has not already. A skipped row silently breaks the divergence check
  for every future client.

## What can go wrong

**Deploying to the wrong domain.** The confirmation prompt requires typing the
domain, and the script refuses the configured preview host outright. Do not
set `GF_YES=1` in a shell you then reuse.

**Deploying over a site that has other things in it.** The endpoint replaces
everything on that website — an existing WordPress install, a subdirectory
someone parked, files nobody remembers. Run `./hostinger.sh files <domain>`
first and look at what is actually there.

**Shipping a preview build.** If the pages came out of a `--noindex` run, the
guard catches it. Keep the guard.
