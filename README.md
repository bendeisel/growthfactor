# Growth Factor AI

Client delivery for Growth Factor: the website half, from design law to live
site, and the paid media half, from a client's ad accounts to what their
money actually did.

## How the pieces fit

### Websites

```
house-style      the design law: what may not drift, and why
    │
site-factory     the shared spine: build pipeline, registry, artifact shell,
    │            Hostinger delivery
    ├── site-redesign    client has a live site to upgrade
    ├── site-new         no site; identity assembled from research
    ├── site-match       reference site for structure + client brand for identity
    ├── site-preview     publish to preview.<domain>/<slug> for client approval
    └── site-ship        deploy an approved build to the client's own domain
```

Three ways a build starts, one way it gets reviewed, one way it goes live.

### Paid media and measurement

```
ads-factory      the spine: client registry, agency-owned credentials,
    │            the write gate, verified API recipes for five platforms
    ├── ads-onboard    connect a new client's accounts, then verify they answer
    └── ads-report     what the money did, across paid and organic
```

Direct API calls from `.claude/skills/ads-factory/scripts`: Google Ads v25,
Meta Marketing, Tag Manager v2, Search Console and GA4. No MCP server and no
third-party connector, so client ad data never flows through a vendor in the
middle.

Reads are open. **Every write refuses unless `--confirm` is on that command
line**, because this repo is driven by Claude and an environment variable is
something an agent can set for itself.

```bash
cd .claude/skills/ads-factory/scripts
python3 ads.py doctor              # check all seven credential surfaces
python3 ads.py client spidersboxing  # one client's whole picture
```

## The pipeline

1. **Build** with one of the three build routines. Each produces **one
   artifact holding every page**, switched by a nav, not one artifact per
   page. The artifact is published as soon as the build starts and redeployed
   to the same URL as it fills in.
2. **Preview.** `site-preview` splits the artifact into real pages and
   uploads them to `preview.<domain>/<slug>`, noindex, for the client to
   approve.
3. **Ship.** `site-ship` splits the same artifact for production, with
   canonical links and a sitemap, and deploys to the client's domain. The
   preview URL keeps working afterwards.

Every build gets a row in `.claude/skills/site-factory/data/sites.csv`, which
is how a build is found by name later, and a row in
`.claude/skills/house-style/data/shipped-log.csv`, which is what stops two
clients in the same city and vertical from getting the same-looking site.

## The build console

https://claude.ai/code/artifact/4e896679-5d8a-4268-90b5-c7745c80bd43

A page for the intake half of the job: pick the build type, type in what the
client gave us, and it hands back the exact command to run in Claude. Briefs
save to the console's own store, so a brief typed there can be read back in a
later session instead of re-pasted.

## Setup

Two config files, both git-ignored, both holding credentials that can do real
damage: the Hostinger token can delete websites, the ads credentials can
spend a client's money.

```bash
# websites
cp .claude/skills/site-factory/config.example.env \
   .claude/skills/site-factory/config.env
# fill in HOSTINGER_API_TOKEN and the preview host, then once:
.claude/skills/site-factory/scripts/hostinger.sh subdomain-add
```

# paid media
cp .claude/skills/ads-factory/config.example.env \
   .claude/skills/ads-factory/config.env
python3 .claude/skills/ads-factory/scripts/google_oauth_setup.py
python3 .claude/skills/ads-factory/scripts/ads.py doctor
```

The ads setup is a one-time job per vendor, not per client. Full walkthrough
in `.claude/skills/ads-factory/references/auth-setup.md`.

## Layout

```
.claude/skills/       the routines, the design law, the API wrappers
projects/<slug>/      one directory per client: kernel.json, intake.md, site.html
```

A client keeps one slug across both halves, so `spidersboxing` is the same
client in `projects/spidersboxing/` and in the ads registry at
`.claude/skills/ads-factory/data/accounts.csv`.
