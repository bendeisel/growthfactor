// Local SQLite store. Uses the SQLite bundled with Node, so the whole pipeline
// runs with no database to provision, no container, and no monthly bill.

import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import type {
  DerivedSignals, DistressEventInput, PropertyInput, RunStats, Scores,
} from '../core/types.ts';
import type {
  LeadRecord, ListLeadsOptions, Store, StoredEvent, UpsertResult,
} from './index.ts';
import { propertyToRow } from './rowmap.ts';

type SqlValue = string | number | null;

/** node:sqlite only binds strings, numbers, bigints and buffers. */
function b(v: unknown): SqlValue {
  if (v === undefined || v === null || v === '') return null;
  if (typeof v === 'boolean') return v ? 1 : 0;
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
}

function bool(v: unknown): boolean | undefined {
  if (v === null || v === undefined) return undefined;
  return Number(v) === 1;
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

function nowIso(): string {
  return new Date().toISOString();
}

const PROPERTY_COLUMNS = [
  'dedupe_key', 'dedupe_basis', 'fips', 'apn', 'address_line', 'city', 'state', 'zip',
  'county', 'latitude', 'longitude', 'property_type', 'beds', 'baths', 'sqft',
  'lot_sqft', 'year_built', 'estimated_value', 'assessed_value', 'estimated_equity',
  'equity_percent', 'equity_basis', 'open_mortgage_bal', 'last_sale_date',
  'last_sale_amount', 'owner_name', 'owner_type', 'estate_indicator',
  'trust_indicator', 'owner_mailing_address', 'owner_mailing_city',
  'owner_mailing_state', 'owner_mailing_zip', 'owner_occupied', 'absentee_owner',
  'out_of_state_owner', 'years_owned', 'likely_free_and_clear', 'raw', 'source',
] as const;

/** Columns added after the first release, applied to an existing local database. */
const LATER_COLUMNS: Array<[string, string]> = [
  ['distance_to_water_ft', 'real'],
  ['waterbody_name', 'text'],
];

export class SqliteStore implements Store {
  private db: DatabaseSync;
  readonly path: string;

  constructor(path = join('data', 'growthfactor.db')) {
    this.path = path;
    if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true });
    this.db = new DatabaseSync(path);
  }

  async init(): Promise<void> {
    this.db.exec('pragma journal_mode = WAL');
    this.db.exec('pragma foreign_keys = ON');
    const here = dirname(new URL(import.meta.url).pathname);
    this.db.exec(readFileSync(join(here, 'schema.sqlite.sql'), 'utf8'));
    this.addMissingColumns();
  }

  /**
   * "create table if not exists" does nothing to a table that already exists, so
   * a database created by an earlier version needs its new columns added.
   */
  private addMissingColumns(): void {
    const existing = new Set(
      (this.db.prepare('pragma table_info(properties)').all() as Array<{ name: string }>)
        .map((r) => r.name),
    );
    let added = false;
    for (const [name, type] of LATER_COLUMNS) {
      if (existing.has(name)) continue;
      this.db.exec(`alter table properties add column ${name} ${type}`);
      added = true;
    }
    // The view was compiled against the old column list, so rebuild it.
    if (added) {
      const here = dirname(new URL(import.meta.url).pathname);
      const sql = readFileSync(join(here, 'schema.sqlite.sql'), 'utf8');
      const viewSql = sql.slice(sql.indexOf('drop view if exists stacked_leads'));
      this.db.exec(viewSql);
    }
  }

  async close(): Promise<void> {
    this.db.close();
  }

  /** Resolve a property by any of its candidate keys, honouring key precedence. */
  private findByKeys(keys: string[]): string | undefined {
    if (!keys.length) return undefined;
    const placeholders = keys.map(() => '?').join(', ');
    const rows = this.db
      .prepare(`select key, property_id from property_keys where key in (${placeholders})`)
      .all(...keys) as Array<{ key: string; property_id: string }>;
    if (!rows.length) return undefined;
    const byKey = new Map(rows.map((r) => [r.key, r.property_id]));
    for (const k of keys) {
      const hit = byKey.get(k);
      if (hit) return hit;
    }
    return undefined;
  }

  /**
   * Register aliases first-writer-wins. If an address key already points at another
   * parcel, it is left alone rather than stolen, so two units that normalize to the
   * same street address never quietly become one record.
   */
  private registerKeys(keys: string[], propertyId: string): void {
    const stmt = this.db.prepare(
      'insert into property_keys (key, property_id) values (?, ?) on conflict(key) do nothing',
    );
    for (const k of keys) stmt.run(k, propertyId);
  }

  async upsertProperty(p: PropertyInput, d: DerivedSignals): Promise<UpsertResult> {
    const keys = d.dedupeKeys?.length ? d.dedupeKeys : [d.dedupeKey];
    const foundId = this.findByKeys(keys);
    const existing = foundId
      ? { id: foundId }
      : (this.db
          .prepare('select id from properties where dedupe_key = ?')
          .get(d.dedupeKey) as { id: string } | undefined);

    const ts = nowIso();
    const row = propertyToRow(p, d);
    const values: SqlValue[] = PROPERTY_COLUMNS.map((c) => b(row[c]));

    if (!existing) {
      const id = crypto.randomUUID();
      const cols = ['id', ...PROPERTY_COLUMNS, 'sources', 'first_seen_at', 'last_seen_at'];
      const placeholders = cols.map(() => '?').join(', ');
      this.db
        .prepare(`insert into properties (${cols.join(', ')}) values (${placeholders})`)
        .run(id, ...values, b(p.source), ts, ts);
      this.registerKeys(keys, id);
      return { id, isNew: true };
    }

    // coalesce(new, old) so a source that carries only an address never erases the
    // owner name or valuation another source already supplied.
    const sets = PROPERTY_COLUMNS
      .filter((c) => c !== 'dedupe_key')
      .map((c) => `${c} = coalesce(?, ${c})`);
    const orderedValues = PROPERTY_COLUMNS
      .map((c, i) => ({ c, v: values[i]! }))
      .filter((x) => x.c !== 'dedupe_key')
      .map((x) => x.v);

    this.db
      .prepare(
        `update properties set ${sets.join(', ')},
           sources = case
             when sources is null then ?
             when instr(sources, ?) > 0 then sources
             else sources || ',' || ?
           end,
           last_seen_at = ?
         where id = ?`,
      )
      .run(...orderedValues, b(p.source), b(p.source), b(p.source), ts, existing.id);
    // A later source may know an identifier the first one did not publish.
    this.registerKeys(keys, existing.id);
    return { id: existing.id, isNew: false };
  }

  async recordEvent(propertyId: string, ev: DistressEventInput): Promise<{ created: boolean }> {
    const open = this.db
      .prepare(
        `select id from distress_events
          where property_id = ? and event_type = ? and cleared_at is null
          order by first_seen_at desc limit 1`,
      )
      .get(propertyId, ev.eventType) as { id: string } | undefined;

    const ts = nowIso();
    if (open) {
      // Bump the sighting and fill in any detail that arrived later, without
      // overwriting detail already recorded.
      this.db
        .prepare(
          `update distress_events set
             last_seen_at = ?,
             filing_date = coalesce(filing_date, ?),
             auction_date = coalesce(?, auction_date),
             lender = coalesce(lender, ?),
             unpaid_balance = coalesce(?, unpaid_balance),
             document_type = coalesce(document_type, ?),
             case_number = coalesce(case_number, ?),
             decedent_name = coalesce(decedent_name, ?),
             date_of_death = coalesce(date_of_death, ?),
             attorney_name = coalesce(attorney_name, ?)
           where id = ?`,
        )
        .run(
          ts, b(ev.filingDate), b(ev.auctionDate), b(ev.lender), b(ev.unpaidBalance),
          b(ev.documentType), b(ev.caseNumber), b(ev.decedentName), b(ev.dateOfDeath),
          b(ev.attorneyName), open.id,
        );
      return { created: false };
    }

    this.db
      .prepare(
        `insert into distress_events (
           id, property_id, event_type, first_seen_at, last_seen_at,
           filing_date, auction_date, lender, unpaid_balance, document_type,
           case_number, decedent_name, date_of_death, attorney_name, source, raw
         ) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        crypto.randomUUID(), propertyId, ev.eventType, ts, ts,
        b(ev.filingDate), b(ev.auctionDate), b(ev.lender), b(ev.unpaidBalance),
        b(ev.documentType), b(ev.caseNumber), b(ev.decedentName), b(ev.dateOfDeath),
        b(ev.attorneyName), ev.source, b(ev.raw),
      );
    return { created: true };
  }

  async saveScores(propertyId: string, s: Scores): Promise<void> {
    this.db
      .prepare(
        `insert into lead_scores (property_id, distress_score, seller_finance_score,
            overall_score, grade, strategy, reasons, scored_at)
         values (?, ?, ?, ?, ?, ?, ?, ?)
         on conflict(property_id) do update set
           distress_score = excluded.distress_score,
           seller_finance_score = excluded.seller_finance_score,
           overall_score = excluded.overall_score,
           grade = excluded.grade,
           strategy = excluded.strategy,
           reasons = excluded.reasons,
           scored_at = excluded.scored_at`,
      )
      .run(
        propertyId, s.distressScore, s.sellerFinanceScore, s.overallScore,
        s.grade, s.strategy, JSON.stringify(s.reasons), nowIso(),
      );
  }

  async startRun(stats: RunStats): Promise<string> {
    const id = crypto.randomUUID();
    this.db
      .prepare(
        `insert into ingest_runs (id, job_name, county, state, started_at, status,
            records_pulled, records_new, records_updated, events_created, api_calls,
            estimated_cost_cents)
         values (?, ?, ?, ?, ?, ?, 0, 0, 0, 0, 0, 0)`,
      )
      .run(id, stats.jobName, b(stats.county), b(stats.state), stats.startedAt, stats.status);
    return id;
  }

  async finishRun(id: string, s: RunStats): Promise<void> {
    this.db
      .prepare(
        `update ingest_runs set finished_at = ?, status = ?, records_pulled = ?,
            records_new = ?, records_updated = ?, events_created = ?, api_calls = ?,
            estimated_cost_cents = ?, error = ?
         where id = ?`,
      )
      .run(
        b(s.finishedAt ?? nowIso()), s.status, s.recordsPulled, s.recordsNew,
        s.recordsUpdated, s.eventsCreated, s.apiCalls, s.estimatedCostCents,
        b(s.error), id,
      );
  }

  async listRuns(limit = 20): Promise<Array<RunStats & { id: string }>> {
    const rows = this.db
      .prepare('select * from ingest_runs order by started_at desc limit ?')
      .all(limit) as Array<Record<string, unknown>>;
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

  private rowToLead(r: Record<string, unknown>): LeadRecord {
    const types = str(r.distress_types);
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
      likelyFreeAndClear: bool(r.likely_free_and_clear),
      ownerName: str(r.owner_name),
      ownerType: str(r.owner_type),
      ownerMailingAddress: str(r.owner_mailing_address),
      ownerMailingCity: str(r.owner_mailing_city),
      ownerMailingState: str(r.owner_mailing_state),
      ownerMailingZip: str(r.owner_mailing_zip),
      absenteeOwner: bool(r.absentee_owner),
      outOfStateOwner: bool(r.out_of_state_owner),
      yearsOwned: num(r.years_owned),
      latitude: num(r.latitude),
      longitude: num(r.longitude),
      distanceToWaterFt: num(r.distance_to_water_ft),
      waterbodyName: str(r.waterbody_name),
      lastSaleDate: str(r.last_sale_date),
      lastSaleAmount: num(r.last_sale_amount),
      distressTypes: types ? [...new Set(types.split(','))] : [],
      distressCount: num(r.distress_count) ?? 0,
      mostRecentSignal: str(r.most_recent_signal),
      distressScore: num(r.distress_score),
      sellerFinanceScore: num(r.seller_finance_score),
      overallScore: num(r.overall_score),
      grade: str(r.grade),
      strategy: str(r.strategy),
      reasons: (() => {
        try { return JSON.parse(String(r.reasons ?? '[]')) as string[]; } catch { return []; }
      })(),
      sources: str(r.sources) ? String(r.sources).split(',') : [],
      pipelineStage: str(r.pipeline_stage),
      hasContactInfo: Number(r.has_contact_info) === 1,
    };
  }

  async listLeads(opts: ListLeadsOptions = {}): Promise<LeadRecord[]> {
    const where: string[] = [];
    const params: SqlValue[] = [];

    if (opts.minOverallScore != null) {
      where.push('coalesce(s.overall_score, 0) >= ?');
      params.push(opts.minOverallScore);
    }
    if (opts.strategy) { where.push('s.strategy = ?'); params.push(opts.strategy); }
    if (opts.state) { where.push('upper(p.state) = ?'); params.push(opts.state.toUpperCase()); }
    if (opts.county) { where.push('lower(p.county) like ?'); params.push(`%${opts.county.toLowerCase()}%`); }
    if (opts.stage) { where.push('op.stage = ?'); params.push(opts.stage); }
    if (opts.maxWaterFt != null) {
      where.push('p.distance_to_water_ft is not null and p.distance_to_water_ft <= ?');
      params.push(opts.maxWaterFt);
    }
    if (opts.eventType) {
      where.push(`exists (select 1 from distress_events e
        where e.property_id = p.id and e.event_type = ? and e.cleared_at is null)`);
      params.push(opts.eventType);
    }

    const order = {
      overall: 'coalesce(s.overall_score, 0) desc',
      distress: 'coalesce(s.distress_score, 0) desc',
      seller_finance: 'coalesce(s.seller_finance_score, 0) desc',
      equity: 'coalesce(p.equity_percent, -1) desc',
      recent: 'p.last_seen_at desc',
      // Nulls last: an unmeasured parcel is not "closest to the water".
      water: 'case when p.distance_to_water_ft is null then 1 else 0 end, p.distance_to_water_ft asc',
    }[opts.sortBy ?? 'overall'];

    const sql = `
      select p.*, s.distress_score, s.seller_finance_score, s.overall_score, s.grade,
             s.strategy, s.reasons, op.stage as pipeline_stage,
             (select count(distinct e.event_type) from distress_events e
                where e.property_id = p.id and e.cleared_at is null) as distress_count,
             (select group_concat(e.event_type) from distress_events e
                where e.property_id = p.id and e.cleared_at is null) as distress_types,
             (select max(e.last_seen_at) from distress_events e where e.property_id = p.id) as most_recent_signal,
             (select count(*) from owners o where o.property_id = p.id) as has_contact_info
      from properties p
      left join lead_scores s on s.property_id = p.id
      left join offer_pipeline op on op.property_id = p.id
      ${where.length ? `where ${where.join(' and ')}` : ''}
      order by ${order}
      limit ?`;
    params.push(opts.limit ?? 100);
    const rows = this.db.prepare(sql).all(...params) as Array<Record<string, unknown>>;
    return rows.map((r) => this.rowToLead({ ...r, has_contact_info: Number(r.has_contact_info) > 0 ? 1 : 0 }));
  }

  async getLead(id: string): Promise<LeadRecord | null> {
    const rows = this.db
      .prepare(
        `select p.*, s.distress_score, s.seller_finance_score, s.overall_score, s.grade,
                s.strategy, s.reasons, op.stage as pipeline_stage,
                (select count(distinct e.event_type) from distress_events e
                   where e.property_id = p.id and e.cleared_at is null) as distress_count,
                (select group_concat(e.event_type) from distress_events e
                   where e.property_id = p.id and e.cleared_at is null) as distress_types,
                (select max(e.last_seen_at) from distress_events e where e.property_id = p.id) as most_recent_signal,
                (select count(*) from owners o where o.property_id = p.id) as has_contact_info
         from properties p
         left join lead_scores s on s.property_id = p.id
         left join offer_pipeline op on op.property_id = p.id
         where p.id = ? or p.dedupe_key = ?`,
      )
      .all(id, id) as Array<Record<string, unknown>>;
    const r = rows[0];
    if (!r) return null;
    return this.rowToLead({ ...r, has_contact_info: Number(r.has_contact_info) > 0 ? 1 : 0 });
  }

  async listEvents(propertyId: string): Promise<StoredEvent[]> {
    const rows = this.db
      .prepare('select * from distress_events where property_id = ? order by first_seen_at desc')
      .all(propertyId) as Array<Record<string, unknown>>;
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

  async allForScoring(): Promise<Array<{ property: PropertyInput; derived: DerivedSignals; events: StoredEvent[]; id: string }>> {
    const rows = this.db.prepare('select * from properties').all() as Array<Record<string, unknown>>;
    const events = this.db.prepare('select * from distress_events').all() as Array<Record<string, unknown>>;
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

    return rows.map((r) => ({
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
        absenteeOwner: bool(r.absentee_owner) ?? null,
        outOfStateOwner: bool(r.out_of_state_owner) ?? null,
        ownerOccupied: bool(r.owner_occupied) ?? null,
        yearsOwned: num(r.years_owned) ?? null,
        ownerType: (str(r.owner_type) ?? 'unknown') as DerivedSignals['ownerType'],
        estateIndicator: bool(r.estate_indicator) ?? false,
        trustIndicator: bool(r.trust_indicator) ?? false,
        estimatedEquity: num(r.estimated_equity) ?? null,
        equityPercent: num(r.equity_percent) ?? null,
        equityBasis: (str(r.equity_basis) ?? 'unknown') as DerivedSignals['equityBasis'],
        likelyFreeAndClear: bool(r.likely_free_and_clear) ?? false,
      },
      events: byProp.get(String(r.id)) ?? [],
    }));
  }

  async setWaterDistance(
    propertyId: string,
    distanceFt: number | null,
    waterbodyName: string | null,
  ): Promise<void> {
    this.db
      .prepare('update properties set distance_to_water_ft = ?, waterbody_name = ? where id = ?')
      .run(b(distanceFt), b(waterbodyName), propertyId);
  }

  async stageOffer(propertyId: string, fields: Record<string, unknown>): Promise<void> {
    const ts = nowIso();
    // awaiting_approval is the terminal stage this system can set. Nothing here
    // can move a lead to offer_sent.
    const stage = String(fields.stage ?? 'awaiting_approval');
    if (stage === 'offer_sent') {
      throw new Error('offer_sent cannot be set by the pipeline. A human sends offers.');
    }
    this.db
      .prepare(
        `insert into offer_pipeline (id, property_id, stage, arv_estimate, repair_estimate,
            max_offer, offer_amount, offer_notes, terms, created_at, updated_at)
         values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         on conflict(property_id) do update set
           stage = excluded.stage,
           arv_estimate = coalesce(excluded.arv_estimate, offer_pipeline.arv_estimate),
           repair_estimate = coalesce(excluded.repair_estimate, offer_pipeline.repair_estimate),
           max_offer = coalesce(excluded.max_offer, offer_pipeline.max_offer),
           offer_amount = coalesce(excluded.offer_amount, offer_pipeline.offer_amount),
           offer_notes = coalesce(excluded.offer_notes, offer_pipeline.offer_notes),
           terms = coalesce(excluded.terms, offer_pipeline.terms),
           updated_at = excluded.updated_at`,
      )
      .run(
        crypto.randomUUID(), propertyId, stage, b(fields.arvEstimate), b(fields.repairEstimate),
        b(fields.maxOffer), b(fields.offerAmount), b(fields.offerNotes), b(fields.terms), ts, ts,
      );
  }

  async setGhlIds(propertyId: string, contactId?: string, opportunityId?: string): Promise<void> {
    this.db
      .prepare(
        `update offer_pipeline set
           ghl_contact_id = coalesce(?, ghl_contact_id),
           ghl_opportunity_id = coalesce(?, ghl_opportunity_id),
           updated_at = ?
         where property_id = ?`,
      )
      .run(b(contactId), b(opportunityId), nowIso(), propertyId);
  }

  async counts(): Promise<{ properties: number; events: number; scored: number }> {
    const one = (sql: string) => Number((this.db.prepare(sql).get() as { n: number }).n);
    return {
      properties: one('select count(*) as n from properties'),
      events: one('select count(*) as n from distress_events'),
      scored: one('select count(*) as n from lead_scores'),
    };
  }
}
