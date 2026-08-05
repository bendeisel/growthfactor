# Growth Factor — Template Library

A WordPress site-production system: **one engine, three skins, ten layouts.**
Read `docs/ARCHITECTURE.md` before doing anything structural.

Stack: WordPress · Bricks Builder · Novamira Pro (MCP) · Claude Code

## Repo map

```
docs/                 architecture, pipeline, intake, edit loop, build plan, 3D, spec format
design-system/
  tokens.json         base variables — everything a skin can override
  components/*.json   build specs, 23 components / 87 variants — SOURCE OF TRUTH
  components.md       human index (deliberately does not duplicate the spec data)
skins/                restoration / medical / combat — variable overrides only
layouts/              the 10 template section maps
schemas/              client.schema.json — intake contract
intake/form.html      self-contained intake form, outputs client.json
content/voice/        per-niche copy voice guides
qa/                   the quality gate
scripts/              validate-config / validate-client / qa
clients/              per-project client.json (gitignored)
```

## Run the gates

```bash
node scripts/validate-config.mjs              # after ANY change to tokens/skins/layouts/specs
node scripts/validate-client.mjs <file.json>  # before provisioning. exit 1 = do not build
node scripts/qa.mjs <staging-url>             # after assembly. exit 1 = do not send
```

## The rules that keep this system fast

These are not style preferences. Each one is load-bearing for the speed target.

1. **Never hard-code a value.** Colour, spacing, type, radius, shadow, motion — all
   go through tokens. This is why "make it less blue" is one edit instead of forty.
2. **Never fork a component for one client.** If a build needs something new, add it
   to the core as a new variant in `design-system/components.md`. The library must
   converge, not fragment.
3. **Layouts reference, they don't define.** A layout is an ordered list of
   component + variant. If you're writing styling into a layout, stop.
4. **Content lives in `client.json`.** Never type a client's phone number into a
   page. Every string traces back to intake data or generated copy.
5. **Nothing 3D is ever the LCP element.** See `docs/3D-DEPTH-SYSTEM.md`. Posters
   and text are LCP; video and canvas are decoration that loads after.
6. **The QA gate is not advisory.** `qa/checklist.md` blocking items block.

## Working with Novamira

Novamira binds to a site URL and **goes dormant on live domains** — all work happens
on staging, then gets promoted. After promotion, further changes go back through
staging. Production is never edited live.

Novamira Pro speaks Bricks natively (components, templates, global classes,
variables), so output must be a **real Bricks document**, editable in the builder —
not injected HTML. If you find yourself writing raw markup into a page, that is a
sign a component variant is missing.

## Common tasks

**New site build** → `docs/PIPELINE.md`. Run `validate-client.mjs` *before*
provisioning; incomplete intake is the main cause of blown timelines.

**Client edits** → `docs/EDIT-LOOP.md`. Triage every item as A (token) / B (content)
/ C (layout) / D (custom) first. Apply A→B→C, re-assemble as one batch, re-run the
gate. Never hand-patch a page — it turns a generated artifact into a bespoke one and
costs you on every future round.

**New layout** → copy the closest existing one, change the section map. If it needs
a component that doesn't exist, add the component to the core first.

**New component variant** → add it to the spec in `design-system/components/*.json`
first, run `validate-config.mjs`, then build it in Bricks, then use it in a layout.
Never the other way round — the validator will reject a layout that gets ahead of the
core, and that rejection is the feature.

## Honest expectations

- First three real builds will be slower than doing it by hand. Normal.
- ROI arrives around site 8–12.
- Every build needs 15–30 min of human taste. Do not skip it.
- Don't add a fourth niche before 20 sites have shipped.
