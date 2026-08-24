// Runtime field mapping.
//
// County GIS layers and open data portals name the same column a dozen different
// ways: PARCELID, parcel_no, GPIN, STRAP, FOLIO, PARID. Rather than hardcode one
// county's schema, every connector asks its endpoint what fields exist and maps
// them here. `gf discover` prints the resulting map with a confidence per field
// so a human can check the guesses before trusting a pull.

import { joinAddress, normApn, normState, normZip, parseDate, parseNum } from './normalize.ts';
import type { PropertyInput, RawRecord } from './types.ts';

export type FieldType = 'string' | 'number' | 'date';

export interface FieldSpec {
  aliases: string[];
  type: FieldType;
  /** Helper fields are used to compose addressLine and are not output directly. */
  helper?: boolean;
}

/**
 * Canonical field to candidate upstream names. Order matters: earlier aliases
 * are preferred when several columns could match.
 */
export const FIELD_SPECS: Record<string, FieldSpec> = {
  apn: {
    type: 'string',
    aliases: [
      'apn', 'parcelid', 'parcelnumber', 'parcelno', 'parcel', 'parcelnum', 'parcelidno',
      'pin', 'pinnum', 'parid', 'gpin', 'strap', 'folio', 'folionumber', 'taxid',
      'taxparcelid', 'accountnumber', 'acctnum', 'propertyid', 'parcelnumb', 'mapno',
      'taxaccountnumber', 'sidwell', 'permanentparcelnumber',
    ],
  },
  fips: { type: 'string', aliases: ['fips', 'fipscode', 'countyfips', 'statecountyfips', 'geoid'] },

  addressLine: {
    type: 'string',
    aliases: [
      'address', 'addressline', 'siteaddress', 'situsaddress', 'propertyaddress',
      'fulladdress', 'streetaddress', 'address1', 'physicaladdress', 'locationaddress',
      'propaddr', 'situsaddr', 'addr', 'siteaddr', 'completeaddress', 'addressfull',
    ],
  },
  houseNumber: { type: 'string', helper: true, aliases: ['streetnumber', 'streetnum', 'housenumber', 'housenum', 'addressnumber', 'stnum', 'situshousenumber', 'propertyhousenumber', 'numb'] },
  streetPreDir: { type: 'string', helper: true, aliases: ['directionprefix', 'streetdirection', 'predirection', 'predir', 'streetprefix', 'dirprefix', 'prefixdirection'] },
  streetName: { type: 'string', helper: true, aliases: ['streetname', 'street', 'stname', 'situsstreetname', 'roadname'] },
  streetSuffix: { type: 'string', helper: true, aliases: ['streettype', 'streetsuffix', 'suffix', 'sttype', 'streetdesignation', 'roadtype'] },
  streetPostDir: { type: 'string', helper: true, aliases: ['postdirection', 'postdir', 'suffixdirection', 'directionsuffix'] },
  unit: { type: 'string', helper: true, aliases: ['unit', 'unitnumber', 'aptnumber', 'suite', 'unitid'] },

  city: { type: 'string', aliases: ['city', 'sitecity', 'situscity', 'propertycity', 'municipality', 'cityname', 'postalcity', 'town'] },
  state: { type: 'string', aliases: ['state', 'statecode', 'sitestate', 'situsstate', 'propertystate', 'stateabbr', 'st'] },
  zip: { type: 'string', aliases: ['zip', 'zipcode', 'postalcode', 'sitezip', 'situszip', 'propertyzip', 'zip5'] },
  county: { type: 'string', aliases: ['county', 'countyname', 'sitecounty'] },
  latitude: { type: 'number', aliases: ['latitude', 'lat', 'ycoord', 'y'] },
  longitude: { type: 'number', aliases: ['longitude', 'lon', 'lng', 'long', 'xcoord', 'x'] },

  propertyType: { type: 'string', aliases: ['propertytype', 'proptype', 'landuse', 'landusecode', 'usecode', 'propertyclass', 'classdescription', 'luc', 'propertyusedescription', 'zoning', 'structuretype'] },
  beds: { type: 'number', aliases: ['beds', 'bedrooms', 'numbedrooms', 'bedroomcount', 'nobedrooms', 'bed'] },
  baths: { type: 'number', aliases: ['baths', 'bathrooms', 'numbathrooms', 'bathroomcount', 'fullbaths', 'bath', 'nobaths'] },
  sqft: { type: 'number', aliases: ['sqft', 'squarefeet', 'buildingsqft', 'livingarea', 'livingsqft', 'finishedarea', 'totalsqft', 'heatedarea', 'grosssqft', 'bldgsqft', 'improvementsize'] },
  lotSqft: { type: 'number', aliases: ['lotsqft', 'lotsize', 'lotsizesqft', 'landsqft', 'parcelarea', 'acreage', 'acres', 'landarea'] },
  yearBuilt: { type: 'number', aliases: ['yearbuilt', 'yrbuilt', 'built', 'effectiveyearbuilt', 'constructionyear', 'yearconstructed'] },

  estimatedValue: { type: 'number', aliases: ['marketvalue', 'totalmarketvalue', 'mktval', 'totmktval', 'estimatedvalue', 'appraisedvalue', 'totalappraisedvalue', 'fairmarketvalue', 'justvalue', 'totalvalue', 'avm', 'estimate', 'listprice', 'price'] },
  assessedValue: { type: 'number', aliases: ['assessedvalue', 'totalassessedvalue', 'assessment', 'assessedtotal', 'taxablevalue', 'assdtotal'] },
  openMortgageBal: { type: 'number', aliases: ['openmortgagebalance', 'mortgagebalance', 'loanbalance', 'unpaidbalance', 'outstandingbalance', 'currentloanbalance'] },
  lastSaleDate: { type: 'date', aliases: ['lastsaledate', 'saledate', 'transferdate', 'deeddate', 'lasttransferdate', 'recordeddate', 'dateofsale', 'salesdate'] },
  lastSaleAmount: { type: 'number', aliases: ['lastsaleamount', 'saleprice', 'salesprice', 'saleamount', 'transferamount', 'deedprice', 'considerationamount', 'lastsaleprice'] },

  ownerName: { type: 'string', aliases: ['ownername', 'owner', 'owner1', 'ownername1', 'ownernme', 'ownname', 'owname', 'ownrname', 'deedholder', 'taxpayername', 'taxpayer', 'currentowner', 'ownerfullname', 'propertyowner', 'ownr', 'own1', 'grantee'] },
  ownerMailingAddress: { type: 'string', aliases: ['owneraddress', 'mailingaddress', 'ownermailingaddress', 'mailaddress', 'mailaddr', 'owneraddr', 'ownermailaddress', 'mailingaddress1', 'ownerstreetaddress'] },
  ownerMailingCity: { type: 'string', aliases: ['ownercity', 'mailingcity', 'ownermailingcity', 'mailcity'] },
  ownerMailingState: { type: 'string', aliases: ['ownerstate', 'mailingstate', 'ownermailingstate', 'mailstate'] },
  ownerMailingZip: { type: 'string', aliases: ['ownerzip', 'mailingzip', 'ownermailingzip', 'mailzip', 'ownerzipcode'] },

  // Business identifiers first: OBJECTID is reassigned when a layer is republished.
  sourceRecordId: { type: 'string', aliases: ['casenumber', 'casenum', 'caseid', 'permitnumber', 'recordid', 'incidentid', 'globalid', 'objectid', 'oid'] },
};

/** Canonical fields carrying event detail rather than property detail. */
export const EVENT_FIELD_SPECS: Record<string, FieldSpec> = {
  filingDate: { type: 'date', aliases: ['filingdate', 'filedate', 'datefiled', 'recordingdate', 'noticedate', 'defaultdate', 'caseopendate', 'dateopened', 'openeddate', 'violationdate', 'inspectiondate', 'reporteddate'] },
  auctionDate: { type: 'date', aliases: ['auctiondate', 'saledate', 'foreclosuresaledate', 'trusteesaledate', 'sheriffsaledate', 'scheduledsaledate'] },
  lender: { type: 'string', aliases: ['lender', 'lendername', 'beneficiary', 'mortgagee', 'plaintiff', 'trustee', 'bank'] },
  unpaidBalance: { type: 'number', aliases: ['unpaidbalance', 'defaultamount', 'judgmentamount', 'amountowed', 'delinquentamount', 'totaldue', 'balancedue', 'taxesowed', 'openingbid'] },
  documentType: { type: 'string', aliases: ['documenttype', 'doctype', 'instrumenttype', 'casetype', 'violationtype', 'noticetype', 'status', 'casestatus', 'description'] },
  caseNumber: { type: 'string', aliases: ['casenumber', 'casenum', 'caseid', 'docketnumber', 'instrumentnumber', 'permitnumber', 'citationnumber'] },
  decedentName: { type: 'string', aliases: ['decedentname', 'decedent', 'deceasedname', 'estatename', 'petitionername'] },
  dateOfDeath: { type: 'date', aliases: ['dateofdeath', 'deathdate', 'dod', 'datedeceased'] },
  attorneyName: { type: 'string', aliases: ['attorneyname', 'attorney', 'attorneyofrecord', 'counsel', 'lawfirm'] },
};

export interface SourceField {
  name: string;
  alias?: string;
  type?: string;
}

export interface MappingEntry {
  canonical: string;
  sourceField: string;
  confidence: number;
  how: 'override' | 'exact' | 'alias' | 'fuzzy';
}

export interface MappingReport {
  mapping: Record<string, string>;
  entries: MappingEntry[];
  unmapped: string[];
  missingImportant: string[];
}

const IMPORTANT = ['addressLine', 'city', 'state', 'zip', 'ownerName', 'apn'];

function norm(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Abbreviations that county schemas use constantly. Expanding these generalizes
 * to counties nobody has written an alias list for, which matters because there
 * are over three thousand of them and each names its columns differently.
 */
const ABBREV: Record<string, string> = {
  mkt: 'market', val: 'value', tot: 'total', ttl: 'total', addr: 'address', add: 'address',
  num: 'number', no: 'number', nbr: 'number', yr: 'year', bldg: 'building', bld: 'building',
  amt: 'amount', dt: 'date', desc: 'description', cd: 'code', nm: 'name', own: 'owner',
  ownr: 'owner', pcl: 'parcel', prcl: 'parcel', prop: 'property', sq: 'square', ft: 'feet',
  sf: 'squarefeet', str: 'street', mail: 'mailing', asmt: 'assessment', assd: 'assessed',
  apprd: 'appraised', imp: 'improvement', lnd: 'land', txbl: 'taxable', dlq: 'delinquent',
  frcl: 'foreclosure', mtg: 'mortgage', bal: 'balance', qty: 'quantity', cnt: 'count',
  yrblt: 'yearbuilt', lvg: 'living', ar: 'area', situs: 'situs', legl: 'legal',
};

/** Substring expansions safe enough to apply to glued names like OWNNAME. */
const GLUED: Array<[RegExp, string]> = [
  [/^own(?!er)/, 'owner'], [/mkt/g, 'market'], [/\bval$/, 'value'], [/val$/, 'value'],
  [/^tot(?!al)/, 'total'], [/addr/g, 'address'], [/mtg/g, 'mortgage'], [/dlq/g, 'delinquent'],
  [/asmt/g, 'assessment'], [/^yr(?!ea)/, 'year'], [/^prop(?!erty)/, 'property'],
];

interface Variant { v: string; w: number }

/**
 * Produce comparable spellings of one upstream field name:
 * the raw normalized form, a token-expanded form (TOTAL_MKT_VAL, situsAddr),
 * and a glued-expansion form (OWNNAME) scored slightly lower.
 */
function variants(name: string): Variant[] {
  const raw = norm(name);
  const seen = new Map<string, number>();
  const add = (v: string, w: number) => {
    if (!v) return;
    const prev = seen.get(v);
    if (prev === undefined || prev < w) seen.set(v, w);
  };
  add(raw, 1);

  const tokens = name
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean)
    .map((t) => t.toLowerCase());
  if (tokens.length > 1) add(tokens.join(''), 1);
  if (tokens.length) add(tokens.map((t) => ABBREV[t] ?? t).join(''), 1);

  let g = raw;
  for (const [re, rep] of GLUED) g = g.replace(re, rep);
  add(g, 0.9);

  return [...seen].map(([v, w]) => ({ v, w }));
}

/**
 * Score how well a source field matches a canonical field. Returns 0 for no match.
 * Exact alias hits win. Substring hits are accepted but scored down and reported
 * so a human can spot a bad guess.
 */
function scoreMatch(sourceField: SourceField, spec: FieldSpec): { score: number; how: MappingEntry['how'] } {
  const candidates: Variant[] = [];
  for (const n of [sourceField.name, sourceField.alias]) {
    if (n) candidates.push(...variants(String(n)));
  }
  let best = { score: 0, how: 'fuzzy' as MappingEntry['how'] };

  for (let i = 0; i < spec.aliases.length; i++) {
    const alias = norm(spec.aliases[i]!);
    // Earlier aliases are slightly preferred so ties resolve predictably.
    const priority = 1 - i / (spec.aliases.length * 20);
    for (const { v: c, w } of candidates) {
      if (!c) continue;
      if (c === alias) {
        const score = 1.0 * priority * w;
        if (score > best.score) best = { score, how: w === 1 ? 'exact' : 'alias' };
        continue;
      }
      // Substring in either direction, scaled by how much of the longer string
      // the match covers. "situsaddressfull" vs "situsaddress" scores well;
      // "zip" vs "ziplookupcodeextra" scores poorly.
      if (c.includes(alias) || alias.includes(c)) {
        const shorter = Math.min(c.length, alias.length);
        const longer = Math.max(c.length, alias.length);
        if (shorter < 3) continue;
        const coverage = shorter / longer;
        if (coverage < 0.45) continue;
        const score = 0.55 * coverage * priority * w;
        if (score > best.score) best = { score, how: coverage > 0.85 ? 'alias' : 'fuzzy' };
      }
    }
  }
  return best;
}

/**
 * Greedily assign each canonical field the best unused source field.
 * `overrides` maps canonical field to an exact source field name and always wins.
 */
export function resolveFieldMap(
  sourceFields: SourceField[],
  specs: Record<string, FieldSpec> = FIELD_SPECS,
  overrides: Record<string, string> = {},
): MappingReport {
  const entries: MappingEntry[] = [];
  const usedSource = new Set<string>();
  const mapping: Record<string, string> = {};

  // Overrides may be written either canonical->source or source->canonical.
  // Accept both so config files are forgiving.
  const byName = new Map(sourceFields.map((f) => [norm(f.name), f.name]));
  for (const [a, b] of Object.entries(overrides)) {
    let canonical: string | undefined;
    let source: string | undefined;
    if (specs[a]) { canonical = a; source = b; }
    else if (specs[b]) { canonical = b; source = a; }
    if (!canonical || !source) continue;
    const actual = byName.get(norm(source)) ?? source;
    mapping[canonical] = actual;
    usedSource.add(actual);
    entries.push({ canonical, sourceField: actual, confidence: 1, how: 'override' });
  }

  const candidates: Array<{ canonical: string; sourceField: string; score: number; how: MappingEntry['how'] }> = [];
  for (const [canonical, spec] of Object.entries(specs)) {
    if (mapping[canonical]) continue;
    for (const sf of sourceFields) {
      const { score, how } = scoreMatch(sf, spec);
      if (score > 0) candidates.push({ canonical, sourceField: sf.name, score, how });
    }
  }
  candidates.sort((a, b) => b.score - a.score || a.canonical.localeCompare(b.canonical));

  for (const c of candidates) {
    if (mapping[c.canonical]) continue;
    if (usedSource.has(c.sourceField)) continue;
    mapping[c.canonical] = c.sourceField;
    usedSource.add(c.sourceField);
    entries.push({ canonical: c.canonical, sourceField: c.sourceField, confidence: Number(c.score.toFixed(3)), how: c.how });
  }

  const unmapped = sourceFields.map((f) => f.name).filter((n) => !usedSource.has(n));
  const missingImportant = IMPORTANT.filter((k) => specs[k] && !mapping[k]);
  entries.sort((a, b) => b.confidence - a.confidence);
  return { mapping, entries, unmapped, missingImportant };
}

function coerce(v: unknown, type: FieldType): unknown {
  if (v == null || v === '') return undefined;
  if (type === 'number') return parseNum(v);
  if (type === 'date') return parseDate(v);
  const s = String(v).trim();
  return s === '' ? undefined : s;
}

/**
 * Apply a resolved mapping to one raw record, producing canonical values.
 * Helper address parts are composed into addressLine when no single address
 * column exists, which is the common case for parcel and REO layers.
 */
export function applyMapping(
  raw: RawRecord,
  mapping: Record<string, string>,
  specs: Record<string, FieldSpec> = FIELD_SPECS,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [canonical, sourceField] of Object.entries(mapping)) {
    const spec = specs[canonical];
    if (!spec) continue;
    const val = coerce(raw[sourceField], spec.type);
    if (val !== undefined) out[canonical] = val;
  }

  if (specs === FIELD_SPECS) {
    if (!out.addressLine) {
      const composed = joinAddress([
        out.houseNumber as string, out.streetPreDir as string, out.streetName as string,
        out.streetSuffix as string, out.streetPostDir as string,
        out.unit ? `APT ${out.unit}` : undefined,
      ]);
      if (composed && /\d/.test(composed)) out.addressLine = composed;
    }
    for (const helper of Object.keys(specs).filter((k) => specs[k]!.helper)) delete out[helper];

    if (out.apn) out.apn = normApn(out.apn as string);
    if (out.state) out.state = normState(out.state as string);
    if (out.ownerMailingState) out.ownerMailingState = normState(out.ownerMailingState as string);
    if (out.zip) out.zip = normZip(out.zip);
    if (out.ownerMailingZip) out.ownerMailingZip = normZip(out.ownerMailingZip);
    // Lot size published in acres needs converting to keep one unit downstream.
    const lot = out.lotSqft as number | undefined;
    if (lot !== undefined && lot > 0 && lot < 200) out.lotSqft = Math.round(lot * 43560);
  }
  return out;
}

/** Build a PropertyInput from a raw record plus config defaults. */
export function toProperty(
  raw: RawRecord,
  mapping: Record<string, string>,
  source: string,
  defaults: Partial<PropertyInput> = {},
): PropertyInput {
  const mapped = applyMapping(raw, mapping) as Partial<PropertyInput>;
  return { ...defaults, ...mapped, raw, source };
}
