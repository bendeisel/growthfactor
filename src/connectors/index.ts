import type { HttpClient } from '../core/http.ts';
import type { SourceField } from '../core/fieldmap.ts';
import type { RawRecord, SourceConfig } from '../core/types.ts';

export interface DescribeResult {
  label: string;
  fields: SourceField[];
  recordCount?: number;
  notes: string[];
}

export interface PageOptions {
  limit?: number;
}

export interface Connector {
  kind: SourceConfig['kind'];
  /** Ask the endpoint what it holds. Never assume a schema. */
  describe(cfg: SourceConfig, http: HttpClient): Promise<DescribeResult>;
  pages(cfg: SourceConfig, http: HttpClient, opts: PageOptions): AsyncGenerator<RawRecord[]>;
  /** Public records are free. Only vendor connectors override this. */
  defaultCostPerRecordCents: number;
}

/** Derive a field list by sampling records, for APIs that publish no schema. */
export function sampleFields(records: RawRecord[]): SourceField[] {
  const names = new Set<string>();
  for (const r of records.slice(0, 50)) for (const k of Object.keys(r)) names.add(k);
  return [...names].map((name) => ({ name }));
}

/** Flatten one level of nesting so vendor payloads with sub-objects still map. */
export function flatten(rec: RawRecord, prefix = ''): RawRecord {
  const out: RawRecord = {};
  for (const [k, v] of Object.entries(rec)) {
    const key = prefix ? `${prefix}_${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      Object.assign(out, flatten(v as RawRecord, key));
    } else {
      out[key] = v;
    }
  }
  return out;
}
