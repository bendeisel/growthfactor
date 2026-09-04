---
name: site-preview
description: Publish a finished build to a preview URL the client can open, at preview.<domain>/<slug>. Use when a build is ready to show someone: "put this on preview", "send it to the client", "get me a preview link for spiders boxing", "publish the fighters build so they can approve it". Takes a build by name from the site registry, splits the artifact into real pages, uploads them noindex to the preview host, and updates the registry. Not for shipping to the client's own domain after approval (site-ship).
---

# Routine: publish a preview

Turns a build into a URL the client can open on their phone: a real site on
our domain, at a path named after their business, before they have pointed a
domain at anything.

```
https://preview.growth-factor.ai/spidersboxing/
https://preview.growth-factor.ai/fighters/
```

Read `../site-factory/references/preview-hosting.md` before the first run —
it holds the architecture and the one genuinely destructive hazard.

## Step 1 — Pick the build by name

```bash
python3 ../site-factory/scripts/registry.py list
python3 ../site-factory/scripts/registry.py get spidersboxing
```

If Ben names a client rather than a slug, resolve it against the registry
rather than guessing at a slug — the slug is the preview path, and a guessed
one publishes to the wrong URL or collides with another client.

If there is no row yet, add one now. Every preview needs a registry row,
because that row is what makes the URL findable again later.

## Step 2 — Publish

```bash
./deploy_preview.sh <slug> projects/<slug>/site.html --assets projects/<slug>/img
```

That single command:

1. splits the multi-page artifact into standalone pages with
   `split_pages.py --noindex`
2. verifies the disallow-all `robots.txt` exists and refuses to publish
   without it
3. uploads every file over TUS into `previews/<slug>/` on the preview website
4. verifies each upload's byte count server-side and fails loudly on a partial
5. sets the registry row to `status=preview` with the URL

Then send Ben the URL. Do not send it to the client directly.

## Step 3 — Check it before it goes out

Open the URL and confirm, quickly:

- the page-switcher chrome is **gone** (it is preview-review furniture, not
  something a client should see)
- internal nav links navigate as real pages
- the popup lead form opens from every request CTA
- it holds up at phone width, which is where the client will open it
- `view-source` shows the `noindex` meta

## Why previews are noindex, and why that is not negotiable

A preview is a byte-identical copy of the client's site on a domain we own.
Left crawlable it is duplicate content competing with their real site, and
Google will index a preview subdomain nobody linked to. Both belts — the meta
tag and the robots file — are written automatically and the script refuses to
publish without them. Do not "clean that up".

## Re-publishing after edits

Change the source, run the same command again. Files are overwritten in place
(`?override=true`), the URL does not change, and the link already sent to the
client keeps working.

Never edit files on the server. The preview is an output; the source of truth
is `projects/<slug>/` in git and the artifact is the review surface. A
server-side edit is invisible to git and gets destroyed on the next run.

## One thing this routine will not do

It cannot deploy an archive, by design. Hostinger's static-deploy endpoint
replaces a website's entire contents, so one such call against the preview
host would delete every client preview at once. Previews upload file by file.
`deploy_preview.sh` has no code path to that endpoint and `hostinger.sh`
refuses it against the configured preview domain.
