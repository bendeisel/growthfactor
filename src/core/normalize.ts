// Normalization. Every cross-source match in this system depends on these
// functions, so they stay boring, pure, and heavily tested.

import type { OwnerType, PropertyInput } from './types.ts';

/** Loose key used for comparing field names and free text. */
export function normKey(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/** APNs are printed with dots, dashes and spaces that vary by county and by vendor. */
export function normApn(s: string | undefined | null): string | undefined {
  if (s == null) return undefined;
  const v = String(s).toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (!v || /^0+$/.test(v)) return undefined;
  return v;
}

const DIRECTIONALS: Record<string, string> = {
  NORTH: 'N', SOUTH: 'S', EAST: 'E', WEST: 'W',
  NORTHEAST: 'NE', NORTHWEST: 'NW', SOUTHEAST: 'SE', SOUTHWEST: 'SW',
};

const SUFFIXES: Record<string, string> = {
  STREET: 'ST', STR: 'ST', AVENUE: 'AVE', AV: 'AVE', ROAD: 'RD', DRIVE: 'DR',
  LANE: 'LN', BOULEVARD: 'BLVD', BOULEVARDE: 'BLVD', COURT: 'CT', CIRCLE: 'CIR',
  PLACE: 'PL', TERRACE: 'TER', TERR: 'TER', PARKWAY: 'PKWY', PARKWY: 'PKWY',
  HIGHWAY: 'HWY', TRAIL: 'TRL', SQUARE: 'SQ', POINT: 'PT', RIDGE: 'RDG',
  CREEK: 'CRK', COVE: 'CV', BEND: 'BND', CROSSING: 'XING', HOLLOW: 'HOLW',
  EXTENSION: 'EXT', TURNPIKE: 'TPKE', FREEWAY: 'FWY', LOOP: 'LOOP', PIKE: 'PIKE',
  RUN: 'RUN', WAY: 'WAY', PASS: 'PASS', PLAZA: 'PLZ', LANDING: 'LNDG',
  MOUNT: 'MT', MOUNTAIN: 'MTN', VALLEY: 'VLY', SPRINGS: 'SPGS', SPRING: 'SPG',
  MEADOWS: 'MDWS', MEADOW: 'MDW', FOREST: 'FRST', GARDENS: 'GDNS', HEIGHTS: 'HTS',
};

const UNIT_WORDS: Record<string, string> = {
  APARTMENT: 'APT', APT: 'APT', SUITE: 'STE', STE: 'STE', UNIT: 'UNIT',
  BUILDING: 'BLDG', BLDG: 'BLDG', FLOOR: 'FL', FL: 'FL', ROOM: 'RM', LOT: 'LOT',
};

/**
 * Collapse a street address to a comparable form.
 * "123 N. Main Street, Apt. 4" and "123 North Main St #4" both become
 * "123 N MAIN ST APT 4".
 */
export function normAddress(s: string | undefined | null): string | undefined {
  if (s == null) return undefined;
  let v = String(s).toUpperCase();
  // Drop anything after a comma that looks like city/state/zip noise, but keep
  // unit fragments that commonly follow a comma.
  v = v.replace(/\s*#\s*/g, ' APT ');
  v = v.replace(/[.,;:'"()]/g, ' ');
  v = v.replace(/\s+/g, ' ').trim();
  if (!v) return undefined;

  const parts = v.split(' ').filter(Boolean);
  const out: string[] = [];
  for (const p of parts) {
    if (DIRECTIONALS[p]) { out.push(DIRECTIONALS[p]); continue; }
    if (SUFFIXES[p]) { out.push(SUFFIXES[p]); continue; }
    if (UNIT_WORDS[p]) { out.push(UNIT_WORDS[p]); continue; }
    out.push(p);
  }
  const res = out.join(' ').trim();
  return res || undefined;
}

export const STATE_FIPS: Record<string, string> = {
  AL: '01', AK: '02', AZ: '04', AR: '05', CA: '06', CO: '08', CT: '09', DE: '10',
  DC: '11', FL: '12', GA: '13', HI: '15', ID: '16', IL: '17', IN: '18', IA: '19',
  KS: '20', KY: '21', LA: '22', ME: '23', MD: '24', MA: '25', MI: '26', MN: '27',
  MS: '28', MO: '29', MT: '30', NE: '31', NV: '32', NH: '33', NJ: '34', NM: '35',
  NY: '36', NC: '37', ND: '38', OH: '39', OK: '40', OR: '41', PA: '42', RI: '44',
  SC: '45', SD: '46', TN: '47', TX: '48', UT: '49', VT: '50', VA: '51', WA: '53',
  WV: '54', WI: '55', WY: '56', PR: '72',
};

export function normState(s: string | undefined | null): string | undefined {
  if (s == null) return undefined;
  const v = String(s).trim().toUpperCase();
  if (!v) return undefined;
  if (v.length === 2 && STATE_FIPS[v]) return v;
  const byName: Record<string, string> = {
    ALABAMA: 'AL', ALASKA: 'AK', ARIZONA: 'AZ', ARKANSAS: 'AR', CALIFORNIA: 'CA',
    COLORADO: 'CO', CONNECTICUT: 'CT', DELAWARE: 'DE', FLORIDA: 'FL', GEORGIA: 'GA',
    HAWAII: 'HI', IDAHO: 'ID', ILLINOIS: 'IL', INDIANA: 'IN', IOWA: 'IA',
    KANSAS: 'KS', KENTUCKY: 'KY', LOUISIANA: 'LA', MAINE: 'ME', MARYLAND: 'MD',
    MASSACHUSETTS: 'MA', MICHIGAN: 'MI', MINNESOTA: 'MN', MISSISSIPPI: 'MS',
    MISSOURI: 'MO', MONTANA: 'MT', NEBRASKA: 'NE', NEVADA: 'NV',
    'NEW HAMPSHIRE': 'NH', 'NEW JERSEY': 'NJ', 'NEW MEXICO': 'NM', 'NEW YORK': 'NY',
    'NORTH CAROLINA': 'NC', 'NORTH DAKOTA': 'ND', OHIO: 'OH', OKLAHOMA: 'OK',
    OREGON: 'OR', PENNSYLVANIA: 'PA', 'RHODE ISLAND': 'RI', 'SOUTH CAROLINA': 'SC',
    'SOUTH DAKOTA': 'SD', TENNESSEE: 'TN', TEXAS: 'TX', UTAH: 'UT', VERMONT: 'VT',
    VIRGINIA: 'VA', WASHINGTON: 'WA', 'WEST VIRGINIA': 'WV', WISCONSIN: 'WI',
    WYOMING: 'WY', 'DISTRICT OF COLUMBIA': 'DC',
  };
  return byName[v] ?? (v.length === 2 ? v : undefined);
}

export function normZip(s: unknown): string | undefined {
  if (s == null) return undefined;
  const m = String(s).match(/\d{5}/);
  return m ? m[0] : undefined;
}

/** Parse money and numerics out of "$1,234.00", "1234", 1234, " ", null. */
export function parseNum(v: unknown): number | undefined {
  if (v == null || v === '') return undefined;
  if (typeof v === 'number') return Number.isFinite(v) ? v : undefined;
  const s = String(v).replace(/[$,\s]/g, '');
  if (!s || !/^-?\d*\.?\d+$/.test(s)) return undefined;
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
}

/**
 * Parse a date to ISO yyyy-mm-dd. Handles ISO, US slashed dates, and the epoch
 * milliseconds that ArcGIS returns for date fields.
 */
export function parseDate(v: unknown): string | undefined {
  if (v == null || v === '') return undefined;
  if (typeof v === 'number' || /^-?\d{10,13}$/.test(String(v))) {
    let n = Number(v);
    if (!Number.isFinite(n)) return undefined;
    // ArcGIS and several county exports write 0 into an empty date column. Reading
    // that as 1970 would turn a blank field into 56 years of ownership and a false
    // free and clear flag, so it is treated as missing.
    if (n === 0) return undefined;
    if (String(Math.abs(Math.trunc(n))).length <= 10) n *= 1000;
    const d = new Date(n);
    if (Number.isNaN(d.getTime())) return undefined;
    const iso = d.toISOString().slice(0, 10);
    // Guard against nonsense epochs from junk numeric columns.
    return iso > '1900-01-01' && iso < '2100-01-01' ? iso : undefined;
  }
  const s = String(v).trim();
  let m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  m = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
  if (m) {
    const mo = m[1]!.padStart(2, '0');
    const da = m[2]!.padStart(2, '0');
    let yr = m[3]!;
    if (yr.length === 2) yr = Number(yr) > 40 ? `19${yr}` : `20${yr}`;
    return `${yr}-${mo}-${da}`;
  }
  const d = new Date(s);
  if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  return undefined;
}

const ESTATE_RE = /\b(ESTATE|EST OF|ESTATE OF|HEIRS?|HEIRS OF|DECEASED|DECD|DEC'D|LIFE ESTATE|EXECUTOR|ADMINISTRATOR)\b/;
const TRUST_RE = /\b(TRUST|TRUSTEE|TRUSTEES|TR\b|REVOCABLE|IRREVOCABLE|LIVING TRUST|FAMILY TRUST)\b/;
const COMPANY_RE = /\b(LLC|L L C|INC|INCORPORATED|CORP|CORPORATION|CO\b|COMPANY|LP\b|LLP|LTD|PARTNERS|PARTNERSHIP|HOLDINGS|PROPERTIES|INVESTMENTS|ENTERPRISES|GROUP|ASSOCIATES|REALTY|MANAGEMENT|CAPITAL|VENTURES|BANK|MORTGAGE|CREDIT UNION|NA\b|FSB|ASSN|ASSOCIATION|CHURCH|MINISTRIES)\b/;
const GOV_RE = /\b(CITY OF|COUNTY OF|STATE OF|UNITED STATES|USA|SECRETARY OF|HOUSING AUTHORITY|SCHOOL DISTRICT|METRO GOVERNMENT|DEPARTMENT OF|VETERANS AFFAIRS|HUD)\b/;

export interface OwnerClassification {
  ownerType: OwnerType;
  estateIndicator: boolean;
  trustIndicator: boolean;
}

/**
 * Classify an owner name from the assessor roll. "SMITH JOHN ESTATE OF" is a
 * probate lead that cost nothing to find, which is the whole point of reading
 * owner names carefully.
 */
export function classifyOwner(name: string | undefined | null): OwnerClassification {
  if (!name) return { ownerType: 'unknown', estateIndicator: false, trustIndicator: false };
  const v = String(name).toUpperCase().replace(/[.,]/g, ' ').replace(/\s+/g, ' ').trim();
  const estateIndicator = ESTATE_RE.test(v);
  const trustIndicator = TRUST_RE.test(v);
  let ownerType: OwnerType;
  if (GOV_RE.test(v)) ownerType = 'government';
  else if (estateIndicator) ownerType = 'estate';
  else if (trustIndicator) ownerType = 'trust';
  else if (COMPANY_RE.test(v)) ownerType = 'company';
  else ownerType = 'individual';
  return { ownerType, estateIndicator, trustIndicator };
}

export interface DedupeResult {
  key: string;
  basis: 'fips_apn' | 'address' | 'source_id';
}

export interface KeySet extends DedupeResult {
  /**
   * Every identifier this record can be recognised by, primary first.
   *
   * This matters more than it looks. A parcel layer publishes an APN, while a code
   * enforcement feed, a court docket and the HUD REO layer publish only an address.
   * If the parcel were stored under an APN key alone, an address-only source could
   * never find it and every free distress signal would land on a duplicate row.
   * Storing all of a property's keys as aliases is what lets signals stack.
   */
  keys: string[];
}

/**
 * Compute every key a property can be matched on, in precedence order:
 *   1. fips + apn, the stable pairing the build spec asks for
 *   2. normalized street address plus zip
 *   3. normalized street address plus city and state, when no zip was published
 *   4. a bare apn with no county, which is only unique within one county
 *   5. source name plus native record id, so nothing is ever merged blindly
 */
export function candidateKeys(p: PropertyInput): KeySet {
  const apn = normApn(p.apn);
  const fips = p.fips ? String(p.fips).replace(/\D/g, '') : undefined;
  const addr = normAddress(p.addressLine);
  const zip = normZip(p.zip);
  const city = p.city ? String(p.city).toUpperCase().trim() : undefined;
  const state = normState(p.state);

  const keys: string[] = [];
  const bases: Array<DedupeResult['basis']> = [];
  const push = (key: string | undefined, basis: DedupeResult['basis']) => {
    if (key && !keys.includes(key)) { keys.push(key); bases.push(basis); }
  };

  if (apn && fips) push(`apn:${fips}:${apn}`, 'fips_apn');
  if (addr && zip) push(`addr:${addr}:${zip}`, 'address');
  if (addr && city && state) push(`addr:${addr}:${city}:${state}`, 'address');
  if (apn && !fips) push(`apn:na:${apn}`, 'fips_apn');

  if (!keys.length) {
    const id = p.sourceRecordId ?? JSON.stringify(p.raw).slice(0, 120);
    push(`src:${p.source}:${id}`, 'source_id');
  }

  return { key: keys[0]!, basis: bases[0]!, keys };
}

/** The single primary key for a property. See candidateKeys for the alias set. */
export function dedupeKey(p: PropertyInput): DedupeResult {
  const { key, basis } = candidateKeys(p);
  return { key, basis };
}

/** Build a display address from whatever parts a source provided. */
export function joinAddress(parts: Array<string | number | undefined | null>): string | undefined {
  const v = parts.map((x) => (x == null ? '' : String(x).trim())).filter(Boolean).join(' ');
  return v.replace(/\s+/g, ' ').trim() || undefined;
}

export function titleCase(s: string | undefined): string | undefined {
  if (!s) return undefined;
  return s.toLowerCase().replace(/\b([a-z])/g, (m) => m.toUpperCase());
}

export interface SplitName {
  firstName?: string;
  lastName?: string;
  /** Set instead of a person name when the deed is held by an entity. */
  companyName?: string;
}

/**
 * Split an assessor owner name into parts.
 *
 * Tax rolls overwhelmingly print "LAST FIRST MIDDLE" with no comma, which is why
 * `order` defaults to last-first. Counties that print "FIRST LAST" can flip it in
 * the source config. Entities are returned as a company name rather than being
 * mangled into a first and last name.
 */
export function splitOwnerName(
  raw: string | undefined | null,
  order: 'last-first' | 'first-last' = 'last-first',
): SplitName {
  if (!raw) return {};
  const cls = classifyOwner(raw);
  let name = String(raw).replace(/\s+/g, ' ').trim();

  if (cls.ownerType === 'company' || cls.ownerType === 'government') {
    return { companyName: name };
  }
  if (cls.ownerType === 'trust' || cls.ownerType === 'estate') {
    // Keep the qualifier visible so mail is addressed correctly, but still try to
    // recover a surname for personalization.
    const stripped = name
      .replace(ESTATE_RE, ' ')
      .replace(TRUST_RE, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    const parts = stripped.split(' ').filter(Boolean);
    if (parts.length >= 2) {
      const [a, b] = order === 'last-first' ? [parts[1]!, parts[0]!] : [parts[0]!, parts[1]!];
      return { firstName: titleCase(a), lastName: titleCase(b), companyName: name };
    }
    if (parts.length === 1) return { lastName: titleCase(parts[0]), companyName: name };
    return { companyName: name };
  }

  // Drop co-owner clauses: "SMITH JOHN & MARY" or "SMITH JOHN ET UX".
  name = name.split(/\s+(?:&|AND|ET UX|ET AL|ET VIR)\s+/i)[0]!.trim();

  if (name.includes(',')) {
    const [left, right] = name.split(',', 2);
    return { lastName: titleCase(left!.trim()), firstName: titleCase((right ?? '').trim().split(' ')[0]) };
  }

  const parts = name.split(' ').filter(Boolean);
  if (parts.length === 1) return { lastName: titleCase(parts[0]) };
  if (order === 'last-first') {
    return { lastName: titleCase(parts[0]), firstName: titleCase(parts[1]) };
  }
  return { firstName: titleCase(parts[0]), lastName: titleCase(parts[parts.length - 1]) };
}
