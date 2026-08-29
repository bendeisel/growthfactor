# Aeterna Club — DrChrono build

Instructions for any Claude Code session working this project. Read this before touching anything.

## What this project is

Finishing the DrChrono implementation for Aeterna Club (Dr. Lee Howard) against
`docs/DrChrono_Implementation_Guide.docx`. The work is being closed out under a
remediation commitment: it was paid for, it was not delivered, and Growth Factor is
completing it at no additional cost.

**Definition of done, in the client's own words:** a test patient can be put through the
complete sequence — intake, onboarding, monthly coordinator check-in, quarterly MD review —
with DrChrono and GoHighLevel interacting correctly. That is Appendix C, the Test Patient
Walkthrough, and it is the acceptance gate. See `gaps/acceptance-appendix-c.md`.

## The four execution surfaces

Every outstanding item belongs to exactly one. Classify before you build — this is the
single most important step, because only two of the four are things Claude can execute.

| Surface | Can Claude execute it? | How |
|---|---|---|
| **DrChrono API** | Yes, once write scopes exist | REST v4, OAuth 2. Blocked until the API app has write scopes and has been re-authorized. |
| **n8n workflows** | Yes | n8n MCP server. Existing DrChrono Router receives DrChrono webhook events and fans out. |
| **GoHighLevel** | Partly | API for pipeline/tag/automation work; some config is UI. |
| **DrChrono UI config** | **No** | Templates, smart phrases, appointment types, custom field *definitions*, report definitions. A human clicks these. Claude writes the exact click-path and the verification script. |

Do not claim an item is done because you produced instructions for it. An item on the UI
surface is done when a human has performed it and the verification step passes.

## Safety envelope — non-negotiable

This is a live medical practice. The API cannot corrupt DrChrono's servers, but it can
absolutely create wrong or duplicate records in Aeterna's own patient data.

1. **Read-only first.** Validate every field mapping with a read-only token before any
   write scope is enabled.
2. **Test patient only.** All write testing goes against "Test Member Aeterna"
   (DOB 1/1/1970, Tier Gold, Founders Y). Never a real member.
3. **Dry-run before live.** For each new write type, log the exact payload and get human
   sign-off before the first real call.
4. **Idempotency on DrChrono record IDs.** A retry must update, never duplicate. The
   duplicate-patient failure mode is the one that costs real cleanup.
5. **Stage the scopes.** Enable write access one domain at a time — appointments, then
   documents, then note field values.
6. **Respect the rate limit.** ~500 calls/hour by default. Back off on 429; do not retry
   in a tight loop.

## Working rules

- The Implementation Guide is the spec. Where a gap list and the guide disagree, the guide
  wins — and flag the discrepancy rather than silently picking one.
- Never mark a guide step complete without its verification evidence recorded in the plan.
- Section 7 requires **all** listed templates to be built; only the first three
  (New Member Intake, Monthly Coordinator Check-In, Quarterly MD Review) need to be tested
  end to end before first patient. Confirmed by the client 2026-08-29.
- Sections 9 and 10 were explicitly deprioritized by the client.
- The intake form from Compass DrChrono must be copied to Aeterna and fire before onboarding.
