import { test } from 'node:test';
import assert from 'node:assert/strict';

import { startMock } from './mockserver.ts';
import {
  BudgetExceededError, centsToUsd, planSpend, spendThisMonth, type BudgetConfig,
} from '../src/core/budget.ts';
import { harvestContacts, normalizePhone, runSkipTrace, type SkipTraceVendor } from '../src/enrich/skiptrace.ts';
import { parseHtmlTables, selectTable, stripTags, tableToObjects } from '../src/core/html.ts';
import { runIngest } from '../src/core/ingest.ts';
import { SqliteStore } from '../src/store/sqlite.ts';
import { HttpClient } from '../src/core/http.ts';
import type { SourceConfig } from '../src/core/types.ts';

const AS_OF = '2026-08-24';
const NOW = new Date('2026-08-24T12:00:00Z');
const CAP: BudgetConfig = { monthlyCapUsd: 200, warnAtPercent: 75, hardStop: true };

function parcelSource(baseUrl: string): SourceConfig {
  return {
    name: 'parcels', kind: 'arcgis', url: `${baseUrl}/arcgis/parcels/0`,
    pageSize: 1000, minIntervalMs: 0, impliesEvents: [],
    defaults: { county: 'Davidson', state: 'TN', fips: '47037' },
  };
}

function vendor(baseUrl: string, cents = 10): SkipTraceVendor {
  return {
    name: 'mock-vendor',
    enabled: true,
    url: `${baseUrl}/skiptrace`,
    method: 'POST',
    apiKeyEnv: 'SKIPTRACE_API_KEY',
    authHeader: 'x-api-key',
    costPerRecordCents: cents,
    requestTemplate: {
      first_name: '{{firstName}}', last_name: '{{lastName}}',
      address: '{{address}}', city: '{{city}}', state: '{{state}}', zip: '{{zip}}',
    },
  };
}

test('free sources report zero spend, forever', async (t) => {
  const mock = await startMock({ parcelCount: 300 });
  const store = new SqliteStore(':memory:');
  await store.init();
  t.after(async () => { await store.close(); await mock.close(); });

  await runIngest(parcelSource(mock.url), store, { asOf: AS_OF });
  const snap = await spendThisMonth(store, CAP, NOW);
  assert.equal(snap.spentCents, 0);
  assert.equal(snap.remainingCents, 20_000);
  assert.equal(snap.percentUsed, 0);
  assert.equal(snap.projectedCents, 0);
});

test('planSpend allows what fits and warns near the cap', () => {
  const snap = {
    monthStart: '2026-08-01T00:00:00.000Z', capCents: 20_000, spentCents: 0,
    remainingCents: 20_000, percentUsed: 0, byJob: [], projectedCents: 0,
    daysElapsed: 24, daysInMonth: 31,
  };
  const ok = planSpend(snap, 100, 10, CAP);
  assert.equal(ok.allowed, 100);
  assert.equal(ok.plannedCents, 1000);
  assert.equal(ok.warning, undefined);

  // 1600 records at ten cents is 160 dollars, which is 80 percent of the cap.
  const warned = planSpend(snap, 1600, 10, CAP);
  assert.equal(warned.allowed, 1600);
  assert.match(warned.warning ?? '', /80 percent/);
});

test('a hard cap refuses to overspend rather than trimming', () => {
  const snap = {
    monthStart: '2026-08-01T00:00:00.000Z', capCents: 20_000, spentCents: 19_500,
    remainingCents: 500, percentUsed: 98, byJob: [], projectedCents: 20_000,
    daysElapsed: 24, daysInMonth: 31,
  };
  assert.throws(() => planSpend(snap, 100, 10, CAP), BudgetExceededError);
  assert.throws(() => planSpend(snap, 100, 10, CAP), /200\.00 already used|195\.00 already used/);

  // With hardStop off the same call is trimmed to what is left, 50 records.
  const soft = planSpend(snap, 100, 10, { ...CAP, hardStop: false });
  assert.equal(soft.allowed, 50);
  assert.equal(soft.trimmed, 50);
  assert.equal(soft.plannedCents, 500);

  // Nothing affordable is still an error even when soft, so zero is never
  // mistaken for success.
  const broke = { ...snap, spentCents: 20_000, remainingCents: 0 };
  assert.throws(() => planSpend(broke, 10, 10, { ...CAP, hardStop: false }), BudgetExceededError);
});

test('a free action is never blocked by the budget', () => {
  const broke = {
    monthStart: '2026-08-01T00:00:00.000Z', capCents: 20_000, spentCents: 20_000,
    remainingCents: 0, percentUsed: 100, byJob: [], projectedCents: 20_000,
    daysElapsed: 24, daysInMonth: 31,
  };
  const free = planSpend(broke, 5000, 0, CAP);
  assert.equal(free.allowed, 5000);
  assert.equal(free.plannedCents, 0);
});

test('phone normalization produces E.164 or nothing', () => {
  assert.equal(normalizePhone('(615) 555-0142'), '+16155550142');
  assert.equal(normalizePhone('615.555.0142'), '+16155550142');
  assert.equal(normalizePhone('16155550142'), '+16155550142');
  assert.equal(normalizePhone('555-0142'), null, 'seven digits is not a number we can dial');
  assert.equal(normalizePhone(''), null);
  assert.equal(normalizePhone(null), null);
});

test('contacts are harvested from a payload whose shape is unknown', () => {
  const payload = {
    output: {
      identity: {
        phones: [{ phoneNumber: '615-555-0101', type: 'Wireless' }, { number: '(615) 555-0102' }],
        emails: [{ email: 'A@B.com' }],
      },
      other: { contact: { mobile: '6155550103' } },
      // An eleven digit id under a key that says nothing about phones must not
      // be mistaken for a phone number.
      junk: { recordId: '12345678901' },
    },
  };
  const { phones, emails } = harvestContacts(payload);
  assert.deepEqual(phones.sort(), ['+16155550101', '+16155550102', '+16155550103']);
  assert.deepEqual(emails, ['a@b.com'], 'emails are lowercased and deduped');
  assert.ok(!phones.includes('+12345678901'));

  assert.deepEqual(harvestContacts({}), { phones: [], emails: [] });
  assert.deepEqual(harvestContacts(null), { phones: [], emails: [] });
});

test('skip trace is a dry run by default and spends nothing', async (t) => {
  const mock = await startMock({ parcelCount: 40 });
  const store = new SqliteStore(':memory:');
  await store.init();
  t.after(async () => { await store.close(); await mock.close(); });
  process.env.SKIPTRACE_API_KEY = 'test-key';

  await runIngest(parcelSource(mock.url), store, { asOf: AS_OF });
  const leads = (await store.listLeads({ limit: 20 })).filter((l) => l.ownerName);

  const dry = await runSkipTrace(leads, store, vendor(mock.url), CAP, { dryRun: true, now: NOW });
  assert.equal(dry.traced, 0);
  assert.equal(dry.costCents, leads.length * 10);
  assert.ok(dry.warnings.some((w) => w.includes('Nothing was spent')));

  // Nothing was written and nothing was billed.
  assert.equal(await store.getOwner(leads[0]!.id), null);
  assert.equal((await spendThisMonth(store, CAP, NOW)).spentCents, 0);
});

test('a confirmed skip trace stores contacts, records cost, and caches', async (t) => {
  const mock = await startMock({ parcelCount: 40 });
  const store = new SqliteStore(':memory:');
  await store.init();
  t.after(async () => { await store.close(); await mock.close(); });
  process.env.SKIPTRACE_API_KEY = 'test-key';

  await runIngest(parcelSource(mock.url), store, { asOf: AS_OF });
  const leads = (await store.listLeads({ limit: 5 })).filter((l) => l.ownerName);

  const run = await runSkipTrace(leads, store, vendor(mock.url), CAP, {
    http: new HttpClient({ minIntervalMs: 0 }), now: NOW,
  });
  assert.equal(run.traced, leads.length);
  assert.equal(run.hits, leads.length);
  assert.equal(run.costCents, leads.length * 10);
  assert.ok(run.phonesFound >= leads.length * 2);
  assert.deepEqual(run.errors, []);

  const owner = await store.getOwner(leads[0]!.id);
  assert.ok(owner, 'a contact row should exist now');
  assert.ok(owner!.phones.every((p) => p.startsWith('+1')));
  assert.equal(owner!.skipTraceCostCents, 10);
  assert.equal(owner!.source, 'mock-vendor');

  // The spend is visible in the same ledger as everything else.
  const snap = await spendThisMonth(store, CAP, NOW);
  assert.equal(snap.spentCents, leads.length * 10);
  assert.ok(snap.byJob.some((j) => j.jobName === 'skip-trace'));

  // A second run inside the cache window costs nothing.
  const again = await runSkipTrace(leads, store, vendor(mock.url), CAP, {
    http: new HttpClient({ minIntervalMs: 0 }), now: NOW,
  });
  assert.equal(again.fromCache, leads.length);
  assert.equal(again.traced, 0);
  assert.equal(again.costCents, 0);
  assert.equal((await spendThisMonth(store, CAP, NOW)).spentCents, leads.length * 10);
});

test('skip trace respects the per invocation cap and the monthly budget', async (t) => {
  const mock = await startMock({ parcelCount: 200 });
  const store = new SqliteStore(':memory:');
  await store.init();
  t.after(async () => { await store.close(); await mock.close(); });
  process.env.SKIPTRACE_API_KEY = 'test-key';

  await runIngest(parcelSource(mock.url), store, { asOf: AS_OF });
  const leads = (await store.listLeads({ limit: 200 })).filter((l) => l.ownerName);
  assert.ok(leads.length > 60, 'need more leads than the cap for this to mean anything');

  const capped = await runSkipTrace(leads, store, vendor(mock.url), CAP, {
    maxRecords: 10, http: new HttpClient({ minIntervalMs: 0 }), now: NOW,
  });
  assert.equal(capped.traced, 10, 'the per run cap is a hard limit');
  assert.ok(capped.warnings.some((w) => w.includes('cap is 10')));

  // A tiny monthly cap refuses outright rather than quietly tracing a few.
  const tiny: BudgetConfig = { monthlyCapUsd: 1.0, hardStop: true };
  await assert.rejects(
    () => runSkipTrace(leads.slice(20), store, vendor(mock.url, 10), tiny, {
      maxRecords: 50, http: new HttpClient({ minIntervalMs: 0 }), now: NOW,
    }),
    BudgetExceededError,
    'fifty records at ten cents exceeds a one dollar cap',
  );
});

test('a record with no owner name is never billed for', async (t) => {
  const mock = await startMock({ parcelCount: 10 });
  const store = new SqliteStore(':memory:');
  await store.init();
  t.after(async () => { await store.close(); await mock.close(); });
  process.env.SKIPTRACE_API_KEY = 'test-key';

  await runIngest(parcelSource(mock.url), store, { asOf: AS_OF });
  const leads = await store.listLeads({ limit: 10 });
  const anonymised = leads.map((l) => ({ ...l, ownerName: undefined }));

  const run = await runSkipTrace(anonymised, store, vendor(mock.url), CAP, {
    http: new HttpClient({ minIntervalMs: 0 }), now: NOW,
  });
  assert.equal(run.skippedNoName, anonymised.length);
  assert.equal(run.traced, 0);
  assert.equal(run.costCents, 0);
});

test('a miss is still billable and still recorded, so cost never hides', async (t) => {
  const mock = await startMock({ parcelCount: 10 });
  const store = new SqliteStore(':memory:');
  await store.init();
  t.after(async () => { await store.close(); await mock.close(); });
  process.env.SKIPTRACE_API_KEY = 'test-key';

  await runIngest(parcelSource(mock.url), store, { asOf: AS_OF });
  const lead = (await store.listLeads({ limit: 1 }))[0]!;
  // The mock returns an empty identity for this surname.
  const miss = { ...lead, ownerName: 'NOBODY SOMEONE' };

  const run = await runSkipTrace([miss], store, vendor(mock.url), CAP, {
    http: new HttpClient({ minIntervalMs: 0 }), now: NOW,
  });
  assert.equal(run.traced, 1);
  assert.equal(run.hits, 0, 'no contacts came back');
  assert.equal(run.costCents, 10, 'but the record was still billed');
  assert.equal((await spendThisMonth(store, CAP, NOW)).spentCents, 10);
});

test('html tables are parsed, selected by header, and turned into records', () => {
  const html = `<html><body>
    <table id="nav"><tr><td>Home</td></tr></table>
    <table><thead><tr><th>Sale Date</th><th>Property Address</th><th>Trustee</th></tr></thead>
    <tbody>
      <tr><td>09/15/2026</td><td>123 Main St<br/>Nashville, TN 37201</td><td>Wilson &amp; Assoc.</td></tr>
      <tr><td>09/22/2026</td><td>99 Oak Ave</td><td>Rubin &#38; Lublin</td></tr>
    </tbody></table></body></html>`;

  const tables = parseHtmlTables(html);
  assert.equal(tables.length, 2);

  // Header matching skips the navigation table without knowing its index.
  const chosen = selectTable(tables, { requireHeaders: ['sale date', 'address'] });
  assert.ok(chosen);
  const rows = tableToObjects(chosen!);
  assert.equal(rows.length, 2);
  assert.equal(rows[0]!['Sale Date'], '09/15/2026');
  assert.equal(rows[0]!['Property Address'], '123 Main St Nashville, TN 37201');
  assert.equal(rows[0]!['Trustee'], 'Wilson & Assoc.', 'entities are decoded');
  assert.equal(rows[1]!['Trustee'], 'Rubin & Lublin', 'numeric entities too');

  assert.equal(selectTable(tables, { requireHeaders: ['nope'] }), null);
  assert.equal(stripTags('<b>a</b>&nbsp;<i>b</i>'), 'a b');
});

test('the html connector ingests a trustee sale list end to end', async (t) => {
  const mock = await startMock();
  const store = new SqliteStore(':memory:');
  await store.init();
  t.after(async () => { await store.close(); await mock.close(); });

  const cfg: SourceConfig = {
    name: 'tn-foreclosure',
    kind: 'html',
    url: `${mock.url}/notices`,
    requireHeaders: ['address'],
    minIntervalMs: 0,
    impliesEvents: ['foreclosure'],
    defaults: { state: 'TN', county: 'Davidson', fips: '47037' },
  };

  const res = await runIngest(cfg, store, { asOf: AS_OF });
  assert.equal(res.status, 'ok');
  assert.equal(res.recordsPulled, 12);
  assert.equal(res.recordsNew, 12);
  assert.equal(res.eventsCreated, 12);
  assert.equal(res.estimatedCostCents, 0, 'a public notice page is free');

  const leads = await store.listLeads({ eventType: 'foreclosure', limit: 20 });
  assert.equal(leads.length, 12);
  assert.ok(leads[0]!.addressLine?.includes('Oak Ave'));

  // The sale date should land as an auction date, which is what drives urgency.
  const events = await store.listEvents(leads[0]!.id);
  assert.equal(events[0]!.eventType, 'foreclosure');
  assert.ok(events[0]!.auctionDate, 'a trustee sale notice carries a sale date');
  assert.match(events[0]!.auctionDate!, /^2026-09-\d\d$/);

  // And the scorer should treat an imminent auction as a cash play.
  assert.equal(leads[0]!.strategy, 'cash_wholesale');
});

test('spend formatting', () => {
  assert.equal(centsToUsd(0), '$0.00');
  assert.equal(centsToUsd(1234), '$12.34');
  assert.equal(centsToUsd(20_000), '$200.00');
});
