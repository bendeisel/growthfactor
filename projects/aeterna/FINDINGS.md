# Open findings — read before building

Two things surfaced from reading the Implementation Guide against the API and compliance
guidance. Both need a human decision; neither should be resolved by whoever picks up the
next task.

## 1. The guide and the compliance rule contradict each other on GHL

**The compliance position:** patient data does not land in GoHighLevel — marketing systems
and clinical systems stay separated, and PHI stays on the self-hosted n8n instance.

**The guide, Appendix D:**

> Health (member scores, at-risk) → DrC Monthly Check-In scores, **synced to GHL**, written
> to Cockpit weekly.
>
> Retention (renewal pipeline) → DrC Renewal Due List, **synced to GHL Pipeline 5**.

Sections 11 and 12 are built on syncing clinically-derived values into GHL. Either health
scores are not PHI in this architecture, or Sections 11 and 12 need redesigning to pass
identifiers and triggers without clinical values.

**Decision needed from:** Ben + Dr. Howard, before Section 11 build starts.
**Consequence if skipped:** the integration gets built twice, or PHI lands in a marketing
system.

## 2. Most of the remaining build cannot be done by the API

The API fills a clinical note template; it cannot author one. The same holds for appointment
type definitions, smart phrases, custom field definitions and report definitions. Section 7
opens: *"Navigate to Account → Clinical Notes → Templates → New."* That is UI configuration.

Rough weight of the guide by section size:

| Section | Paragraphs | Surface |
|---|---|---|
| 5 — Entitlement Tracker | 449 | Mixed: field defs UI, logic n8n |
| 7 — Clinical Note Templates | 302 | **UI — human** |
| 3 — Appointment Types (all 34) | 237 | **UI — human** (verify: appointment profiles may be API-writable) |
| 2 — Provider and User Setup | 123 | Mostly UI |
| 4 — Custom Fields | 118 | Definitions UI; values via API |
| 6 — Smart Phrase / Macro Library | 70 | **UI — human** |
| 8 — Standard Reports (16) | 67 | **UI — human** |
| 12 — Metric Capture Matrix | 59 | n8n + reporting |
| 11 — DrChrono → GHL via n8n | 26 | **n8n — automatable** |

**Implication for planning:** "hand it to Claude and it does the work" holds for the n8n
layer, the API sync layer, and for generating click-paths and verification scripts. It does
not hold for the largest sections. Estimate the human-hours at a DrChrono screen separately
and do not let them fall off the schedule.

**To verify:** whether appointment profiles (Section 3, 34 types) are creatable via the API.
If they are, that is the single biggest block of UI work that could be automated.
