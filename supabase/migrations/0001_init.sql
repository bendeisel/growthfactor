-- Distressed property pipeline, initial schema.
--
-- Follows the build spec, with three deliberate changes documented in
-- docs/DEVIATIONS.md:
--   1. properties.dedupe_key, because most free public sources publish no APN
--   2. extra distress_type values for signals available from free county data
--   3. lead_scores, so scoring is stored rather than recomputed in every query

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- ---------------------------------------------------------------
-- properties: one row per parcel, current state
-- ---------------------------------------------------------------
create table if not exists properties (
  id                uuid primary key default gen_random_uuid(),

  -- Stable identity. fips + apn when both exist, otherwise a normalized address.
  dedupe_key        text not null unique,
  dedupe_basis      text,
  fips              text,
  apn               text,

  address_line      text,
  city              text,
  state             text,
  zip               text,
  county            text,
  latitude          numeric,
  longitude         numeric,

  property_type     text,
  beds              int,
  baths             numeric,
  sqft              int,
  lot_sqft          int,
  year_built        int,

  estimated_value   numeric,
  assessed_value    numeric,
  estimated_equity  numeric,
  equity_percent    numeric,
  equity_basis      text,
  open_mortgage_bal numeric,
  last_sale_date    date,
  last_sale_amount  numeric,

  owner_name        text,
  owner_type        text,
  estate_indicator  boolean,
  trust_indicator   boolean,
  owner_mailing_address text,
  owner_mailing_city    text,
  owner_mailing_state   text,
  owner_mailing_zip     text,
  owner_occupied    boolean,
  absentee_owner    boolean,
  out_of_state_owner boolean,
  years_owned       numeric,
  likely_free_and_clear boolean,

  raw               jsonb,
  source            text not null,
  sources           text,
  first_seen_at     timestamptz not null default now(),
  last_seen_at      timestamptz not null default now(),

  unique (fips, apn)
);

create index if not exists idx_properties_county on properties (county, state);
create index if not exists idx_properties_zip on properties (zip);
create index if not exists idx_properties_equity on properties (equity_percent);

-- Every identifier a property can be recognised by. A parcel layer supplies an
-- APN, a code enforcement feed supplies only an address. Both point here, which
-- is what lets distress signals from different sources land on one row.
create table if not exists property_keys (
  key         text primary key,
  property_id uuid not null references properties(id) on delete cascade
);

create index if not exists idx_property_keys_property on property_keys (property_id);

-- ---------------------------------------------------------------
-- distress_events: append only, never updated in place
-- ---------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'distress_type') then
    create type distress_type as enum (
      'pre_foreclosure', 'foreclosure', 'reo', 'auction', 'tax_delinquent',
      'probate', 'pre_probate', 'vacant', 'lien',
      -- Added: all three are published free by many city open data portals.
      'code_violation', 'eviction', 'demolition'
    );
  end if;
end $$;

create table if not exists distress_events (
  id              uuid primary key default gen_random_uuid(),
  property_id     uuid not null references properties(id) on delete cascade,
  event_type      distress_type not null,

  first_seen_at   timestamptz not null default now(),
  last_seen_at    timestamptz not null default now(),
  cleared_at      timestamptz,

  filing_date     date,
  auction_date    date,
  lender          text,
  unpaid_balance  numeric,
  document_type   text,

  case_number     text,
  decedent_name   text,
  date_of_death   date,
  attorney_name   text,

  source          text not null,
  raw             jsonb,

  unique (property_id, event_type, first_seen_at)
);

create index if not exists idx_events_property on distress_events (property_id);
create index if not exists idx_events_type on distress_events (event_type, last_seen_at);

-- ---------------------------------------------------------------
-- owners: skip trace cache. Expensive. Populated on demand only.
-- ---------------------------------------------------------------
create table if not exists owners (
  id               uuid primary key default gen_random_uuid(),
  property_id      uuid not null references properties(id) on delete cascade,
  full_name        text,
  first_name       text,
  last_name        text,
  mailing_address  text,
  mailing_city     text,
  mailing_state    text,
  mailing_zip      text,
  phones           jsonb,
  emails           jsonb,
  skip_traced_at   timestamptz,
  skip_trace_cost_cents int,
  source           text,
  raw              jsonb
);

create index if not exists idx_owners_property on owners (property_id);

-- ---------------------------------------------------------------
-- lead_scores: computed locally, stored so queries stay cheap
-- ---------------------------------------------------------------
create table if not exists lead_scores (
  property_id          uuid primary key references properties(id) on delete cascade,
  distress_score       int,
  seller_finance_score int,
  overall_score        int,
  grade                text,
  strategy             text,
  reasons              jsonb,
  scored_at            timestamptz not null default now()
);

create index if not exists idx_scores_overall on lead_scores (overall_score desc);

-- ---------------------------------------------------------------
-- offer_pipeline: the working set, gated on human approval
-- ---------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'pipeline_stage') then
    create type pipeline_stage as enum (
      'new', 'reviewing', 'comping', 'offer_drafted', 'awaiting_approval',
      'offer_sent', 'negotiating', 'under_contract', 'dead'
    );
  end if;
end $$;

create table if not exists offer_pipeline (
  id                uuid primary key default gen_random_uuid(),
  property_id       uuid not null references properties(id) on delete cascade,
  stage             pipeline_stage not null default 'new',

  arv_estimate      numeric,
  repair_estimate   numeric,
  max_offer         numeric,
  offer_amount      numeric,
  offer_notes       text,
  terms             jsonb,

  approved_by       text,
  approved_at       timestamptz,
  offer_sent_at     timestamptz,

  ghl_contact_id    text,
  ghl_opportunity_id text,

  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),

  unique (property_id)
);

create index if not exists idx_pipeline_stage on offer_pipeline (stage);

-- An offer can only reach offer_sent when a human has approved it first.
create or replace function enforce_approval_gate() returns trigger as $$
begin
  if new.stage = 'offer_sent' and new.approved_at is null then
    raise exception 'offer_sent requires approved_at to be set first';
  end if;
  new.updated_at := now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_approval_gate on offer_pipeline;
create trigger trg_approval_gate before insert or update on offer_pipeline
  for each row execute function enforce_approval_gate();

-- ---------------------------------------------------------------
-- ingest_runs: cost and health audit
-- ---------------------------------------------------------------
create table if not exists ingest_runs (
  id              uuid primary key default gen_random_uuid(),
  job_name        text not null,
  county          text,
  state           text,
  started_at      timestamptz not null default now(),
  finished_at     timestamptz,
  status          text,
  records_pulled  int,
  records_new     int,
  records_updated int,
  events_created  int,
  api_calls       int,
  estimated_cost_cents int,
  error           text
);

create index if not exists idx_runs_job on ingest_runs (job_name, started_at desc);

-- ---------------------------------------------------------------
-- ingest_targets: the source configs a scheduled run should pull.
-- Push these up from config/sources with "gf targets:push".
-- ---------------------------------------------------------------
create table if not exists ingest_targets (
  name        text primary key,
  config      jsonb not null,
  enabled     boolean not null default true,
  notes       text,
  updated_at  timestamptz not null default now()
);

alter table ingest_targets enable row level security;

-- ---------------------------------------------------------------
-- stacked_leads: the view to query, conversationally or otherwise
-- ---------------------------------------------------------------
create or replace view stacked_leads as
select
  p.id,
  p.dedupe_key,
  p.apn, p.fips,
  p.address_line, p.city, p.state, p.zip, p.county,
  p.property_type, p.beds, p.baths, p.sqft, p.year_built,
  p.estimated_value, p.estimated_equity, p.equity_percent, p.equity_basis,
  p.likely_free_and_clear, p.absentee_owner, p.out_of_state_owner,
  p.owner_name, p.owner_type, p.owner_mailing_address, p.owner_mailing_city,
  p.owner_mailing_state, p.owner_mailing_zip,
  p.years_owned, p.last_sale_date, p.last_sale_amount, p.sources,
  count(distinct e.event_type) filter (where e.cleared_at is null) as distress_count,
  array_agg(distinct e.event_type::text) filter (where e.cleared_at is null) as distress_types,
  max(e.last_seen_at) as most_recent_signal,
  min(e.first_seen_at) as first_signal,
  (owners.id is not null) as has_contact_info,
  s.distress_score, s.seller_finance_score, s.overall_score, s.grade, s.strategy, s.reasons,
  op.stage as pipeline_stage
from properties p
left join distress_events e on e.property_id = p.id
left join lateral (
  select id from owners where owners.property_id = p.id limit 1
) owners on true
left join lead_scores s on s.property_id = p.id
left join offer_pipeline op on op.property_id = p.id
group by p.id, owners.id, s.distress_score, s.seller_finance_score, s.overall_score,
         s.grade, s.strategy, s.reasons, op.stage;

-- ---------------------------------------------------------------
-- RPCs. These keep merge semantics identical to the local SQLite store.
-- ---------------------------------------------------------------

-- Upsert a parcel without letting a sparse record erase richer data.
-- coalesce(incoming, existing) on every column means a code enforcement row that
-- carries only an address never wipes the owner name from the assessor roll.
create or replace function upsert_property(p jsonb, keys text[] default null)
returns table (id uuid, is_new boolean)
language plpgsql
as $$
declare
  existing_id uuid;
  key_list text[] := coalesce(keys, array[p->>'dedupe_key']);
  k text;
begin
  -- Resolve by any known identifier, honouring the order they were supplied in.
  foreach k in array key_list loop
    select pk.property_id into existing_id from property_keys pk where pk.key = k;
    exit when existing_id is not null;
  end loop;

  if existing_id is null then
    select pr.id into existing_id from properties pr where pr.dedupe_key = p->>'dedupe_key';
  end if;

  if existing_id is null then
    insert into properties (
      dedupe_key, dedupe_basis, fips, apn, address_line, city, state, zip, county,
      latitude, longitude, property_type, beds, baths, sqft, lot_sqft, year_built,
      estimated_value, assessed_value, estimated_equity, equity_percent, equity_basis,
      open_mortgage_bal, last_sale_date, last_sale_amount, owner_name, owner_type,
      estate_indicator, trust_indicator, owner_mailing_address, owner_mailing_city,
      owner_mailing_state, owner_mailing_zip, owner_occupied, absentee_owner,
      out_of_state_owner, years_owned, likely_free_and_clear, raw, source, sources
    ) values (
      p->>'dedupe_key', p->>'dedupe_basis', p->>'fips', p->>'apn', p->>'address_line',
      p->>'city', p->>'state', p->>'zip', p->>'county',
      (p->>'latitude')::numeric, (p->>'longitude')::numeric, p->>'property_type',
      (p->>'beds')::int, (p->>'baths')::numeric, (p->>'sqft')::int,
      (p->>'lot_sqft')::int, (p->>'year_built')::int,
      (p->>'estimated_value')::numeric, (p->>'assessed_value')::numeric,
      (p->>'estimated_equity')::numeric, (p->>'equity_percent')::numeric,
      p->>'equity_basis', (p->>'open_mortgage_bal')::numeric,
      (p->>'last_sale_date')::date, (p->>'last_sale_amount')::numeric,
      p->>'owner_name', p->>'owner_type',
      (p->>'estate_indicator')::boolean, (p->>'trust_indicator')::boolean,
      p->>'owner_mailing_address', p->>'owner_mailing_city',
      p->>'owner_mailing_state', p->>'owner_mailing_zip',
      (p->>'owner_occupied')::boolean, (p->>'absentee_owner')::boolean,
      (p->>'out_of_state_owner')::boolean, (p->>'years_owned')::numeric,
      (p->>'likely_free_and_clear')::boolean, p->'raw', p->>'source', p->>'source'
    ) returning properties.id into existing_id;
    -- First writer wins, so an ambiguous address never steals another parcel.
    insert into property_keys (key, property_id)
      select unnest(key_list), existing_id
      on conflict (key) do nothing;
    return query select existing_id, true;
  else
    update properties pr set
      dedupe_basis = coalesce(p->>'dedupe_basis', pr.dedupe_basis),
      fips = coalesce(p->>'fips', pr.fips),
      apn = coalesce(p->>'apn', pr.apn),
      address_line = coalesce(p->>'address_line', pr.address_line),
      city = coalesce(p->>'city', pr.city),
      state = coalesce(p->>'state', pr.state),
      zip = coalesce(p->>'zip', pr.zip),
      county = coalesce(p->>'county', pr.county),
      latitude = coalesce((p->>'latitude')::numeric, pr.latitude),
      longitude = coalesce((p->>'longitude')::numeric, pr.longitude),
      property_type = coalesce(p->>'property_type', pr.property_type),
      beds = coalesce((p->>'beds')::int, pr.beds),
      baths = coalesce((p->>'baths')::numeric, pr.baths),
      sqft = coalesce((p->>'sqft')::int, pr.sqft),
      lot_sqft = coalesce((p->>'lot_sqft')::int, pr.lot_sqft),
      year_built = coalesce((p->>'year_built')::int, pr.year_built),
      estimated_value = coalesce((p->>'estimated_value')::numeric, pr.estimated_value),
      assessed_value = coalesce((p->>'assessed_value')::numeric, pr.assessed_value),
      estimated_equity = coalesce((p->>'estimated_equity')::numeric, pr.estimated_equity),
      equity_percent = coalesce((p->>'equity_percent')::numeric, pr.equity_percent),
      equity_basis = coalesce(p->>'equity_basis', pr.equity_basis),
      open_mortgage_bal = coalesce((p->>'open_mortgage_bal')::numeric, pr.open_mortgage_bal),
      last_sale_date = coalesce((p->>'last_sale_date')::date, pr.last_sale_date),
      last_sale_amount = coalesce((p->>'last_sale_amount')::numeric, pr.last_sale_amount),
      owner_name = coalesce(p->>'owner_name', pr.owner_name),
      owner_type = coalesce(p->>'owner_type', pr.owner_type),
      estate_indicator = coalesce((p->>'estate_indicator')::boolean, pr.estate_indicator),
      trust_indicator = coalesce((p->>'trust_indicator')::boolean, pr.trust_indicator),
      owner_mailing_address = coalesce(p->>'owner_mailing_address', pr.owner_mailing_address),
      owner_mailing_city = coalesce(p->>'owner_mailing_city', pr.owner_mailing_city),
      owner_mailing_state = coalesce(p->>'owner_mailing_state', pr.owner_mailing_state),
      owner_mailing_zip = coalesce(p->>'owner_mailing_zip', pr.owner_mailing_zip),
      owner_occupied = coalesce((p->>'owner_occupied')::boolean, pr.owner_occupied),
      absentee_owner = coalesce((p->>'absentee_owner')::boolean, pr.absentee_owner),
      out_of_state_owner = coalesce((p->>'out_of_state_owner')::boolean, pr.out_of_state_owner),
      years_owned = coalesce((p->>'years_owned')::numeric, pr.years_owned),
      likely_free_and_clear = coalesce((p->>'likely_free_and_clear')::boolean, pr.likely_free_and_clear),
      raw = coalesce(p->'raw', pr.raw),
      sources = case
        when pr.sources is null then p->>'source'
        when position(p->>'source' in pr.sources) > 0 then pr.sources
        else pr.sources || ',' || (p->>'source')
      end,
      last_seen_at = now()
    where pr.id = existing_id;
    insert into property_keys (key, property_id)
      select unnest(key_list), existing_id
      on conflict (key) do nothing;
    return query select existing_id, false;
  end if;
end;
$$;

-- Append-only event recording. Bumps an open event of the same type, otherwise
-- inserts a new one, so a property that redefaults keeps both histories.
create or replace function record_distress_event(pid uuid, e jsonb)
returns table (event_id uuid, created boolean)
language plpgsql
as $$
declare
  open_id uuid;
begin
  select de.id into open_id
    from distress_events de
   where de.property_id = pid
     and de.event_type = (e->>'event_type')::distress_type
     and de.cleared_at is null
   order by de.first_seen_at desc
   limit 1;

  if open_id is not null then
    update distress_events de set
      last_seen_at = now(),
      filing_date = coalesce(de.filing_date, (e->>'filing_date')::date),
      auction_date = coalesce((e->>'auction_date')::date, de.auction_date),
      lender = coalesce(de.lender, e->>'lender'),
      unpaid_balance = coalesce((e->>'unpaid_balance')::numeric, de.unpaid_balance),
      document_type = coalesce(de.document_type, e->>'document_type'),
      case_number = coalesce(de.case_number, e->>'case_number'),
      decedent_name = coalesce(de.decedent_name, e->>'decedent_name'),
      date_of_death = coalesce(de.date_of_death, (e->>'date_of_death')::date),
      attorney_name = coalesce(de.attorney_name, e->>'attorney_name')
    where de.id = open_id;
    return query select open_id, false;
  end if;

  insert into distress_events (
    property_id, event_type, filing_date, auction_date, lender, unpaid_balance,
    document_type, case_number, decedent_name, date_of_death, attorney_name, source, raw
  ) values (
    pid, (e->>'event_type')::distress_type, (e->>'filing_date')::date,
    (e->>'auction_date')::date, e->>'lender', (e->>'unpaid_balance')::numeric,
    e->>'document_type', e->>'case_number', e->>'decedent_name',
    (e->>'date_of_death')::date, e->>'attorney_name', e->>'source', e->'raw'
  ) returning distress_events.id into open_id;
  return query select open_id, true;
end;
$$;

-- ---------------------------------------------------------------
-- Row level security. Single operator system: edge functions use the service
-- role key, which bypasses RLS. Nothing client side ever connects, so no anon
-- policy is granted.
-- ---------------------------------------------------------------
alter table properties       enable row level security;
alter table property_keys    enable row level security;
alter table distress_events  enable row level security;
alter table owners           enable row level security;
alter table lead_scores      enable row level security;
alter table offer_pipeline   enable row level security;
alter table ingest_runs      enable row level security;
