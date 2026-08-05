# Growth Factor — WordPress Template Library

A site-production system for shipping high-end WordPress sites in three niches —
**restoration**, **doctors' offices**, and **combat sports / fitness** — with a
first draft inside an hour and client edit rounds measured in minutes.

Stack: **WordPress · Bricks Builder · Novamira Pro (MCP) · Claude Code**

---

## The idea in one paragraph

Ten separate template sites means ten codebases and a maintenance museum by site 30.
Instead this is **one engine, three skins, ten layouts**: a single Bricks design
system of tokens and components, three niche skins that override only variables, and
ten layouts that are ordered lists of component references. Design is pre-decided,
content is data, assembly is deterministic, and edits are diffs. That is what makes
both the first build and every revision fast.

Start with **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)**.

---

## Documentation

| | |
|---|---|
| [Architecture](docs/ARCHITECTURE.md) | The layer model and why it's shaped this way |
| [Build plan](docs/BUILD-PLAN.md) | Phased roadmap to get the system operational |
| [Pipeline](docs/PIPELINE.md) | Intake → provision → assemble → gate → review → promote |
| [Intake](docs/INTAKE.md) | The form, what blocks a build, and what can arrive later |
| [Edit loop](docs/EDIT-LOOP.md) | Why revisions take minutes, and how feedback is collected |
| [Depth system](docs/3D-DEPTH-SYSTEM.md) | The "futuristic and expensive" look without wrecking Core Web Vitals |
| [Component spec format](docs/COMPONENT-SPEC-FORMAT.md) | How the build specs are shaped, and the Bricks mechanics |
| [QA gate](qa/checklist.md) | What blocks a build from reaching a client |
| [CLAUDE.md](CLAUDE.md) | Operating rules for Claude Code in this repo |

## Repo map

```
design-system/
  tokens.json      base design variables (87 tokens)
  components/      build specs — 23 components, 87 variants (source of truth)
  components.md    human index over the specs
skins/             restoration · medical · combat — variable overrides only
layouts/           the 10 template section maps
schemas/           client.schema.json — the intake contract
intake/form.html   self-contained intake form, outputs client.json
content/voice/     per-niche copywriting guides
qa/                quality gate
scripts/           validate-config · validate-client · qa
clients/           per-project client.json (gitignored)
```

## Current status

Specification and tooling layer, complete and self-validating. The WordPress-side
build — base snapshot, the Bricks components themselves, 3D assets — is Phases 0–3 of
[the build plan](docs/BUILD-PLAN.md) and needs a live install with Novamira connected.

```bash
node scripts/validate-config.mjs              # library consistency — before every build & in CI
node scripts/validate-client.mjs <file.json>  # intake gate — before provisioning
node scripts/qa.mjs <staging-url>             # quality gate (needs playwright + @axe-core/playwright)
```

The two validators are the guards that keep the system honest. `validate-config`
fails the build if a layout references a component or variant that doesn't exist, if
a spec hard-codes a colour instead of using a token, or if a skin overrides a token
that isn't there — the three ways "one engine" quietly degrades into ten.
`validate-client` blocks provisioning on incomplete intake, unconsented medical
testimonials, and brand colours that fail WCAG AA.

## The three rules that carry the whole system

1. **Never hard-code a value.** Everything goes through tokens — that's why "make it
   less blue" is one edit instead of forty.
2. **Never fork a component for one client.** New needs become new core variants, so
   client 12 inherits what client 5 paid for.
3. **Nothing 3D is ever the LCP element.** These are mobile local-search businesses;
   a six-second hero costs more leads than any visual effect wins.

## Honest expectations

The first three real builds will be slower than doing them by hand. ROI arrives
around site 8–12. Every build still needs 15–30 minutes of human taste — the agent
reliably reaches 90%, and the last 10% is what separates a $10k site from an $800
one.
