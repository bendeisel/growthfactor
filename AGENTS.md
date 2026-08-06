<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Command Center

Single-tab operations dashboard for Growth Factor AI. Spec and phase plan:
`docs/COMMAND-CENTER-SPEC.md`.

## Layout of the code

- `app/page.tsx` — the whole product: two columns, one screen, no routes to add.
- `middleware.ts` — the single auth gate for every request.
- `components/metrics/` — always-visible left column: attention feed, rows, sparklines.
- `components/workspace/` — the tabbed right column; one file per panel.
- `components/brain/brain-graph.tsx` — the header's 3D node graph (three.js).
- `lib/metrics/` — data layer. `registry.ts` decides stored-vs-pull;
  `adapters/*` implement one source each.
- `lib/store/` — the append-only snapshot log behind history and trends.
- `lib/alerts.ts` — the rules behind "needs attention".
- `lib/chat/` — provider layer for the model switch.
- `lib/budget.ts` — spend caps and the daily log at `memory/budget-YYYY-MM-DD.json`.

## Conventions

- **New metrics source = new adapter.** Implement `MetricsAdapter`, register it
  in `lib/metrics/registry.ts`, point a business at it in `lib/businesses.ts`.
  No UI changes.
- **Ingestion is push-first.** n8n POSTs to `/api/ingest`; page loads read the
  stored reading. Only a business with no usable stored reading triggers a live
  pull, and mock readings are never persisted — they would poison the trends.
- **Unconfigured is a first-class state.** An adapter without credentials
  returns `isConfigured() === false` plus a one-line `missingReason()`; the
  registry serves mock data marked as such. No number appears on screen without
  a `mock` / `stale` badge unless a vendor actually reported it.
- **Never invent a number.** That covers prices too: a model with no configured
  rate logs tokens and reports cost as unpriced rather than estimating.
- **Money is cents** end to end (`revenueCents`, `pastDueCents`); format at the
  edge with `lib/metrics/format.ts`. Don't use `Intl` compact notation — Node
  and Chrome disagree on trailing zeros, which breaks hydration.
- **Budget checks happen before the provider call**, never after.
- Dark theme only. Colours come from the `@theme` block in `app/globals.css` —
  use the token names (`text-ink-muted`, `bg-panel`), not raw hex. Status
  colours are reserved for status; don't use them as series colours.
- Server components fetch; client components poll. Keep secrets in route
  handlers and `lib/` — never in a `"use client"` file.

## Checks

```bash
npm test        # vitest — money math, adapters, alerts, store, budget, SSE parsing
npm run build   # includes TypeScript
```

Anything with money math, a threshold, or hand-rolled parsing gets a test.
