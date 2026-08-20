# CI Board — System Plan

**For:** David Blunk · **Requested by:** Ben Grove · **Date:** 2026-08-20
**Executed in:** David's CI repo (`ci.growth-factor.ai`) · **Status:** plan, not yet started

---

## 1. The job

`ci.growth-factor.ai` becomes the place the work lives. It replaces ClickUp.
Two people use it — Ben and David. Everything that isn't the board, a task, or a
client card comes out.

Ben asked for four things, precisely:

1. A kanban board that works like the ClickUp board — the same statuses and the
   same fields they actually used.
2. Filter by client, by client status, and by assignee.
3. A tab that switches the same filtered set between **Board** and **List**.
4. Fewer tabs. The SEO tooling and the AI-chat surfaces go away.

Slack stays exactly as it is. It is the notification layer; don't build one.

This plan is written against the live ClickUp workspace (`9013810139`, space
`90133290104` "Team Space") rather than from memory, so the schema below is what
they have, not what a kanban board usually has.

**One caveat up front:** `ci.growth-factor.ai` is not reachable from where this
was written, and David's repo isn't attached, so this specifies *data model,
views, and acceptance criteria* rather than file-level edits. It should drop onto
any Postgres + React stack; the SQL is Postgres but the shape translates.

---

## 2. What is actually in ClickUp today

### Lists

| List | ID | What it holds | Status set |
| --- | --- | --- | --- |
| Agency OS | `901327128404` | Internal agency work | Workflow |
| Client OS | `901327128407` | Client-facing delivery | Workflow (+ `stop`) |
| Clients | `901328102684` | One card per client (7 clients) | Project |
| Websites | `901328102677` | Website build templates 1–2 | Project |
| Google Ads | `901328102678` | Campaign build template | Project |
| Meta Ads | `901328102679` | Campaign build template | Project |
| Local/GBP | `901328102681` | GBP setup template | Project |
| GHL Builds | `901328102683` | GHL system + agent builds, templates 6–7 | Project |
| Personal List | `901308712160` | Ben's personal tasks (separate space) | Project |
| Active Tasks | `901326928381` | Stale, 4 backlog items (separate space) | Backlog |

### Two status sets — collapse to one

**Workflow set** (Agency OS, Client OS):
`new brief` → `in production` → `client review` → `revisions` → `delivered`,
plus `stop` on Client OS only.

**Project set** (everything else):
`to do` → `in progress` → `complete`.

That split is an accident of how the lists were created, not a design. Two
status vocabularies across one 2-person board is exactly the kind of gap Ben is
asking to remove. **One set for all work.**

### Custom fields

**Space-level — apply everywhere (7):**

| Field | Type | Options |
| --- | --- | --- |
| Client | task relation | → a card in the Clients list |
| Reviewer | user (single) | |
| AI Executor | dropdown | Claude · Viktor · Manual |
| Vertical | dropdown | MMA Gym · Fitness Gym · Doctor's Office · Restoration · Other |
| Output URL | url | |
| Revision Notes | text | |
| Summary | text | AI-generated bullet summary |

**Client OS adds (7):** Account Director (user), Annual Contract Value
(currency), Contract Renewal Date (date), Existing account (checkbox), Scope
(labels: Pipelines · Workflows · Calendars · Fields+Tags · Forms ·
Integrations), Service Specialization (dropdown, 6 options), Performance Tier
(dropdown, Excellent → Poor, AI-categorised).

**Clients list — the client card, ~40 fields.** Grouped by what they're for:

- *Identity:* Business name, Owner contact, Industry, Address / service area,
  Site URL, IG handle, Phone numbers owned
- *Commercial:* Tier (Lead Factory · Growth Factory), Signed contract link,
  Vault reference, Hours, Existing account
- *Health:* Health (On Track · At Risk · Off Track), Latest sentiment tier
  (Green · Yellow · Red), Current rating, Wins rollup, Promises made
- *Services:* Services active (labels: Website · Google Ads · Meta Ads ·
  Local/GBP · GHL), Active agents (Super · Chat · Voice · Review), Frequency per
  service, Delivery channel (Email · Portal · SMS)
- *Stack & IDs:* Sub-account ID, Google Ads ID, Meta ad account ID, GA4 ID,
  Pixel ID, Page ID, Hosting (Vercel · Netlify · WordPress · Other), WP URL,
  GBP link, Review link, Categories, CAPI status, Conversion tracking verified,
  Billing confirmed, Stack notes

### People and priority

Ben Grove `132038715`, David Blunk `118056972`, Lorenz Ramal `118101560`, Maju
Comendador `118103285`. Priority is ClickUp's standard four: urgent, high,
normal, low — keep as-is.

---

## 3. Three findings that change the build

### Tags are not the mechanism

Ben asked for "the tags and fields we used." Across **73 open tasks there is
exactly one tag** — `nmma`, on a single task. Tags were never adopted.

What actually links work to a client is the **Client** relation field pointing at
a card in the Clients list, backed by **Services active** labels on that card.
There is even an open ClickUp task — *"Add client tagging to Agency OS / Client
OS boards"*, sitting in `client review` — which confirms tagging was aspiration,
not practice.

**So: build the client relation and the label fields. Do not build a free-form
tag system.** A tag input would be a feature nobody has ever used, and it's the
kind of thing that makes a board feel loose. If a tag-shaped need appears later,
it will appear as a label field with fixed options.

### The templates are the IP

There are **nine `⭐ TEMPLATE` tasks**: Website Build (Node.js), Website Build
(WordPress Bricks), Google Ads Campaign Build, Meta Ads Campaign Build,
Local/GBP Setup, GHL System Build, GHL Agent Build, Client Card, and Reporting
Setup.

Those are the agency's SOPs — the checklist that makes fulfilment repeatable.
Losing them costs more than losing any board feature. **Templates are Phase 4,
in scope, not "later."**

### Most in-flight work belongs to people who are leaving

Of 73 open tasks: **Lorenz is assigned 28** and **Maju 4**. Nineteen of those
have no second assignee — when the accounts go, that work has no owner.

Concentrated in: the Aeterna Club pipeline rebuild (8 tasks, two flagged
GO-LIVE BLOCKER), the Compass workflow programme (10 tasks), and the two website
rebuilds (Nashville MMA, Fighters Boxing).

No code fixes this. **Ben reassigns or archives those 19 before migration**, or
they land in the new board as orphans and the first thing the new system does is
lose work.

---

## 4. Design decisions, already made

### Don't build a custom-field engine

The tempting move is a generic field system — a `custom_fields` table, a type
registry, an admin UI to add fields. That is how this project doesn't ship. It's
weeks of work to rebuild the least interesting part of ClickUp.

Instead:

- The **~10 fields used on task work** become **real columns**. Typed,
  indexed, filterable, queryable.
- The **~40 client-card fields** become one **`jsonb` column** on `clients`,
  rendered from a static schema file checked into the repo.

Adding a client field is then one line in that file plus a deploy. For two
people who change fields a few times a year, that is the right trade.

### One status set

Six columns, in order:

`Brief` → `In progress` → `Client review` → `Revisions` → `Delivered` · `Stopped`

`Delivered` and `Stopped` are terminal and hidden by default (a "show closed"
toggle reveals them). Mapping from ClickUp:

| ClickUp | New |
| --- | --- |
| `new brief`, `to do`, `backlog` | Brief |
| `in production`, `in progress` | In progress |
| `client review` | Client review |
| `revisions` | Revisions |
| `delivered`, `complete` | Delivered |
| `stop` | Stopped |

### Filter state lives in the URL

`/board?client=aeterna-club&assignee=david&status=in_progress`

Bookmarkable, pasteable into Slack, survives a reload, and needs no state
library. This is also how Board and List stay honest about showing the same set.

### Board and List are two renderers over one query

Same filter state, same result set, the toggle swaps the component and nothing
else. **Never two data paths** — that is where "the list says 12 and the board
says 11" bugs come from.

### Delete, don't hide

The SEO tooling and AI-chat surfaces come out of the codebase, not behind a
feature flag. Ben's "gaps and glitches" are mostly surface area: a half-finished
tab still throws, still carries dependencies, still needs care. Route removal is
the bug fix. Target: **no more than four nav items.**

---

## 5. Data model

```sql
-- Two of them. Keep it a table anyway; it's how assignment and @-mention work.
create table users (
  id          uuid primary key default gen_random_uuid(),
  email       text not null unique,
  name        text not null,
  avatar_url  text,
  clickup_id  text unique,
  active      boolean not null default true
);

create table clients (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,          -- 'aeterna-club', used in filter URLs
  name        text not null,
  tier        text check (tier in ('lead_factory','growth_factory')),
  health      text not null default 'on_track'
                check (health in ('on_track','at_risk','off_track')),
  sentiment   text check (sentiment in ('green','yellow','red')),
  vertical    text check (vertical in ('mma_gym','fitness_gym','doctors_office',
                                       'restoration','other')),
  services    text[] not null default '{}',  -- website, google_ads, meta_ads, local_gbp, ghl
  details     jsonb  not null default '{}',  -- the ~40 card fields; schema in code
  clickup_id  text unique,
  archived_at timestamptz,
  created_at  timestamptz not null default now()
);

create table tasks (
  id             uuid primary key default gen_random_uuid(),
  board          text not null check (board in ('agency','client')),
  title          text not null,
  description    text,
  status         text not null default 'brief'
                   check (status in ('brief','in_progress','client_review',
                                     'revisions','delivered','stopped')),
  priority       text check (priority in ('urgent','high','normal','low')),
  client_id      uuid references clients(id) on delete set null,
  reviewer_id    uuid references users(id) on delete set null,
  due_date       date,
  scope          text[] not null default '{}', -- pipelines, workflows, calendars, …
  ai_executor    text check (ai_executor in ('claude','manual')),
  output_url     text,
  revision_notes text,
  parent_id      uuid references tasks(id) on delete cascade,  -- subtasks
  position       numeric not null,             -- ordering within a column
  clickup_id     text unique,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  completed_at   timestamptz
);

-- ClickUp tasks carry up to three assignees. Keep that.
create table task_assignees (
  task_id uuid not null references tasks(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  primary key (task_id, user_id)
);

create table task_comments (
  id         uuid primary key default gen_random_uuid(),
  task_id    uuid not null references tasks(id) on delete cascade,
  author_id  uuid not null references users(id),
  body       text not null,
  created_at timestamptz not null default now()
);

create table task_templates (
  id       uuid primary key default gen_random_uuid(),
  name     text not null,            -- 'Meta Ads: Campaign Build'
  service  text not null,            -- meta_ads, google_ads, website, ghl, local_gbp
  body     jsonb not null            -- { description, checklist[], subtasks[], defaults{} }
);

create index on tasks (status, position);
create index on tasks (client_id) where archived_at is null;
create index on tasks (due_date) where completed_at is null;
create index on task_assignees (user_id);
```

Why these choices:

- **`position numeric`** — dragging a card between two others sets its position
  to the average of theirs. No renumbering the column on every drop. Rebalance
  only if precision ever runs out, which for two people it won't.
- **`clickup_id` kept forever** — it's how the migration is verified, and how a
  ClickUp link pasted in Slack last month still resolves to the right task.
- **`board` as a column, not two status sets** — preserves the Agency OS /
  Client OS distinction without reintroducing two vocabularies.
- **`scope` and `services` as `text[]`** — closed label sets. Join tables would
  be correct and pointless.
- **`ai_executor` drops "Viktor"** — see the open decisions; add it back if it's
  still in use.

---

## 6. Views

### Board

Six columns, count in each header. Card shows, in this order of visual weight:
title · client chip · assignee avatars · priority dot · due date (red once past)
· service labels.

Drag to change status: optimistic move, then `PATCH /api/tasks/:id`, and revert
the card with a toast if the write fails. Drag within a column reorders via
`position`.

### List

The same rows as a table: Title · Client · Status · Assignees · Priority · Due ·
Updated. Sortable on due, priority, updated. This is the view for *"what's
overdue"* and *"what did we touch this week"* — the two questions a board is bad
at.

### Filter bar — one bar, shared by both views

Client · Assignee (Ben / David / Unassigned) · Status (multi) · Client health ·
Priority · Service · title search.

Default: open statuses only, no other filter on.

> **Ben — one ambiguity.** "Filter by client status" could mean the task's status
> or the client's **Health** field. Both are in the bar, because including both
> costs almost nothing and guessing wrong costs a round trip.

### Task detail

A drawer over the board, not its own page — the board stays visible behind it,
and closing it doesn't reload or lose scroll position. Contains: fields,
description, comments, subtasks, and a plain activity log (status changes,
assignment changes).

### Client card

One page per client, rendered from the `details` jsonb through the static schema
file, grouped as in §2: Identity · Commercial · Health · Services · Stack & IDs.
Below the fields, that client's open tasks — which is the whole point of the
relation.

---

## 7. What leaving ClickUp actually costs

Worth saying out loud now so none of it is a surprise in week three:

| Lost | Replacement |
| --- | --- |
| Docs | Google Drive, linked from the client card |
| Task templates | Rebuilt — Phase 4, in scope |
| Notifications | Slack webhook — Phase 5 |
| Time tracking | Dropped. Nothing here is billed hourly. |
| Recurring tasks | Templates plus a monthly cron, or by hand |
| Mobile app | The board is responsive; there is no native app |
| Guest / client access | Out of scope. Clients get email and Slack. |
| AI summarise / categorise fields | Dropped for now — cheap to add later against Claude |

---

## 8. Migration

One-shot importer, run twice.

1. **Export** every task, list, custom field value, comment and assignee from
   ClickUp's API to JSON on disk. Keep the raw dump in the repo — it is the only
   record once the subscription lapses.
2. **Map** through the status and field tables in §4 and §5. Anything that
   doesn't map gets written to `unmapped.json` and read by a human, never
   silently dropped.
3. **Verify** before trusting it: task count matches per list, every task that
   had a Client still has one, no task lost its assignees, and ten tasks checked
   field-by-field against the ClickUp UI by hand.
4. **Re-run at cutover** for anything created since step 1.
5. **Freeze** ClickUp — read-only for two weeks — then cancel.

**Do not cancel ClickUp before Phase 5 plus two weeks of running on the new
board.** The saving is real but small next to re-entering 53 tasks by hand.

---

## 9. Phases

Each phase has a done test, so "is it finished" isn't a matter of opinion.

### Phase 1 — Strip

Delete the SEO tooling, the AI-chat surfaces, and every dead route. Nav is Board,
Clients, and whatever else CI genuinely earns.

*Done when:* no route 500s, no unreferenced dependencies in `package.json`, nav
has four items or fewer, and a clean `npm ci && build` passes.

### Phase 2 — Schema and migration, read-only

Tables from §5. The importer from §8. The board renders real data and nothing is
editable yet.

*Done when:* counts match ClickUp exactly, the ten hand-checked tasks are
correct, and Ben can see today's real work on the board.

### Phase 3 — Make it work

Create, edit, drag, comment, assign. Filter bar. Board ↔ List toggle. URL state.

*Done when:* Ben runs a full day without opening ClickUp.

### Phase 4 — Client cards and templates

The client card page. The nine templates behind a "New from template" action.

*Done when:* creating a Meta Ads Campaign Build produces the same checklist it
produces in ClickUp today.

### Phase 5 — Cutover

Slack webhook on a deliberately small set of events: assigned to you, moved to
Client review, moved to Revisions, overdue. Re-run the importer. Freeze ClickUp.

*Done when:* two weeks pass with nobody opening ClickUp, then cancel it.

---

## 10. Where this meets the Command Center

There's an open ClickUp task — *"Research embedding Ben's Command Center
dashboard into CI"* (David + Lorenz, `new brief`) — so this is worth settling
now rather than discovering later.

They stay separate and split cleanly by subject:

- **Command Center** answers *how are the businesses doing* — revenue, members,
  churn, pulled from Glofox and GHL.
- **CI Board** answers *what are we working on* — tasks, clients, delivery.

One nav item each. If they ever share anything it's the client list, and the
right seam for that is a read-only endpoint on one side, not a shared database.
Don't merge them; the reason CI is being simplified is that it tried to be
several products at once.

---

## 11. Decisions for Ben

1. **The 19 orphaned tasks** — reassign to you or David, or archive? Needed
   before Phase 2.
2. **`AI Executor`** — does "Viktor" survive the downsizing, or is it Claude and
   Manual only?
3. **`Performance Tier` and `Service Specialization`** on Client OS look
   inherited from a ClickUp template and are unset on every task. Cut them?
4. **Personal List** — does your personal list move into CI, or stay wherever it
   is? It's 16 tasks and a different space, and mixing it into an agency board
   costs a filter on every view.
5. **Active Tasks** (4 stale backlog items about Grok and Codex CLI) — migrate or
   drop?
