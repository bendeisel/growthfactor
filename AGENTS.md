<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Command Center

Single-tab operations dashboard for Growth Factor AI. Spec and phase plan:
`docs/COMMAND-CENTER-SPEC.md`.

## Layout of the code

A rail of sections on the left, one section filling the rest.

- `app/page.tsx` — the whole product. No routes to add.
- `middleware.ts` — the single auth gate for every request.
- `components/command-center.tsx` — the shell: section state, theme toggle, the
  desktop rail and the phone tab bar.
- `components/ui/sidebar.tsx` — the collapsible rail.
- `components/sections/` — one file per section (businesses, clients, bridge,
  inbox, clickup). `parts.tsx` holds the shared page furniture.
- `components/charts/plot.tsx` — every chart. Area, bars, pace bars, rank grid,
  meters.
- `lib/reports.ts` — sample Client OS data, badged as sample until an adapter
  replaces it.
- `lib/tools/` — what the agent can do. One file per source.
- `lib/chat/` — providers and the Anthropic tool loop.
- `lib/metrics/` — data layer. `registry.ts` decides stored-vs-pull;
  `adapters/*` implement one source each.
- `lib/store/` — the append-only snapshot log behind history and trends.
- `lib/alerts.ts` — the rules behind "needs attention".
- `lib/budget.ts` — spend caps and the daily log at `memory/budget-YYYY-MM-DD.json`.

## Conventions

- **New capability = new tool, not a new screen.** Add a `ToolDefinition` to
  `lib/tools/`, register it in `lib/tools/index.ts`, and declare which `panel`
  shape renders its result. The window it opens is free. Never build a
  second, hand-made path to the same data.
- **Anything outward-facing is `destructive: true`** and returns
  `requiresApproval(...)` until `context.confirmed`. Approvals are granted per
  tool, per turn, and never carry over.
- **A tool that can't run says which credential is missing** via
  `notConnected(...)`. It must never return plausible-looking placeholder data.
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
- **Two themes, one set of token names.** Every colour is a runtime variable in
  `app/globals.css`; `.dark` on `<html>` flips the whole app. Use the token names
  (`text-ink-muted`, `bg-surface`), never raw hex, and never define a colour only
  inside one scheme. A tile is never pure white and never pure black.
- **Text on a status colour uses `text-on-tone`,** not `text-white`. The status
  colours are dark in light mode and bright in dark mode, so a fixed foreground
  fails one of them. Status colours are reserved for status — never a series colour.
- **Claude only.** One provider means one tool shape, one price table, one
  failure mode in the budget guard. Don't add a second provider "switched off".
- Server components fetch; client components poll. Keep secrets in route
  handlers and `lib/` — never in a `"use client"` file.

## Checks

```bash
npm test        # vitest — money math, adapters, alerts, store, budget, SSE parsing
npm run build   # includes TypeScript
```

Anything with money math, a threshold, or hand-rolled parsing gets a test.
