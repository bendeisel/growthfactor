# Command Center — Build Spec v0.1

**Date:** 2026-08-05 · **Owner:** Ben Grove (Growth Factor AI) · **Builder:** Claude Code · **Architect:** Megatron
**Status:** Open questions locked 2026-08-05. Converted from the hand-off `.docx`; §7 and §9 are the binding decisions.

## 1. Vision

A single-tab command center. Stop opening 15 windows to do one task. Everything
needed to run multiple businesses plus the agency, in one screen, from any
computer.

Reachable from:

- The web dashboard itself (any browser, any computer)
- Telegram (Megatron already lives there)
- Claude Code CLI (with model switch)

## 2. Core layout

Two columns, single page.

### Left column — metrics (always visible)

Live numbers, every business at once. No drill-down.

| Business | Sales (MTD) | Revenue (MTD) | Cancellations (MTD) |
| --- | --- | --- | --- |
| Nashville MMA Training Camp | … | … | … |
| Fighters Boxing Gym | … | … | … |
| Growth Factor AI (agency) | … | … | … |
| Fuel Fortress Nashville | … | … | … |
| Aeterna Club | … | … | … |
| Furst Place MMA | … | … | … |
| Dr. Howard's Compass | … | … | … |

Data sources:

- GHL subaccounts → GHL API or existing PIT tokens
- Glow Fox → Glow Fox API via n8n workflow
- Future: any source via the adapter pattern

### Right column — workspace tabs

Each tab is a self-contained app.

| Tab | v1 | What it does |
| --- | --- | --- |
| Megatron | ✅ | Embedded chat. Same brain as Telegram. Always on. |
| Claude Code | ✅ | Sonnet/Opus chat with a model switch (Anthropic ↔ OpenAI ↔ OpenClaw). |
| ClickUp | ✅ | Embedded task view, quick-add, project switcher. |
| Google Drive | ✅ | File browser, upload, recent files. |
| Gmail unified inbox | ⏳ v2 | All email accounts in one feed, triage with Megatron. |
| Google Photos | ⏳ deferred | Skipped for v1. |
| Notion / Wiki | ⏳ future | TBD. |

## 3. Model switch (within the Claude Code tab)

One button cycles between Ben's primary three:

1. **Anthropic** (Sonnet 5 / Opus 5) — heavy reasoning, code generation
2. **OpenAI** (GPT-5) — general purpose
3. **OpenClaw / minimax** (M3 / M2.7) — cheap default, routing

Budget guardrails:

- $5/day soft cap, $100/month hard cap (Ben approves overages)
- Cheap model is the default; escalate only when needed
- Tokens logged daily to `/memory/budget-YYYY-MM-DD.json`

## 4. Gmail / email triage (v2)

One inbox across every account: `ben@nashvillemma.com`,
`ben@fightersboxing.com`, `support@growth-factor.ai`, plus any others.

1. Megatron fetches all unread email on dashboard load (cached, scheduled)
2. Renders a unified feed, sorted by learned priority
3. Ben types or taps: archive, reply, draft, forward, filter-rule, mark spam
4. Megatron drafts the reply in Ben's voice and waits for approval
5. Send on tap

Tone presets: "Reply yes", "Reply no", "Schedule meeting", more as Ben trains
them. Both reply templates can be edited inline and saved as new defaults.

Goal: clear the inbox in 5 minutes, not 60.

## 5. Tech stack

| Layer | Choice | Why |
| --- | --- | --- |
| Frontend | Next.js (App Router) + shadcn-style UI | Fast iteration |
| Visual layer | 3D brain component (three.js) | The wow factor that sells |
| Backend | Node serverless functions | Cheap to run, scales |
| Data store | Postgres (Neon / Supabase) | Multi-business metrics |
| Job runner | n8n (already in the stack) | Scheduled pulls from GHL, Glow Fox |
| Auth | Auth.js or Clerk | Single user initially |
| Hosting | Hostinger (see §7) | Already in the stack |

## 6. Build sequence

- **Phase 1 — skeleton:** two-column layout, mock metrics, tabs with
  placeholders, brain visual in the header.
- **Phase 2 — real data:** GHL subaccounts, Glow Fox via n8n, live refresh.
- **Phase 3 — workspaces:** embed Megatron (web endpoint + WebSocket), Claude
  Code (backend proxy), ClickUp, Drive, Calendar.
- **Phase 4 — email:** Gmail OAuth, unified inbox, triage workflow.
- **Phase 5 — polish / productize:** white-label version for clients,
  onboarding, pricing.

## 7. Locked decisions

- **Auth:** just Ben (single user). Multiple email accounts aggregate into the
  Gmail tab but stay visually separated by account.
- **Hosting:** WordPress hosting + Hostinger (already in the stack).
- **v1 panels:** Metrics + Megatron + Claude Code + ClickUp + Drive + Gmail +
  Calendar. Skip Google Photos.
- **Model switch UX:** option C (hybrid). Single chat with a toggle for the
  active model; models can also call each other for subtasks.
- **Glow Fox:** n8n confirmed. Pull month-to-date, last month, revenue, new
  members, cancellations, past due, active member count.
- **Brain visual:** an Obsidian-style 3D graph view — rotating, connected nodes,
  constantly moving, sci-fi. Also the wow factor for productization.

## 8. Next steps

1. Ben clarifies open questions — ✅ locked 2026-08-05
2. Megatron updates the spec with locked decisions — ✅ done
3. Ben hands the spec to Claude Code — ✅ done
4. Claude Code builds Phase 1 — ✅ done
5. Iterate

## 9. Locked v1 panel list (final)

| Tab | Source | Notes |
| --- | --- | --- |
| Metrics | GHL, Glow Fox (via n8n), ClickUp | Always-visible left column |
| Megatron | OpenClaw / minimax | Same brain as Telegram |
| Claude Code | Anthropic (Sonnet/Opus) | Toggle to OpenAI / OpenClaw |
| ClickUp | ClickUp API / embed | Tasks + quick-add |
| Drive | Google Drive API | File browser + upload |
| Gmail | Gmail API | Unified inbox, separated by account |
| Calendar | Google Calendar API | Embedded agenda |

Deferred: Google Photos.
