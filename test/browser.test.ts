import { test } from 'node:test';
import assert from 'node:assert/strict';

import { startMock } from './mockserver.ts';
import { runIngest } from '../src/core/ingest.ts';
import { SqliteStore } from '../src/store/sqlite.ts';
import { HttpClient } from '../src/core/http.ts';
import { extractTableRows, parseHtmlTables } from '../src/core/html.ts';
import { findBrowser, renderPages } from '../src/core/browser.ts';
import { htmlConnector } from '../src/connectors/html.ts';
import { browserConnector } from '../src/connectors/browser.ts';
import type { SourceConfig } from '../src/core/types.ts';

const AS_OF = '2026-08-24';

// Chromium ships with this environment. Where it does not, these skip rather than
// fail, because the rest of the pipeline does not depend on a browser.
let browserAvailable = true;
try { findBrowser(); } catch { browserAvailable = false; }

test('a table written inside a script tag is not mistaken for data', () => {
  const page = `<html><body><div id="app">loading</div>
    <script>var tpl = "<table><tr><th>Fake</th></tr><tr><td>template</td></tr></table>";</script>
    <table><tr><th>Real</th></tr><tr><td>data</td></tr></table></body></html>`;
  const tables = parseHtmlTables(page);
  assert.equal(tables.length, 1, 'only the rendered table counts');
  assert.equal(tables[0]![0]![0], 'Real');

  const commented = '<!-- <table><tr><td>old</td></tr></table> -->'
    + '<table><tr><th>H</th></tr><tr><td>v</td></tr></table>';
  assert.equal(parseHtmlTables(commented).length, 1, 'commented out markup is not data either');
});

test('a missing table explains itself and points at the browser connector', async (t) => {
  const mock = await startMock();
  t.after(async () => { await mock.close(); });

  // Plain HTTP against a JavaScript rendered portal returns a shell with no table.
  const shell = await new HttpClient({ minIntervalMs: 0 }).getText(`${mock.url}/portal`);
  assert.ok(shell.includes('Loading results'));
  assert.throws(
    () => extractTableRows(shell, { requireHeaders: ['case number'], sourceName: 'portal' }),
    /rendered by JavaScript, so try kind "browser"/,
    'the error should name the fix',
  );
});

test('the html connector fails usefully on a JavaScript rendered page', async (t) => {
  const mock = await startMock();
  t.after(async () => { await mock.close(); });

  const cfg: SourceConfig = {
    name: 'portal-http', kind: 'html', url: `${mock.url}/portal`,
    requireHeaders: ['case number'], minIntervalMs: 0,
  };
  await assert.rejects(
    () => htmlConnector.describe(cfg, new HttpClient({ minIntervalMs: 0 })),
    /kind "browser"/,
  );
});

test('the browser connector renders JavaScript and reads the results', { skip: !browserAvailable }, async (t) => {
  const mock = await startMock();
  t.after(async () => { await mock.close(); });

  const cfg: SourceConfig = {
    name: 'probate-portal',
    kind: 'browser',
    url: `${mock.url}/portal`,
    waitForSelector: '#cases',
    requireHeaders: ['case number'],
    minIntervalMs: 0,
  };

  const described = await browserConnector.describe(cfg, new HttpClient({ minIntervalMs: 0 }));
  assert.equal(described.recordCount, 3, 'all three cases should render');
  const names = described.fields.map((f) => f.name);
  assert.ok(names.includes('Case Number'));
  assert.ok(names.includes('Decedent Name'));
  assert.ok(described.notes.some((n) => n.includes('no scraping subscription')));
});

test('form steps drive a search before the results exist', { skip: !browserAvailable }, async (t) => {
  const mock = await startMock();
  t.after(async () => { await mock.close(); });

  // Without the right criteria the portal renders no table at all.
  const noCriteria = renderPages(`${mock.url}/portal-search`, {
    steps: [{ type: 'click', selector: '#go' }],
    waitMs: 200,
  });
  for await (const html of noCriteria) {
    assert.ok(html.includes('No criteria selected'), 'the guard page should show');
    assert.equal(parseHtmlTables(html).length, 0);
  }

  // Filling the form and submitting produces the docket.
  const cfg: SourceConfig = {
    name: 'probate-search',
    kind: 'browser',
    url: `${mock.url}/portal-search`,
    steps: [
      { type: 'type', selector: '#caseType', text: 'PROBATE' },
      { type: 'select', selector: '#county', text: 'DAVIDSON' },
      { type: 'click', selector: '#go' },
    ],
    waitForSelector: '#res',
    requireHeaders: ['case number'],
    minIntervalMs: 0,
  };
  const described = await browserConnector.describe(cfg, new HttpClient({ minIntervalMs: 0 }));
  assert.equal(described.recordCount, 2, 'the first page holds two results');
});

test('pagination clicks through and stops when the link runs out', { skip: !browserAvailable }, async (t) => {
  const mock = await startMock();
  t.after(async () => { await mock.close(); });

  const seen: string[] = [];
  for await (const html of renderPages(`${mock.url}/portal-search`, {
    steps: [
      { type: 'type', selector: '#caseType', text: 'PROBATE' },
      { type: 'select', selector: '#county', text: 'DAVIDSON' },
      { type: 'click', selector: '#go' },
    ],
    waitForSelector: '#res',
    nextSelector: '#next',
    maxPages: 5,
    waitMs: 120,
  })) {
    const rows = extractTableRows(html, { requireHeaders: ['case number'] });
    for (const r of rows) seen.push(r['Case Number']!);
  }
  // Three pages of two, and the fourth click finds no link so it stops.
  assert.equal(seen.length, 6, `expected six cases across three pages, got ${seen.join(',')}`);
  assert.equal(new Set(seen).size, 6, 'no page should be read twice');
  assert.ok(seen.includes('26P2000') && seen.includes('26P2005'));
});

test('a probate docket row merges onto the parcel it belongs to', { skip: !browserAvailable }, async (t) => {
  const mock = await startMock({ parcelCount: 400 });
  const store = new SqliteStore(':memory:');
  await store.init();
  t.after(async () => { await store.close(); await mock.close(); });

  // The parcel layer publishes 120 Oak Ave with an APN, an owner and a value.
  await runIngest({
    name: 'parcels', kind: 'arcgis', url: `${mock.url}/arcgis/parcels/0`,
    minIntervalMs: 0, pageSize: 1000, impliesEvents: [],
    defaults: { county: 'Davidson', state: 'TN', fips: '47037' },
  }, store, { asOf: AS_OF });
  const before = (await store.counts()).properties;

  // The docket publishes the same address as one string, with no APN at all.
  const probate = await runIngest({
    name: 'probate', kind: 'browser', url: `${mock.url}/portal`,
    waitForSelector: '#cases', requireHeaders: ['case number'], minIntervalMs: 0,
    impliesEvents: ['probate'],
    defaults: { county: 'Davidson', state: 'TN', fips: '47037' },
  }, store, { asOf: AS_OF });

  assert.equal(probate.recordsPulled, 3);
  assert.equal(probate.recordsNew, 0, 'every docket row should find its parcel');
  assert.equal(probate.recordsUpdated, 3);
  assert.equal((await store.counts()).properties, before, 'no duplicate rows created');

  // And the merged lead carries data from both sources.
  const merged = (await store.listLeads({ eventType: 'probate', limit: 5 }))[0]!;
  assert.equal(merged.sources.length, 2);
  assert.ok(merged.ownerName, 'owner name came from the parcel layer');
  assert.ok(merged.estimatedValue, 'value came from the parcel layer');
  assert.ok(merged.distressTypes.includes('probate'), 'the event came from the docket');
});

test('a rendered docket ingests into the pipeline like any other source', { skip: !browserAvailable }, async (t) => {
  const mock = await startMock();
  const store = new SqliteStore(':memory:');
  await store.init();
  t.after(async () => { await store.close(); await mock.close(); });

  const cfg: SourceConfig = {
    name: 'davidson-probate',
    kind: 'browser',
    url: `${mock.url}/portal`,
    waitForSelector: '#cases',
    requireHeaders: ['case number'],
    minIntervalMs: 0,
    impliesEvents: ['probate'],
    defaults: { county: 'Davidson', state: 'TN', fips: '47037' },
  };

  const res = await runIngest(cfg, store, { asOf: AS_OF });
  assert.equal(res.status, 'ok');
  assert.equal(res.recordsPulled, 3);
  assert.equal(res.recordsNew, 3);
  assert.equal(res.eventsCreated, 3);
  assert.equal(res.estimatedCostCents, 0, 'a local browser costs nothing per record');

  const leads = await store.listLeads({ eventType: 'probate', limit: 10 });
  assert.equal(leads.length, 3);
  // Source casing is preserved for display. Only matching is normalized.
  assert.ok(leads.every((l) => /oak ave/i.test(l.addressLine ?? '')));

  // The docket publishes one "Property Address" column holding the whole address.
  // City and zip must be recovered from it, because without them the dedupe key
  // falls back to a source id and this record could never join its parcel.
  const one = leads.find((l) => l.addressLine === '120 Oak Ave');
  assert.ok(one, `expected the street alone, saw ${leads.map((l) => l.addressLine).join(' | ')}`);
  assert.equal(one!.city, 'Nashville');
  assert.equal(one!.zip, '37201');
  assert.equal(one!.state, 'TN');
  assert.match(one!.dedupeKey, /^addr:120 OAK AVE:37201$/, 'keyed on address, so a parcel can match it');

  const events = await store.listEvents(leads[0]!.id);
  assert.equal(events[0]!.eventType, 'probate');
  const full = await store.getLead(leads[0]!.id);
  assert.equal(full!.county, 'Davidson');

  // And a probate lead with no equity data still scores and gets a strategy.
  assert.ok(leads.every((l) => l.overallScore != null));
  assert.ok(leads.every((l) => l.strategy));
});
