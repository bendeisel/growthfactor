// HTML table connector.
//
// For public data published as a page rather than an API: trustee and sheriff sale
// notices, delinquent tax rolls, condemnation lists. Free, and often the least
// competed data in a county because pulling it takes effort.

import type { HttpClient } from '../core/http.ts';
import { extractTableRows } from '../core/html.ts';
import type { RawRecord, SourceConfig } from '../core/types.ts';
import type { Connector, DescribeResult, PageOptions } from './index.ts';
import { sampleFields } from './index.ts';

function urlsFor(cfg: SourceConfig): string[] {
  if (Array.isArray(cfg.urls) && cfg.urls.length) return (cfg.urls as string[]).map(String);
  const single = String(cfg.url ?? '');
  if (!single) throw new Error(`source ${cfg.name}: needs "url" or "urls"`);
  if (single.includes('REPLACE_ME')) {
    throw new Error(
      `source ${cfg.name}: the url is still a placeholder. Open the site, find the page `
      + `that lists the notices, and paste its url here.`,
    );
  }
  // urlTemplate style paging, for example ?page={{page}}
  const pages = Number(cfg.pages ?? 0);
  if (pages > 1 && single.includes('{{page}}')) {
    return Array.from({ length: pages }, (_, i) => single.replace(/\{\{page\}\}/g, String(i + 1)));
  }
  return [single.replace(/\{\{page\}\}/g, '1')];
}

async function rowsFor(cfg: SourceConfig, http: HttpClient, url: string): Promise<RawRecord[]> {
  const html = await http.getText(url);
  return extractTableRows(html, {
    tableIndex: cfg.tableIndex as number | undefined,
    requireHeaders: cfg.requireHeaders as string[] | undefined,
    sourceName: cfg.name,
    origin: url,
  }) as RawRecord[];
}

export const htmlConnector: Connector = {
  kind: 'html',
  defaultCostPerRecordCents: 0,

  async describe(cfg, http): Promise<DescribeResult> {
    const [first] = urlsFor(cfg);
    const rows = await rowsFor(cfg, http, first!);
    const notes = ['parsed from an HTML table, so a page redesign can break it'];
    if (!cfg.requireHeaders) {
      notes.push('set requireHeaders to match on column names instead of a table index, which survives redesigns');
    }
    return {
      label: cfg.label ?? cfg.name,
      fields: sampleFields(rows),
      recordCount: rows.length,
      notes,
    };
  },

  async *pages(cfg, http, opts: PageOptions): AsyncGenerator<RawRecord[]> {
    let emitted = 0;
    for (const url of urlsFor(cfg)) {
      const rows = await rowsFor(cfg, http, url);
      if (!rows.length) return;
      const slice = opts.limit ? rows.slice(0, Math.max(0, opts.limit - emitted)) : rows;
      if (!slice.length) return;
      yield slice;
      emitted += slice.length;
      if (opts.limit && emitted >= opts.limit) return;
    }
  },
};
