---
name: site-factory
description: The shared spine behind Growth Factor's website routines — the build pipeline every site build runs through, the site registry, the preview-hosting architecture, and the verified Hostinger API recipes. Read this when running any of site-redesign, site-new, site-match, site-preview, or site-ship; when deciding WHICH of those a job is; when a build needs its preview artifact or registry entry; or when wiring anything to Hostinger. Also the reference for building one artifact that holds many pages instead of one artifact per page.
---

# Site factory: the spine under the routines

## Why this is split into routines at all

One routine cannot take a site from nothing to live. The work has three
genuinely different front ends and two genuinely different back ends, and
jamming them together produced a routine that asked the wrong questions in
every direction: it hunted for a kernel on greenfield jobs, hunted for social
accounts on jobs that had a whole site to extract from, and forgot the preview
step whenever the build got interesting.

So: **five routines, one spine.** The routines differ only at the ends. The
middle — motif inventory, axes, build, artifact, self-audit, log — is identical
and is defined once, here.

## Which routine

| The client arrives with | Routine | What it does |
| --- | --- | --- |
| A live site, however bad | `site-redesign` | Copy it down, extract the kernel, amplify what is there |
| Nothing — no site, maybe no logo | `site-new` | Research them, assemble a kernel from real material, build |
| A site they want to *be like*, plus their own brand | `site-match` | Read the reference for structure, keep their kernel for identity |
| A build already in an artifact, ready for the client to see | `site-preview` | Publish to `preview.<domain>/<slug>` |
| A preview the client approved | `site-ship` | Deploy to their production domain on Hostinger |

If two look plausible, the tiebreaker is **where the identity comes from**.
`site-redesign` and `site-match` both have an existing site in play, but in
redesign that site *is* the identity, and in match it is only a structural
reference and the identity comes from the client's brand material.

## The spine

Every build routine — redesign, new, match — runs these steps. The routine
files cover only Steps 1 and 2; from Step 3 they all converge here.

**Step 1 — Intake.** Routine-specific. See `references/intake.md` for the
per-routine checklist and, importantly, what to do with a gap rather than
inventing a filler.

**Step 2 — Kernel.** Routine-specific. Ends the same way in all three: a
stated kernel, in one line, confirmed with the user before anything is built.
A wrong kernel caught here costs a sentence.

**Step 3 — Divergence check.** Read `../house-style/data/shipped-log.csv`.
Find same-vertical entries within ~100 miles. Pick axes such that at least two
of {type stance, color stance, structure} differ from every one of them.

**Step 4 — Motif inventory and axes.** Per `house-style` Steps 2 and 3. On
greenfield there is no site to inventory, so the motif vocabulary comes from
the logo and print material and is written down explicitly, because from that
moment it is frozen exactly as an extracted one would be.

**Step 5 — Build, as one multi-page artifact.** Not one artifact per page.
See `references/multipage-artifact.md` and start from
`templates/site-shell.html`. This is not a preference — a site split across
artifacts cannot be reviewed, cannot be page-switched by the client, and
cannot be split into production HTML by script.

**Step 6 — Publish the artifact. Without being asked.**
The artifact is published the moment the build starts, not when the build is
finished and someone remembers to ask. Publish the shell with its pages
stubbed, then redeploy to the same file path as sections land. Rationale in
`references/multipage-artifact.md` under "Publish early".

**Step 7 — Register it.** `scripts/registry.py` writes the row: client, slug,
vertical, artifact URL, preview URL, production domain, status. This is the
list that answers "which site is this?" without opening anything, and it is
what the preview and ship routines read to find a build by name.

```bash
python3 scripts/registry.py add --client "Spiders Boxing" --slug spidersboxing \
  --vertical "boxing gym" --city Nashville --state TN \
  --artifact https://claude.ai/code/artifact/UUID --status building
```

**Step 8 — Self-audit and log.** `house-style` Steps 5 and 6. The shipped-log
row is what makes the next project's Step 3 mean anything; skipping it silently
breaks divergence for every future client.

## Non-negotiables

These are the four things that went wrong often enough to be worth stating as
rules rather than advice.

1. **One artifact per site, never one per page.** Pages are sections inside a
   single artifact, switched by the chrome nav.
2. **The artifact is published automatically**, at build start, and redeployed
   to the same path — so the URL in the registry never goes stale.
3. **Previews never live inside a client's production website.** The Hostinger
   static-deploy endpoint overwrites an entire website. See
   `references/preview-hosting.md` — this one has actually destructive failure
   modes, so read it before touching deploy.
4. **Previews are `noindex`.** A preview of a client's site is duplicate
   content against their real domain, and Google is happy to index a preview
   subdomain nobody linked to. `deploy_preview.sh` writes the header and the
   robots file; do not "clean up" either.

## Config

Copy `config.example.env` to `config.env` (git-ignored) and fill it in. Every
script here reads that file and refuses to run on missing values rather than
guessing at a domain or silently deploying to the wrong account.

## Files

- `references/intake.md` — per-routine intake checklists and how to handle gaps.
- `references/multipage-artifact.md` — the one-artifact-many-pages pattern:
  chrome markers, page switching, deep links, and why publishing happens early.
- `references/preview-hosting.md` — preview architecture, the overwrite hazard,
  the slug scheme, and keeping previews alive after production launch.
- `references/hostinger-api.md` — endpoints verified against Hostinger's
  OpenAPI spec, with working curl for the TUS upload flow.
- `templates/site-shell.html` — the multi-page artifact starting point.
- `scripts/split_pages.py` — artifact → per-page production HTML.
- `scripts/registry.py` — the site registry.
- `scripts/hostinger.sh` — API wrapper (upload, deploy, subdomains, list).
- `scripts/deploy_preview.sh` — built dir → `preview.<domain>/<slug>/`.
- `scripts/deploy_production.sh` — built dir → client production domain.
- `data/sites.csv` — the registry itself.
