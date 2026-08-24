// Plain CSV over HTTP.
//
// Many county trustees and sheriffs publish the delinquent tax roll or the
// monthly sale list as a single CSV or as an Excel export saved to CSV. No API,
// no key, and often the highest signal list in the county.

import { csvToObjects } from '../core/csv.ts';
import type { RawRecord, SourceConfig } from '../core/types.ts';
import type { Connector, DescribeResult, PageOptions } from './index.ts';
import { sampleFields } from './index.ts';

export const csvConnector: Connector = {
  kind: 'csv',
  defaultCostPerRecordCents: 0,

  async describe(cfg, http): Promise<DescribeResult> {
    const url = String(cfg.url ?? '');
    if (!url) throw new Error(`source ${cfg.name}: missing "url"`);
    const text = await http.getText(url);
    const rows = csvToObjects(text, String(cfg.delimiter ?? ','));
    return {
      label: cfg.label ?? cfg.name,
      fields: sampleFields(rows as RawRecord[]),
      recordCount: rows.length,
      notes: rows.length ? [] : ['file parsed but contained no data rows'],
    };
  },

  async *pages(cfg, http, opts: PageOptions): AsyncGenerator<RawRecord[]> {
    const url = String(cfg.url ?? '');
    const text = await http.getText(url);
    const rows = csvToObjects(text, String(cfg.delimiter ?? ',')) as RawRecord[];
    const pageSize = Number(cfg.pageSize ?? 500) || 500;
    const capped = opts.limit ? rows.slice(0, opts.limit) : rows;
    for (let i = 0; i < capped.length; i += pageSize) {
      yield capped.slice(i, i + pageSize);
    }
  },
};
