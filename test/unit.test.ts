import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  classifyOwner, dedupeKey, normAddress, normApn, normState, normZip,
  parseDate, parseNum, splitOwnerName,
} from '../src/core/normalize.ts';
import { FIELD_SPECS, resolveFieldMap, toProperty } from '../src/core/fieldmap.ts';
import { derive, estimateEquity, remainingBalance } from '../src/core/derive.ts';
import { scoreLead } from '../src/core/score.ts';
import { computeOffer } from '../src/core/offer.ts';
import { matchesBuyBox } from '../src/core/buybox.ts';
import { csvToObjects, parseCsv, toCsv } from '../src/core/csv.ts';
import type { PropertyInput } from '../src/core/types.ts';

const AS_OF = '2026-08-24';

test('address normalization collapses the ways a county might print one address', () => {
  const variants = [
    '123 N. Main Street, Apt. 4',
    '123 North Main St #4',
    '123 n main street apt 4',
    '  123   NORTH   MAIN   STREET   APT   4  ',
  ];
  const normed = variants.map((v) => normAddress(v));
  assert.equal(new Set(normed).size, 1, `expected one form, got ${JSON.stringify(normed)}`);
  assert.equal(normed[0], '123 N MAIN ST APT 4');
});

test('address normalization keeps genuinely different addresses apart', () => {
  assert.notEqual(normAddress('123 Main St'), normAddress('123 Main Ave'));
  assert.notEqual(normAddress('123 Main St Apt 1'), normAddress('123 Main St Apt 2'));
});

test('apn normalization strips county punctuation but rejects filler', () => {
  assert.equal(normApn('047-12 03.00'), '047120300');
  assert.equal(normApn('  047120300 '), '047120300');
  assert.equal(normApn('000'), undefined);
  assert.equal(normApn(''), undefined);
  assert.equal(normApn(null), undefined);
});

test('date parsing handles ISO, US slashes, and ArcGIS epoch milliseconds', () => {
  assert.equal(parseDate('2024-05-06'), '2024-05-06');
  assert.equal(parseDate('5/6/2024'), '2024-05-06');
  assert.equal(parseDate('3/7/99'), '1999-03-07');
  assert.equal(parseDate(Date.UTC(1987, 5, 15)), '1987-06-15');
  assert.equal(parseDate(''), undefined);
  assert.equal(parseDate(0), undefined, 'a zero epoch is an empty column, not 1970');
});

test('numeric parsing handles money formatting', () => {
  assert.equal(parseNum('$1,234.50'), 1234.5);
  assert.equal(parseNum('310000'), 310000);
  assert.equal(parseNum(''), undefined);
  assert.equal(parseNum('n/a'), undefined);
});

test('state and zip normalization', () => {
  assert.equal(normState('Tennessee'), 'TN');
  assert.equal(normState('tn'), 'TN');
  assert.equal(normZip('37201-1234'), '37201');
  assert.equal(normZip(37201), '37201');
});

test('owner classification finds estates and entities', () => {
  assert.equal(classifyOwner('SMITH JOHN R ESTATE OF').ownerType, 'estate');
  assert.equal(classifyOwner('SMITH JOHN R ESTATE OF').estateIndicator, true);
  assert.equal(classifyOwner('JONES FAMILY TRUST').ownerType, 'trust');
  assert.equal(classifyOwner('ACME HOLDINGS LLC').ownerType, 'company');
  assert.equal(classifyOwner('METRO GOVERNMENT OF NASHVILLE').ownerType, 'government');
  assert.equal(classifyOwner('SMITH JOHN R').ownerType, 'individual');
});

test('owner name splitting assumes the tax roll last-first order', () => {
  assert.deepEqual(splitOwnerName('SMITH JOHN R'), { lastName: 'Smith', firstName: 'John' });
  assert.deepEqual(splitOwnerName('SMITH JOHN & MARY'), { lastName: 'Smith', firstName: 'John' });
  assert.deepEqual(splitOwnerName('SMITH, JOHN R'), { lastName: 'Smith', firstName: 'John' });
  assert.deepEqual(splitOwnerName('John Smith', 'first-last'), { firstName: 'John', lastName: 'Smith' });
  assert.equal(splitOwnerName('ACME HOLDINGS LLC').companyName, 'ACME HOLDINGS LLC');
  assert.equal(splitOwnerName('ACME HOLDINGS LLC').firstName, undefined);
});

test('dedupe prefers fips and apn, falls back to address, never merges blindly', () => {
  const withApn: PropertyInput = { source: 's', raw: {}, fips: '47037', apn: '047-12 03.00' };
  assert.deepEqual(dedupeKey(withApn), { key: 'apn:47037:047120300', basis: 'fips_apn' });

  const a: PropertyInput = { source: 's', raw: {}, addressLine: '123 North Main St #4', zip: '37201-9999' };
  const b: PropertyInput = { source: 't', raw: {}, addressLine: '123 N. Main Street, Apt 4', zip: '37201' };
  assert.equal(dedupeKey(a).key, dedupeKey(b).key, 'same address from two sources must match');
  assert.equal(dedupeKey(a).basis, 'address');

  const nothing: PropertyInput = { source: 's', raw: { x: 1 }, sourceRecordId: 'abc' };
  assert.equal(dedupeKey(nothing).basis, 'source_id');
});

test('field mapping resolves a realistic parcel schema including glued abbreviations', () => {
  const fields = [
    { name: 'PARID' }, { name: 'OWNNAME' }, { name: 'SITUSADDR' }, { name: 'SITUSCITY' },
    { name: 'MAILADDR' }, { name: 'MAILSTATE' }, { name: 'TOTAL_MKT_VAL' },
    { name: 'SALEDATE' }, { name: 'SALEPRICE' }, { name: 'YRBUILT' }, { name: 'ACRES' },
    { name: 'HEATEDAREA' },
  ];
  const { mapping } = resolveFieldMap(fields);
  assert.equal(mapping.apn, 'PARID');
  assert.equal(mapping.ownerName, 'OWNNAME', 'OWNNAME must resolve via abbreviation expansion');
  assert.equal(mapping.estimatedValue, 'TOTAL_MKT_VAL');
  assert.equal(mapping.addressLine, 'SITUSADDR');
  assert.equal(mapping.lastSaleDate, 'SALEDATE');
  assert.equal(mapping.sqft, 'HEATEDAREA');
});

test('field mapping composes an address from separate house number and street parts', () => {
  // Mirrors the real HUD REO layer, which publishes no single address column.
  const fields = [
    { name: 'OBJECTID' }, { name: 'CASE_NUM', alias: 'Case Number' },
    { name: 'STREET_NUM', alias: 'Street Number' },
    { name: 'DIRECTION_PREFIX', alias: 'Street Direction Prefix' },
    { name: 'STREET_NAME', alias: 'Street' }, { name: 'CITY' },
    { name: 'STATE_CODE', alias: 'State' },
  ];
  const { mapping } = resolveFieldMap(fields);
  const p = toProperty(
    { OBJECTID: 5, CASE_NUM: '481-123456', STREET_NUM: '123', DIRECTION_PREFIX: 'N', STREET_NAME: 'MAIN ST', CITY: 'Nashville', STATE_CODE: 'TN' },
    mapping, 'hud-reo', { county: 'Davidson' },
  );
  assert.equal(p.addressLine, '123 N MAIN ST');
  assert.equal(p.city, 'Nashville');
  assert.equal(p.state, 'TN');
  assert.equal(p.county, 'Davidson', 'config defaults must fill gaps the layer does not publish');
  assert.equal(p.sourceRecordId, '481-123456', 'a stable case number beats a volatile OBJECTID');
});

test('field mapping reports what it could not map instead of guessing silently', () => {
  const { missingImportant, mapping } = resolveFieldMap([{ name: 'WIDGET_COUNT' }, { name: 'COLOR' }]);
  assert.ok(missingImportant.includes('addressLine'));
  assert.ok(missingImportant.includes('ownerName'));
  assert.equal(mapping.addressLine, undefined);
});

test('explicit field map overrides beat the automatic guess', () => {
  const fields = [{ name: 'OWNNAME' }, { name: 'TAXPAYER' }];
  const { mapping, entries } = resolveFieldMap(fields, FIELD_SPECS, { ownerName: 'TAXPAYER' });
  assert.equal(mapping.ownerName, 'TAXPAYER');
  assert.equal(entries.find((e) => e.canonical === 'ownerName')?.how, 'override');
});

test('acreage is converted to square feet so one unit flows downstream', () => {
  const { mapping } = resolveFieldMap([{ name: 'ACRES' }, { name: 'SITUSADDR' }]);
  const p = toProperty({ ACRES: '0.34', SITUSADDR: '1 A St' }, mapping, 's');
  assert.equal(p.lotSqft, 14810);
});

test('loan amortization matches a known schedule', () => {
  // 100k at 6 percent over 30 years leaves about 71k after 15 years.
  assert.equal(Math.round(remainingBalance(100000, 0.06, 360, 180)), 71049);
  assert.equal(remainingBalance(100000, 0.06, 360, 360), 0, 'a matured loan is paid off');
  assert.equal(remainingBalance(100000, 0.06, 360, 0), 100000);
});

test('equity is measured when loan data exists and labelled as such', () => {
  const e = estimateEquity({ source: 's', raw: {}, estimatedValue: 200000, openMortgageBal: 50000 }, AS_OF);
  assert.equal(e.equityBasis, 'measured');
  assert.equal(e.estimatedEquity, 150000);
  assert.equal(e.equityPercent, 75);
  assert.equal(e.likelyFreeAndClear, false);
});

test('equity is estimated from tenure when the county publishes no loan data', () => {
  const old = estimateEquity(
    { source: 's', raw: {}, estimatedValue: 310000, lastSaleDate: '1987-06-15', lastSaleAmount: 42000 },
    AS_OF,
  );
  assert.equal(old.equityBasis, 'estimated_from_tenure');
  assert.equal(old.likelyFreeAndClear, true, '39 years of ownership is free and clear');

  const recent = estimateEquity(
    { source: 's', raw: {}, estimatedValue: 340000, lastSaleDate: '2022-05-01', lastSaleAmount: 325000 },
    AS_OF,
  );
  assert.equal(recent.likelyFreeAndClear, false);
  assert.ok(recent.equityPercent! < 45, `a 2022 buyer should be leveraged, got ${recent.equityPercent}`);

  const noPrice = estimateEquity(
    { source: 's', raw: {}, estimatedValue: 180000, lastSaleDate: '2010-01-01' },
    AS_OF,
  );
  assert.equal(noPrice.likelyFreeAndClear, true, 'a transfer with no price is a gift or inheritance');
});

test('equity is unknown, not zero, when there is nothing to work from', () => {
  const e = estimateEquity({ source: 's', raw: {}, addressLine: '1 A St' }, AS_OF);
  assert.equal(e.equityBasis, 'unknown');
  assert.equal(e.equityPercent, null);
  assert.equal(e.likelyFreeAndClear, false);
});

test('absentee and out of state ownership come free from the mailing address', () => {
  const d = derive({
    source: 's', raw: {}, addressLine: '99 Oak Ave', state: 'TN',
    ownerMailingAddress: 'PO Box 5', ownerMailingState: 'FL', ownerName: 'SMITH JOHN',
  }, AS_OF);
  assert.equal(d.absenteeOwner, true);
  assert.equal(d.outOfStateOwner, true);
  assert.equal(d.ownerOccupied, false);

  const owner = derive({
    source: 's', raw: {}, addressLine: '99 Oak Ave', state: 'TN',
    ownerMailingAddress: '99 Oak Avenue', ownerMailingState: 'TN', ownerName: 'SMITH JOHN',
  }, AS_OF);
  assert.equal(owner.absenteeOwner, false, 'same address in different spelling is owner occupied');
  assert.equal(owner.ownerOccupied, true);

  const unknown = derive({ source: 's', raw: {}, addressLine: '99 Oak Ave' }, AS_OF);
  assert.equal(unknown.absenteeOwner, null, 'no mailing address means unknown, not false');
});

const SELLER_FINANCE_TARGET: PropertyInput = {
  source: 's', raw: {}, addressLine: '99 Oak Ave', state: 'TN', propertyType: 'Single Family',
  sqft: 1450, estimatedValue: 310000, lastSaleDate: '1987-06-15', lastSaleAmount: 42000,
  ownerMailingAddress: 'PO Box 5', ownerMailingState: 'FL', ownerName: 'SMITH JOHN',
};

test('a free and clear absentee owner with soft distress is the top seller finance lead', () => {
  const d = derive(SELLER_FINANCE_TARGET, AS_OF);
  const s = scoreLead(SELLER_FINANCE_TARGET, d, [
    { eventType: 'code_violation', firstSeenAt: '2026-08-01', lastSeenAt: '2026-08-20' },
    { eventType: 'tax_delinquent', firstSeenAt: '2026-07-01', lastSeenAt: '2026-08-20' },
  ], AS_OF);
  assert.equal(s.strategy, 'seller_finance');
  assert.ok(s.sellerFinanceScore >= 85, `expected a high fit, got ${s.sellerFinanceScore}`);
  assert.ok(s.reasons.some((r) => r.includes('absentee')));
  assert.ok(s.reasons.some((r) => r.includes('stacked')));
});

test('an imminent auction is a cash play, not a seller carry', () => {
  const p: PropertyInput = {
    source: 's', raw: {}, state: 'TN', propertyType: 'Single Family',
    estimatedValue: 340000, lastSaleDate: '2022-05-01', lastSaleAmount: 325000, ownerName: 'JONES ANN',
  };
  const s = scoreLead(p, derive(p, AS_OF), [
    { eventType: 'pre_foreclosure', firstSeenAt: '2026-08-10', lastSeenAt: '2026-08-22', auctionDate: '2026-10-01' },
  ], AS_OF);
  assert.equal(s.strategy, 'cash_wholesale', 'a sale five weeks out leaves no room for terms');
  assert.ok(s.distressScore > s.sellerFinanceScore);
  assert.ok(s.reasons.some((r) => r.includes('auction scheduled')));

  // Thin equity and a filing but no sale date yet is the subject to case: there is
  // still time to take over the existing loan.
  const noDate = scoreLead(p, derive(p, AS_OF), [
    { eventType: 'pre_foreclosure', firstSeenAt: '2026-08-10', lastSeenAt: '2026-08-22' },
  ], AS_OF);
  assert.equal(noDate.strategy, 'subject_to');
});

test('a sale already on the calendar is a cash play whatever the equity', () => {
  // Foreclosure filed, sale in three weeks, and plenty of equity. Terms and a
  // subject to close both need more runway than this seller has.
  const rich: PropertyInput = {
    source: 's', raw: {}, state: 'TN', propertyType: 'Single Family',
    estimatedValue: 400000, lastSaleDate: '1994-01-01', lastSaleAmount: 60000,
    ownerName: 'BROWN SAM',
  };
  const soon = scoreLead(rich, derive(rich, AS_OF), [
    { eventType: 'foreclosure', firstSeenAt: '2026-08-01', lastSeenAt: '2026-08-23', auctionDate: '2026-09-14' },
  ], AS_OF);
  assert.equal(soon.strategy, 'cash_wholesale');
  assert.ok(soon.reasons.some((r) => r.includes('auction scheduled in')));

  // The same property with the sale far out is still a terms conversation.
  const later = scoreLead(rich, derive(rich, AS_OF), [
    { eventType: 'foreclosure', firstSeenAt: '2026-08-01', lastSeenAt: '2026-08-23', auctionDate: '2027-06-01' },
  ], AS_OF);
  assert.equal(later.strategy, 'seller_finance');
});

test('bank owned inventory scores as a cash wholesale play', () => {
  const p: PropertyInput = { source: 's', raw: {}, state: 'TN', estimatedValue: 200000, ownerName: 'BANK OF AMERICA NA' };
  const s = scoreLead(p, derive(p, AS_OF), [
    { eventType: 'reo', firstSeenAt: '2026-08-01', lastSeenAt: '2026-08-23' },
  ], AS_OF);
  assert.equal(s.strategy, 'cash_wholesale');
});

test('stale signals decay and stacked signals add up', () => {
  const d = derive(SELLER_FINANCE_TARGET, AS_OF);
  const fresh = scoreLead(SELLER_FINANCE_TARGET, d, [
    { eventType: 'tax_delinquent', firstSeenAt: '2026-08-01', lastSeenAt: '2026-08-23' },
  ], AS_OF);
  const stale = scoreLead(SELLER_FINANCE_TARGET, d, [
    { eventType: 'tax_delinquent', firstSeenAt: '2019-01-01', lastSeenAt: '2019-02-01' },
  ], AS_OF);
  assert.ok(fresh.distressScore > stale.distressScore, 'a 2019 signal must be worth less than a fresh one');

  const stacked = scoreLead(SELLER_FINANCE_TARGET, d, [
    { eventType: 'tax_delinquent', firstSeenAt: '2026-08-01', lastSeenAt: '2026-08-23' },
    { eventType: 'code_violation', firstSeenAt: '2026-08-01', lastSeenAt: '2026-08-23' },
    { eventType: 'vacant', firstSeenAt: '2026-08-01', lastSeenAt: '2026-08-23' },
  ], AS_OF);
  assert.ok(stacked.distressScore > fresh.distressScore);

  const cleared = scoreLead(SELLER_FINANCE_TARGET, d, [
    { eventType: 'tax_delinquent', firstSeenAt: '2026-08-01', lastSeenAt: '2026-08-23', clearedAt: '2026-08-24' },
  ], AS_OF);
  assert.ok(cleared.distressScore < fresh.distressScore, 'a cleared event is nearly noise');
});

test('offer math produces reviewable seller finance terms', () => {
  const d = derive(SELLER_FINANCE_TARGET, AS_OF);
  const o = computeOffer(SELLER_FINANCE_TARGET, d);
  assert.equal(o.arvEstimate, 310000);
  assert.equal(o.repairEstimate, 1450 * 25);
  // 310000 * 0.7 - 36250 - 10000
  assert.equal(o.maxCashOffer, 170750);
  const sf = o.sellerFinance!;
  assert.equal(sf.price, 294500);
  assert.equal(sf.downPayment, 29450);
  assert.equal(sf.notePrincipal, 265050);
  assert.ok(sf.monthlyPrincipalAndInterest > 1400 && sf.monthlyPrincipalAndInterest < 1450);
  assert.ok(sf.balloonBalance < sf.notePrincipal, 'a balloon balance must amortize down');
  assert.ok(o.notes.some((n) => n.includes('not from comps')), 'the ARV caveat must travel with the number');
});

test('offer math refuses to invent numbers with no value', () => {
  const p: PropertyInput = { source: 's', raw: {}, addressLine: '1 A St' };
  const o = computeOffer(p, derive(p, AS_OF));
  assert.equal(o.arvEstimate, null);
  assert.equal(o.maxCashOffer, null);
  assert.equal(o.sellerFinance, null);
});

test('buy box filters on value, equity and score', () => {
  const candidate = {
    property: { source: 's', raw: {}, state: 'TN', estimatedValue: 300000, propertyType: 'Single Family' },
    derived: { equityPercent: 80 },
    scores: { overallScore: 70, strategy: 'seller_finance' },
  } as never;
  assert.equal(matchesBuyBox(candidate, { states: ['TN'], minValue: 100000, minEquityPercent: 50 }).pass, true);
  assert.equal(matchesBuyBox(candidate, { states: ['GA'] }).pass, false);
  assert.equal(matchesBuyBox(candidate, { maxValue: 200000 }).pass, false);
  assert.equal(matchesBuyBox(candidate, { minOverallScore: 90 }).pass, false);
  assert.equal(matchesBuyBox(candidate, { propertyTypeExclude: ['single family'] }).pass, false);

  const unknownEquity = {
    property: { source: 's', raw: {}, estimatedValue: 300000 },
    derived: { equityPercent: null },
    scores: { overallScore: 70, strategy: 'seller_finance' },
  } as never;
  assert.equal(matchesBuyBox(unknownEquity, { minEquityPercent: 50, allowUnknownEquity: true }).pass, true);
  assert.equal(matchesBuyBox(unknownEquity, { minEquityPercent: 50, allowUnknownEquity: false }).pass, false);
});

test('csv round trips quotes, commas and embedded newlines', () => {
  const text = 'a,b,c\n1,"hello, world",3\n2,"say ""hi""",4\n';
  const rows = csvToObjects(text);
  assert.equal(rows.length, 2);
  assert.equal(rows[0]!.b, 'hello, world');
  assert.equal(rows[1]!.b, 'say "hi"');

  const out = toCsv([{ a: 1, b: 'x,y' }, { a: 2, b: 'line1\nline2' }]);
  const back = csvToObjects(out);
  assert.equal(back[0]!.b, 'x,y');
  assert.equal(back[1]!.b, 'line1\nline2');

  assert.deepEqual(parseCsv('a,b\n\n1,2\n'), [['a', 'b'], ['1', '2']], 'blank lines are dropped');
});
