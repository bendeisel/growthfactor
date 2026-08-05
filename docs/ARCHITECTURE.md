# Template Library Architecture

## The problem with "10 templates"

The obvious approach is to build 10 beautiful sites and clone the closest one per
client. That fails at scale for one reason: **10 templates is 10 codebases.** Every
design fix, every browser bug, every new section has to be made ten times. By site
30 you are maintaining a museum, not a factory.

This system builds **one engine, three skins, ten layouts.** Apparent variety comes
from combination, not duplication.

```
                     ┌─────────────────────────────┐
                     │   CORE ENGINE (build once)  │
                     │  tokens + classes + ~20     │
                     │  Bricks components w/       │
                     │  variants and slots         │
                     └──────────────┬──────────────┘
                                    │
              ┌─────────────────────┼─────────────────────┐
              │                     │                     │
        ┌─────▼─────┐         ┌─────▼─────┐         ┌─────▼─────┐
        │RESTORATION│         │  MEDICAL  │         │  COMBAT   │
        │   skin    │         │   skin    │         │   skin    │
        │(vars only)│         │(vars only)│         │(vars only)│
        └─────┬─────┘         └─────┬─────┘         └─────┬─────┘
              │                     │                     │
        4 layouts             3 layouts             3 layouts
              └─────────────────────┼─────────────────────┘
                                    │
                        ┌───────────▼───────────┐
                        │  client.json (intake) │
                        │  copy + photos + NAP  │
                        └───────────┬───────────┘
                                    │
                        ┌───────────▼───────────┐
                        │  ASSEMBLER            │
                        │  Claude Code +        │
                        │  Novamira MCP → Bricks│
                        └───────────────────────┘
```

A layout is **data**, not a design. A skin is **variables**, not a stylesheet. That
is what makes both the first build and every subsequent edit fast.

---

## Why the speed target is actually reachable

The bottleneck in a normal agency build is not placing sections. It is:

| Cost centre | Normal agency | This system |
|---|---|---|
| Design decisions | 4–10 hrs | 0 — pre-decided in tokens |
| Page assembly | 6–15 hrs | 10–20 min — agent-driven |
| Copywriting | 4–8 hrs | 15 min — generated from `client.json` + niche voice guide |
| Photography sourcing | 2–5 hrs | 0 for draft — pre-graded niche image packs |
| Client edit rounds | 3–6 hrs over weeks | minutes per round — most edits are one token or one JSON field |
| QA / responsive / speed | 2–4 hrs | automated Playwright + Lighthouse gate |

Design is pre-decided. Content is data. Assembly is deterministic. Edits are diffs.

**Realistic first-draft timings once the library exists:**

- Repeat niche, photos already in hand → **10–25 min**
- New client, standard layout, stock image pack → **35–60 min**
- Custom section or bespoke hero → **1.5–2 hrs**

The "few minutes" case is real but only for a same-niche repeat. Do not promise it
for cold builds — the honest headline is "first draft same day, usually within the
hour."

---

## Layer 1 — The Core Engine

One WordPress + Bricks child theme, built once, versioned in this repo.

### Global Variables
Every value that could ever differ between clients lives in the Bricks
[Global Variables Manager](https://academy.bricksbuilder.io/article/global-variables-manager/).
Nothing is hard-coded on an element. See `design-system/tokens.json`.

Categories: color, space, type, radius, shadow, motion, depth, border.

Type and space use `clamp()` for fluid scaling, so there is never a "fix the tablet
breakpoint" task.

### Global Classes
Layout primitives only — never cosmetic one-offs:
`.section`, `.container`, `.stack`, `.cluster`, `.grid-2/3/4`, `.split`,
`.is-dark`, `.is-inverted`, `.depth-0/1/2/3`.

Bricks 2.2 also auto-generates colour utility classes, which we use rather than
duplicating.

### Components
~20 [Bricks Components](https://academy.bricksbuilder.io/builder/features/components/)
with **variants** and **slots**. This is the load-bearing feature of the whole
system: one component with four variants gives four designs at one component's
maintenance cost, and slots let content be injected without forking the structure.

Full inventory in `design-system/components.md`.

The critical rule: **a layout may only reference components and variants that exist
in the core.** If a build needs something new, it gets added to the core as a new
variant, not bolted onto that one site. That keeps the library converging instead
of fragmenting.

---

## Layer 2 — Skins (3 files)

A skin is a JSON override of core variables and default variant selections. That is
all. It changes zero structure.

| | Restoration | Medical | Combat / Fitness |
|---|---|---|---|
| Mood | Urgent, dependable, industrial | Calm, precise, premium | Aggressive, kinetic, forged |
| Base | Deep navy / charcoal | Off-white / soft sand | Near-black / graphite |
| Accent | Safety amber or signal red | Single cool teal or slate blue | Electric single accent (crimson, lime, or ice) |
| Type | Condensed grotesk + humanist body | Elegant serif display + clean sans | Wide/heavy display + tight sans |
| Radius | Small (2–6px) | Generous (12–20px) | Sharp (0–2px) |
| Shadow | Hard, directional | Soft, diffuse, low-opacity | High-contrast rim/glow |
| Motion | Fast, decisive (200–300ms) | Slow, gentle (500–700ms) | Snappy with overshoot (250–400ms) |
| Depth tier | 1 | 0–1 | 1–2 |

Because a skin is variables, "make it less blue" on a live client site is **one edit
that propagates everywhere.** That single property is why the edit week works.

---

## Layer 3 — Layouts (the 10 templates)

A layout is an ordered section list referencing components and variants:

```json
{
  "id": "resto-01-emergency",
  "sections": [
    { "component": "hero", "variant": "split-urgent", "depth": 2 },
    { "component": "trust-bar", "variant": "certifications" },
    { "component": "service-grid", "variant": "cards-3up" }
  ]
}
```

Ten layouts, allocated by market size:

**Restoration (4)** — `resto-01-emergency`, `resto-02-authority`,
`resto-03-visual`, `resto-04-multiservice`
**Medical (3)** — `med-01-concierge`, `med-02-specialist`, `med-03-multi-provider`
**Combat & Fitness (3)** — `gym-01-combat`, `gym-02-academy`, `gym-03-performance`

Skin × layout × content means the three restoration sites you ship this month do not
look like siblings. See `layouts/` for the full section maps and the rationale for
each.

---

## Layer 4 — Content (`client.json`)

One file per project, produced by the intake form, validated against
`schemas/client.schema.json`. It carries NAP, service area, services, team,
hours, testimonials, differentiators, brand assets, and integrations.

Two things fall out of this for free:

1. **Copy generation.** A Claude Code pass turns `client.json` + the niche voice
   guide (`content/voice/`) into every string on the site. Deterministic prompt per
   section type, locked voice per niche.
2. **Programmatic service-area pages.** `services[] × service_areas[]` generates 20–60
   local landing pages in minutes. For restoration and medical this is often worth
   more to the client than the homepage, and it is nearly free here.

---

## Layer 5 — The Assembler

Claude Code drives [Novamira](https://novamira.ai/) over MCP. Novamira Pro speaks
Bricks natively — components, templates, global classes, variables — so the output
is **editable in Bricks**, not injected HTML. That matters: the client's future
maintenance, and your own edit rounds, depend on the site being a real Bricks
document.

**Hard constraint:** Novamira binds to a site URL and goes dormant on the live
domain. Every build happens on staging and is promoted to production. This is not a
workaround — it is the correct pipeline anyway, and it is what makes the client
review week safe.

Full sequence in `docs/BUILD-PLAN.md` and `docs/PIPELINE.md`.

---

## Layer 6 — Quality gate

Speed without a gate produces fast garbage. Every build must pass `qa/checklist.md`
automatically before a client sees it:

- Lighthouse: LCP < 2.5s, CLS < 0.1, INP < 200ms, mobile perf ≥ 85
- Contrast AA on every text/background pair
- Playwright screenshots at 390 / 768 / 1024 / 1440 / 1920
- No placeholder text, no broken links, NAP consistent everywhere
- Schema.org valid for the niche type
- Forms submit and route
- `prefers-reduced-motion` honoured

For medical especially, accessibility is a genuine legal exposure area, not a
nice-to-have. The gate is not optional there.

---

## What this system deliberately does not do

- **It does not do bespoke design.** A client who wants a truly custom art direction
  is not a template-library client. Price that separately.
- **It does not skip the human pass.** Budget 15–30 min of taste on every build.
  The agent gets it to 90%; the last 10% is what makes it read as $10k.
- **It does not front-load ROI.** The system pays for itself around site 8–12, not
  site 1. The first three builds will be slower than doing it by hand.
</invoke>
