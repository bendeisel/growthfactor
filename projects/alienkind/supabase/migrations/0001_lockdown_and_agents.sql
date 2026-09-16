-- Alien Kind: lock the tables down, then add the three agents.
--
-- NOT APPLIED. Read it, then say go.
--
-- Project: bzenkskiplgfqxfycdwv ("Alien Kind AI")
-- Existing tables this touches: conversations, learning_ledger,
-- consciousness_entries, terminal_state. Nothing is dropped and no row is
-- deleted. The only destructive-looking statements are REVOKEs.

begin;

-- ===========================================================================
-- 1. The security fix. Do this part whether or not you want the rest.
-- ===========================================================================
--
-- Every table currently has RLS "enabled" with a policy of USING (true) for
-- role public, and the anon role holds SELECT, INSERT, UPDATE, DELETE and
-- TRUNCATE on all four. Enabled RLS with an always-true policy is not a guard,
-- it is a switch that is on and doing nothing.
--
-- The anon key is designed to be public. It ships in any browser client. So
-- the moment the dashboard goes up, anyone who opens devtools can read every
-- conversation, rewrite the learning ledger, or TRUNCATE the lot.
--
-- Nothing reads these tables from a browser today, so this is a door left
-- open rather than a break-in. It has to be shut before the dashboard ships.

revoke all on public.conversations        from anon, authenticated;
revoke all on public.learning_ledger      from anon, authenticated;
revoke all on public.consciousness_entries from anon, authenticated;
revoke all on public.terminal_state       from anon, authenticated;

-- Future tables in this schema should not inherit the same problem.
alter default privileges in schema public revoke all on tables from anon;

-- Replace the always-true policies with service-role-only ones. Wingman keeps
-- working untouched: it writes with the service role, which bypasses RLS
-- anyway, and its grants are not revoked above.
drop policy if exists "Allow all for authenticated" on public.conversations;
drop policy if exists "Allow all for authenticated" on public.learning_ledger;
drop policy if exists "Allow all for authenticated" on public.consciousness_entries;
drop policy if exists "Service role full access"    on public.terminal_state;

create policy service_only on public.conversations
  for all to service_role using (true) with check (true);
create policy service_only on public.learning_ledger
  for all to service_role using (true) with check (true);
create policy service_only on public.consciousness_entries
  for all to service_role using (true) with check (true);
create policy service_only on public.terminal_state
  for all to service_role using (true) with check (true);

-- The dashboard now reaches these tables only through the edge functions,
-- which hold the service role key server side and check the caller's session
-- before every query. The browser never talks to Postgres directly.

-- ===========================================================================
-- 2. The three agents
-- ===========================================================================
create table if not exists public.agents (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  name        text not null,
  role        text not null default '',
  brief       text not null default '',
  accent      text not null default '#C2521A',
  position    int  not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.agents enable row level security;
revoke all on public.agents from anon, authenticated;
drop policy if exists service_only on public.agents;
create policy service_only on public.agents
  for all to service_role using (true) with check (true);

insert into public.agents (slug, name, role, brief, accent, position) values
  ('bob', 'Bob',
   'The gyms: Nashville MMA Training Camp and Fighters Boxing Gym',
   'You own the two gyms and nothing else. Their sites, content, classes, members and local search. Agency operations and anything personal belong to Kevin or Stewart.',
   '#2F8A5B', 0),
  ('kevin', 'Kevin',
   'Growth Factor agency work',
   'You own the agency. Client work, proposals, pricing, builds, SEO, ads, GHL automation, the pipeline, the process. The two gyms are Bob''s. Anything personal is Stewart''s.',
   '#C2521A', 1),
  ('stewart', 'Stewart',
   'Personal and side hustles',
   'You own everything outside the agency. Personal projects, side hustles, money, admin. Agency work is Kevin''s. The gyms are Bob''s.',
   '#5B58C4', 2)
on conflict (slug) do nothing;

-- ===========================================================================
-- 3. Hang conversations off an agent
-- ===========================================================================
-- Nullable on purpose. Existing rows keep their null, and Wingman keeps
-- inserting without knowing agents exist. A null agent_id reads as "the
-- terminal, before agents", which is exactly what those rows are.
alter table public.conversations
  add column if not exists agent_id uuid references public.agents (id) on delete set null;

-- The dashboard reads one agent's most recent sessions, so the index leads
-- with agent and orders by time.
create index if not exists conversations_agent_created_idx
  on public.conversations (agent_id, created_at desc);

-- And the thread list groups by session, across every channel.
create index if not exists conversations_session_created_idx
  on public.conversations (session_id, created_at);

-- Backfill: everything already in there came from the terminal, which is
-- Kevin's surface. Left commented out because it is a judgement call, not a
-- mechanical one. Two rows.
--
-- update public.conversations
--    set agent_id = (select id from public.agents where slug = 'kevin')
--  where agent_id is null;

commit;
