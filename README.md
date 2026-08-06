# Command Center

One screen for every business Ben runs: live metrics down the left, a tabbed
workspace down the right, and a 3D brain across the header.

Full spec and phase plan: [`docs/COMMAND-CENTER-SPEC.md`](docs/COMMAND-CENTER-SPEC.md).

## Run it

```bash
npm install
npm run dev          # http://localhost:3000
npm test             # 69 tests
npm run build        # includes TypeScript
```

Nothing needs configuring to start: unconfigured sources serve badged mock data,
and unconfigured model providers say which key they need. Copy `.env.example` to
`.env.local` as you connect things.

**Before you deploy this anywhere public, set `COMMAND_CENTER_PASSWORD`.** In
production the app refuses to serve without it rather than exposing revenue data;
locally it runs open and shows an `unprotected` badge in the header.

## How it works

### Metrics: pushed, stored, then read

```
n8n (holds vendor credentials, runs on a schedule)
  └── POST /api/ingest  (Bearer INGEST_TOKEN)
        └── data/metrics.jsonl   append-only snapshot log
              └── dashboard reads the latest reading + 14 days of trend
```

Page loads never wait on a vendor. A vendor outage shows as **stale** with the
last known numbers, not a blank column, and history is what makes the trend
lines and the membership-decline alert possible.

Only a business with no usable stored reading triggers a live pull, via its
adapter (`GLOWFOX_N8N_URL`, `GHL_METRICS_URL`). The refresh button forces one.
Both directions share one payload shape — money in dollars, converted to cents at
the edge:

```jsonc
POST /api/ingest
{
  "source": "glowfox",
  "businesses": [
    {
      "id": "nashville-mma",
      "activeMembers": 312,
      "mtd":       { "sales": 21, "revenue": 18450.5, "cancellations": 4, "newMembers": 21, "pastDue": 1220 },
      "lastMonth": { "sales": 44, "revenue": 39100.0, "cancellations": 9, "newMembers": 44, "pastDue": 980 }
    }
  ]
}
```

A push is rejected if it carries a business that source doesn't own, so a
misconfigured workflow can't overwrite another source's numbers. Adding a source
later is an adapter plus one line in `lib/metrics/registry.ts`; no UI changes.

### Needs attention

A wall of numbers still leaves you doing the arithmetic across seven businesses,
so the rules in `lib/alerts.ts` do it: revenue behind a pro-rated pace,
cancellation spikes, past due over threshold, membership decline, a business
missing from its payload, ingestion that has stopped. Sorted worst-first, and an
empty feed says so — "nothing needs you" is a real answer.

Thresholds are all in one exported object at the top of that file.

### The chat tabs

Both tabs stream from a shared provider layer: the Anthropic SDK for Claude, and
one OpenAI-compatible client for OpenAI and OpenClaw / minimax. Each turn:

1. **Budget is checked first.** The monthly hard cap refuses the call; the daily
   soft cap warns and proceeds (that's what "Ben approves overages" means).
2. **The optional delegated subtask runs**, so the active model can consult a
   second model before answering — the locked hybrid switch.
3. **The answer streams** token by token over SSE.
4. **Usage is logged** to `memory/budget-YYYY-MM-DD.json`.

Both agents get the current numbers and open alerts in their system prompt, so
"why is Aeterna behind?" is answerable without a tool call. Mock rows are
labelled as mock so the model doesn't present them as fact.

Anthropic calls use adaptive thinking, `xhigh` effort by default, and a
server-side refusal fallback so a false positive on a benign question doesn't
come back as a dead end. Spend is priced from Anthropic's published rates; other
providers need `*_INPUT_CENTS_PER_MTOK` / `*_OUTPUT_CENTS_PER_MTOK` set, and
until they are, those turns log tokens and report cost as *unpriced* rather than
guessing a number into a budget guardrail.

## State of each piece

| Piece | State |
| --- | --- |
| Two-column layout, phone-friendly with a Metrics/Workspace switch | ✅ |
| Metrics for all 7 businesses, MTD, auto-refresh, totals | ✅ |
| Push ingestion + append-only snapshot log + 14-day trend | ✅ |
| Attention feed | ✅ |
| Password login, signed session cookie, edge-gated routes | ✅ |
| Streaming chat, hybrid model switch, enforced budget caps | ✅ needs a provider key |
| Sparklines (daily revenue, derived from stored MTD readings) | ✅ |
| Brain graph | ✅ |
| ClickUp / Drive / Gmail / Calendar panels | ⏳ scope + blockers listed in-app |
| Megatron sharing one thread with Telegram | ⏳ needs the Megatron web endpoint |

## Layout

```
app/
  page.tsx              two columns, the whole product
  login/                password gate
  api/ingest            n8n pushes metrics here
  api/metrics           snapshot + alerts + trend  (?force=1 re-pulls)
  api/chat              SSE streaming chat
  api/budget            spend against the caps
  api/auth/*            login / logout
middleware.ts           one auth gate for every request
components/
  brain/                three.js node graph
  metrics/              attention feed, rows, sparkline
  workspace/            tabs + one file per panel
  ui/                   card, badge, button, tabs
lib/
  businesses.ts         the 7 businesses and their source mapping
  metrics/              types, registry, adapters, formatting, trend
  store/                append-only snapshot log
  alerts.ts             the "needs attention" rules
  auth/                 session signing (Web Crypto, edge-safe)
  chat/                 providers, orchestration, system prompt
  budget.ts, pricing.ts spend caps, token rates
tests/                  vitest
data/                   metrics.jsonl        (gitignored)
memory/                 budget-YYYY-MM-DD.json (gitignored)
```

## Hosting note

The spec locks hosting to "WordPress hosting + Hostinger". This app
server-renders and needs Node, so it needs Hostinger's **Node.js app hosting or a
VPS** — shared WordPress hosting can't run it. Give it its own subdomain on a
Node plan, or reverse-proxy it from the WordPress host, and point `DATA_DIR` and
`MEMORY_DIR` at a persistent volume so history and spend survive a redeploy.

The snapshot log is a file, not Postgres, on purpose: one user, one node, a few
rows per ingest, and a year of history you can open in a text editor. Postgres
earns its place at the white-label step in Phase 5, when there's more than one
tenant to keep apart — `MetricsStore` is the seam where that swap happens.

## Next

- **Phase 2:** the n8n workflow that pushes Glow Fox, and the GHL subaccount
  rollup. Confirm which businesses sit on which source in `lib/businesses.ts`.
- **Phase 3:** Megatron's web transport, ClickUp / Drive / Calendar OAuth.
- **Phase 4:** Gmail unified inbox and triage.
