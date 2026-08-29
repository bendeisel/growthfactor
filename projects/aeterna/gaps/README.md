# Gap tracking

## Input

Drop the built-inventory audit here — Lorenz's `DRCHRONO_BUILT_INVENTORY.md`, emailed
2026-08-29, ~50 gaps ordered by section.

## The classification pass

The point of this folder is to turn "50 gaps" into a schedule. For each gap, tag it with the
surface that can execute it:

| Tag | Meaning | Who does it |
|---|---|---|
| `API` | A DrChrono v4 REST call | Claude, once write scopes are live |
| `n8n` | Workflow build or fix | Claude, via the n8n MCP server |
| `GHL` | GoHighLevel pipeline / tag / automation | Claude, partly |
| `UI` | DrChrono screen configuration | **Human.** Claude writes the click-path and the check. |

Then produce two numbers: how many items close by code, and how many hours of human
DrChrono-screen time remain. That is the answer to "how fast can we finish."

Every item traces to a numbered step in `docs/DrChrono_Implementation_Guide.docx`. Where the
inventory and the guide disagree, the guide wins — flag the discrepancy, do not silently pick.

## Acceptance

`acceptance-appendix-c.md` is the gate. An item is not done until its evidence is recorded
there or against its guide step.
