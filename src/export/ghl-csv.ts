// GHL CSV export.
//
// This is the zero setup path into GHL: run the pull, export the CSV, drag it into
// Contacts > Import. No API key, no custom field ids, no private integration.
//
// The contact address is the owner MAILING address, not the property address, so
// mail actually reaches an absentee owner. The property address rides along as a
// custom field.

import { toCsv } from '../core/csv.ts';
import { splitOwnerName } from '../core/normalize.ts';
import { computeOffer, DEFAULT_OFFER_CONFIG, type OfferConfig } from '../core/offer.ts';
import type { LeadRecord } from '../store/index.ts';

export const GHL_CSV_COLUMNS = [
  'first_name', 'last_name', 'company_name', 'phone', 'email',
  'address1', 'city', 'state', 'postal_code', 'tags',
  'property_address', 'property_city', 'property_state', 'property_zip',
  'county', 'apn', 'property_type', 'beds', 'baths', 'sqft', 'year_built',
  'distance_to_water_ft', 'waterbody', 'latitude', 'longitude',
  'estimated_value', 'estimated_equity', 'equity_percent', 'equity_basis',
  'likely_free_and_clear', 'years_owned', 'last_sale_date', 'last_sale_amount',
  'owner_type', 'absentee_owner', 'out_of_state_owner',
  'distress_types', 'distress_count', 'most_recent_signal',
  'strategy', 'grade', 'overall_score', 'seller_finance_score', 'distress_score',
  'arv_estimate', 'repair_estimate', 'max_cash_offer',
  'sf_price', 'sf_down_payment', 'sf_monthly_payment', 'sf_balloon_years', 'sf_balloon_balance',
  'lead_reasons', 'data_sources', 'lead_id',
];

function yn(v: boolean | undefined): string {
  return v === undefined ? '' : v ? 'yes' : 'no';
}

/**
 * Where a letter actually goes.
 *
 * All or nothing on purpose. Mixing a mailing street with a property zip would
 * produce "PO Box 20, Tampa, FL 37201", which is a Nashville zip on a Florida
 * box, and the mail would not arrive. If the mailing address exists it is used
 * whole, with blanks where the county published nothing. Only when there is no
 * mailing address at all does the property address stand in.
 */
export function contactAddress(l: LeadRecord): {
  address1: string; city: string; state: string; postalCode: string; usedMailing: boolean;
} {
  if (l.ownerMailingAddress) {
    return {
      address1: l.ownerMailingAddress,
      city: l.ownerMailingCity ?? '',
      state: l.ownerMailingState ?? '',
      postalCode: l.ownerMailingZip ?? '',
      usedMailing: true,
    };
  }
  return {
    address1: l.addressLine ?? '',
    city: l.city ?? '',
    state: l.state ?? '',
    postalCode: l.zip ?? '',
    usedMailing: false,
  };
}

/** Tags GHL can segment on without any extra setup. */
export function tagsFor(l: LeadRecord): string[] {
  const tags = ['gf-lead'];
  if (l.strategy) tags.push(`gf-${l.strategy.replace(/_/g, '-')}`);
  if (l.grade) tags.push(`gf-grade-${l.grade.toLowerCase()}`);
  for (const t of l.distressTypes) tags.push(`gf-${t.replace(/_/g, '-')}`);
  if (l.likelyFreeAndClear) tags.push('gf-free-and-clear');
  if (l.absenteeOwner) tags.push('gf-absentee');
  if (l.outOfStateOwner) tags.push('gf-out-of-state');
  return [...new Set(tags)];
}

export function leadToGhlRow(
  l: LeadRecord,
  offerCfg: OfferConfig = DEFAULT_OFFER_CONFIG,
  nameOrder: 'last-first' | 'first-last' = 'last-first',
): Record<string, unknown> {
  const name = splitOwnerName(l.ownerName, nameOrder);
  const offer = computeOffer(
    {
      raw: {}, source: 'export',
      estimatedValue: l.estimatedValue, sqft: l.sqft, propertyType: l.propertyType,
    },
    {
      dedupeKey: l.dedupeKey, dedupeBasis: 'address', dedupeKeys: [l.dedupeKey],
      absenteeOwner: l.absenteeOwner ?? null, outOfStateOwner: l.outOfStateOwner ?? null,
      ownerOccupied: null, yearsOwned: l.yearsOwned ?? null,
      ownerType: (l.ownerType ?? 'unknown') as 'unknown', estateIndicator: false,
      trustIndicator: false, estimatedEquity: l.estimatedEquity ?? null,
      equityPercent: l.equityPercent ?? null,
      equityBasis: (l.equityBasis ?? 'unknown') as 'unknown',
      likelyFreeAndClear: Boolean(l.likelyFreeAndClear),
    },
    offerCfg,
  );

  const mail = contactAddress(l);

  return {
    first_name: name.firstName ?? '',
    last_name: name.lastName ?? '',
    company_name: name.companyName ?? '',
    phone: '',
    email: '',
    address1: mail.address1,
    city: mail.city,
    state: mail.state,
    postal_code: mail.postalCode,
    tags: tagsFor(l).join(', '),

    property_address: l.addressLine ?? '',
    property_city: l.city ?? '',
    property_state: l.state ?? '',
    property_zip: l.zip ?? '',
    county: l.county ?? '',
    apn: l.apn ?? '',
    property_type: l.propertyType ?? '',
    beds: l.beds ?? '',
    baths: l.baths ?? '',
    sqft: l.sqft ?? '',
    year_built: l.yearBuilt ?? '',
    distance_to_water_ft: l.distanceToWaterFt ?? '',
    waterbody: l.waterbodyName ?? '',
    latitude: l.latitude ?? '',
    longitude: l.longitude ?? '',

    estimated_value: l.estimatedValue ?? '',
    estimated_equity: l.estimatedEquity ?? '',
    equity_percent: l.equityPercent ?? '',
    equity_basis: l.equityBasis ?? '',
    likely_free_and_clear: yn(l.likelyFreeAndClear),
    years_owned: l.yearsOwned ?? '',
    last_sale_date: l.lastSaleDate ?? '',
    last_sale_amount: l.lastSaleAmount ?? '',
    owner_type: l.ownerType ?? '',
    absentee_owner: yn(l.absenteeOwner),
    out_of_state_owner: yn(l.outOfStateOwner),

    distress_types: l.distressTypes.join('; '),
    distress_count: l.distressCount,
    most_recent_signal: l.mostRecentSignal ?? '',

    strategy: l.strategy ?? '',
    grade: l.grade ?? '',
    overall_score: l.overallScore ?? '',
    seller_finance_score: l.sellerFinanceScore ?? '',
    distress_score: l.distressScore ?? '',

    arv_estimate: offer.arvEstimate ?? '',
    repair_estimate: offer.repairEstimate ?? '',
    max_cash_offer: offer.maxCashOffer ?? '',
    sf_price: offer.sellerFinance?.price ?? '',
    sf_down_payment: offer.sellerFinance?.downPayment ?? '',
    sf_monthly_payment: offer.sellerFinance?.monthlyPrincipalAndInterest ?? '',
    sf_balloon_years: offer.sellerFinance?.balloonYears ?? '',
    sf_balloon_balance: offer.sellerFinance?.balloonBalance ?? '',

    lead_reasons: l.reasons.join('; '),
    data_sources: l.sources.join('; '),
    lead_id: l.id,
  };
}

export function leadsToGhlCsv(
  leads: LeadRecord[],
  offerCfg?: OfferConfig,
  nameOrder?: 'last-first' | 'first-last',
): string {
  return toCsv(leads.map((l) => leadToGhlRow(l, offerCfg, nameOrder)), GHL_CSV_COLUMNS);
}
