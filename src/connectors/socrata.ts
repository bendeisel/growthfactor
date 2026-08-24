// Socrata open data connector.
//
// Cities and counties run Socrata portals (data.nashville.gov, data.cityofchicago.org,
// and hundreds more) publishing code enforcement cases, condemnations, demolition
// orders, vacant property registries and tax delinquency. All free, all queryable
// with SoQL. An app token is optional and only raises the rate limit.

import { qs, type HttpClient } from '../core/http.ts';
import type { SourceField } from '../core/fieldmap.ts';
import type { RawRecord, SourceConfig } from '../core/types.ts';
import type { Connector, DescribeResult, PageOptions } from './index.ts';
import { getEnv } from '../core/env.ts';

interface SocrataView {
  name?: string;
  description?: string;
  columns?: Array<{ fieldName?: string; name?: string; dataTypeName?: string }>;
}

function base(cfg: SourceConfig): { origin: string; dataset: string } {
  const domain = String(cfg.domain ?? '').replace(/^https?:\/\//, '').replace(/\/+$/, '');
  const dataset = String(cfg.datasetId ?? cfg.dataset ?? '');
  if (!domain || !dataset) {
    throw new Error(`source ${cfg.name}: socrata needs "domain" and "datasetId"`);
  }
  // baseUrl lets a test or a proxy point the connector somewhere other than the
  // live portal. Everything else assumes https, which Socrata requires.
  const origin = String(cfg.baseUrl ?? `https://${domain}`).replace(/\/+$/, '');
  return { origin, dataset };
}

function tokenHeaders(): Record<string, string> {
  const token = getEnv('SOCRATA_APP_TOKEN');
  return token ? { 'X-App-Token': token } : {};
}

export const socrataConnector: Connector = {
  kind: 'socrata',
  defaultCostPerRecordCents: 0,

  async describe(cfg, http): Promise<DescribeResult> {
    const { origin, dataset } = base(cfg);
    const notes: string[] = [];
    let fields: SourceField[] = [];
    let label = cfg.label ?? cfg.name;

    try {
      const view = await http.getJson<SocrataView>(
        `${origin}/api/views/${dataset}.json`,
        { headers: tokenHeaders() },
      );
      label = view.name ?? label;
      fields = (view.columns ?? [])
        .filter((c) => c.fieldName)
        .map((c) => ({ name: c.fieldName!, alias: c.name, type: c.dataTypeName }));
    } catch (err) {
      notes.push(`view metadata unavailable (${(err as Error).message}), sampling rows instead`);
    }

    if (!fields.length) {
      const sample = await http.getJson<RawRecord[]>(
        `${origin}/resource/${dataset}.json?${qs({ $limit: 5 })}`,
        { headers: tokenHeaders() },
      );
      const names = new Set<string>();
      for (const r of sample) for (const k of Object.keys(r)) names.add(k);
      fields = [...names].map((name) => ({ name }));
    }

    let recordCount: number | undefined;
    try {
      const params: Record<string, string | number | undefined> = { $select: 'count(1) as n' };
      if (cfg.where) params.$where = String(cfg.where);
      const cnt = await http.getJson<Array<Record<string, string>>>(
        `${origin}/resource/${dataset}.json?${qs(params)}`,
        { headers: tokenHeaders() },
      );
      const n = Number(cnt[0]?.n);
      if (Number.isFinite(n)) recordCount = n;
    } catch (err) {
      notes.push(`count query failed: ${(err as Error).message}`);
    }

    if (!tokenHeaders()['X-App-Token']) {
      notes.push('no SOCRATA_APP_TOKEN set, requests are throttled but still free');
    }
    return { label, fields, recordCount, notes };
  },

  async *pages(cfg, http, opts: PageOptions): AsyncGenerator<RawRecord[]> {
    const { origin, dataset } = base(cfg);
    const pageSize = Math.min(Number(cfg.pageSize ?? 1000) || 1000, 50_000);
    let offset = 0;
    let emitted = 0;

    for (;;) {
      const params: Record<string, string | number | undefined> = {
        $limit: pageSize,
        $offset: offset,
        // Ordering by the internal row id keeps paging stable while data changes.
        $order: String(cfg.order ?? ':id'),
      };
      if (cfg.where) params.$where = String(cfg.where);
      if (cfg.select) params.$select = String(cfg.select);

      const rows = await http.getJson<RawRecord[]>(
        `${origin}/resource/${dataset}.json?${qs(params)}`,
        { headers: tokenHeaders() },
      );
      if (!Array.isArray(rows) || !rows.length) return;

      yield rows;
      emitted += rows.length;
      offset += rows.length;
      if (opts.limit && emitted >= opts.limit) return;
      if (rows.length < pageSize) return;
    }
  },
};
