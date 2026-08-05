<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Command Center

Single-tab operations dashboard for Growth Factor AI. Spec and phase plan:
`docs/COMMAND-CENTER-SPEC.md`. Current state: Phase 1 (skeleton) is complete.

## Layout of the code

- `app/page.tsx` — the whole product: two columns, one screen, no routes to add.
- `components/metrics/` — always-visible left column.
- `components/workspace/` — the tabbed right column; one file per panel.
- `components/brain/brain-graph.tsx` — the header's 3D node graph (three.js).
- `lib/metrics/` — data layer. `registry.ts` fans out over adapters;
  `adapters/*` implement one source each.
- `lib/budget.ts` — token/spend log at `memory/budget-YYYY-MM-DD.json`.

## Conventions

- **New metrics source = new adapter.** Implement `MetricsAdapter`, register it
  in `lib/metrics/registry.ts`, point a business at it in `lib/businesses.ts`.
  No UI changes.
- **Unconfigured is a first-class state.** An adapter without credentials must
  return `isConfigured() === false` and a one-line `missingReason()`; the
  registry then serves mock data marked as such. The dashboard never shows a
  fabricated number without a `mock` / `stale` badge next to it.
- **Money is cents** end to end (`revenueCents`, `pastDueCents`); format at the
  edge with `lib/metrics/format.ts`.
- Dark theme only. Colours come from the `@theme` block in `app/globals.css` —
  use the token names (`text-ink-muted`, `bg-panel`), not raw hex.
- Server components fetch; client components poll. Keep secrets in route
  handlers and `lib/` — never in a `"use client"` file.

## Checks

`npm run build` runs TypeScript. There is no test suite yet.
