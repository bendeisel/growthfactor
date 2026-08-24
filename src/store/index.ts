import type {
  DerivedSignals, DistressEventInput, DistressType, PropertyInput, RunStats, Scores,
} from '../core/types.ts';

export interface UpsertResult {
  id: string;
  isNew: boolean;
}

export interface StoredEvent {
  id: string;
  eventType: DistressType;
  firstSeenAt: string;
  lastSeenAt: string;
  clearedAt?: string | null;
  filingDate?: string | null;
  auctionDate?: string | null;
  source: string;
}

export interface LeadRecord {
  id: string;
  dedupeKey: string;
  apn?: string;
  addressLine?: string;
  city?: string;
  state?: string;
  zip?: string;
  county?: string;
  propertyType?: string;
  beds?: number;
  baths?: number;
  sqft?: number;
  yearBuilt?: number;
  estimatedValue?: number;
  estimatedEquity?: number;
  equityPercent?: number;
  equityBasis?: string;
  likelyFreeAndClear?: boolean;
  ownerName?: string;
  ownerType?: string;
  ownerMailingAddress?: string;
  ownerMailingCity?: string;
  ownerMailingState?: string;
  ownerMailingZip?: string;
  absenteeOwner?: boolean;
  outOfStateOwner?: boolean;
  yearsOwned?: number;
  latitude?: number;
  longitude?: number;
  distanceToWaterFt?: number;
  waterbodyName?: string;
  lastSaleDate?: string;
  lastSaleAmount?: number;
  distressTypes: string[];
  distressCount: number;
  mostRecentSignal?: string;
  distressScore?: number;
  sellerFinanceScore?: number;
  overallScore?: number;
  grade?: string;
  strategy?: string;
  reasons: string[];
  sources: string[];
  pipelineStage?: string;
  hasContactInfo: boolean;
}

export interface ListLeadsOptions {
  minOverallScore?: number;
  strategy?: string;
  state?: string;
  county?: string;
  eventType?: string;
  /** Only leads within this many feet of a measured waterbody. */
  maxWaterFt?: number;
  limit?: number;
  sortBy?: 'overall' | 'distress' | 'seller_finance' | 'equity' | 'recent' | 'water';
  stage?: string;
}

export interface OwnerContact {
  propertyId: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  mailingAddress?: string;
  mailingCity?: string;
  mailingState?: string;
  mailingZip?: string;
  phones: string[];
  emails: string[];
  skipTracedAt?: string;
  skipTraceCostCents?: number;
  source?: string;
}

export interface Store {
  init(): Promise<void>;
  close(): Promise<void>;

  upsertProperty(p: PropertyInput, d: DerivedSignals): Promise<UpsertResult>;
  /**
   * Append-only. Bumps last_seen_at on an open event of the same type, otherwise
   * inserts a new one. A property that hits pre-foreclosure twice keeps both rows.
   */
  recordEvent(propertyId: string, ev: DistressEventInput): Promise<{ created: boolean }>;
  saveScores(propertyId: string, s: Scores): Promise<void>;

  startRun(stats: RunStats): Promise<string>;
  finishRun(id: string, stats: RunStats): Promise<void>;
  listRuns(limit?: number): Promise<Array<RunStats & { id: string }>>;
  /** Billable spend since an ISO timestamp. Every cost in the system lands here. */
  spendSince(sinceIso: string): Promise<Array<{ jobName: string; cents: number; records: number }>>;

  listLeads(opts?: ListLeadsOptions): Promise<LeadRecord[]>;
  getLead(id: string): Promise<LeadRecord | null>;
  listEvents(propertyId: string): Promise<StoredEvent[]>;
  allForScoring(): Promise<Array<{ property: PropertyInput; derived: DerivedSignals; events: StoredEvent[]; id: string }>>;

  /** The cached skip trace for a property, if there is one. */
  getOwner(propertyId: string): Promise<OwnerContact | null>;
  /** Cache a skip trace result. The only place per record spend is recorded. */
  saveOwner(owner: OwnerContact & { raw?: unknown }): Promise<void>;

  /** Record how far a parcel sits from a named waterbody. Computed locally, free. */
  setWaterDistance(propertyId: string, distanceFt: number | null, waterbodyName: string | null): Promise<void>;

  /** Stages an offer for human review. Cannot advance past awaiting_approval. */
  stageOffer(propertyId: string, fields: Record<string, unknown>): Promise<void>;
  setGhlIds(propertyId: string, contactId?: string, opportunityId?: string): Promise<void>;

  counts(): Promise<{ properties: number; events: number; scored: number }>;
}
