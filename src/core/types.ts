// Canonical shapes for the whole pipeline. Every connector, no matter how odd the
// upstream schema, produces IngestRecord values so the rest of the system never
// has to care where a lead came from.

export type DistressType =
  | 'pre_foreclosure'
  | 'foreclosure'
  | 'reo'
  | 'auction'
  | 'tax_delinquent'
  | 'probate'
  | 'pre_probate'
  | 'vacant'
  | 'lien'
  | 'code_violation'
  | 'eviction'
  | 'demolition';

export const DISTRESS_TYPES: readonly DistressType[] = [
  'pre_foreclosure', 'foreclosure', 'reo', 'auction', 'tax_delinquent',
  'probate', 'pre_probate', 'vacant', 'lien', 'code_violation',
  'eviction', 'demolition',
];

export type OwnerType = 'individual' | 'company' | 'trust' | 'estate' | 'government' | 'unknown';

/** Which strategy the numbers actually support for a given lead. */
export type Strategy =
  | 'seller_finance'
  | 'subject_to'
  /** Lease with an option to buy. Controls the property without transferring title. */
  | 'lease_option'
  | 'cash_wholesale'
  | 'novation'
  | 'unclear';

/** How much to believe an equity number. Free county data rarely carries loan balances. */
export type EquityBasis = 'measured' | 'estimated_from_tenure' | 'unknown';

export type RawRecord = Record<string, unknown>;

export interface PropertyInput {
  fips?: string;
  apn?: string;

  addressLine?: string;
  city?: string;
  state?: string;
  zip?: string;
  county?: string;
  latitude?: number;
  longitude?: number;

  propertyType?: string;
  beds?: number;
  baths?: number;
  sqft?: number;
  lotSqft?: number;
  yearBuilt?: number;

  /** Assessor market value, vendor AVM, or list price depending on source. */
  estimatedValue?: number;
  assessedValue?: number;
  openMortgageBal?: number;
  lastSaleDate?: string;
  lastSaleAmount?: number;

  ownerName?: string;
  ownerMailingAddress?: string;
  ownerMailingCity?: string;
  ownerMailingState?: string;
  ownerMailingZip?: string;

  /** Native identifier from the source, used as a last-resort dedupe key. */
  sourceRecordId?: string;

  raw: RawRecord;
  source: string;
}

export interface DistressEventInput {
  eventType: DistressType;

  filingDate?: string;
  auctionDate?: string;
  lender?: string;
  unpaidBalance?: number;
  documentType?: string;

  caseNumber?: string;
  decedentName?: string;
  dateOfDeath?: string;
  attorneyName?: string;

  source: string;
  raw?: RawRecord;
}

export interface IngestRecord {
  property: PropertyInput;
  events: DistressEventInput[];
}

/** Signals computed locally from free data. No vendor call, no per-record cost. */
export interface DerivedSignals {
  dedupeKey: string;
  dedupeBasis: 'fips_apn' | 'address' | 'source_id';
  /** All identifiers this record can be matched on, primary first. */
  dedupeKeys: string[];

  absenteeOwner: boolean | null;
  outOfStateOwner: boolean | null;
  ownerOccupied: boolean | null;
  yearsOwned: number | null;
  ownerType: OwnerType;

  /** Owner name contains estate/heirs/deceased language. A free probate proxy. */
  estateIndicator: boolean;
  trustIndicator: boolean;

  estimatedEquity: number | null;
  equityPercent: number | null;
  equityBasis: EquityBasis;
  likelyFreeAndClear: boolean;
}

export interface Scores {
  distressScore: number;
  sellerFinanceScore: number;
  overallScore: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  strategy: Strategy;
  reasons: string[];
}

export interface SourceConfig {
  name: string;
  kind: 'arcgis' | 'socrata' | 'csv' | 'html' | 'reapi';
  label?: string;
  enabled?: boolean;
  /** Cents per record this source costs. Free public sources are 0. */
  costPerRecordCents?: number;
  /** Distress event types every record from this source implies. */
  impliesEvents?: DistressType[];
  /** Static values merged onto every property, for example county and state. */
  defaults?: Partial<PropertyInput>;
  /** Explicit source-field to canonical-field overrides. Wins over auto mapping. */
  fieldMap?: Record<string, string>;
  notes?: string;
  [k: string]: unknown;
}

export interface RunStats {
  jobName: string;
  county?: string;
  state?: string;
  startedAt: string;
  finishedAt?: string;
  status: 'running' | 'ok' | 'partial' | 'error';
  recordsPulled: number;
  recordsNew: number;
  recordsUpdated: number;
  eventsCreated: number;
  apiCalls: number;
  estimatedCostCents: number;
  error?: string;
}
