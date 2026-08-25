// Browser connector, for public records portals that render with JavaScript.
//
// Same contract as every other connector: it produces rows, the field mapper works
// out the columns, and the rest of the pipeline never knows the difference. The only
// distinction is that a real browser renders the page first, which is what makes a
// modern court docket search reachable.
//
// Costs nothing. It drives a Chromium already on the machine over the DevTools
// protocol, so there is no scraping subscription in the loop.
//
// Read docs/SCRAPING.md before pointing this at a court site. Two rules matter:
// prefer an official bulk data request over scraping when one is available, and do
// not point this at a portal that required you to agree to terms or log in.

import { renderPages, type RenderOptions, type Step } from '../core/browser.ts';
import { extractTableRows } from '../core/html.ts';
import type { RawRecord, SourceConfig } from '../core/types.ts';
import type { Connector, DescribeResult, PageOptions } from './index.ts';
import { sampleFields } from './index.ts';

function target(cfg: SourceConfig): string {
  const url = String(cfg.url ?? '');
  if (!url) throw new Error(`source ${cfg.name}: needs "url"`);
  if (url.includes('REPLACE_ME')) {
    throw new Error(
      `source ${cfg.name}: the url is still a placeholder. Open the portal in a normal `
      + `browser, run the search you want, and paste the results url here.`,
    );
  }
  return url;
}

function renderOptions(cfg: SourceConfig, opts: PageOptions): RenderOptions {
  return {
    waitForSelector: cfg.waitForSelector as string | undefined,
    waitMs: cfg.waitMs as number | undefined,
    steps: cfg.steps as Step[] | undefined,
    nextSelector: cfg.nextSelector as string | undefined,
    maxPages: opts.limit ? undefined : (cfg.maxPages as number | undefined) ?? 1,
    timeoutMs: cfg.timeoutMs as number | undefined,
  };
}

async function firstPageRows(cfg: SourceConfig): Promise<RawRecord[]> {
  for await (const html of renderPages(
    target(cfg),
    { ...renderOptions(cfg, {}), maxPages: 1 },
    cfg.browserPath as string | undefined,
  )) {
    return extractTableRows(html, {
      tableIndex: cfg.tableIndex as number | undefined,
      requireHeaders: cfg.requireHeaders as string[] | undefined,
      sourceName: cfg.name,
      origin: target(cfg),
    }) as RawRecord[];
  }
  return [];
}

export const browserConnector: Connector = {
  kind: 'browser',
  defaultCostPerRecordCents: 0,

  async describe(cfg): Promise<DescribeResult> {
    const rows = await firstPageRows(cfg);
    const notes = [
      'rendered in a local headless browser, so no scraping subscription is involved',
      'a portal redesign can break this, which is why requireHeaders beats tableIndex',
    ];
    if (!cfg.steps) {
      notes.push('no form steps configured, so this reads whatever the url returns directly');
    }
    if (cfg.nextSelector) notes.push(`will page by clicking ${String(cfg.nextSelector)}`);
    if (!rows.length) notes.push('the table parsed but held no data rows, check the search filters');
    return {
      label: cfg.label ?? cfg.name,
      fields: sampleFields(rows),
      recordCount: rows.length,
      notes,
    };
  },

  async *pages(cfg, _http, opts: PageOptions): AsyncGenerator<RawRecord[]> {
    let emitted = 0;
    const maxPages = (cfg.maxPages as number | undefined) ?? 1;
    for await (const html of renderPages(
      target(cfg),
      { ...renderOptions(cfg, opts), maxPages },
      cfg.browserPath as string | undefined,
    )) {
      const rows = extractTableRows(html, {
        tableIndex: cfg.tableIndex as number | undefined,
        requireHeaders: cfg.requireHeaders as string[] | undefined,
        sourceName: cfg.name,
        origin: target(cfg),
      }) as RawRecord[];
      if (!rows.length) return;
      const slice = opts.limit ? rows.slice(0, Math.max(0, opts.limit - emitted)) : rows;
      if (!slice.length) return;
      yield slice;
      emitted += slice.length;
      if (opts.limit && emitted >= opts.limit) return;
    }
  },
};
