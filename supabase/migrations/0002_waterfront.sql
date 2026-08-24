-- Waterfront support.
--
-- "On the water" is not an attribute any assessor publishes, so it is computed
-- from the parcel coordinate and a shoreline polygon by "gf geo" and stored here.

alter table properties add column if not exists distance_to_water_ft numeric;
alter table properties add column if not exists waterbody_name text;

create index if not exists idx_properties_water on properties (distance_to_water_ft);

-- Rebuild the view so the new columns and the coordinates come through.
create or replace view stacked_leads as
select
  p.id,
  p.dedupe_key,
  p.apn, p.fips,
  p.address_line, p.city, p.state, p.zip, p.county,
  p.property_type, p.beds, p.baths, p.sqft, p.year_built,
  p.latitude, p.longitude, p.distance_to_water_ft, p.waterbody_name,
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
