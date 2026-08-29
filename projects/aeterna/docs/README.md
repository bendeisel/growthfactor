# Source documents

| File | What it is | Authority |
|---|---|---|
| `DrChrono_Implementation_Guide.docx` | The build spec. Sections 1–12, Appendices A–D (note: **two** Appendix C's — Test Patient Walkthrough, and CA v2026.6 Field & Workflow Requirements). | **Authoritative.** Build against this. |
| `DrChrono_Implementation_Guide.txt` | Flat text extraction of the above, for grep and for reading without a docx parser. | Derived — regenerate, don't edit. |

## Not committed here

| Document | Where | Why not committed |
|---|---|---|
| Aeterna GHL Pipeline Build Spec v1.3 FINAL (2026-07-28) | Google Drive `125JFSaRHQ9wJN1GoT8YeNhWUfNk6UTeW` | Needed for Section 11 work. Pull on demand rather than duplicating the client's copy. |
| DrChrono built-inventory audit (50 gaps) | Emailed by Lorenz, 2026-08-29, `DRCHRONO_BUILT_INVENTORY.md` | Drop it in `gaps/` when you have it — that is the input to the classification pass. |

To pull a Drive document into this folder, fetch it by file ID via the Google Drive
connector and decode to `docs/`, then regenerate the `.txt` alongside it.

## Guide structure

Section sizes give a rough sense of where the work is concentrated:

```
 1 Practice Configuration                28    7 Clinical Note Templates          302
 2 Provider and User Setup              123    8 Standard Reports (16)             67
 3 Appointment Types (build all 34)     237    9 Seat-Based Capacity      44  [deprioritized]
 4 Custom Fields for Member Records     118   10 Clinical Workflow Summaries  70 [deprioritized]
 5 Entitlement Tracker (core of UM)     449   11 DrChrono → GHL via n8n          26
 6 Smart Phrase and Macro Library        70   12 Metric Capture Matrix           59
```
