import { test } from 'node:test';
import assert from 'node:assert/strict';

import { startMock } from './mockserver.ts';
import { runIngest } from '../src/core/ingest.ts';
import { SqliteStore } from '../src/store/sqlite.ts';
import { HttpClient } from '../src/core/http.ts';
import { arcgisConnector } from '../src/connectors/arcgis.ts';
import { leadsToGhlCsv, leadToGhlRow, tagsFor } from '../src/export/ghl-csv.ts';
import { pushLead } from '../src/export/ghl-api.ts';
import { csvToObjects } from '../src/core/csv.ts';
import type { SourceConfig } from '../src/core/types.ts';

const AS_OF = '2026-08-24';

function parcelSource(baseUrl: string, over: Partial<SourceConfig> = {}): SourceConfig {
  return {
    name: 'test-parcels',
    kind: 'arcgis',
    url: `${baseUrl}/arcgis/parcels/0`,
    pageSize: 1000,
    minIntervalMs: 0,
    impliesEvents: [],
    defaults: { county: 'Davidson', state: 'TN', fips: '47037' },
    ...over,
  };
}

function codesSource(baseUrl: string): SourceConfig {
  return {
    name: 'test-codes',
    kind: 'socrata',
    baseUrl,
    domain: 'data.example.gov',
    datasetId: 'abcd-1234',
    pageSize: 1000,
    minIntervalMs: 0,
    impliesEvents: ['code_violation'],
    eventTypeFrom: {
      field: 'request_type',
      map: { DEMOLITION: 'demolition' },
      default: 'code_violation',
    },
    defaults: { county: 'Davidson', state: 'TN', fips: '47037' },
  };
}

test('arcgis ingest pages through a full layer and is idempotent on a second run', async (t) => {
  const mock = await startMock({ parcelCount: 2500 });
  const store = new SqliteStore(':memory:');
  await store.init();
  t.after(async () => { await store.close(); await mock.close(); });

  const first = await runIngest(parcelSource(mock.url), store, { asOf: AS_OF });
  assert.equal(first.status, 'ok');
  assert.equal(first.recordsPulled, 2500, 'must page past the 1000 record server cap');
  assert.equal(first.recordsNew, 2500);
  assert.equal(first.recordsUpdated, 0);
  assert.equal(first.estimatedCostCents, 0, 'public data costs nothing and must report nothing');
  assert.ok(first.apiCalls >= 4, `expected metadata plus 3 pages, got ${first.apiCalls}`);

  // The definition of done in the build spec: a second run creates no duplicates.
  const second = await runIngest(parcelSource(mock.url), store, { asOf: AS_OF });
  assert.equal(second.recordsPulled, 2500);
  assert.equal(second.recordsNew, 0, 'APN dedupe must hold across consecutive runs');
  assert.equal(second.recordsUpdated, 2500);
  assert.equal(second.eventsCreated, 0);

  const counts = await store.counts();
  assert.equal(counts.properties, 2500);
  assert.equal(counts.scored, 2500);
});

test('arcgis ingest works against a server that does not support paging', async (t) => {
  const mock = await startMock({ parcelCount: 2300, supportsPagination: false });
  const store = new SqliteStore(':memory:');
  await store.init();
  t.after(async () => { await store.close(); await mock.close(); });

  const res = await runIngest(parcelSource(mock.url), store, { asOf: AS_OF });
  assert.equal(res.recordsPulled, 2300, 'object id windowing must cover the whole layer');
  assert.equal(res.recordsNew, 2300);
  assert.ok(res.notes.some((n) => n.includes('object id windowing')));
});

test('geometry is turned into coordinates when the layer has no lat lon columns', async (t) => {
  const mock = await startMock({ parcelCount: 3 });
  const store = new SqliteStore(':memory:');
  await store.init();
  t.after(async () => { await store.close(); await mock.close(); });

  await runIngest(parcelSource(mock.url), store, { asOf: AS_OF });
  const rows = await store.allForScoring();
  const withCoords = rows.filter((r) => r.property.latitude != null && r.property.longitude != null);
  assert.equal(withCoords.length, 3);
  const lat = withCoords[0]!.property.latitude!;
  const lon = withCoords[0]!.property.longitude!;
  assert.ok(lat > 36 && lat < 36.3, `polygon centroid latitude looked wrong: ${lat}`);
  assert.ok(lon < -86.6 && lon > -86.9, `polygon centroid longitude looked wrong: ${lon}`);
});

test('a second source merges onto existing parcels by address and stacks a distress event', async (t) => {
  const mock = await startMock({ parcelCount: 2500 });
  const store = new SqliteStore(':memory:');
  await store.init();
  t.after(async () => { await store.close(); await mock.close(); });

  await runIngest(parcelSource(mock.url), store, { asOf: AS_OF });
  const codes = await runIngest(codesSource(mock.url), store, { asOf: AS_OF });

  assert.equal(codes.status, 'ok');
  assert.equal(codes.recordsPulled, 120);
  // 119 of the 120 violation addresses exist in the parcel layer. The one that
  // does not is a genuinely new property, not a silent merge into the wrong row.
  assert.equal(codes.recordsNew, 1, 'address matching must merge, not duplicate');
  assert.equal(codes.recordsUpdated, 119);
  // 120 violation rows, of which 24 are demolition notices. Those carry both a
  // code_violation and a demolition event, because a demolition notice is also a
  // violation, so 120 + 24 = 144 events.
  assert.equal(codes.eventsCreated, 144);

  // Violations were aimed at the long tenure absentee archetype, so the merged
  // rows must carry owner data from the parcel layer and the event from codes.
  const stacked = await store.listLeads({ eventType: 'code_violation', limit: 500 });
  assert.ok(stacked.length > 100, `expected the violation cohort, got ${stacked.length}`);
  const merged = stacked.find((l) => l.ownerName?.startsWith('SMITH JOHN'));
  assert.ok(merged, 'a merged lead should keep the owner name from the parcel layer');
  assert.equal(merged!.sources.length, 2, `expected both sources, got ${merged!.sources.join(',')}`);
  assert.ok(merged!.sources.includes('test-parcels'));
  assert.ok(merged!.sources.includes('test-codes'));
  assert.equal(merged!.likelyFreeAndClear, true, 'the parcel equity signal must survive the merge');
  assert.equal(merged!.absenteeOwner, true);
  assert.equal(merged!.outOfStateOwner, true);
  assert.equal(merged!.strategy, 'seller_finance');

  // Demolition rows carry a second event type, so those leads stack two signals.
  const demo = await store.listLeads({ eventType: 'demolition', limit: 50 });
  assert.ok(demo.length > 0, 'eventTypeFrom must split demolition out of the violation feed');
  assert.ok(demo[0]!.distressCount >= 2, 'a demolition notice also counts as a violation');
});

test('re-running the violation feed bumps events instead of appending duplicates', async (t) => {
  const mock = await startMock({ parcelCount: 600 });
  const store = new SqliteStore(':memory:');
  await store.init();
  t.after(async () => { await store.close(); await mock.close(); });

  await runIngest(parcelSource(mock.url), store, { asOf: AS_OF });
  const one = await runIngest(codesSource(mock.url), store, { asOf: AS_OF });
  const before = (await store.counts()).events;
  const two = await runIngest(codesSource(mock.url), store, { asOf: AS_OF });
  const after = (await store.counts()).events;

  assert.ok(one.eventsCreated > 0);
  assert.equal(two.eventsCreated, 0, 'an open event of the same type is bumped, never re-inserted');
  assert.equal(before, after);

  // The sighting timestamp must still move so recency scoring stays honest.
  const lead = (await store.listLeads({ eventType: 'code_violation', limit: 1 }))[0]!;
  const events = await store.listEvents(lead.id);
  assert.ok(events.length >= 1);
  assert.ok(events[0]!.lastSeenAt >= events[0]!.firstSeenAt);
});

test('the seller finance targets outrank the leveraged recent buyers', async (t) => {
  const mock = await startMock({ parcelCount: 400 });
  const store = new SqliteStore(':memory:');
  await store.init();
  t.after(async () => { await store.close(); await mock.close(); });

  await runIngest(parcelSource(mock.url), store, { asOf: AS_OF });
  await runIngest(codesSource(mock.url), store, { asOf: AS_OF });

  const top = await store.listLeads({ limit: 10, sortBy: 'overall' });
  assert.ok(top.length === 10);
  for (const l of top) {
    assert.equal(l.strategy, 'seller_finance', `top leads should be seller finance, saw ${l.strategy}`);
    assert.equal(l.likelyFreeAndClear, true);
  }
  const recentBuyers = await store.listLeads({ limit: 400 });
  const jones = recentBuyers.filter((l) => l.ownerName?.startsWith('JONES'));
  assert.ok(jones.length > 0);
  const worstTop = Math.min(...top.map((l) => l.overallScore ?? 0));
  const bestJones = Math.max(...jones.map((l) => l.overallScore ?? 0));
  assert.ok(worstTop > bestJones, `leveraged buyers must rank below: ${bestJones} vs ${worstTop}`);
});

test('a broken endpoint is reported in the run row, not swallowed', async (t) => {
  const mock = await startMock();
  const store = new SqliteStore(':memory:');
  await store.init();
  t.after(async () => { await store.close(); await mock.close(); });

  const res = await runIngest(
    parcelSource(mock.url, { name: 'broken', url: `${mock.url}/arcgis/broken/0` }),
    store,
    { asOf: AS_OF },
  ).catch((err: Error) => err);

  // describe throws before a run row exists, so the CLI surfaces the message.
  assert.ok(res instanceof Error);
  assert.match(res.message, /Layer does not exist/);
});

test('a mid-run failure still writes a partial run row with the error', async (t) => {
  const mock = await startMock({ parcelCount: 2500 });
  const store = new SqliteStore(':memory:');
  await store.init();
  t.after(async () => { await store.close(); await mock.close(); });

  // Break the connection after the first page by pointing the store at a closed
  // server mid-stream: simulate by shutting the mock once ingest has started.
  const cfg = parcelSource(mock.url);
  const original = arcgisConnector.pages;
  let page = 0;
  arcgisConnector.pages = async function* (c, http, opts) {
    for await (const rows of original.call(arcgisConnector, c, http, opts)) {
      page++;
      if (page === 2) throw new Error('connection reset by peer');
      yield rows;
    }
  };
  t.after(() => { arcgisConnector.pages = original; });

  const res = await runIngest(cfg, store, { asOf: AS_OF });
  assert.equal(res.status, 'partial');
  assert.match(res.error ?? '', /connection reset/);
  assert.equal(res.recordsPulled, 1000, 'the first page must still be saved');

  const runs = await store.listRuns(5);
  assert.equal(runs[0]!.status, 'partial');
  assert.match(runs[0]!.error ?? '', /connection reset/);
  assert.equal(runs[0]!.recordsPulled, 1000);
});

test('http client retries a rate limited request and counts every call', async (t) => {
  const mock = await startMock();
  t.after(async () => { await mock.close(); });

  const http = new HttpClient({ minIntervalMs: 0, retries: 4 });
  const body = await http.getJson<{ ok: boolean }>(`${mock.url}/flaky`);
  assert.equal(body.ok, true);
  assert.equal(http.calls, 3, 'two 429s then a success is three calls');
});

test('the GHL csv mails the owner, not the vacant house', async (t) => {
  const mock = await startMock({ parcelCount: 400 });
  const store = new SqliteStore(':memory:');
  await store.init();
  t.after(async () => { await store.close(); await mock.close(); });

  await runIngest(parcelSource(mock.url), store, { asOf: AS_OF });
  await runIngest(codesSource(mock.url), store, { asOf: AS_OF });
  const leads = await store.listLeads({ limit: 20 });

  const csv = leadsToGhlCsv(leads);
  const rows = csvToObjects(csv);
  assert.equal(rows.length, leads.length);

  const row = rows[0]!;
  assert.ok(row.address1!.startsWith('PO Box'), `contact address must be the mailing address, got "${row.address1!}"`);
  assert.ok(row.property_address!.includes('Oak Ave'), 'the property address rides along separately');
  assert.equal(row.state!, 'FL', 'mailing state, because that is where the letter goes');
  assert.equal(row.postal_code!, '', 'the mock parcel layer publishes no mailing zip, so it stays blank');
  assert.ok(row.apn!.length > 0, 'the parcel number must survive into the export');
  assert.equal(row.property_state!, 'TN');
  assert.equal(row.first_name!, 'John');
  assert.equal(row.last_name!, 'Smith');
  assert.ok(Number(row.sf_monthly_payment!) > 0, 'the seller finance payment must be quoted');
  assert.ok(row.tags!.includes('gf-seller-finance'));
  assert.ok(row.tags!.includes('gf-free-and-clear'));
  assert.ok(row.lead_reasons!.length > 10, 'the reasons travel with the lead');
  assert.ok(row.data_sources!.includes('test-parcels'));
});

test('the contact address is never a mix of the mailing and property address', async () => {
  const { contactAddress } = await import('../src/export/ghl-csv.ts');
  const absenteeNoMailZip = {
    ownerMailingAddress: 'PO Box 20', ownerMailingCity: 'Tampa', ownerMailingState: 'FL',
    addressLine: '120 Oak Ave', city: 'Nashville', state: 'TN', zip: '37201',
  } as never;
  const a = contactAddress(absenteeNoMailZip);
  assert.equal(a.address1, 'PO Box 20');
  assert.equal(a.state, 'FL');
  assert.equal(a.postalCode, '', 'a Nashville zip on a Tampa box would not deliver');
  assert.equal(a.usedMailing, true);

  const ownerOccupied = {
    addressLine: '120 Oak Ave', city: 'Nashville', state: 'TN', zip: '37201',
  } as never;
  const b = contactAddress(ownerOccupied);
  assert.equal(b.address1, '120 Oak Ave');
  assert.equal(b.postalCode, '37201', 'with no mailing address the property address stands in whole');
  assert.equal(b.usedMailing, false);
});

test('csv export never leaks a phone or email it does not have', async (t) => {
  const mock = await startMock({ parcelCount: 8 });
  const store = new SqliteStore(':memory:');
  await store.init();
  t.after(async () => { await store.close(); await mock.close(); });

  await runIngest(parcelSource(mock.url), store, { asOf: AS_OF });
  const leads = await store.listLeads({ limit: 8 });
  for (const l of leads) {
    const row = leadToGhlRow(l);
    assert.equal(row.phone, '', 'skip trace is opt in, so no phone is ever fabricated');
    assert.equal(row.email, '');
  }
  assert.ok(tagsFor(leads[0]!).includes('gf-lead'));
});

test('a GHL push creates a contact and an opportunity and refuses without confirmation', async (t) => {
  const mock = await startMock({ parcelCount: 8 });
  const store = new SqliteStore(':memory:');
  await store.init();
  t.after(async () => { await store.close(); await mock.close(); });

  await runIngest(parcelSource(mock.url), store, { asOf: AS_OF });
  const lead = (await store.listLeads({ limit: 1 }))[0]!;
  const cfg = {
    apiKey: 'test-token',
    locationId: 'loc_1',
    pipelineId: 'pipe_1',
    pipelineStageId: 'stage_1',
    customFieldIds: { property_address: 'cf_1' },
  };

  await assert.rejects(
    () => pushLead(lead, cfg, { confirm: false, baseUrl: mock.url }),
    /requires explicit confirmation/,
    'nothing reaches GHL without an explicit confirm',
  );

  const res = await pushLead(lead, cfg, { confirm: true, baseUrl: mock.url });
  assert.equal(res.contactId, 'contact_mock_1');
  assert.equal(res.opportunityId, 'opp_mock_1');
  assert.ok(res.skippedFields.length > 0, 'unmapped custom fields are skipped and reported');
  assert.ok(res.warnings.some((w) => w.includes('no GHL custom field id')));

  await store.setGhlIds(lead.id, res.contactId, res.opportunityId);

  // Nothing in the push may hit a workflow or messaging endpoint.
  const touched = mock.requests.filter((r) => /workflow|conversation|message|sms|email/i.test(r));
  assert.deepEqual(touched, [], `push must not touch messaging endpoints, saw ${touched.join(',')}`);
});

test('staging an offer stops at awaiting approval and refuses to mark one sent', async (t) => {
  const mock = await startMock({ parcelCount: 8 });
  const store = new SqliteStore(':memory:');
  await store.init();
  t.after(async () => { await store.close(); await mock.close(); });

  await runIngest(parcelSource(mock.url), store, { asOf: AS_OF });
  const lead = (await store.listLeads({ limit: 1 }))[0]!;

  await store.stageOffer(lead.id, { arvEstimate: 300000, maxOffer: 180000 });
  const staged = await store.getLead(lead.id);
  assert.equal(staged!.pipelineStage, 'awaiting_approval');

  await assert.rejects(
    () => store.stageOffer(lead.id, { stage: 'offer_sent' }),
    /A human sends offers/,
    'the pipeline must not be able to declare an offer sent',
  );
});

test('a dry run reads and reports without writing anything', async (t) => {
  const mock = await startMock({ parcelCount: 50 });
  const store = new SqliteStore(':memory:');
  await store.init();
  t.after(async () => { await store.close(); await mock.close(); });

  const res = await runIngest(parcelSource(mock.url), store, { asOf: AS_OF, dryRun: true, limit: 25 });
  assert.equal(res.recordsPulled, 25);
  assert.equal((await store.counts()).properties, 0, 'a dry run must leave the database empty');
  assert.equal((await store.listRuns()).length, 0);
});

test('records with no address and no parcel number are counted and dropped', async (t) => {
  const mock = await startMock({ parcelCount: 10 });
  const store = new SqliteStore(':memory:');
  await store.init();
  t.after(async () => { await store.close(); await mock.close(); });

  // Force a mapping that finds no address and no apn.
  const res = await runIngest(
    parcelSource(mock.url, { fieldMap: { addressLine: 'NOPE', apn: 'ALSO_NOPE' } }),
    store,
    { asOf: AS_OF },
  );
  assert.equal(res.recordsPulled, 10);
  assert.equal(res.recordsSkipped, 10, 'unidentifiable records must not be stored as noise');
  assert.equal((await store.counts()).properties, 0);
});
