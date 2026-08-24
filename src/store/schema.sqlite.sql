-- Local SQLite schema. Mirrors the Postgres migration in supabase/migrations so a
-- query written against one works against the other.

create table if not exists properties (
  id                   text primary key,
  dedupe_key           text not null unique,
  dedupe_basis         text,

  fips                 text,
  apn                  text,
  address_line         text,
  city                 text,
  state                text,
  zip                  text,
  county               text,
  latitude             real,
  longitude            real,

  property_type        text,
  beds                 integer,
  baths                real,
  sqft                 integer,
  lot_sqft             integer,
  year_built           integer,

  estimated_value      real,
  assessed_value       real,
  estimated_equity     real,
  equity_percent       real,
  equity_basis         text,
  open_mortgage_bal    real,
  last_sale_date       text,
  last_sale_amount     real,

  owner_name           text,
  owner_type           text,
  estate_indicator     integer,
  trust_indicator      integer,
  owner_mailing_address text,
  owner_mailing_city   text,
  owner_mailing_state  text,
  owner_mailing_zip    text,
  owner_occupied       integer,
  absentee_owner       integer,
  out_of_state_owner   integer,
  years_owned          real,
  likely_free_and_clear integer,

  -- Waterfront, computed by "gf geo" from the parcel coordinate and a shoreline.
  distance_to_water_ft real,
  waterbody_name       text,

  raw                  text,
  source               text not null,
  sources              text,
  first_seen_at        text not null,
  last_seen_at         text not null
);

create index if not exists idx_properties_county on properties (county, state);
create index if not exists idx_properties_zip on properties (zip);
create index if not exists idx_properties_equity on properties (equity_percent);
create index if not exists idx_properties_apn on properties (fips, apn);
create index if not exists idx_properties_water on properties (distance_to_water_ft);

-- Every identifier a property can be recognised by. A parcel layer supplies an
-- APN, a code enforcement feed supplies only an address. Both point here, which
-- is what lets distress signals from different sources land on one row.
create table if not exists property_keys (
  key         text primary key,
  property_id text not null references properties(id) on delete cascade
);

create index if not exists idx_property_keys_property on property_keys (property_id);

create table if not exists distress_events (
  id             text primary key,
  property_id    text not null references properties(id) on delete cascade,
  event_type     text not null,

  first_seen_at  text not null,
  last_seen_at   text not null,
  cleared_at     text,

  filing_date    text,
  auction_date   text,
  lender         text,
  unpaid_balance real,
  document_type  text,

  case_number    text,
  decedent_name  text,
  date_of_death  text,
  attorney_name  text,

  source         text not null,
  raw            text,
  unique (property_id, event_type, first_seen_at)
);

create index if not exists idx_events_property on distress_events (property_id);
create index if not exists idx_events_type on distress_events (event_type, last_seen_at);

-- Skip trace cache. Expensive, populated on demand only, never during ingest.
create table if not exists owners (
  id                    text primary key,
  property_id           text not null references properties(id) on delete cascade,
  full_name             text,
  first_name            text,
  last_name             text,
  mailing_address       text,
  mailing_city          text,
  mailing_state         text,
  mailing_zip           text,
  phones                text,
  emails                text,
  skip_traced_at        text,
  skip_trace_cost_cents integer,
  source                text,
  raw                   text
);

create index if not exists idx_owners_property on owners (property_id);

create table if not exists lead_scores (
  property_id         text primary key references properties(id) on delete cascade,
  distress_score      integer,
  seller_finance_score integer,
  overall_score       integer,
  grade               text,
  strategy            text,
  reasons             text,
  scored_at           text not null
);

create index if not exists idx_scores_overall on lead_scores (overall_score desc);

create table if not exists offer_pipeline (
  id                 text primary key,
  property_id        text not null unique references properties(id) on delete cascade,
  stage              text not null default 'new',

  arv_estimate       real,
  repair_estimate    real,
  max_offer          real,
  offer_amount       real,
  offer_notes        text,
  terms              text,

  approved_by        text,
  approved_at        text,
  offer_sent_at      text,

  ghl_contact_id     text,
  ghl_opportunity_id text,

  created_at         text not null,
  updated_at         text not null
);

create index if not exists idx_pipeline_stage on offer_pipeline (stage);

create table if not exists ingest_runs (
  id                   text primary key,
  job_name             text not null,
  county               text,
  state                text,
  started_at           text not null,
  finished_at          text,
  status               text,
  records_pulled       integer,
  records_new          integer,
  records_updated      integer,
  events_created       integer,
  api_calls            integer,
  estimated_cost_cents integer,
  error                text
);

create index if not exists idx_runs_job on ingest_runs (job_name, started_at desc);

drop view if exists stacked_leads;
create view stacked_leads as
select
  p.id, p.address_line, p.city, p.state, p.zip, p.county,
  p.estimated_value, p.estimated_equity, p.equity_percent, p.equity_basis,
  p.likely_free_and_clear, p.absentee_owner, p.out_of_state_owner,
  p.owner_name, p.owner_type, p.years_owned,
  p.latitude, p.longitude, p.distance_to_water_ft, p.waterbody_name,
  p.beds, p.baths, p.sqft, p.year_built,
  (select count(distinct e.event_type) from distress_events e
     where e.property_id = p.id and e.cleared_at is null) as distress_count,
  (select group_concat(distinct e.event_type) from distress_events e
     where e.property_id = p.id and e.cleared_at is null) as distress_types,
  (select max(e.last_seen_at) from distress_events e where e.property_id = p.id) as most_recent_signal,
  (select min(e.first_seen_at) from distress_events e where e.property_id = p.id) as first_signal,
  (select count(*) from owners o where o.property_id = p.id) > 0 as has_contact_info,
  s.distress_score, s.seller_finance_score, s.overall_score, s.grade, s.strategy, s.reasons,
  op.stage as pipeline_stage
from properties p
left join lead_scores s on s.property_id = p.id
left join offer_pipeline op on op.property_id = p.id;
