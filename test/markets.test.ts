import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { startMock } from './mockserver.ts';
import { HttpClient } from '../src/core/http.ts';
import { fetchWaterbody, listLayers, type WaterbodySource } from '../src/core/waterbody.ts';
import { enrichWaterDistance } from '../src/core/geoenrich.ts';
import { findMarket, marketMatches, type Market, type MarketSubject } from '../src/core/markets.ts';
import { runIngest } from '../src/core/ingest.ts';
import { SqliteStore } from '../src/store/sqlite.ts';
import { pointInShape } from '../src/core/geo.ts';
import type { SourceConfig } from '../src/core/types.ts';

const AS_OF = '2026-08-24';

/** The markets that actually ship, so the config itself is under test. */
function shippedMarkets(): Market[] {
  return (JSON.parse(readFileSync('config/markets.json', 'utf8')) as { markets: Market[] }).markets;
}

function lakeSource(baseUrl: string): WaterbodySource {
  return {
    name: 'old-hickory-lake',
    label: 'Old Hickory Lake',
    match: 'Old Hickory Lake',
    nameFields: ['GNIS_NAME'],
    // Layer 8 errors and layer 9 holds a different river, so both the error path
    // and the name filter get exercised before the real layer is reached.
    candidates: [{ service: `${baseUrl}/nhd/MapServer`, layers: [8, 9, 10] }],
    bbox: [-86.72, 36.08, -85.9, 36.42],
  };
}

function lakeParcelSource(baseUrl: string): SourceConfig {
  return {
    name: 'lake-parcels',
    kind: 'arcgis',
    url: `${baseUrl}/arcgis/parcels/0`,
    pageSize: 1000,
    minIntervalMs: 0,
    impliesEvents: [],
    defaults: { county: 'Davidson', state: 'TN', fips: '47037' },
  };
}

test('service layers can be listed when the candidate ids are unknown', async (t) => {
  const mock = await startMock();
  t.after(async () => { await mock.close(); });
  const layers = await listLayers(`${mock.url}/nhd/MapServer`, new HttpClient({ minIntervalMs: 0 }));
  assert.equal(layers.length, 3);
  assert.ok(layers.some((l) => l.name === 'NHDWaterbody' && l.id === 10));
});

test('waterbody fetch walks past a failed layer and matches only the named lake', async (t) => {
  const mock = await startMock();
  t.after(async () => { await mock.close(); });

  const res = await fetchWaterbody(lakeSource(mock.url), new HttpClient({ minIntervalMs: 0 }));
  assert.ok(res.shape, 'the lake polygon should have been found');
  assert.match(res.layerUsed ?? '', /\/10$/, 'it should land on the waterbody layer');
  assert.equal(res.featureCount, 1, 'Percy Priest Lake must not be merged in');

  // The attempts log is what makes an unknown schema debuggable.
  const byLayer = new Map(res.attempts.map((a) => [a.layer.split('/').pop(), a]));
  assert.ok(byLayer.get('8')?.error, 'layer 8 should record an error, not throw');
  assert.equal(byLayer.get('9')?.matched, 0, 'the Cumberland River row must not match the name');
  assert.equal(byLayer.get('10')?.matched, 1);

  // A point in the middle of the mock lake channel is inside the fetched shape.
  assert.equal(pointInShape(-86.45, 36.29, res.shape!), true);
  assert.equal(pointInShape(-86.45, 36.10, res.shape!), false);
  assert.ok(res.namesSeen.includes('Old Hickory Lake'));
});

test('waterbody fetch reports the names it found when nothing matches', async (t) => {
  const mock = await startMock();
  t.after(async () => { await mock.close(); });

  const src = { ...lakeSource(mock.url), match: 'Lake That Does Not Exist' };
  const res = await fetchWaterbody(src, new HttpClient({ minIntervalMs: 0 }));
  assert.equal(res.shape, null);
  assert.ok(res.namesSeen.includes('Old Hickory Lake'), 'it must say what it did see');
  assert.ok(res.namesSeen.includes('Cumberland River'));

  // Which is then recoverable without editing any config.
  const retry = await fetchWaterbody(src, new HttpClient({ minIntervalMs: 0 }), {
    acceptName: 'Old Hickory Lake',
  });
  assert.ok(retry.shape, 'accepting a reported name should work');
});

test('waterfront enrichment separates lakefront parcels from inland ones', async (t) => {
  const mock = await startMock({ parcelCount: 200, lakeParcels: true });
  const store = new SqliteStore(':memory:');
  await store.init();
  t.after(async () => { await store.close(); await mock.close(); });

  await runIngest(lakeParcelSource(mock.url), store, { asOf: AS_OF });
  const shape = (await fetchWaterbody(lakeSource(mock.url), new HttpClient({ minIntervalMs: 0 }))).shape!;

  const res = await enrichWaterDistance(store, shape, 'old-hickory-lake', {
    maxMiles: 3,
    waterfrontFt: 1000,
  });
  assert.equal(res.skippedNoCoordinates, 0, 'every parcel had geometry to work from');
  assert.ok(res.withCoordinates >= 190, `expected coordinates on nearly all, got ${res.withCoordinates}`);
  assert.ok(res.waterfront > 20, `expected the on-water cohort, got ${res.waterfront}`);

  const all = await store.listLeads({ limit: 500 });
  const near = all.filter((l) => (l.distanceToWaterFt ?? Infinity) <= 1000);
  const far = all.filter((l) => (l.distanceToWaterFt ?? Infinity) > 1000);
  assert.ok(near.length > 20 && far.length > 20, 'both cohorts should be populated');

  // In the mock, the parcels on the water are the long tenure absentee owners.
  for (const l of near) {
    assert.ok(l.ownerName?.startsWith('SMITH JOHN'), `unexpected waterfront owner ${l.ownerName}`);
    assert.ok(l.distanceToWaterFt! < 1000);
  }
  assert.equal(near[0]!.waterbodyName, 'old-hickory-lake');

  // Parcels beyond the search band keep a null distance, which every waterfront
  // filter reads as "not near this water" rather than as zero.
  const unmeasured = all.filter((l) => l.distanceToWaterFt == null);
  for (const l of unmeasured) {
    assert.equal(marketMatches({ ...l, distanceToWaterFt: undefined }, findMarket(shippedMarkets(), 'old-hickory-waterfront')).pass, false);
  }
});

test('the shipped Old Hickory market selects the waterfront cohort end to end', async (t) => {
  const mock = await startMock({ parcelCount: 200, lakeParcels: true });
  const store = new SqliteStore(':memory:');
  await store.init();
  t.after(async () => { await store.close(); await mock.close(); });

  await runIngest(lakeParcelSource(mock.url), store, { asOf: AS_OF });
  const shape = (await fetchWaterbody(lakeSource(mock.url), new HttpClient({ minIntervalMs: 0 }))).shape!;
  await enrichWaterDistance(store, shape, 'old-hickory-lake');

  const market = findMarket(shippedMarkets(), 'old-hickory-waterfront');
  const all = await store.listLeads({ limit: 500 });
  const matched = all.filter((l) => marketMatches(
    {
      county: l.county, state: l.state, city: l.city,
      latitude: l.latitude, longitude: l.longitude,
      distanceToWaterFt: l.distanceToWaterFt, waterbodyName: l.waterbodyName,
    },
    market,
  ).pass);

  assert.ok(matched.length > 20, `expected a waterfront cohort, got ${matched.length}`);
  assert.ok(matched.length < all.length, 'it must actually filter something out');
  for (const l of matched) {
    assert.ok(l.distanceToWaterFt! <= market.waterfront!.maxDistanceFt);
  }
  // These are the seller finance targets: long tenure, absentee, on the water.
  assert.ok(matched.every((l) => l.strategy === 'seller_finance'));
  assert.ok(matched.every((l) => l.likelyFreeAndClear === true));
});

test('the shipped area markets read "area" as a radius, not just city limits', () => {
  const markets = shippedMarkets();
  const pegram = findMarket(markets, 'pegram');

  const inTown: MarketSubject = { county: 'Cheatham', state: 'TN', fips: '47021', city: 'Pegram' };
  assert.equal(marketMatches(inTown, pegram).pass, true);

  // Unincorporated land three miles out, labelled with a different town. The
  // radius is what catches this, and it is most of the Pegram area.
  const nearby: MarketSubject = {
    county: 'Cheatham', state: 'TN', fips: '47021', city: 'Ashland City',
    latitude: 36.14, longitude: -87.03,
  };
  assert.equal(marketMatches(nearby, pegram).pass, true);

  const farInCounty: MarketSubject = {
    county: 'Cheatham', state: 'TN', fips: '47021', city: 'Ashland City',
    latitude: 36.27, longitude: -87.06,
  };
  assert.deepEqual(marketMatches(farInCounty, pegram).failed, ['place']);

  const wrongCounty: MarketSubject = { county: 'Davidson', state: 'TN', fips: '47037', city: 'Nashville' };
  assert.ok(marketMatches(wrongCounty, pegram).failed.includes('county'));
});

test('Spring Hill matches on both sides of the county line', () => {
  const springHill = findMarket(shippedMarkets(), 'spring-hill');
  for (const [county, fips] of [['Williamson', '47187'], ['Maury', '47119']] as const) {
    assert.equal(
      marketMatches({ county, fips, state: 'TN', city: 'Spring Hill' }, springHill).pass,
      true,
      `${county} side of Spring Hill should match`,
    );
  }
  assert.equal(
    marketMatches({ county: 'Rutherford', fips: '47149', state: 'TN', city: 'Spring Hill' }, springHill).pass,
    false,
  );
});

test('every shipped market is well formed and covers the stated targets', () => {
  const markets = shippedMarkets();
  const names = markets.map((m) => m.name);
  for (const expected of [
    'davidson', 'williamson', 'old-hickory-waterfront', 'pegram',
    'kingston-springs', 'fairview', 'spring-hill',
  ]) {
    assert.ok(names.includes(expected), `missing market ${expected}`);
  }
  for (const m of markets) {
    assert.ok(m.name && !m.name.includes(' '), `market name should be a slug: ${m.name}`);
    for (const c of m.counties ?? []) {
      assert.ok(c.fips && /^\d{5}$/.test(c.fips), `county needs a five digit fips: ${JSON.stringify(c)}`);
      assert.equal(c.state, 'TN');
    }
    if (m.near) {
      assert.ok(m.near.lat > 34 && m.near.lat < 37, `latitude looks wrong for ${m.name}`);
      assert.ok(m.near.lon < -85 && m.near.lon > -90, `longitude looks wrong for ${m.name}`);
      assert.ok(m.near.radiusMiles > 0 && m.near.radiusMiles <= 25);
    }
  }
});
