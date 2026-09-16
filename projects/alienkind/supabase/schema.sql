-- Alien Kind: the shared brain.
--
-- Everything that makes the dashboard "one AI" instead of one AI per browser
-- lives in these five tables. The page holds no state of its own beyond a
-- session token, so a thread opened on the desktop is the same thread on the
-- phone. Row level security scopes every row to its owner.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------- threads --
create table if not exists public.threads (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  title       text not null default 'New thread',
  archived    boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists threads_user_updated_idx
  on public.threads (user_id, updated_at desc);

-- --------------------------------------------------------------- messages --
create table if not exists public.messages (
  id          uuid primary key default gen_random_uuid(),
  thread_id   uuid not null references public.threads (id) on delete cascade,
  user_id     uuid not null references auth.users (id) on delete cascade,
  role        text not null check (role in ('user', 'assistant')),
  content     text not null,
  -- Where the message was typed. Purely informational, but it is the thing
  -- that proves the shared brain is working: one thread, several devices.
  device      text,
  -- Token accounting straight off response.usage, for the cost readout.
  usage       jsonb,
  created_at  timestamptz not null default now()
);

create index if not exists messages_thread_created_idx
  on public.messages (thread_id, created_at);

-- ----------------------------------------------------------------- memory --
-- Facts Alien Kind keeps across every thread and every device. This is the
-- difference between an assistant that knows the business and one that starts
-- from nothing every morning.
create table if not exists public.memory (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  label       text not null,
  body        text not null,
  pinned      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (user_id, label)
);

-- ----------------------------------------------------------- instructions --
-- The operating rules, one row per user. Edited from the dashboard, read by
-- the edge function on every call, so a rule changed on the phone is in force
-- on the next message sent from anywhere.
create table if not exists public.instructions (
  user_id     uuid primary key references auth.users (id) on delete cascade,
  body        text not null default '',
  updated_at  timestamptz not null default now()
);

-- ------------------------------------------------------------ connections --
-- What Alien Kind can reach: GHL, WordPress, n8n, ad accounts. Status is
-- written by whatever checks them, read by the dashboard.
create table if not exists public.connections (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users (id) on delete cascade,
  name            text not null,
  kind            text not null,
  status          text not null default 'unknown'
                    check (status in ('live', 'degraded', 'down', 'unknown')),
  detail          text,
  last_checked_at timestamptz,
  unique (user_id, name)
);

-- -------------------------------------------------------------------- RLS --
alter table public.threads      enable row level security;
alter table public.messages     enable row level security;
alter table public.memory       enable row level security;
alter table public.instructions enable row level security;
alter table public.connections  enable row level security;

do $$
declare t text;
begin
  foreach t in array array['threads', 'messages', 'memory', 'instructions', 'connections']
  loop
    execute format(
      'drop policy if exists %I on public.%I', t || '_owner', t);
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

drop trigger if exists threads_touch on public.threads;
create trigger threads_touch before update on public.threads
  for each row execute function public.touch_updated_at();

drop trigger if exists memory_touch on public.memory;
create trigger memory_touch before update on public.memory
  for each row execute function public.touch_updated_at();

-- A new message bumps its thread, so the thread list sorts by real activity.
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
