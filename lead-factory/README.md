# Lead Factory — Go-to-Market Playbook

Complete build-out of the Lead Factory offer: positioning, economics, data layer, campaign copy, sales process, delivery, and a sequenced 90-day rollout.

Built from the one-page blueprint dated 2026-08-05 (preserved verbatim at [`source/ORIGINAL-BLUEPRINT.md`](source/ORIGINAL-BLUEPRINT.md)).

---

## Read in this order

**First time through — 20 minutes:** [`01-positioning`](00-strategy/01-positioning.md) → [`02-offer-architecture`](00-strategy/02-offer-architecture.md) → [`19-90-day-rollout`](04-ops/19-90-day-rollout.md).

**Before spending money:** [`03-unit-economics`](00-strategy/03-unit-economics.md) and [`04-funnel-math`](00-strategy/04-funnel-math.md).

**Before sending anything:** [`05-compliance`](00-strategy/05-compliance.md) and [`08-sending-infrastructure`](01-data/08-sending-infrastructure.md).

## Contents

### Strategy
| | |
|---|---|
| [01 · Positioning & ICP](00-strategy/01-positioning.md) | Named mechanism, three ICP verticals, geo rings, proof strategy |
| [02 · Offer Architecture](00-strategy/02-offer-architecture.md) | Tiers, add-ons, concession ladder, guarantee, price integrity |
| [03 · Unit Economics](00-strategy/03-unit-economics.md) | Delivery cost, LTV:CAC, capacity, break-even |
| [04 · Funnel Math](00-strategy/04-funnel-math.md) | Volumes required, channel mix, leading indicators |
| [05 · Compliance & Risk](00-strategy/05-compliance.md) | TCPA, CAN-SPAM, DNC, data provenance, deliverability |

### Data
| | |
|---|---|
| [06 · Segment Taxonomy](01-data/06-datamoon-buckets.md) | 14 launch segments, record schema, pipeline, quality gates |
| [07 · Scoring & Routing](01-data/07-scoring-and-routing.md) | 100-point model, bands, routing, SLAs, status model |
| [08 · Sending Infrastructure](01-data/08-sending-infrastructure.md) | Domains, warmup, suppression, verification, monitoring |

### Campaigns
| | |
|---|---|
| [09 · Email Sequences](02-campaigns/09-email-sequences.md) | Full copy — 4 cold sequences, 5 lifecycle sequences |
| [10 · SMS Program](02-campaigns/10-sms-program.md) | Consent-based only. Cold SMS cancelled and why |
| [11 · Phone Scripts](02-campaigns/11-phone-scripts.md) | Openers, discovery, objections, voicemail, call blocks |
| [12 · Paid Media & Creative](02-campaigns/12-ad-creative.md) | Search structure, Meta lead magnet, 10 angles, restrictions |
| [13 · Landing Pages](02-campaigns/13-landing-pages.md) | Four pages, wireframes, copy, conversion targets |

### Sales
| | |
|---|---|
| [14 · Sales Playbook](03-sales/14-sales-playbook.md) | Pipeline stages, qualification, discovery call, cadence, CRM |
| [15 · Objection Handling](03-sales/15-objection-handling.md) | Full library by category, plus when to walk away |
| [16 · Proposal & Close](03-sales/16-proposal-and-close.md) | Template, Loom script, decision call, handoff |

### Operations
| | |
|---|---|
| [17 · Onboarding & Delivery](04-ops/17-onboarding-and-delivery.md) | 30-day plan, kickoff, monthly cycle, retention, offboarding |
| [18 · KPI Dashboard](04-ops/18-kpi-dashboard.md) | The five numbers, scorecards, cohorts, instrumentation |
| [19 · 90-Day Rollout](04-ops/19-90-day-rollout.md) | Week-by-week with owners, dependencies, budget, risks |

---

## What changed from the original blueprint

| Original | Now | Why |
|---|---|---|
| Down-sell on silence: $1,500 → $1,000 → niche | Scope ladder triggered by **stated need**, never by time | Discounting on silence teaches prospects to wait and punishes fast buyers |
| "$500 website only" | $500/mo **+ $1,500 build fee**, 12-month term | $500 for a build with SEO is below delivery cost |
| Ad spend ownership unstated | **Client pays platforms directly** — stated on every asset | The most common cause of late-stage deal collapse |
| Three SMS sequences incl. cold | **Cold SMS cancelled.** Consent-based only | TCPA: $500–$1,500 per message, no cap, active plaintiffs' bar |
| Phone at Stage 4 (last resort) | Phone **first** for Band A Ring 1 | ~8× more efficient per contact than email |
| "Any niche, service businesses" | Three named verticals with rationale | Can't sell "targeted" while targeting nobody |
| "Powered by Datamoon" | **In-Market Match**, vendor kept internal | A vendor-named moat is a credit card away for competitors |
| 3 intent buckets | 14 segments on 5 dimensions | Buckets must change what we *do*, or they're one bucket |
| Retargeting from cold list | Retargeting **built by** outbound traffic | You can't retarget a list — 20–50% match rates at best |
| No economics | Full model + capacity caps | $2,000 CAC ceiling, 4 new clients/mo/FTE cap |
| No measurement | 5 core metrics + scorecards + cohorts | Nothing in the original could be proven wrong |
| 6 undated next steps | 90-day plan, owners, gates, dependencies | Warmup is the critical path and nothing in the original knew that |

## Open decisions

These need a human, not more analysis:

1. **Target: 5 clients/month or 2–3?** 5 requires a delivery hire immediately. → [`19 §0.7`](04-ops/19-90-day-rollout.md)
2. **Is the intent data good enough?** One afternoon reading 25 enriched records answers it. → [`19 §0.4`](04-ops/19-90-day-rollout.md)
3. **Guarantee number `N` per vertical** — cannot be set until there's real data. Use the make-good without a number until then. → [`02 §4`](00-strategy/02-offer-architecture.md)
4. **Datamoon pricing** — the one `[TBD]` the budget can't be finalized without.

## Conventions

- `[ASSUMPTION]` marks a modeled number. Replace with actuals as they land; conclusions update themselves.
- Every metric has an owner, a cadence, and a threshold that triggers a named action.
- Cross-references use `file §section`.
- Compliance content is an operating framework, **not legal advice** — see the note at the top of [`05`](00-strategy/05-compliance.md).
