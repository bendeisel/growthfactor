# Aeterna Club — DrChrono implementation

- **Client:** Dr. Lee Howard, Aeterna Club (`admin@aeternaclub.com`). Practice subdomain
  `drhowardaeterna.drchrono.com`.
- **Spec (source of truth):** `docs/DrChrono_Implementation_Guide.docx`
- **Acceptance gate:** `gaps/acceptance-appendix-c.md` — the 10-step Test Patient Walkthrough.
  Client's words, 2026-08-29: *"the job is complete once I can adequately put a test patient
  through that first quarter MD visit."*
- **Open decisions:** `FINDINGS.md` — read this before building Section 11 or 12.
- **Session rules:** `CLAUDE.md`

## Status

Remediation close-out. Three committed items:

1. **GHL Pipeline Build Spec v1.3** — believed complete; verification pass against all 23
   tech-team checklist items outstanding.
2. **DrChrono implementation** — paid for, not delivered, being completed at no additional
   cost. Built inventory audit found ~50 gaps.
3. **Section 7 clinical note templates** — client clarified 2026-08-29: **build all**
   templates; test end-to-end through the first three (New Member Intake, Monthly
   Coordinator Check-In, Quarterly MD Review).

Sections 9 and 10 explicitly deprioritized by the client. The Compass DrChrono intake form
must be copied to Aeterna and fire before onboarding.

## Existing infrastructure

Not greenfield. As of 2026-08-21 there are 43 n8n workflows on the new server with DrChrono
repointed, including a **DrChrono Router** that already receives DrChrono webhook events and
fans them out. Close gaps in that estate rather than standing up a parallel receiver.
