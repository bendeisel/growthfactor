// Supabase store, over PostgREST.
//
// Deliberately uses plain fetch against the REST endpoint rather than a client
// library, which keeps the dependency count at zero and lets the identical code
// run in a Supabase Edge Function on Deno.
//
// Writes go through the upsert_property and record_distress_event functions
// defined in supabase/migrations/0001_init.sql, so merge and append-only
// semantics are identical to the local SQLite store.

import { HttpClient } from '../core/http.ts';
import { getEnv } from '../core/env.ts';
import type {
  DerivedSignals, DistressEventInput, PropertyInput, RunStats, Scores,
} from '../core/types.ts';
import type {
  LeadRecord, ListLeadsOptions, OwnerContact, Store, StoredEvent, UpsertResult,
} from './index.ts';
import { eventToRow, propertyToRow } from './rowmap.ts';

function stripNulls(o: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(o)) if (v !== undefined) out[k] = v;
  return out;
}

function num(v: unknown): number | undefined {
  if (v === null || v === undefined) return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

function str(v: unknown): string | undefined {
  if (v === null || v === undefined || v === '') return undefined;
  return String(v);
}

function boolOf(v: unknown): boolean | undefined {
  if (v === null || v === undefined) return undefined;
  return Boolean(v);
}

export class SupabaseStore implements Store {
  private http: HttpClient;
  private rest: string;
  private key: string;

  constructor(url?: string, serviceRoleKey?: string, http?: HttpClient) {
    const base = (url ?? getEnv('SUPABASE_URL') ?? '').replace(/\/+$/, '');
    this.key = serviceRoleKey ?? getEnv('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    if (!base) throw new Error('SUPABASE_URL is not set');
    if (!this.key) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set');
    this.rest = `${base}/rest/v1`;
    this.http = http ?? new HttpClient({ minIntervalMs: 0 });
  }

  private headers(extra: Record<string, string> = {}): Record<string, string> {
    return {
      apikey: this.key,
      authorization: `Bearer ${this.key}`,
      'content-type': 'application/json',
      ...extra,
    };
  }

  private async rpc<T>(fn: string, args: Record<string, unknown>): Promise<T> {
    return this.http.getJson<T>(`${this.rest}/rpc/${fn}`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify(args),
    });
  }

  async init(): Promise<void> {
    // PostgREST cannot run DDL. Verify the migration has been applied instead.
    try {
      await this.http.getJson(`${this.rest}/properties?select=id&limit=1`, { headers: this.headers() });
    } catch (err) {
      throw new Error(
        `cannot read the properties table. Apply supabase/migrations/0001_init.sql first. Cause: ${(err as Error).message}`,
      );
    }
  }

  async close(): Promise<void> {}

  async upsertProperty(p: PropertyInput, d: DerivedSignals): Promise<UpsertResult> {
    const rows = await this.rpc<Array<{ id: string; is_new: boolean }>>('upsert_property', {
      p: stripNulls(propertyToRow(p, d)),
      keys: d.dedupeKeys?.length ? d.dedupeKeys : [d.dedupeKey],
    });
    const r = rows[0];
    if (!r) throw new Error('upsert_property returned no row');
    return { id: r.id, isNew: Boolean(r.is_new) };
  }

  async recordEvent(propertyId: string, ev: DistressEventInput): Promise<{ created: boolean }> {
    const rows = await this.rpc<Array<{ event_id: string; created: boolean }>>(
      'record_distress_event',
      { pid: propertyId, e: stripNulls(eventToRow(ev)) },
    );
    return { created: Boolean(rows[0]?.created) };
  }

  async saveScores(propertyId: string, s: Scores): Promise<void> {
    await this.http.request(`${this.rest}/lead_scores?on_conflict=property_id`, {
      method: 'POST',
      headers: this.headers({ prefer: 'resolution=merge-duplicates,return=minimal' }),
      body: JSON.stringify({
        property_id: propertyId,
        distress_score: s.distressScore,
        seller_finance_score: s.sellerFinanceScore,
        overall_score: s.overallScore,
        grade: s.grade,
        strategy: s.strategy,
        reasons: s.reasons,
        scored_at: new Date().toISOString(),
      }),
    });
  }

  async startRun(stats: RunStats): Promise<string> {
    const rows = await this.http.getJson<Array<{ id: string }>>(`${this.rest}/ingest_runs`, {
      method: 'POST',
      headers: this.headers({ prefer: 'return=representation' }),
      body: JSON.stringify({
        job_name: stats.jobName,
        county: stats.county ?? null,
        state: stats.state ?? null,
        started_at: stats.startedAt,
        status: stats.status,
        records_pulled: 0, records_new: 0, records_updated: 0,
        events_created: 0, api_calls: 0, estimated_cost_cents: 0,
      }),
    });
    const id = rows[0]?.id;
    if (!id) throw new Error('could not create ingest_runs row');
    return id;
  }

  async finishRun(id: string, s: RunStats): Promise<void> {
    await this.http.request(`${this.rest}/ingest_runs?id=eq.${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: this.headers({ prefer: 'return=minimal' }),
      body: JSON.stringify({
        finished_at: s.finishedAt ?? new Date().toISOString(),
        status: s.status,
        records_pulled: s.recordsPulled,
        records_new: s.recordsNew,
        records_updated: s.recordsUpdated,
        events_created: s.eventsCreated,
        api_calls: s.apiCalls,
        estimated_cost_cents: s.estimatedCostCents,
        error: s.error ?? null,
      }),
    });
  }

  async listRuns(limit = 20): Promise<Array<RunStats & { id: string }>> {
    const rows = await this.http.getJson<Array<Record<string, unknown>>>(
      `${this.rest}/ingest_runs?select=*&order=started_at.desc&limit=${limit}`,
      { headers: this.headers() },
    );
    return rows.map((r) => ({
      id: String(r.id),
      jobName: String(r.job_name),
      county: str(r.county),
      state: str(r.state),
      startedAt: String(r.started_at),
      finishedAt: str(r.finished_at),
      status: String(r.status) as RunStats['status'],
      recordsPulled: num(r.records_pulled) ?? 0,
      recordsNew: num(r.records_new) ?? 0,
      recordsUpdated: num(r.records_updated) ?? 0,
      eventsCreated: num(r.events_created) ?? 0,
      apiCalls: num(r.api_calls) ?? 0,
      estimatedCostCents: num(r.estimated_cost_cents) ?? 0,
      error: str(r.error),
    }));
  }

  async spendSince(sinceIso: string): Promise<Array<{ jobName: string; cents: number; records: number }>> {
    const rows = await this.http.getJson<Array<Record<string, unknown>>>(
      `${this.rest}/ingest_runs?select=job_name,estimated_cost_cents,records_pulled`
      + `&started_at=gte.${encodeURIComponent(sinceIso)}`,
      { headers: this.headers() },
    );
    const byJob = new Map<string, { cents: number; records: number }>();
    for (const r of rows) {
      const key = String(r.job_name);
      const prev = byJob.get(key) ?? { cents: 0, records: 0 };
      byJob.set(key, {
        cents: prev.cents + (num(r.estimated_cost_cents) ?? 0),
        records: prev.records + (num(r.records_pulled) ?? 0),
      });
    }
    return [...byJob].map(([jobName, v]) => ({ jobName, ...v }));
  }

  async getOwner(propertyId: string): Promise<OwnerContact | null> {
    const rows = await this.http.getJson<Array<Record<string, unknown>>>(
      `${this.rest}/owners?select=*&property_id=eq.${encodeURIComponent(propertyId)}`
      + '&order=skip_traced_at.desc&limit=1',
      { headers: this.headers() },
    );
    const r = rows[0];
    if (!r) return null;
    const arr = (v: unknown): string[] => (Array.isArray(v) ? v.map(String) : []);
    return {
      propertyId,
      fullName: str(r.full_name),
      firstName: str(r.first_name),
      lastName: str(r.last_name),
      mailingAddress: str(r.mailing_address),
      mailingCity: str(r.mailing_city),
      mailingState: str(r.mailing_state),
      mailingZip: str(r.mailing_zip),
      phones: arr(r.phones),
      emails: arr(r.emails),
      skipTracedAt: str(r.skip_traced_at),
      skipTraceCostCents: num(r.skip_trace_cost_cents),
      source: str(r.source),
    };
  }

  async saveOwner(owner: OwnerContact & { raw?: unknown }): Promise<void> {
    await this.http.request(`${this.rest}/owners`, {
      method: 'POST',
      headers: this.headers({ prefer: 'return=minimal' }),
      body: JSON.stringify(stripNulls({
        property_id: owner.propertyId,
        full_name: owner.fullName,
        first_name: owner.firstName,
        last_name: owner.lastName,
        mailing_address: owner.mailingAddress,
        mailing_city: owner.mailingCity,
        mailing_state: owner.mailingState,
        mailing_zip: owner.mailingZip,
        phones: owner.phones ?? [],
        emails: owner.emails ?? [],
        skip_traced_at: owner.skipTracedAt ?? new Date().toISOString(),
        skip_trace_cost_cents: owner.skipTraceCostCents ?? 0,
        source: owner.source,
        raw: owner.raw,
      })),
    });
  }

  private rowToLead(r: Record<string, unknown>): LeadRecord {
    const types = r.distress_types;
    return {
      id: String(r.id),
      dedupeKey: String(r.dedupe_key ?? ''),
      apn: str(r.apn),
      addressLine: str(r.address_line),
      city: str(r.city),
      state: str(r.state),
      zip: str(r.zip),
      county: str(r.county),
      propertyType: str(r.property_type),
      beds: num(r.beds),
      baths: num(r.baths),
      sqft: num(r.sqft),
      yearBuilt: num(r.year_built),
      estimatedValue: num(r.estimated_value),
      estimatedEquity: num(r.estimated_equity),
      equityPercent: num(r.equity_percent),
      equityBasis: str(r.equity_basis),
      likelyFreeAndClear: boolOf(r.likely_free_and_clear),
      ownerName: str(r.owner_name),
      ownerType: str(r.owner_type),
      ownerMailingAddress: str(r.owner_mailing_address),
      ownerMailingCity: str(r.owner_mailing_city),
      ownerMailingState: str(r.owner_mailing_state),
      ownerMailingZip: str(r.owner_mailing_zip),
      absenteeOwner: boolOf(r.absentee_owner),
      outOfStateOwner: boolOf(r.out_of_state_owner),
      yearsOwned: num(r.years_owned),
      latitude: num(r.latitude),
      longitude: num(r.longitude),
      distanceToWaterFt: num(r.distance_to_water_ft),
      waterbodyName: str(r.waterbody_name),
      lastSaleDate: str(r.last_sale_date),
      lastSaleAmount: num(r.last_sale_amount),
      distressTypes: Array.isArray(types) ? (types as string[]).filter(Boolean) : [],
      distressCount: num(r.distress_count) ?? 0,
      mostRecentSignal: str(r.most_recent_signal),
      distressScore: num(r.distress_score),
      sellerFinanceScore: num(r.seller_finance_score),
      overallScore: num(r.overall_score),
      grade: str(r.grade),
      strategy: str(r.strategy),
      reasons: Array.isArray(r.reasons) ? (r.reasons as string[]) : [],
      sources: str(r.sources) ? String(r.sources).split(',') : [],
      pipelineStage: str(r.pipeline_stage),
      hasContactInfo: Boolean(r.has_contact_info),
    };
  }

  async listLeads(opts: ListLeadsOptions = {}): Promise<LeadRecord[]> {
    const q: string[] = ['select=*'];
    if (opts.minOverallScore != null) q.push(`overall_score=gte.${opts.minOverallScore}`);
    if (opts.strategy) q.push(`strategy=eq.${encodeURIComponent(opts.strategy)}`);
    if (opts.state) q.push(`state=eq.${encodeURIComponent(opts.state.toUpperCase())}`);
    if (opts.county) q.push(`county=ilike.*${encodeURIComponent(opts.county)}*`);
    if (opts.stage) q.push(`pipeline_stage=eq.${encodeURIComponent(opts.stage)}`);
    if (opts.maxWaterFt != null) q.push(`distance_to_water_ft=lte.${opts.maxWaterFt}`);
    if (opts.eventType) q.push(`distress_types=cs.{${encodeURIComponent(opts.eventType)}}`);

    const order = {
      overall: 'overall_score.desc.nullslast',
      distress: 'distress_score.desc.nullslast',
      seller_finance: 'seller_finance_score.desc.nullslast',
      equity: 'equity_percent.desc.nullslast',
      recent: 'most_recent_signal.desc.nullslast',
      water: 'distance_to_water_ft.asc.nullslast',
    }[opts.sortBy ?? 'overall'];
    q.push(`order=${order}`);
    q.push(`limit=${opts.limit ?? 100}`);

    const rows = await this.http.getJson<Array<Record<string, unknown>>>(
      `${this.rest}/stacked_leads?${q.join('&')}`,
      { headers: this.headers() },
    );
    return rows.map((r) => this.rowToLead(r));
  }

  async getLead(id: string): Promise<LeadRecord | null> {
    const rows = await this.http.getJson<Array<Record<string, unknown>>>(
      `${this.rest}/stacked_leads?select=*&id=eq.${encodeURIComponent(id)}&limit=1`,
      { headers: this.headers() },
    );
    return rows[0] ? this.rowToLead(rows[0]) : null;
  }

  async listEvents(propertyId: string): Promise<StoredEvent[]> {
    const rows = await this.http.getJson<Array<Record<string, unknown>>>(
      `${this.rest}/distress_events?select=*&property_id=eq.${encodeURIComponent(propertyId)}&order=first_seen_at.desc`,
      { headers: this.headers() },
    );
    return rows.map((r) => ({
      id: String(r.id),
      eventType: String(r.event_type) as StoredEvent['eventType'],
      firstSeenAt: String(r.first_seen_at),
      lastSeenAt: String(r.last_seen_at),
      clearedAt: str(r.cleared_at) ?? null,
      filingDate: str(r.filing_date) ?? null,
      auctionDate: str(r.auction_date) ?? null,
      source: String(r.source),
    }));
  }

  private async page<T>(path: string, pageSize = 1000): Promise<T[]> {
    const out: T[] = [];
    for (let offset = 0; ; offset += pageSize) {
      const rows = await this.http.getJson<T[]>(
        `${path}&limit=${pageSize}&offset=${offset}`,
        { headers: this.headers() },
      );
      out.push(...rows);
      if (rows.length < pageSize) return out;
    }
  }

  async allForScoring(): Promise<Array<{ property: PropertyInput; derived: DerivedSignals; events: StoredEvent[]; id: string }>> {
    const props = await this.page<Record<string, unknown>>(`${this.rest}/properties?select=*&order=id`);
    const events = await this.page<Record<string, unknown>>(`${this.rest}/distress_events?select=*&order=id`);
    const byProp = new Map<string, StoredEvent[]>();
    for (const e of events) {
      const pid = String(e.property_id);
      const list = byProp.get(pid) ?? [];
      list.push({
        id: String(e.id),
        eventType: String(e.event_type) as StoredEvent['eventType'],
        firstSeenAt: String(e.first_seen_at),
        lastSeenAt: String(e.last_seen_at),
        clearedAt: str(e.cleared_at) ?? null,
        filingDate: str(e.filing_date) ?? null,
        auctionDate: str(e.auction_date) ?? null,
        source: String(e.source),
      });
      byProp.set(pid, list);
    }
    return props.map((r) => ({
      id: String(r.id),
      property: {
        fips: str(r.fips), apn: str(r.apn), addressLine: str(r.address_line),
        city: str(r.city), state: str(r.state), zip: str(r.zip), county: str(r.county),
        latitude: num(r.latitude), longitude: num(r.longitude),
        propertyType: str(r.property_type), beds: num(r.beds), baths: num(r.baths),
        sqft: num(r.sqft), lotSqft: num(r.lot_sqft), yearBuilt: num(r.year_built),
        estimatedValue: num(r.estimated_value), assessedValue: num(r.assessed_value),
        openMortgageBal: num(r.open_mortgage_bal), lastSaleDate: str(r.last_sale_date),
        lastSaleAmount: num(r.last_sale_amount), ownerName: str(r.owner_name),
        ownerMailingAddress: str(r.owner_mailing_address),
        ownerMailingCity: str(r.owner_mailing_city),
        ownerMailingState: str(r.owner_mailing_state),
        ownerMailingZip: str(r.owner_mailing_zip),
        raw: {}, source: String(r.source),
      },
      derived: {
        dedupeKey: String(r.dedupe_key),
        dedupeKeys: [String(r.dedupe_key)],
        dedupeBasis: (str(r.dedupe_basis) ?? 'address') as DerivedSignals['dedupeBasis'],
        absenteeOwner: boolOf(r.absentee_owner) ?? null,
        outOfStateOwner: boolOf(r.out_of_state_owner) ?? null,
        ownerOccupied: boolOf(r.owner_occupied) ?? null,
        yearsOwned: num(r.years_owned) ?? null,
        ownerType: (str(r.owner_type) ?? 'unknown') as DerivedSignals['ownerType'],
        estateIndicator: boolOf(r.estate_indicator) ?? false,
        trustIndicator: boolOf(r.trust_indicator) ?? false,
        estimatedEquity: num(r.estimated_equity) ?? null,
        equityPercent: num(r.equity_percent) ?? null,
        equityBasis: (str(r.equity_basis) ?? 'unknown') as DerivedSignals['equityBasis'],
        likelyFreeAndClear: boolOf(r.likely_free_and_clear) ?? false,
      },
      events: byProp.get(String(r.id)) ?? [],
    }));
  }

  async setWaterDistance(
    propertyId: string,
    distanceFt: number | null,
    waterbodyName: string | null,
  ): Promise<void> {
    await this.http.request(`${this.rest}/properties?id=eq.${encodeURIComponent(propertyId)}`, {
      method: 'PATCH',
      headers: this.headers({ prefer: 'return=minimal' }),
      body: JSON.stringify({ distance_to_water_ft: distanceFt, waterbody_name: waterbodyName }),
    });
  }

  async stageOffer(propertyId: string, fields: Record<string, unknown>): Promise<void> {
    const stage = String(fields.stage ?? 'awaiting_approval');
    if (stage === 'offer_sent') {
      throw new Error('offer_sent cannot be set by the pipeline. A human sends offers.');
    }
    await this.http.request(`${this.rest}/offer_pipeline?on_conflict=property_id`, {
      method: 'POST',
      headers: this.headers({ prefer: 'resolution=merge-duplicates,return=minimal' }),
      body: JSON.stringify(stripNulls({
        property_id: propertyId,
        stage,
        arv_estimate: fields.arvEstimate,
        repair_estimate: fields.repairEstimate,
        max_offer: fields.maxOffer,
        offer_amount: fields.offerAmount,
        offer_notes: fields.offerNotes,
        terms: fields.terms,
        updated_at: new Date().toISOString(),
      })),
    });
  }

  async setGhlIds(propertyId: string, contactId?: string, opportunityId?: string): Promise<void> {
    const patch = stripNulls({ ghl_contact_id: contactId, ghl_opportunity_id: opportunityId });
    if (!Object.keys(patch).length) return;
    await this.http.request(
      `${this.rest}/offer_pipeline?property_id=eq.${encodeURIComponent(propertyId)}`,
      {
        method: 'PATCH',
        headers: this.headers({ prefer: 'return=minimal' }),
        body: JSON.stringify(patch),
      },
    );
  }

  async counts(): Promise<{ properties: number; events: number; scored: number }> {
    const one = async (table: string): Promise<number> => {
      const res = await this.http.requestMeta(`${this.rest}/${table}?select=id&limit=1`, {
        headers: this.headers({ prefer: 'count=exact', range: '0-0' }),
      });
      const cr = res.headers.get('content-range') ?? '';
      const total = Number(cr.split('/')[1]);
      return Number.isFinite(total) ? total : 0;
    };
    return {
      properties: await one('properties'),
      events: await one('distress_events'),
      scored: await one('lead_scores'),
    };
  }
}
