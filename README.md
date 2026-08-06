# Command Center

One screen to run every business. Metrics on the left, one terminal in the
middle, and whichever app the agent opened on the right.

Spec and phase plan: [`docs/COMMAND-CENTER-SPEC.md`](docs/COMMAND-CENTER-SPEC.md).

## Run it

```bash
npm install
npm run dev          # http://localhost:3000
npm test             # 95 tests
npm run build        # includes TypeScript
```

Nothing needs configuring to start: unconfigured sources serve badged mock data,
and every tool reports the credential it needs rather than pretending.

**Before you deploy this anywhere public, set `COMMAND_CENTER_PASSWORD`.** In
production the app refuses to serve without it rather than exposing revenue data;
locally it runs open and shows an `unprotected` badge in the header.

## The idea

```
┌── My businesses ────┐ ┌── Command Center ───────┐ ┌── Apps ─────────────┐
│ selector            │ │      ( Jarvis core )    │ │ Email ClickUp …     │
│ Revenue  Members    │ │  status: working ●      │ │                     │
│ New      Lost       │ │                         │ │  the window the     │
│ ────────────────    │ │  you: open ClickUp      │ │  agent just opened  │
│ chart               │ │  ⚒ clickup_tasks        │ │                     │
│ ────────────────    │ │  Opus 5: four open …    │ │  [Approve] [Decline]│
│ needs attention     │ │  ▸ model selector       │ │                     │
└─────────────────────┘ └─────────────────────────┘ └─────────────────────┘
```

**The left column is the wall.** The four numbers Ben asked for — revenue, new
members, lost members, total members — month-to-date with last month beside
them, per business or rolled up. Flows compare against a pro-rated slice of last
month, because half a month of revenue judged against a whole one always looks
like a collapse. Total members is a stock, so it compares to where last month
closed.

**The middle column is the only terminal.** One thread, run by Claude — Opus 5
by default (best at driving the tools) or Sonnet 5 when a question is routine and
you'd rather spend less. Codex and Gemini are optional second opinions that appear
in the selector only once you set both their API key and their model id; they
answer but can't drive the tools yet. The Jarvis core is also the status light:
idle drifts, thinking speeds up and shifts violet, working runs hot.

**The right column is whatever you summoned.** Nothing is a hand-built app
screen. Ask for something, the agent calls a tool, and the tool call *is* the
window — it opens on the matching tab so you can watch the work.

## Tools

Adding a capability means adding a `ToolDefinition` in `lib/tools/`, not building
a screen. Each one declares how its result renders (`table`, `email`, `tasks`,
`files`, `text`), so a new source reuses the existing renderers.

| Tool | State |
| --- | --- |
| `get_metrics`, `get_revenue_trend`, `list_alerts` | ✅ working now, no credentials |
| `gmail_search`, `gmail_draft`, `gmail_modify`, `gmail_send` | needs Google OAuth |
| `clickup_tasks`, `clickup_create_task` | needs `CLICKUP_API_TOKEN` |
| `drive_search`, `calendar_agenda` | needs Google OAuth |

Two rules hold for all of them:

- **Nothing outward-facing happens without approval.** Sending mail, moving mail
  to spam, creating a task — the tool stops, the window shows what it's about to
  do, and nothing runs until you press Approve. An approval covers one tool for
  one turn and never carries over.
- **A tool that can't run says which credential is missing.** It never returns
  plausible-looking placeholder data.

Tools run on Claude. If you add Codex or Gemini later they'll answer but not act,
and the panel says `chat only` rather than letting you find out by asking.

## Metrics: pushed, stored, then read

```
n8n (holds vendor credentials, runs on a schedule)
  └── POST /api/ingest  (Bearer INGEST_TOKEN)
        └── data/metrics.jsonl   append-only snapshot log
              └── dashboard reads the latest reading + 14 days of trend
```

Page loads never wait on a vendor. An outage shows as **stale** with the last
known numbers, not a blank column, and stored history is what makes the trend
chart and the membership-decline alert possible. Only a business with no usable
stored reading triggers a live pull; the refresh button forces one.

```jsonc
POST /api/ingest
{
  "source": "glowfox",
  "businesses": [
    {
      "id": "nashville-mma",
      "activeMembers": 312,
      "activeMembersLastMonth": 305,
      "mtd":       { "sales": 21, "revenue": 18450.5, "cancellations": 4, "newMembers": 21, "pastDue": 1220 },
      "lastMonth": { "sales": 44, "revenue": 39100.0, "cancellations": 9, "newMembers": 44, "pastDue": 980 }
    }
  ]
}
```

Money is dollars on the wire and cents everywhere inside. A push carrying a
business that source doesn't own is rejected, so a misconfigured workflow can't
overwrite another source's numbers.

## Needs attention

Rules in `lib/alerts.ts` do the scan across seven businesses so you don't:
revenue behind pace, cancellation spikes, past due over threshold, membership
decline, a business missing from its payload, ingestion that has stopped. Worst
first, thresholds in one exported object, and "nothing needs you" is a real
answer rather than an empty state.

## Budget

$5/day soft cap and $100/month hard cap, checked **before** each provider call.
The monthly cap refuses; the daily cap warns and proceeds. Spend is logged to
`memory/budget-YYYY-MM-DD.json` and priced from Claude's published rates. Any
provider you add later needs `*_INPUT_CENTS_PER_MTOK` / `*_OUTPUT_CENTS_PER_MTOK`
set, and until it is, those turns log tokens and report cost as *unpriced* rather
than guessing a number into a guardrail.

Opus 5 is the default because it's the best tool-driver, not the cheapest: at
list rates a heavy tool-using turn is cents, but a day of them adds up against a
$5 cap. Switch to Sonnet 5 for routine questions if the meter gets tight.

## Layout

```
app/
  page.tsx              three columns, the whole product
  login/                password gate
  api/ingest            n8n pushes metrics here
  api/metrics           snapshot + alerts + trend  (?force=1 re-pulls)
  api/chat              SSE stream: text, tool calls, tool results
  api/budget            spend against the caps
middleware.ts           one auth gate for every request
components/
  command-center-panel  Jarvis core + model selector + chat
  jarvis/               the core (three.js)
  metrics/              business panel, KPI grid, attention feed
  charts/               bar comparison, trend chart
  workspace/            app toggle, tool windows, chat, shared context
  ui/                   card, badge, button, KPI tile
lib/
  tools/                what the agent can do
  chat/                 providers, tool loop, system prompt
  models.ts             which models this deployment can actually call
  metrics/              types, registry, adapters, rollup, trend, formatting
  store/                append-only snapshot log
  alerts.ts  budget.ts  pricing.ts  businesses.ts
tests/                  vitest
data/                   metrics.jsonl        (gitignored)
memory/                 budget-YYYY-MM-DD.json (gitignored)
```

## Hosting note

The spec locks hosting to "WordPress hosting + Hostinger". This app
server-renders and needs Node, so it needs Hostinger's **Node.js app hosting or a
VPS** — shared WordPress hosting can't run it. Point `DATA_DIR` and `MEMORY_DIR`
at a persistent volume so history and spend survive a redeploy.

The snapshot log is a file, not Postgres, on purpose: one user, one node, a few
rows per ingest, and a year of history you can open in a text editor. Postgres
earns its place at the white-label step in Phase 5 — `MetricsStore` is the seam.

## Next

- **Saved routines.** "Do this for me from now on": the agent proposes a routine
  (schedule + the tool sequence it just ran), you approve, it's stored and runs on
  a cron. The tool layer is the hard part and it's built; this is a store, a
  proposal flow, and a runner.
- **Phase 2:** the n8n workflow that pushes Glow Fox, and the GHL rollup.
- **Phase 3/4:** the Google OAuth client and ClickUp token, which turn nine of the
  eleven tools on without touching the UI.
