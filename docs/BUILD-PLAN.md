# Build Plan — getting the system operational

Roughly 5–6 weeks of focused work. Sequenced so the highest-leverage, hardest-to-
automate work happens first, and so you have something usable before it is finished.

---

## Phase 0 — Foundation (2–3 days)

- [ ] Host with one-click staging clone (Kinsta / WP Engine / Flywheel / SiteGround)
- [ ] Licences: Bricks (unlimited), Novamira Pro, ACF or Meta Box, forms, security
- [ ] Build the **base snapshot**: WP + Bricks + child theme + plugin set + settings
- [ ] Novamira installed, MCP connected to Claude Code, verified against a scratch site
- [ ] Confirm the clone → search-replace → Novamira-rebind loop works end to end

**Exit test:** clone the snapshot to a fresh staging URL and have Claude Code place a
single Bricks section on it, in under 5 minutes. If this does not work, nothing
downstream matters.

## Phase 1 — Core engine (8–10 days) ← the highest-value work

- [ ] Token set in Bricks Global Variables (`design-system/tokens.json`)
- [ ] Fluid type + space scale via `clamp()`
- [ ] Layout primitive global classes
- [ ] ~20 components with variants and slots (`design-system/components.md`)
- [ ] Tier 0 depth utilities (glass, rim light, mesh gradient, grain, tilt, CSS parallax)
- [ ] Header/footer templates, 404, search, base blog

This phase needs a real designer's eye more than it needs an agent. Everything
downstream inherits its quality ceiling from here. **Do not rush it** — a week saved
in Phase 1 costs you on all 30 sites.

## Phase 2 — Skins (3–4 days)

- [ ] Restoration, Medical, Combat skins (`skins/*.json`)
- [ ] Verify each skin against the same layout — should look like three different agencies
- [ ] Contrast-check every skin's colour pairs at AA

## Phase 3 — 3D asset library (4–5 days, parallelisable)

- [ ] 3 hero scenes per niche, modelled in Spline or Blender
- [ ] Rendered to AV1 + VP9 loops with WebP posters, in each skin's accent colour
- [ ] Mesh gradient + noise tile shared set
- [ ] 2–3 shader background snippets
- [ ] `depth-layer` component wired to the `depth` token

## Phase 4 — Layouts (8–10 days)

- [ ] 4 restoration, 3 medical, 3 gym layouts
- [ ] Build each with **realistic** demo content, not lorem — they double as your sales
      demos and they must look like $10k sites
- [ ] Each passes the QA gate

## Phase 5 — Content system (4–5 days)

- [ ] Niche voice guides (`content/voice/`)
- [ ] Copy generation prompts, one per section type
- [ ] Image packs: ~60 pre-graded images per niche, licensed for commercial resale
- [ ] `client.json` schema + intake form wired to produce it

Licensing matters — confirm your stock licence permits use on client sites you're
paid for. Getting this wrong is expensive.

## Phase 6 — Automation (4–5 days)

- [ ] `scripts/provision.sh` — clone, search-replace, rebind
- [ ] `scripts/assemble.mjs` — the Claude Code assembly driver
- [ ] `scripts/qa.mjs` — Playwright + Lighthouse gate
- [ ] `scripts/promote.sh` — staging → production
- [ ] Claude Code skills in `.claude/skills/` for build / edit-triage / QA

## Phase 7 — Dogfood (1 week)

Build three real sites against a stopwatch, one per niche. Log where every minute
goes. The bottleneck will not be where you expect — most likely candidates are
intake completeness and image selection, not assembly.

Fix the top two bottlenecks. Then repeat.

---

## Sequencing advice

**You can start selling after Phase 4.** Phases 5–6 make it fast; Phases 1–4 make it
good. Ship manually-assembled sites from the library while you build the automation
— it validates the layouts against real clients before you harden the pipeline
around them.

**Expect the first three real builds to be slower than doing it by hand.** That is
normal and it is not a sign the system is wrong. The ROI shows up around site 8–12.

**Resist adding niches.** Three is already ambitious. A fourth niche before you have
20 sites shipped will stall the whole thing.
</invoke>
