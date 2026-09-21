# Growth Factor AI

Website production for Growth Factor's client work: the design law, the build
routines, and the pipeline that gets a site from intake to live.

## How the pieces fit

```
house-style      the design law — what may not drift, and why
    │
site-factory     the shared spine — build pipeline, registry, artifact shell,
    │            Hostinger delivery
    ├── site-redesign    client has a live site to upgrade
    ├── site-new         no site; identity assembled from research
    ├── site-match       reference site for structure + client brand for identity
    ├── site-preview     publish to preview.<domain>/<slug> for client approval
    └── site-ship        deploy an approved build to the client's own domain
```

Three ways a build starts, one way it gets reviewed, one way it goes live.

## The pipeline

1. **Build** with one of the three build routines. Each produces **one
   artifact holding every page**, switched by a nav — not one artifact per
   page. The artifact is published as soon as the build starts and redeployed
   to the same URL as it fills in.
2. **Preview** — `site-preview` splits the artifact into real pages and
   uploads them to `preview.<domain>/<slug>`, noindex, for the client to
   approve.
3. **Ship** — `site-ship` splits the same artifact for production, with
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

```bash
cp .claude/skills/site-factory/config.example.env \
   .claude/skills/site-factory/config.env
# fill in HOSTINGER_API_TOKEN and the preview host, then once:
.claude/skills/site-factory/scripts/hostinger.sh subdomain-add
```

`config.env` is git-ignored — the token can delete websites.

## Training video production

A separate pipeline, same house rules. `video-factory` rebuilds a software
walkthrough with our own cloned presenter over the original screen recording:
it transcribes the source, rewrites every line to a duration budget with the
interface names locked, renders those lines on a HeyGen avatar, and composites
the avatar over the footage with the narration kept under the cursor.

```
transcribe -> segment -> rewrite -> REVIEW -> render -> composite -> caption -> verify
```

The review stop is deliberate and it is where the value is. Renders are the
expensive half, and narration that names a button the cursor is not moving
toward makes the video worse than useless, so a human reads the rewritten
script against the source before anything is rendered.

```bash
cp .claude/skills/video-factory/config.example.env \
   .claude/skills/video-factory/config.env
.claude/skills/video-factory/scripts/vf.sh doctor
```

Jobs live in `video/jobs/<slug>/`, which is git-ignored: a full library runs
to tens of gigabytes. The index of what exists and where it got to is
`.claude/skills/video-factory/data/videos.csv`.

One video goes through `vf.sh`. The whole library goes through `batch.py`,
which runs the same scripts over every job, collects failures instead of
stopping at the first, and writes one review checklist covering everything
waiting on a human.

Start at `.claude/skills/video-factory/HANDOFF.md` for who owns what, and
`references/timing.md` before touching the timing arithmetic. Run
`python3 .claude/skills/video-factory/tests/test_pipeline.py` after changing
any of it.

## Layout

```
.claude/skills/       the routines and the design law
projects/<slug>/      one directory per client: kernel.json, intake.md, site.html
video/jobs/<slug>/    one directory per training video (git-ignored)
```
