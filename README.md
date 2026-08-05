# Command Center

One screen for every business Ben runs: live metrics down the left, a tabbed
workspace down the right, and a 3D brain across the header.

Full spec and phase plan: [`docs/COMMAND-CENTER-SPEC.md`](docs/COMMAND-CENTER-SPEC.md).

## Run it

```bash
npm install
npm run dev          # http://localhost:3000
```

No configuration needed to start. Every data source is optional: unset sources
serve deterministic mock data with a `mock` badge, and unset model providers
report which credential they need instead of answering. Copy `.env.example` to
`.env.local` as you connect things.

```bash
npm run build && npm start   # production
```

## What's built (Phase 1 — skeleton)

| Piece | State |
| --- | --- |
| Two-column single-page layout | ✅ |
| Metrics column, all 7 businesses, MTD sales / revenue / cancellations | ✅ mock data, auto-refresh every 60s |
| Adapter layer for GHL + Glow Fox with graceful mock fallback | ✅ ready for real endpoints |
| Rotating 3D brain graph in the header | ✅ |
| Six workspace tabs (Megatron, Claude Code, ClickUp, Drive, Gmail, Calendar) | ✅ mounted; panels state their scope and blockers |
| Model switch — hybrid UX: active-model toggle + delegate target | ✅ UI wired, provider calls are Phase 3 |
| Budget guardrails ($5/day soft, $100/mo hard) + daily spend log | ✅ meter reads `memory/budget-YYYY-MM-DD.json` |

Nothing in this phase invents a number or an answer. Mock metrics are badged,
and sending a chat message returns which provider and credential the turn would
have needed rather than a fake reply.

## Wiring up Phase 2 (real metrics)

Both adapters read one normalized payload, so n8n owns the vendor credentials
and this app never sees them. Shape is documented in
`lib/metrics/adapters/normalized.ts`:

```jsonc
{
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

Point `GLOWFOX_N8N_URL` at the n8n webhook and `GHL_METRICS_URL` at the
subaccount rollup, and the column goes live — a source that is down or
unconfigured degrades to mock for its own businesses only, never blanking the
column.

Adding a source later is an adapter plus one line in
`lib/metrics/registry.ts`; no UI changes.

## Layout

```
app/
  page.tsx              two columns, the whole product
  api/metrics           snapshot for the left column
  api/budget            today's spend against the caps
  api/chat              Phase 1: reports what a turn would need
components/
  brain/                three.js node graph
  metrics/              left column
  workspace/            tabs + one file per panel
  ui/                   card, badge, button, tabs
lib/
  businesses.ts         the 7 businesses and their source mapping
  metrics/              types, registry, adapters, formatting
  models.ts             model-switch registry
  budget.ts             daily token/spend log
memory/                 budget-YYYY-MM-DD.json (gitignored)
```

## Hosting note

The spec locks hosting to "WordPress hosting + Hostinger". This app server-renders
and needs Node, so it needs Hostinger's **Node.js app hosting or a VPS** — shared
WordPress hosting can't run it. Either give it its own subdomain on a Node plan,
or reverse-proxy it from the WordPress host. Worth confirming before Phase 5.

## Next

Phase 2: n8n workflow for Glow Fox, GHL subaccount rollup, live refresh.
Phase 3: Megatron web transport, provider calls behind the model switch, ClickUp
/ Drive / Calendar OAuth.
