// RealEstateAPI connector. OPTIONAL AND PAID.
//
// Disabled by default. The free public sources cover pre-foreclosure, REO, tax
// delinquency, code enforcement and probate-adjacent signals at zero cost, so this
// exists only for the case where paying for national coverage becomes worth it.
//
// Field names are deliberately NOT hardcoded here. The live request and response
// schema was not readable when this was written, so the connector samples one
// record and hands the keys to the same runtime field mapper every other source
// uses. That means it keeps working even if the vendor renames a column, and it
// means nothing in this file depends on a guessed field name.

import type { HttpClient } from '../core/http.ts';
import type { RawRecord, SourceConfig } from '../core/types.ts';
import type { Connector, DescribeResult, PageOptions } from './index.ts';
import { flatten, sampleFields } from './index.ts';
import { getEnv } from '../core/env.ts';

function apiKey(): string {
  const k = getEnv('REAPI_API_KEY');
  if (!k) throw new Error('REAPI_API_KEY is not set. This connector costs money and is opt in.');
  return k;
}

function endpoint(cfg: SourceConfig): string {
  const baseUrl = String(cfg.baseUrl ?? 'https://api.realestateapi.com');
  const path = String(cfg.path ?? '/v2/PropertySearch');
  return `${baseUrl.replace(/\/+$/, '')}${path}`;
}

/** Pull the record array out of whatever envelope the vendor uses. */
function extractRecords(body: unknown, recordsPath?: string): RawRecord[] {
  if (Array.isArray(body)) return body as RawRecord[];
  if (!body || typeof body !== 'object') return [];
  const obj = body as Record<string, unknown>;
  if (recordsPath) {
    let cur: unknown = obj;
    for (const seg of recordsPath.split('.')) {
      cur = (cur as Record<string, unknown> | undefined)?.[seg];
    }
    if (Array.isArray(cur)) return cur as RawRecord[];
  }
  for (const key of ['data', 'records', 'results', 'properties', 'items']) {
    const v = obj[key];
    if (Array.isArray(v)) return v as RawRecord[];
  }
  return [];
}

async function post(
  http: HttpClient,
  cfg: SourceConfig,
  body: Record<string, unknown>,
): Promise<unknown> {
  return http.getJson(endpoint(cfg), {
    method: 'POST',
    headers: { 'x-api-key': apiKey(), 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export const reapiConnector: Connector = {
  kind: 'reapi',
  // Set explicitly per plan in the source config. Left at zero so an unconfigured
  // run never silently reports fake spend.
  defaultCostPerRecordCents: 0,

  async describe(cfg, http): Promise<DescribeResult> {
    const query = (cfg.query ?? {}) as Record<string, unknown>;
    const body = { ...query, size: 1, resultIndex: 0 };
    const res = await post(http, cfg, body);
    const records = extractRecords(res, cfg.recordsPath as string | undefined).map((r) => flatten(r));
    const notes = [
      'PAID SOURCE. Every record pulled here may be billable under your plan.',
      'Schema is discovered by sampling, not hardcoded. Check the mapping below before a full pull.',
    ];
    if (!records.length) notes.push('sample returned no records, check the query filters');
    return {
      label: cfg.label ?? cfg.name,
      fields: sampleFields(records),
      recordCount: undefined,
      notes,
    };
  },

  async *pages(cfg, http, opts: PageOptions): AsyncGenerator<RawRecord[]> {
    const query = (cfg.query ?? {}) as Record<string, unknown>;
    const pageSize = Number(cfg.pageSize ?? 250) || 250;
    let resultIndex = 0;
    let emitted = 0;

    for (;;) {
      const res = await post(http, cfg, { ...query, size: pageSize, resultIndex });
      const records = extractRecords(res, cfg.recordsPath as string | undefined).map((r) => flatten(r));
      if (!records.length) return;
      yield records;
      emitted += records.length;
      resultIndex += records.length;
      if (opts.limit && emitted >= opts.limit) return;
      if (records.length < pageSize) return;
    }
  },
};
