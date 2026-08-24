// One place that decides how canonical objects become database columns, shared by
// the SQLite and Supabase stores so the two can never drift apart.

import type { DerivedSignals, DistressEventInput, PropertyInput } from '../core/types.ts';

/**
 * Derived values move as coherent groups.
 *
 * A code enforcement record carries no owner name and no sale history. Its
 * "unknown" owner type and "unknown" equity basis must not overwrite what the
 * assessor roll already established, so those groups are emitted as null and the
 * stores coalesce them away.
 */
export function propertyToRow(p: PropertyInput, d: DerivedSignals): Record<string, unknown> {
  const hasEquity = d.equityBasis !== 'unknown';
  const hasOwner = d.ownerType !== 'unknown';

  return {
    dedupe_key: d.dedupeKey,
    dedupe_basis: d.dedupeBasis,
    fips: p.fips,
    apn: p.apn,
    address_line: p.addressLine,
    city: p.city,
    state: p.state,
    zip: p.zip,
    county: p.county,
    latitude: p.latitude,
    longitude: p.longitude,
    property_type: p.propertyType,
    beds: p.beds,
    baths: p.baths,
    sqft: p.sqft,
    lot_sqft: p.lotSqft,
    year_built: p.yearBuilt,
    estimated_value: p.estimatedValue,
    assessed_value: p.assessedValue,
    estimated_equity: hasEquity ? d.estimatedEquity : null,
    equity_percent: hasEquity ? d.equityPercent : null,
    equity_basis: hasEquity ? d.equityBasis : null,
    open_mortgage_bal: p.openMortgageBal,
    last_sale_date: p.lastSaleDate,
    last_sale_amount: p.lastSaleAmount,
    owner_name: p.ownerName,
    owner_type: hasOwner ? d.ownerType : null,
    // Only ever asserted, never cleared, by an ingest.
    estate_indicator: d.estateIndicator ? true : null,
    trust_indicator: d.trustIndicator ? true : null,
    owner_mailing_address: p.ownerMailingAddress,
    owner_mailing_city: p.ownerMailingCity,
    owner_mailing_state: p.ownerMailingState,
    owner_mailing_zip: p.ownerMailingZip,
    owner_occupied: d.ownerOccupied,
    absentee_owner: d.absenteeOwner,
    out_of_state_owner: d.outOfStateOwner,
    years_owned: d.yearsOwned,
    likely_free_and_clear: hasEquity ? d.likelyFreeAndClear : null,
    raw: p.raw,
    source: p.source,
  };
}

export function eventToRow(ev: DistressEventInput): Record<string, unknown> {
  return {
    event_type: ev.eventType,
    filing_date: ev.filingDate,
    auction_date: ev.auctionDate,
    lender: ev.lender,
    unpaid_balance: ev.unpaidBalance,
    document_type: ev.documentType,
    case_number: ev.caseNumber,
    decedent_name: ev.decedentName,
    date_of_death: ev.dateOfDeath,
    attorney_name: ev.attorneyName,
    source: ev.source,
    raw: ev.raw,
  };
}
