-- Alien Kind: the shared brain, split three ways.
--
-- Bob, Kevin and Stewart are three agents with separate jobs, separate threads
-- and separate memory. What they share is the house rules and anything filed as
-- shared memory, so "Ben works on Windows" is known by all three while
-- "Fighters Boxing schedule" belongs to Bob alone.
--
-- Everything that makes this one AI per agent rather than one per browser lives
-- in these tables. The page holds a session token and nothing else.

create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------- agents --
create table if not exists public.agents (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  slug        text not null,
  name        text not null,
  -- One line under the name in the switcher. What this one is for.
  role        text not null default '',
  -- This agent's own operating instructions, on top of the shared ones.
  brief       text not null default '',
  accent      text not null default '#C2521A',
  position    int  not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (user_id, slug)
);

create index if not exists agents_user_position_idx
  on public.agents (user_id, position);

-- ---------------------------------------------------------------- threads --
create table if not exists public.threads (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  agent_id    uuid not null references public.agents (id) on delete cascade,
  title       text not null default 'New thread',
  archived    boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Threads are always read one agent at a time, so the index leads with agent.
create index if not exists threads_agent_updated_idx
  on public.threads (agent_id, updated_at desc);

-- --------------------------------------------------------------- messages --
create table if not exists public.messages (
  id          uuid primary key default gen_random_uuid(),
  thread_id   uuid not null references public.threads (id) on delete cascade,
  user_id     uuid not null references auth.users (id) on delete cascade,
  role        text not null check (role in ('user', 'assistant')),
  content     text not null,
  -- Where the message was typed. Informational, but it is what proves the
  -- shared brain: one thread, several devices.
  device      text,
  usage       jsonb,
  created_at  timestamptz not null default now()
);

create index if not exists messages_thread_created_idx
  on public.messages (thread_id, created_at);

-- ----------------------------------------------------------------- memory --
-- agent_id null means every agent reads it. Set it, and only that agent does.
create table if not exists public.memory (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  agent_id    uuid references public.agents (id) on delete cascade,
  label       text not null,
  body        text not null,
  pinned      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- A label is unique per scope. Two indexes because null is not comparable in a
-- unique constraint, so the shared rows need their own.
create unique index if not exists memory_scoped_label_idx
  on public.memory (user_id, agent_id, label) where agent_id is not null;
create unique index if not exists memory_shared_label_idx
  on public.memory (user_id, label) where agent_id is null;

-- ----------------------------------------------------------- instructions --
-- The shared rules, one row per user. Every agent reads these; each agent's own
-- brief sits on its agents row and stacks on top.
create table if not exists public.instructions (
  user_id     uuid primary key references auth.users (id) on delete cascade,
  body        text not null default '',
  updated_at  timestamptz not null default now()
);

-- ------------------------------------------------------------ connections --
create table if not exists public.connections (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users (id) on delete cascade,
  agent_id        uuid references public.agents (id) on delete cascade,
  name            text not null,
  kind            text not null,
  status          text not null default 'unknown'
                    check (status in ('live', 'degraded', 'down', 'unknown')),
  detail          text,
  last_checked_at timestamptz
);

-- -------------------------------------------------------------------- RLS --
alter table public.agents       enable row level security;
alter table public.threads      enable row level security;
alter table public.messages     enable row level security;
alter table public.memory       enable row level security;
alter table public.instructions enable row level security;
alter table public.connections  enable row level security;

do $$
declare t text;
begin
  foreach t in array array['agents', 'threads', 'messages', 'memory',
                           'instructions', 'connections']
  loop
    execute format('drop policy if exists %I on public.%I', t || '_owner', t);
    execute format(
      'create policy %I on public.%I for all
         using (user_id = (select auth.uid()))
         with check (user_id = (select auth.uid()))',
      t || '_owner', t);
  end loop;
end $$;

-- --------------------------------------------------------------- triggers --
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists agents_touch on public.agents;
create trigger agents_touch before update on public.agents
  for each row execute function public.touch_updated_at();

drop trigger if exists threads_touch on public.threads;
create trigger threads_touch before update on public.threads
  for each row execute function public.touch_updated_at();

drop trigger if exists memory_touch on public.memory;
create trigger memory_touch before update on public.memory
  for each row execute function public.touch_updated_at();

-- A new message bumps its thread, so each agent's list sorts by real activity.
create or replace function public.bump_thread()
returns trigger
language plpgsql
as $$
begin
  update public.threads set updated_at = now() where id = new.thread_id;
  return new;
end $$;

drop trigger if exists messages_bump_thread on public.messages;
create trigger messages_bump_thread after insert on public.messages
  for each row execute function public.bump_thread();
