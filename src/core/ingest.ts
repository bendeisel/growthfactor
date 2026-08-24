// Ingest orchestration.
//
// One source, one invocation, one ingest_runs row. The flow is always:
//   ask the endpoint what fields it has -> resolve them onto canonical fields ->
//   page through records -> upsert the parcel -> append distress events -> score.
//
// Skip trace is never called here. Nothing in this file spends money per record.

import { connectorFor, costPerRecordCents } from '../connectors/registry.ts';
import { EVENT_FIELD_SPECS, FIELD_SPECS, applyMapping, resolveFieldMap, toProperty } from './fieldmap.ts';
import type { MappingReport } from './fieldmap.ts';
import { DEFAULT_EQUITY_MODEL, derive, type EquityModelConfig } from './derive.ts';
import { HttpClient } from './http.ts';
import { scoreLead } from './score.ts';
import type { Store } from '../store/index.ts';
import type {
  DistressEventInput, DistressType, RawRecord, RunStats, SourceConfig,
} from './types.ts';
import { DISTRESS_TYPES } from './types.ts';

export interface IngestOptions {
  limit?: number;
  dryRun?: boolean;
  asOf?: string;
  equityModel?: EquityModelConfig;
  onProgress?: (msg: string) => void;
}

export interface IngestResult extends RunStats {
  mapping: MappingReport;
  eventMapping: MappingReport;
  recordsSkipped: number;
  sourceLabel: string;
  sourceRecordCount?: number;
  notes: string[];
}

/** Decide which distress event types a raw record implies. */
function eventTypesFor(cfg: SourceConfig, raw: RawRecord): DistressType[] {
  const types = new Set<DistressType>(
    (cfg.impliesEvents ?? []).filter((t) => DISTRESS_TYPES.includes(t)),
  );

  const rule = cfg.eventTypeFrom as
    | { field: string; map?: Record<string, string>; default?: string }
    | undefined;
  if (rule?.field) {
    const value = String(raw[rule.field] ?? '').toUpperCase();
    let matched = false;
    for (const [needle, type] of Object.entries(rule.map ?? {})) {
      if (value && value.includes(needle.toUpperCase()) && DISTRESS_TYPES.includes(type as DistressType)) {
        types.add(type as DistressType);
        matched = true;
      }
    }
    if (!matched && rule.default && DISTRESS_TYPES.includes(rule.default as DistressType)) {
      types.add(rule.default as DistressType);
    }
  }
  return [...types];
}

export async function runIngest(
  cfg: SourceConfig,
  store: Store,
  opts: IngestOptions = {},
): Promise<IngestResult> {
  const asOf = opts.asOf ?? new Date().toISOString().slice(0, 10);
  const equityModel = opts.equityModel ?? DEFAULT_EQUITY_MODEL;
  const log = opts.onProgress ?? (() => {});
  const connector = connectorFor(cfg);
  const http = new HttpClient({
    minIntervalMs: Number(cfg.minIntervalMs ?? 250),
    retries: Number(cfg.retries ?? 3),
  });

  const stats: RunStats = {
    jobName: cfg.name,
    county: cfg.defaults?.county ?? (cfg.county as string | undefined),
    state: cfg.defaults?.state ?? (cfg.state as string | undefined),
    startedAt: new Date().toISOString(),
    status: 'running',
    recordsPulled: 0,
    recordsNew: 0,
    recordsUpdated: 0,
    eventsCreated: 0,
    apiCalls: 0,
    estimatedCostCents: 0,
  };

  const described = await connector.describe(cfg, http);
  log(`${cfg.name}: ${described.label}, ${described.fields.length} fields${described.recordCount != null ? `, ${described.recordCount} records available` : ''}`);
  for (const n of described.notes) log(`  note: ${n}`);

  const mapping = resolveFieldMap(described.fields, FIELD_SPECS, cfg.fieldMap ?? {});
  const eventMapping = resolveFieldMap(
    described.fields,
    EVENT_FIELD_SPECS,
    (cfg.eventFieldMap as Record<string, string>) ?? {},
  );
  if (mapping.missingImportant.length) {
    log(`  unmapped important fields: ${mapping.missingImportant.join(', ')}`);
  }

  const runId = opts.dryRun ? 'dry-run' : await store.startRun(stats);
  const touched = new Set<string>();
  let recordsSkipped = 0;
  const notes = [...described.notes];

  try {
    outer: for await (const page of connector.pages(cfg, http, { limit: opts.limit })) {
      for (const raw of page) {
        if (opts.limit && stats.recordsPulled >= opts.limit) break outer;
        stats.recordsPulled++;

        const property = toProperty(raw, mapping.mapping, cfg.name, cfg.defaults);
        // A record with neither an address nor a parcel number cannot be matched
        // to anything, so it is counted and dropped rather than stored as noise.
        if (!property.addressLine && !property.apn) {
          recordsSkipped++;
          continue;
        }

        const derived = derive(property, asOf, equityModel);
        if (opts.dryRun) {
          touched.add(derived.dedupeKey);
          continue;
        }

        const { id, isNew } = await store.upsertProperty(property, derived);
        if (isNew) stats.recordsNew++;
        else if (!touched.has(id)) stats.recordsUpdated++;
        touched.add(id);

        const eventBase = applyMapping(raw, eventMapping.mapping, EVENT_FIELD_SPECS);
        for (const eventType of eventTypesFor(cfg, raw)) {
          const ev: DistressEventInput = {
            ...(eventBase as Partial<DistressEventInput>),
            eventType,
            source: cfg.name,
            raw,
          };
          const { created } = await store.recordEvent(id, ev);
          if (created) stats.eventsCreated++;
        }
      }
      log(`  ${stats.recordsPulled} records processed`);
    }
    stats.status = 'ok';
  } catch (err) {
    // Partial failure still writes the run row with the error text, per the spec.
    stats.status = stats.recordsPulled > 0 ? 'partial' : 'error';
    stats.error = (err as Error).message;
    log(`  ERROR: ${stats.error}`);
  }

  stats.apiCalls = http.calls;
  stats.estimatedCostCents = Math.round(stats.recordsPulled * costPerRecordCents(cfg));
  stats.finishedAt = new Date().toISOString();

  if (!opts.dryRun) {
    await store.finishRun(runId, stats);
    // Rescoring is free, so touched leads are always left with fresh scores.
    const all = await store.allForScoring();
    for (const row of all) {
      if (!touched.has(row.id)) continue;
      await store.saveScores(row.id, scoreLead(row.property, row.derived, row.events, asOf));
    }
  }

  return {
    ...stats,
    mapping,
    eventMapping,
    recordsSkipped,
    sourceLabel: described.label,
    sourceRecordCount: described.recordCount,
    notes,
  };
}
