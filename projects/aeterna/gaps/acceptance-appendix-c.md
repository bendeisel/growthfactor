# Acceptance gate — Appendix C, Test Patient Walkthrough

> Verbatim from `docs/DrChrono_Implementation_Guide.docx`. This is the client's stated
> definition of done. Do not reword the steps; record evidence against each one.

Before any real member is enrolled, run a test patient through the complete build. This validates every integration and every form.

Test patient: **Test Member Aeterna**, DOB 1/1/1970, Tier = Gold, Founders = Y.

| # | Step | Surface | Status | Evidence |
|---|---|---|---|---|
| 1 | Create test patient "Test Member Aeterna" in DrChrono with DOB 1/1/1970, Tier = Gold, Founders = Y. |  | ☐ |  |
| 2 | Confirm entitlement tracker auto-populated with 40 Gold rows. |  | ☐ |  |
| 3 | Schedule New Member Intake — confirm 90 min duration, Navy Blue, Coordinator + MD. |  | ☐ |  |
| 4 | Complete Intake Note Template — confirm all fields save. |  | ☐ |  |
| 5 | RN completes BHRT Lab Draw appointment + IV Procedure Note — confirm entitlement tracker decrements from 2 to 1. |  | ☐ |  |
| 6 | Coordinator completes Monthly Check-In — confirm health score calculates correctly. |  | ☐ |  |
| 7 | Trigger a mock at-risk event (manually set score to 55) — confirm At-Risk Action Note appears and GHL tag fires. |  | ☐ |  |
| 8 | Manually advance test patient's Membership End Date to be 90 days away — confirm Renewal pipeline triggers in GHL. |  | ☐ |  |
| 9 | Run each of the 16 standard reports — confirm test patient data appears correctly. |  | ☐ |  |
| 10 | Verify every n8n workflow executes without error. |  | ☐ |  |

**Only after all 10 steps pass should real member enrollment begin.**

## Notes on the surfaces column

Fill in one of `API`, `n8n`, `GHL`, `UI` per step so it is obvious which steps a Claude
session can execute and which need a human at a DrChrono screen. Several of these steps
are assertions about behaviour that emerges from configuration — those verify by
observation, not by a call.
