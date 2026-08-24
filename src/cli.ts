#!/usr/bin/env node
// Command line entry point.
//
//   gf sources                       list configured data sources
//   gf discover <source>             probe a source and show the field mapping
//   gf pull <source> [--limit N]     ingest a source
//   gf score                         rescore everything, free
//   gf leads [filters]               show the working list
//   gf show <id>                     one lead in full
//   gf export [--out file.csv]       GHL ready CSV
//   gf stage <id>                    stage an offer for approval
//   gf push <id> --confirm           push one approved lead into GHL
//   gf runs                          ingest history, record counts and spend
//   gf ghl:fields                    list GHL custom field ids

import { readFileSync, readdirSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { runIngest } from './core/ingest.ts';
import { shapeBbox, toShape, vertexCount, type Shape } from './core/geo.ts';
import { enrichWaterDistance } from './core/geoenrich.ts';
import { findMarket, marketMatches, type Market, type MarketSubject } from './core/markets.ts';
import { fetchWaterbody, listLayers, type WaterbodySource } from './core/waterbody.ts';
import { DEFAULT_OFFER_CONFIG, computeOffer, type OfferConfig } from './core/offer.ts';
import { DEFAULT_BUY_BOX, matchesBuyBox, type BuyBox } from './core/buybox.ts';
import { scoreLead } from './core/score.ts';
import { HttpClient } from './core/http.ts';
import { SqliteStore } from './store/sqlite.ts';
import { SupabaseStore } from './store/supabase.ts';
import type { Store, LeadRecord, ListLeadsOptions } from './store/index.ts';
import { leadsToGhlCsv } from './export/ghl-csv.ts';
import { ghlConfigFromEnv, listCustomFields, pushLead } from './export/ghl-api.ts';
import { centsToUsd, spendThisMonth, DEFAULT_BUDGET, type BudgetConfig } from './core/budget.ts';
import { runSkipTrace, type SkipTraceVendor } from './enrich/skiptrace.ts';
import type { SourceConfig } from './core/types.ts';

// GF_CONFIG_DIR lets you keep several config sets side by side, for example one
// per market, without editing files in place.
const CONFIG_DIR = process.env.GF_CONFIG_DIR ?? 'config';
const SOURCES_DIR = join(CONFIG_DIR, 'sources');

// ---------------------------------------------------------------- environment

/** Minimal .env reader so no dependency is needed to hold local secrets. */
function loadEnv(path = '.env'): void {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    const key = m[1]!;
    let val = (m[2] ?? '').trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (val && !process.env[key]) process.env[key] = val;
  }
}

// ---------------------------------------------------------------- args

interface Args {
  cmd: string;
  positional: string[];
  flags: Record<string, string | boolean>;
}

function parseArgs(argv: string[]): Args {
  const [cmd = 'help', ...rest] = argv;
  const positional: string[] = [];
  const flags: Record<string, string | boolean> = {};
  for (let i = 0; i < rest.length; i++) {
    const a = rest[i]!;
    if (a.startsWith('--')) {
      const [k, v] = a.slice(2).split('=', 2);
      if (v !== undefined) flags[k!] = v;
      else if (rest[i + 1] && !rest[i + 1]!.startsWith('--')) flags[k!] = rest[++i]!;
      else flags[k!] = true;
    } else positional.push(a);
  }
  return { cmd, positional, flags };
}

const numFlag = (f: Args['flags'], k: string): number | undefined => {
  const v = f[k];
  if (v === undefined || v === true) return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
};
const strFlag = (f: Args['flags'], k: string): string | undefined => {
  const v = f[k];
  return typeof v === 'string' ? v : undefined;
};

// ---------------------------------------------------------------- config files

function readJson<T>(path: string, fallback: T): T {
  if (!existsSync(path)) return fallback;
  return JSON.parse(readFileSync(path, 'utf8')) as T;
}

function loadSources(): SourceConfig[] {
  if (!existsSync(SOURCES_DIR)) return [];
  const out: SourceConfig[] = [];
  for (const file of readdirSync(SOURCES_DIR).filter((f) => f.endsWith('.json')).sort()) {
    const body = JSON.parse(readFileSync(join(SOURCES_DIR, file), 'utf8')) as unknown;
    const list = Array.isArray(body)
      ? body
      : (body as { sources?: unknown[] }).sources ?? [body];
    for (const s of list as SourceConfig[]) out.push(s);
  }
  return out;
}

function findSource(name: string): SourceConfig {
  const all = loadSources();
  const hit = all.find((s) => s.name === name);
  if (!hit) {
    throw new Error(`unknown source "${name}". Available: ${all.map((s) => s.name).join(', ') || '(none)'}`);
  }
  return hit;
}

const loadBuyBox = (): BuyBox => readJson(join(CONFIG_DIR, 'buybox.json'), DEFAULT_BUY_BOX);
const WATERBODY_DIR = join(CONFIG_DIR, 'waterbodies');
const loadBudget = (): BudgetConfig => readJson(join(CONFIG_DIR, 'budget.json'), DEFAULT_BUDGET);

function loadSkipTraceVendor(): SkipTraceVendor {
  const body = readJson<{ vendor?: SkipTraceVendor }>(join(CONFIG_DIR, 'skiptrace.json'), {});
  const v = body.vendor;
  if (!v || v.enabled === false || v.name === 'REPLACE_ME') {
    throw new Error(
      'no skip trace vendor configured. Fill in config/skiptrace.json and set enabled to true. '
      + 'This is the only part of the system that costs money per record.',
    );
  }
  return v;
}

function loadMarkets(): Market[] {
  const body = readJson<{ markets?: Market[] }>(join(CONFIG_DIR, 'markets.json'), {});
  return body.markets ?? [];
}

function loadWaterbodySource(name: string): WaterbodySource {
  const path = join(WATERBODY_DIR, `${name}.source.json`);
  if (!existsSync(path)) {
    throw new Error(`no source config at ${path}. Create one, or copy the Old Hickory Lake example.`);
  }
  return JSON.parse(readFileSync(path, 'utf8')) as WaterbodySource;
}

function loadWaterbodyShape(name: string): Shape {
  const path = join(WATERBODY_DIR, `${name}.geojson`);
  if (!existsSync(path)) {
    throw new Error(
      `no shoreline cached for "${name}". Run: gf waterbody:fetch ${name}`,
    );
  }
  const shape = toShape(JSON.parse(readFileSync(path, 'utf8')));
  if (!shape) throw new Error(`${path} did not parse as a polygon`);
  return shape;
}

/** Turn a stored lead into the shape a market test needs. */
function marketSubject(l: LeadRecord): MarketSubject {
  return {
    county: l.county,
    state: l.state,
    city: l.city,
    latitude: l.latitude,
    longitude: l.longitude,
    distanceToWaterFt: l.distanceToWaterFt,
    waterbodyName: l.waterbodyName,
  };
}
const loadOfferConfig = (): OfferConfig => readJson(join(CONFIG_DIR, 'offer.json'), DEFAULT_OFFER_CONFIG);
const loadGhlFieldIds = (): Record<string, string> => readJson(join(CONFIG_DIR, 'ghl-fields.json'), {});

async function openStore(flags: Args['flags']): Promise<Store> {
  const kind = strFlag(flags, 'store') ?? process.env.GF_STORE ?? 'sqlite';
  const store: Store = kind === 'supabase'
    ? new SupabaseStore()
    : new SqliteStore(strFlag(flags, 'db') ?? process.env.GF_DB ?? join('data', 'growthfactor.db'));
  await store.init();
  return store;
}

// ---------------------------------------------------------------- output

const money = (n: number | undefined): string =>
  n == null ? '' : `$${Math.round(n).toLocaleString('en-US')}`;

function table(rows: Array<Record<string, unknown>>, columns: string[]): string {
  if (!rows.length) return '(no rows)';
  const widths = columns.map((c) =>
    Math.max(c.length, ...rows.map((r) => String(r[c] ?? '').length)));
  const line = (cells: string[]) =>
    cells.map((v, i) => v.padEnd(widths[i]!)).join('  ').trimEnd();
  return [
    line(columns),
    line(columns.map((_, i) => '-'.repeat(widths[i]!))),
    ...rows.map((r) => line(columns.map((c) => String(r[c] ?? '')))),
  ].join('\n');
}

function leadRows(leads: LeadRecord[]): Array<Record<string, unknown>> {
  return leads.map((l) => ({
    score: l.overallScore ?? '',
    gr: l.grade ?? '',
    strategy: l.strategy ?? '',
    address: l.addressLine ?? '',
    city: l.city ?? '',
    st: l.state ?? '',
    value: money(l.estimatedValue),
    'eq%': l.equityPercent == null ? '' : Math.round(l.equityPercent),
    yrs: l.yearsOwned == null ? '' : Math.round(l.yearsOwned),
    water: l.distanceToWaterFt == null ? '' : `${Math.round(l.distanceToWaterFt)}ft`,
    signals: l.distressTypes.join(','),
    owner: (l.ownerName ?? '').slice(0, 26),
  }));
}

const LEAD_COLUMNS = ['score', 'gr', 'strategy', 'address', 'city', 'st', 'value', 'eq%', 'yrs', 'water', 'signals', 'owner'];

function listOptsFrom(flags: Args['flags']): ListLeadsOptions {
  return {
    minOverallScore: numFlag(flags, 'min-score'),
    strategy: strFlag(flags, 'strategy'),
    state: strFlag(flags, 'state'),
    county: strFlag(flags, 'county'),
    eventType: strFlag(flags, 'event'),
    maxWaterFt: numFlag(flags, 'max-water-ft'),
    stage: strFlag(flags, 'stage'),
    limit: numFlag(flags, 'limit') ?? 50,
    sortBy: (strFlag(flags, 'sort') as ListLeadsOptions['sortBy']) ?? 'overall',
  };
}

// ---------------------------------------------------------------- commands

const HELP = `growthfactor leads, distressed property pipeline

  gf sources                                list configured sources
  gf find "<query>" [--kind arcgis|socrata] search public data catalogs by county
  gf discover <source>                      probe a source, show field mapping
  gf pull <source> [--limit N] [--dry-run]  ingest one source
  gf pull-all [--limit N]                   ingest every enabled source
  gf score [--as-of YYYY-MM-DD]             rescore all leads, costs nothing
  gf markets [name]                         list target markets
  gf waterbody:fetch <name>                 download and cache a shoreline
  gf waterbody:layers <serviceUrl>          list layers in a GIS service
  gf geo [--waterbody N] [--max-miles N]    compute distance to water, free
  gf leads [--market M] [--min-score N] [--strategy S] [--state XX] [--county C]
           [--event T] [--max-water-ft N]
           [--sort overall|distress|seller_finance|equity|recent|water]
           [--limit N] [--json] [--buybox]
  gf show <lead-id>                         one lead in full, with event history
  gf export [--out file.csv] [filters]      GHL ready CSV
  gf stage <lead-id> [--offer N] [--notes "..."]
  gf push <lead-id> --confirm               create GHL contact and opportunity
  gf spend                                  monthly budget, spend and projection
  gf trace [ids...] [--market M] [--min-score N] [--limit N] [--confirm]
                                            skip trace, dry run unless confirmed
  gf runs [--limit N]                       ingest history and spend
  gf ghl:fields                             list GHL custom field ids
  gf targets:push [--source S]              upload source configs to Supabase
  gf status                                 database summary

Global flags: --store sqlite|supabase, --db path/to.db
`;

async function cmdSources(): Promise<void> {
  const rows = loadSources().map((s) => ({
    name: s.name,
    kind: s.kind,
    enabled: s.enabled === false ? 'no' : 'yes',
    cost: s.kind === 'reapi'
      ? (s.costPerRecordCents ? `${s.costPerRecordCents}c/rec` : 'PAID, cost unset')
      : 'free',
    events: (s.impliesEvents ?? []).join(','),
    label: s.label ?? '',
  }));
  console.log(table(rows, ['name', 'kind', 'enabled', 'cost', 'events', 'label']));
}

/**
 * Search the two public catalogs that index almost every county and city dataset
 * in the country, so finding a new county is a query rather than an afternoon of
 * clicking through GIS portals.
 */
async function cmdFind(args: Args): Promise<void> {
  const query = args.positional.join(' ').trim();
  if (!query) { console.log('usage: gf find "davidson county parcels"'); process.exitCode = 1; return; }
  const http = new HttpClient({ minIntervalMs: 100 });
  const want = strFlag(args.flags, 'kind');
  const limit = numFlag(args.flags, 'limit') ?? 15;

  if (!want || want === 'arcgis') {
    console.log('=== ArcGIS Hub (parcels, code enforcement, vacancy, REO) ===');
    try {
      const body = await http.getJson<{ data?: Array<Record<string, unknown>> }>(
        `https://hub.arcgis.com/api/v3/datasets?q=${encodeURIComponent(query)}&limit=${limit}`,
      );
      const rows = (body.data ?? []).map((d) => {
        const a = (d.attributes ?? {}) as Record<string, unknown>;
        return {
          name: String(a.name ?? '').slice(0, 44),
          org: String(a.orgName ?? a.owner ?? '').slice(0, 22),
          records: String(a.recordCount ?? ''),
          url: String(a.url ?? a.serviceUrl ?? ''),
        };
      });
      console.log(table(rows, ['name', 'org', 'records', 'url']));
      console.log('Take a url ending in /MapServer/0 or /FeatureServer/0 and put it in a source config with kind "arcgis".');
    } catch (err) {
      console.log(`  lookup failed: ${(err as Error).message}`);
    }
  }

  if (!want || want === 'socrata') {
    console.log('\n=== Socrata open data (violations, demolitions, tax delinquency) ===');
    try {
      const body = await http.getJson<{ results?: Array<Record<string, unknown>> }>(
        `https://api.us.socrata.com/api/catalog/v1?q=${encodeURIComponent(query)}&limit=${limit}`,
      );
      const rows = (body.results ?? []).map((r) => {
        const res = (r.resource ?? {}) as Record<string, unknown>;
        const meta = (r.metadata ?? {}) as Record<string, unknown>;
        return {
          name: String(res.name ?? '').slice(0, 44),
          domain: String(meta.domain ?? ''),
          datasetId: String(res.id ?? ''),
          type: String(res.type ?? ''),
        };
      });
      console.log(table(rows, ['name', 'domain', 'datasetId', 'type']));
      console.log('Put domain and datasetId in a source config with kind "socrata".');
    } catch (err) {
      console.log(`  lookup failed: ${(err as Error).message}`);
    }
  }
}

async function cmdDiscover(args: Args): Promise<void> {
  const cfg = findSource(args.positional[0] ?? '');
  const { connectorFor } = await import('./connectors/registry.ts');
  const { EVENT_FIELD_SPECS, FIELD_SPECS, resolveFieldMap } = await import('./core/fieldmap.ts');
  const http = new HttpClient({ minIntervalMs: Number(cfg.minIntervalMs ?? 250) });
  const described = await connectorFor(cfg).describe(cfg, http);

  console.log(`source:  ${cfg.name} (${cfg.kind})`);
  console.log(`label:   ${described.label}`);
  console.log(`fields:  ${described.fields.length}`);
  if (described.recordCount != null) console.log(`records: ${described.recordCount.toLocaleString('en-US')}`);
  for (const n of described.notes) console.log(`note:    ${n}`);

  const prop = resolveFieldMap(described.fields, FIELD_SPECS, cfg.fieldMap ?? {});
  const ev = resolveFieldMap(described.fields, EVENT_FIELD_SPECS, (cfg.eventFieldMap as Record<string, string>) ?? {});

  console.log('\nproperty field mapping:');
  console.log(table(
    prop.entries.map((e) => ({
      canonical: e.canonical, source_field: e.sourceField,
      confidence: e.confidence.toFixed(2), how: e.how,
    })),
    ['canonical', 'source_field', 'confidence', 'how'],
  ));
  if (prop.missingImportant.length) {
    console.log(`\nNOT MAPPED (important): ${prop.missingImportant.join(', ')}`);
    console.log('Supply these in the source config "defaults" or "fieldMap".');
  }
  if (ev.entries.length) {
    console.log('\nevent field mapping:');
    console.log(table(
      ev.entries.map((e) => ({
        canonical: e.canonical, source_field: e.sourceField,
        confidence: e.confidence.toFixed(2), how: e.how,
      })),
      ['canonical', 'source_field', 'confidence', 'how'],
    ));
  }
  const low = prop.entries.filter((e) => e.confidence < 0.7);
  if (low.length) {
    console.log(`\nCheck these low confidence guesses by hand: ${low.map((e) => `${e.canonical}=${e.sourceField}`).join(', ')}`);
  }
  console.log(`\nunmapped source fields: ${prop.unmapped.length ? prop.unmapped.join(', ') : '(none)'}`);
}

async function ingestOne(cfg: SourceConfig, store: Store, args: Args): Promise<void> {
  const res = await runIngest(cfg, store, {
    limit: numFlag(args.flags, 'limit'),
    dryRun: args.flags['dry-run'] === true,
    asOf: strFlag(args.flags, 'as-of'),
    onProgress: (m) => console.log(m),
  });
  console.log([
    `  status ${res.status}`,
    `pulled ${res.recordsPulled}`,
    `new ${res.recordsNew}`,
    `updated ${res.recordsUpdated}`,
    `events ${res.eventsCreated}`,
    `skipped ${res.recordsSkipped}`,
    `api calls ${res.apiCalls}`,
    `cost ${res.estimatedCostCents === 0 ? '$0.00 (free source)' : `$${(res.estimatedCostCents / 100).toFixed(2)}`}`,
  ].join(', '));
  if (res.error) console.log(`  error: ${res.error}`);
}

async function cmdPull(args: Args): Promise<void> {
  const store = await openStore(args.flags);
  try {
    await ingestOne(findSource(args.positional[0] ?? ''), store, args);
  } finally {
    await store.close();
  }
}

async function cmdPullAll(args: Args): Promise<void> {
  const store = await openStore(args.flags);
  try {
    for (const cfg of loadSources().filter((s) => s.enabled !== false)) {
      console.log(`\n=== ${cfg.name} ===`);
      await ingestOne(cfg, store, args);
    }
  } finally {
    await store.close();
  }
}

async function cmdScore(args: Args): Promise<void> {
  const store = await openStore(args.flags);
  try {
    const asOf = strFlag(args.flags, 'as-of') ?? new Date().toISOString().slice(0, 10);
    const rows = await store.allForScoring();
    for (const r of rows) {
      await store.saveScores(r.id, scoreLead(r.property, r.derived, r.events, asOf));
    }
    console.log(`scored ${rows.length} properties as of ${asOf}`);
  } finally {
    await store.close();
  }
}

async function cmdLeads(args: Args): Promise<void> {
  const store = await openStore(args.flags);
  try {
    const opts = listOptsFrom(args.flags);
    const limit = opts.limit ?? 50;
    const marketName = strFlag(args.flags, 'market');
    // Buy box and market filters run in memory, so they have to read past the
    // limit first, otherwise they only ever filter the first page.
    const widen = Boolean(args.flags.buybox || marketName);
    let leads = await store.listLeads(
      widen ? { ...opts, limit: Math.max(limit * 40, 5000) } : opts,
    );

    if (marketName) {
      const market = findMarket(loadMarkets(), marketName);
      const before = leads.length;
      leads = leads.filter((l) => marketMatches(marketSubject(l), market).pass);
      console.log(`market ${market.name}: ${leads.length} of ${before} leads match`);
      if (market.waterfront && !leads.length) {
        console.log(`No matches. Did you run "gf waterbody:fetch ${market.waterfront.waterbody}" and "gf geo"?`);
      }
      console.log('');
    }
    if (args.flags.buybox) {
      const box = loadBuyBox();
      const before = leads.length;
      leads = leads.filter((l) => matchesBuyBox(
        {
          property: {
            raw: {}, source: '', addressLine: l.addressLine, city: l.city, state: l.state,
            zip: l.zip, county: l.county, propertyType: l.propertyType, beds: l.beds,
            sqft: l.sqft, yearBuilt: l.yearBuilt, estimatedValue: l.estimatedValue,
          },
          derived: { equityPercent: l.equityPercent ?? null } as never,
          scores: { overallScore: l.overallScore ?? 0, strategy: l.strategy } as never,
        },
        box,
      ).pass);
      console.log(`buy box filter: ${leads.length} of ${before} leads pass\n`);
    }
    if (widen) leads = leads.slice(0, limit);
    if (args.flags.json) {
      console.log(JSON.stringify(leads, null, 2));
      return;
    }
    console.log(table(leadRows(leads), LEAD_COLUMNS));
    console.log(`\n${leads.length} leads. Use "gf show <id>" for detail, "gf export" for a GHL CSV.`);
  } finally {
    await store.close();
  }
}

async function cmdShow(args: Args): Promise<void> {
  const store = await openStore(args.flags);
  try {
    const id = args.positional[0] ?? '';
    const l = await store.getLead(id);
    if (!l) { console.log(`no lead found for "${id}"`); process.exitCode = 1; return; }
    const events = await store.listEvents(l.id);
    const offer = computeOffer(
      { raw: {}, source: '', estimatedValue: l.estimatedValue, sqft: l.sqft, propertyType: l.propertyType },
      { equityPercent: l.equityPercent ?? null } as never,
      loadOfferConfig(),
    );

    console.log(`${l.addressLine ?? '(no address)'}, ${l.city ?? ''} ${l.state ?? ''} ${l.zip ?? ''}`);
    console.log(`lead id      ${l.id}`);
    console.log(`county       ${l.county ?? ''}`);
    console.log(`score        ${l.overallScore ?? '?'} grade ${l.grade ?? '?'}, strategy ${l.strategy ?? '?'}`);
    console.log(`  distress ${l.distressScore ?? '?'}, seller finance ${l.sellerFinanceScore ?? '?'}`);
    console.log(`value        ${money(l.estimatedValue)}  equity ${money(l.estimatedEquity)} (${l.equityPercent ?? '?'}%, basis ${l.equityBasis ?? 'unknown'})`);
    console.log(`property     ${l.propertyType ?? ''} ${l.beds ?? '?'}bd ${l.baths ?? '?'}ba ${l.sqft ?? '?'}sqft built ${l.yearBuilt ?? '?'}`);
    console.log(`owner        ${l.ownerName ?? '(unknown)'} [${l.ownerType ?? '?'}]`);
    console.log(`mailing      ${l.ownerMailingAddress ?? ''} ${l.ownerMailingCity ?? ''} ${l.ownerMailingState ?? ''} ${l.ownerMailingZip ?? ''}`);
    console.log(`tenure       ${l.yearsOwned ?? '?'} years, last sale ${l.lastSaleDate ?? '?'} for ${money(l.lastSaleAmount)}`);
    console.log(`absentee     ${l.absenteeOwner ?? 'unknown'}, out of state ${l.outOfStateOwner ?? 'unknown'}`);
    if (l.distanceToWaterFt != null) {
      const miles = l.distanceToWaterFt / 5280;
      const how = miles < 0.25 ? 'on the water' : miles < 1 ? 'walk to the water' : 'inland';
      console.log(`water        ${Math.round(l.distanceToWaterFt)} ft from ${l.waterbodyName ?? 'water'} (${how})`);
    }
    if (l.latitude != null && l.longitude != null) {
      console.log(`coordinates  ${l.latitude.toFixed(5)}, ${l.longitude.toFixed(5)}`);
    }
    console.log(`sources      ${l.sources.join(', ')}`);
    console.log(`pipeline     ${l.pipelineStage ?? '(not staged)'}`);

    console.log('\nwhy this scored:');
    for (const r of l.reasons) console.log(`  - ${r}`);

    console.log('\ndistress history:');
    console.log(table(
      events.map((e) => ({
        type: e.eventType, first_seen: e.firstSeenAt.slice(0, 10),
        last_seen: e.lastSeenAt.slice(0, 10), filing: e.filingDate ?? '',
        auction: e.auctionDate ?? '', cleared: e.clearedAt?.slice(0, 10) ?? '', source: e.source,
      })),
      ['type', 'first_seen', 'last_seen', 'filing', 'auction', 'cleared', 'source'],
    ));

    console.log('\noffer math (review before quoting anything):');
    console.log(`  ARV estimate      ${money(offer.arvEstimate ?? undefined)}`);
    console.log(`  repair estimate   ${money(offer.repairEstimate ?? undefined)}`);
    console.log(`  max cash offer    ${money(offer.maxCashOffer ?? undefined)}`);
    if (offer.sellerFinance) {
      const s = offer.sellerFinance;
      console.log(`  seller finance    ${money(s.price)} price, ${money(s.downPayment)} down, ${money(s.monthlyPrincipalAndInterest)}/mo at ${s.ratePercent}% over ${s.amortYears}y, balloon ${money(s.balloonBalance)} at year ${s.balloonYears}`);
    }
    for (const n of offer.notes) console.log(`  note: ${n}`);
  } finally {
    await store.close();
  }
}

async function cmdExport(args: Args): Promise<void> {
  const store = await openStore(args.flags);
  try {
    let leads = await store.listLeads({ ...listOptsFrom(args.flags), limit: numFlag(args.flags, 'limit') ?? 5000 });
    const marketName = strFlag(args.flags, 'market');
    if (marketName) {
      const market = findMarket(loadMarkets(), marketName);
      const before = leads.length;
      leads = leads.filter((l) => marketMatches(marketSubject(l), market).pass);
      console.log(`market ${market.name}: ${leads.length} of ${before} leads match`);
    }
    const csv = leadsToGhlCsv(
      leads,
      loadOfferConfig(),
      (strFlag(args.flags, 'name-order') as 'last-first' | 'first-last') ?? 'last-first',
    );
    const out = strFlag(args.flags, 'out') ?? join('out', `ghl-leads-${new Date().toISOString().slice(0, 10)}.csv`);
    mkdirSync(join(out, '..'), { recursive: true });
    writeFileSync(out, csv);
    console.log(`wrote ${leads.length} leads to ${out}`);
    console.log('Import in GHL under Contacts > Import. Map address1 to the mailing address.');
  } finally {
    await store.close();
  }
}

async function cmdStage(args: Args): Promise<void> {
  const store = await openStore(args.flags);
  try {
    const l = await store.getLead(args.positional[0] ?? '');
    if (!l) { console.log('no such lead'); process.exitCode = 1; return; }
    const offer = computeOffer(
      { raw: {}, source: '', estimatedValue: l.estimatedValue, sqft: l.sqft },
      { equityPercent: l.equityPercent ?? null } as never,
      loadOfferConfig(),
    );
    await store.stageOffer(l.id, {
      stage: 'awaiting_approval',
      arvEstimate: offer.arvEstimate,
      repairEstimate: offer.repairEstimate,
      maxOffer: offer.maxCashOffer,
      offerAmount: numFlag(args.flags, 'offer') ?? undefined,
      offerNotes: strFlag(args.flags, 'notes'),
      terms: offer.sellerFinance ? JSON.stringify(offer.sellerFinance) : undefined,
    });
    console.log(`staged ${l.addressLine ?? l.id} at awaiting_approval.`);
    console.log('Nothing has been sent. Approve it yourself before any offer goes out.');
  } finally {
    await store.close();
  }
}

async function cmdPush(args: Args): Promise<void> {
  if (args.flags.confirm !== true) {
    console.log('Refusing to push without --confirm. This writes a contact into GHL.');
    process.exitCode = 1;
    return;
  }
  const store = await openStore(args.flags);
  try {
    const l = await store.getLead(args.positional[0] ?? '');
    if (!l) { console.log('no such lead'); process.exitCode = 1; return; }
    const cfg = ghlConfigFromEnv({ customFieldIds: loadGhlFieldIds() });
    const res = await pushLead(l, cfg, { confirm: true });
    if (res.contactId) await store.setGhlIds(l.id, res.contactId, res.opportunityId);
    console.log(`contact ${res.contactId ?? '(none)'} opportunity ${res.opportunityId ?? '(none)'}`);
    for (const w of res.warnings) console.log(`warning: ${w}`);
    console.log('No outbound message was triggered. Staging only.');
  } finally {
    await store.close();
  }
}

async function cmdRuns(args: Args): Promise<void> {
  const store = await openStore(args.flags);
  try {
    const runs = await store.listRuns(numFlag(args.flags, 'limit') ?? 20);
    console.log(table(
      runs.map((r) => ({
        started: r.startedAt.slice(0, 16).replace('T', ' '),
        job: r.jobName, status: r.status, pulled: r.recordsPulled,
        new: r.recordsNew, updated: r.recordsUpdated, events: r.eventsCreated,
        calls: r.apiCalls, cost: `$${(r.estimatedCostCents / 100).toFixed(2)}`,
        error: (r.error ?? '').slice(0, 40),
      })),
      ['started', 'job', 'status', 'pulled', 'new', 'updated', 'events', 'calls', 'cost', 'error'],
    ));
    const total = runs.reduce((a, r) => a + r.estimatedCostCents, 0);
    console.log(`\ntotal spend across these runs: $${(total / 100).toFixed(2)}`);
  } finally {
    await store.close();
  }
}

async function cmdGhlFields(args: Args): Promise<void> {
  const cfg = ghlConfigFromEnv();
  const fields = await listCustomFields(cfg);
  console.log(table(
    fields.map((f) => ({ id: f.id, name: f.name ?? '', key: f.fieldKey ?? '', type: f.dataType ?? '' })),
    ['id', 'name', 'key', 'type'],
  ));
  console.log('\nPut the ids you want populated into config/ghl-fields.json, for example:');
  console.log('  { "property_address": "<id>", "equity_percent": "<id>" }');
}

/** Push local source configs up to ingest_targets so scheduled runs can read them. */
async function cmdTargetsPush(args: Args): Promise<void> {
  const url = (process.env.SUPABASE_URL ?? '').replace(/\/+$/, '');
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
  if (!url || !key) throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');

  const only = strFlag(args.flags, 'source');
  const sources = loadSources().filter((s) => !only || s.name === only);
  if (!sources.length) { console.log('no sources to push'); return; }

  const http = new HttpClient({ minIntervalMs: 0 });
  const body = sources.map((s) => ({
    name: s.name,
    config: s,
    enabled: s.enabled !== false,
    notes: Array.isArray(s.notes) ? (s.notes as string[]).join(' ') : (s.notes ?? null),
    updated_at: new Date().toISOString(),
  }));
  await http.request(`${url}/rest/v1/ingest_targets?on_conflict=name`, {
    method: 'POST',
    headers: {
      apikey: key,
      authorization: `Bearer ${key}`,
      'content-type': 'application/json',
      prefer: 'resolution=merge-duplicates,return=minimal',
    },
    body: JSON.stringify(body),
  });
  console.log(`pushed ${body.length} targets: ${body.map((b) => b.name).join(', ')}`);
  console.log('Schedule them with supabase/schedule.sql.');
}

async function cmdMarkets(args: Args): Promise<void> {
  const markets = loadMarkets();
  if (!markets.length) { console.log('no markets configured in config/markets.json'); return; }
  console.log(table(
    markets.map((m) => ({
      name: m.name,
      counties: (m.counties ?? []).map((c) => c.name ?? c.fips ?? '?').join(', '),
      places: [...(m.cities ?? []), m.near ? `within ${m.near.radiusMiles}mi` : ''].filter(Boolean).join(', '),
      waterfront: m.waterfront ? `${m.waterfront.waterbody} <= ${m.waterfront.maxDistanceFt}ft` : '',
      label: m.label ?? '',
    })),
    ['name', 'counties', 'places', 'waterfront', 'label'],
  ));
  const detail = args.positional[0];
  if (detail) {
    const m = findMarket(markets, detail);
    console.log(`\n${m.name}: ${m.label ?? ''}`);
    for (const n of m.notes ?? []) console.log(`  ${n}`);
  }
}

async function cmdWaterbodyLayers(args: Args): Promise<void> {
  const service = args.positional[0];
  if (!service) { console.log('usage: gf waterbody:layers <serviceUrl>'); process.exitCode = 1; return; }
  const layers = await listLayers(service, new HttpClient({ minIntervalMs: 100 }));
  console.log(table(
    layers.map((l) => ({ id: String(l.id), name: l.name, geometry: l.geometryType ?? '' })),
    ['id', 'name', 'geometry'],
  ));
  console.log('\nPut the polygon layer id into the candidates list in the waterbody source config.');
}

async function cmdWaterbodyFetch(args: Args): Promise<void> {
  const name = args.positional[0];
  if (!name) { console.log('usage: gf waterbody:fetch <name>'); process.exitCode = 1; return; }
  const src = loadWaterbodySource(name);
  const http = new HttpClient({ minIntervalMs: 200 });

  console.log(`looking for "${strFlag(args.flags, 'accept-name') ?? src.match}"...`);
  const res = await fetchWaterbody(src, http, {
    acceptName: strFlag(args.flags, 'accept-name'),
    acceptAll: args.flags['all-water'] === true,
  });

  for (const a of res.attempts) {
    console.log(`  ${a.layer}: ${a.error ? `error, ${a.error}` : `${a.features} features, ${a.matched} matched`}`);
  }

  if (!res.shape) {
    console.log('\nNo matching polygon found.');
    if (res.namesSeen.length) {
      console.log('Names present in the search area:');
      for (const n of res.namesSeen.slice(0, 40)) console.log(`  ${n}`);
      console.log('\nRe-run with --accept-name "<one of the above>", or --all-water to take');
      console.log('every water polygon in the bounding box.');
    } else {
      console.log('No features came back at all. Check the service and layer ids with:');
      console.log(`  gf waterbody:layers <serviceUrl>`);
    }
    process.exitCode = 1;
    return;
  }

  mkdirSync(WATERBODY_DIR, { recursive: true });
  const out = join(WATERBODY_DIR, `${name}.geojson`);
  writeFileSync(out, JSON.stringify({ type: 'Feature', properties: { name }, geometry: res.shape }));
  const box = res.bbox!;
  console.log(`\nfound in ${res.layerUsed}`);
  console.log(`  ${res.featureCount} polygons, ${res.vertices} vertices`);
  console.log(`  bounding box ${box.map((n) => n.toFixed(3)).join(', ')}`);
  console.log(`  saved to ${out}`);

  if (src.bbox) {
    const inside = box[0] >= src.bbox[0] - 0.5 && box[1] >= src.bbox[1] - 0.5
      && box[2] <= src.bbox[2] + 0.5 && box[3] <= src.bbox[3] + 0.5;
    if (!inside) {
      console.log('\nWARNING: the fetched polygon extends well outside the configured bounding box.');
      console.log('That usually means it matched more than the intended waterbody. Inspect it before trusting it.');
    }
  }
  console.log('\nNext: gf geo --waterbody ' + name);
}

async function cmdGeo(args: Args): Promise<void> {
  const name = strFlag(args.flags, 'waterbody') ?? 'old-hickory-lake';
  const maxMiles = numFlag(args.flags, 'max-miles') ?? 3;
  const waterfrontFt = numFlag(args.flags, 'waterfront-ft') ?? 1000;
  const shape = loadWaterbodyShape(name);
  console.log(`${name}: ${vertexCount(shape)} shoreline vertices, searching within ${maxMiles} miles`);
  console.log(`shoreline bounding box ${shapeBbox(shape).map((n) => n.toFixed(3)).join(', ')}`);

  const store = await openStore(args.flags);
  try {
    const res = await enrichWaterDistance(store, shape, name, { maxMiles, waterfrontFt });
    console.log(`  ${res.withCoordinates} properties had coordinates`);
    if (res.skippedNoCoordinates) {
      console.log(`  ${res.skippedNoCoordinates} had none and were skipped`);
    }
    console.log(`  ${res.measured} were inside the search band and got a distance`);
    console.log(`  ${res.waterfront} are within ${waterfrontFt} ft of the water`);
    if (!res.withCoordinates) {
      console.log('\nNo coordinates at all. The parcel layer needs geometry, which the');
      console.log('ArcGIS connector requests by default. Check "gf discover <source>".');
    }
    console.log(`\nSee them with: gf leads --market old-hickory-waterfront`);
  } finally {
    await store.close();
  }
}

async function cmdSpend(args: Args): Promise<void> {
  const budget = loadBudget();
  const store = await openStore(args.flags);
  try {
    const snap = await spendThisMonth(store, budget);
    console.log(`month starting ${snap.monthStart.slice(0, 10)}, day ${snap.daysElapsed} of ${snap.daysInMonth}`);
    console.log(`cap        ${centsToUsd(snap.capCents)}`);
    console.log(`spent      ${centsToUsd(snap.spentCents)}  (${snap.percentUsed} percent)`);
    console.log(`remaining  ${centsToUsd(snap.remainingCents)}`);
    console.log(`projected  ${centsToUsd(snap.projectedCents)} by month end at the current rate`);

    if (snap.byJob.length) {
      console.log('');
      console.log(table(
        snap.byJob.map((j) => ({
          job: j.jobName,
          records: String(j.records),
          cost: centsToUsd(j.cents),
        })),
        ['job', 'records', 'cost'],
      ));
    }
    if (snap.spentCents === 0) {
      console.log('\nNothing spent. Every enabled source is free public data.');
    }
    if (snap.projectedCents > snap.capCents) {
      console.log(`\nWARNING: on pace to exceed the cap by ${centsToUsd(snap.projectedCents - snap.capCents)}.`);
      console.log('Paid calls will be refused once the cap is reached.');
    }
  } finally {
    await store.close();
  }
}

async function cmdTrace(args: Args): Promise<void> {
  const store = await openStore(args.flags);
  try {
    // Explicit ids, or a filtered slice of the working list.
    let leads: LeadRecord[];
    if (args.positional.length) {
      leads = [];
      for (const id of args.positional) {
        const l = await store.getLead(id);
        if (l) leads.push(l);
        else console.log(`no lead found for "${id}"`);
      }
    } else {
      const opts = listOptsFrom(args.flags);
      const marketName = strFlag(args.flags, 'market');
      leads = await store.listLeads({ ...opts, limit: marketName ? 5000 : (opts.limit ?? 50) });
      if (marketName) {
        const market = findMarket(loadMarkets(), marketName);
        leads = leads.filter((l) => marketMatches(marketSubject(l), market).pass);
      }
      const cap = numFlag(args.flags, 'limit') ?? 50;
      leads = leads.slice(0, cap);
    }
    if (!leads.length) { console.log('no leads selected'); return; }

    const vendor = loadSkipTraceVendor();
    const budget = loadBudget();
    // Dry run is the default. Spending money takes an explicit --confirm.
    const dryRun = args.flags.confirm !== true;

    const res = await runSkipTrace(leads, store, vendor, budget, {
      maxRecords: numFlag(args.flags, 'max') ?? 50,
      cacheDays: numFlag(args.flags, 'cache-days') ?? 90,
      dryRun,
    });

    console.log(`selected ${res.requested} leads`);
    if (res.fromCache) console.log(`  ${res.fromCache} already traced within the cache window, free`);
    if (res.skippedNoName) console.log(`  ${res.skippedNoName} had no owner name and cannot be traced`);
    if (res.trimmedByBudget) console.log(`  ${res.trimmedByBudget} trimmed by the monthly budget`);
    for (const w of res.warnings) console.log(`  note: ${w}`);

    if (dryRun) {
      console.log(`\nestimated cost ${centsToUsd(res.costCents)}. Nothing was spent.`);
      console.log('Add --confirm to actually run it.');
    } else {
      console.log(`\ntraced ${res.traced} records, ${res.hits} returned contacts`);
      console.log(`  ${res.phonesFound} phones, ${res.emailsFound} emails`);
      console.log(`  cost ${centsToUsd(res.costCents)}`);
      const snap = await spendThisMonth(store, budget);
      console.log(`  month to date ${centsToUsd(snap.spentCents)} of ${centsToUsd(snap.capCents)}`);
    }
    for (const e of res.errors.slice(0, 5)) console.log(`  error: ${e}`);
  } finally {
    await store.close();
  }
}

async function cmdStatus(args: Args): Promise<void> {
  const store = await openStore(args.flags);
  try {
    const c = await store.counts();
    console.log(`properties ${c.properties}, distress events ${c.events}, scored ${c.scored}`);
    const top = await store.listLeads({ limit: 5 });
    if (top.length) {
      console.log('\ntop leads:');
      console.log(table(leadRows(top), LEAD_COLUMNS));
    }
  } finally {
    await store.close();
  }
}

// ---------------------------------------------------------------- main

async function main(): Promise<void> {
  loadEnv();
  const args = parseArgs(process.argv.slice(2));
  const commands: Record<string, (a: Args) => Promise<void>> = {
    sources: cmdSources,
    find: cmdFind,
    markets: cmdMarkets,
    geo: cmdGeo,
    'waterbody:fetch': cmdWaterbodyFetch,
    'waterbody:layers': cmdWaterbodyLayers,
    discover: cmdDiscover,
    pull: cmdPull,
    'pull-all': cmdPullAll,
    score: cmdScore,
    leads: cmdLeads,
    show: cmdShow,
    export: cmdExport,
    stage: cmdStage,
    push: cmdPush,
    runs: cmdRuns,
    'ghl:fields': cmdGhlFields,
    'targets:push': cmdTargetsPush,
    spend: cmdSpend,
    trace: cmdTrace,
    status: cmdStatus,
  };
  const fn = commands[args.cmd];
  if (!fn) { console.log(HELP); return; }
  await fn(args);
}

main().catch((err) => {
  console.error(`error: ${(err as Error).message}`);
  process.exitCode = 1;
});
