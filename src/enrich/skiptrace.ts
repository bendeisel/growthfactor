// SKIP TRACE. THIS IS THE ONLY FILE IN THE SYSTEM PERMITTED TO SPEND MONEY PER
// RECORD. Nothing in the ingest path can reach it.
//
// Three guards, all enforced in code rather than documented:
//   1. a cache, so the same owner is never paid for twice inside the TTL
//   2. a per invocation cap, so a bad command cannot trace a whole county
//   3. the monthly budget, checked before the first call and never after
//
// No vendor schema is hardcoded. The request is a template you fill in from your
// vendor's docs, and the response is harvested by scanning for anything that looks
// like a phone or an email. That way switching vendors is a config edit, and a
// vendor renaming a field does not silently return zero contacts.

import { getEnv } from '../core/env.ts';
import { HttpClient } from '../core/http.ts';
import { splitOwnerName } from '../core/normalize.ts';
import { planSpend, spendThisMonth, type BudgetConfig } from '../core/budget.ts';
import type { LeadRecord, OwnerContact, Store } from '../store/index.ts';

export interface SkipTraceVendor {
  name: string;
  enabled?: boolean;
  url: string;
  method?: 'POST' | 'GET';
  /** Environment variable holding the key. Never the key itself. */
  apiKeyEnv: string;
  authHeader?: string;
  authPrefix?: string;
  extraHeaders?: Record<string, string>;
  /** What one record costs you, from your own plan. Drives every budget check. */
  costPerRecordCents: number;
  /** Request body, with {{placeholders}} substituted per lead. */
  requestTemplate?: Record<string, unknown>;
  /** Query string for GET style vendors. */
  queryTemplate?: Record<string, string>;
  /** Dotted path to the person record, if the payload wraps it. */
  recordPath?: string;
}

/** Values available to a request template. */
function placeholders(l: LeadRecord): Record<string, string> {
  const name = splitOwnerName(l.ownerName);
  return {
    firstName: name.firstName ?? '',
    lastName: name.lastName ?? '',
    fullName: l.ownerName ?? '',
    companyName: name.companyName ?? '',
    // Mailing address is the better trace input for an absentee owner, since it is
    // where they actually live.
    address: l.ownerMailingAddress ?? l.addressLine ?? '',
    city: l.ownerMailingCity ?? l.city ?? '',
    state: l.ownerMailingState ?? l.state ?? '',
    zip: l.ownerMailingZip ?? l.zip ?? '',
    propertyAddress: l.addressLine ?? '',
    propertyCity: l.city ?? '',
    propertyState: l.state ?? '',
    propertyZip: l.zip ?? '',
  };
}

function fill(template: unknown, values: Record<string, string>): unknown {
  if (typeof template === 'string') {
    return template.replace(/\{\{(\w+)\}\}/g, (_, k: string) => values[k] ?? '');
  }
  if (Array.isArray(template)) return template.map((t) => fill(t, values));
  if (template && typeof template === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(template)) out[k] = fill(v, values);
    return out;
  }
  return template;
}

/** US numbers in E.164, which is what GHL expects. */
export function normalizePhone(raw: unknown): string | null {
  if (raw == null) return null;
  const digits = String(raw).replace(/\D/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  return null;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * Walk an unknown payload collecting anything that looks like a phone or email.
 * Keys are used as a hint, but a bare value that parses as a phone number under a
 * key mentioning phone counts too. Robust to a schema nobody documented.
 */
export function harvestContacts(payload: unknown): { phones: string[]; emails: string[] } {
  const phones = new Set<string>();
  const emails = new Set<string>();

  const walk = (node: unknown, keyHint = ''): void => {
    if (node == null) return;
    if (typeof node === 'string' || typeof node === 'number') {
      const s = String(node);
      if (EMAIL_RE.test(s)) { emails.add(s.toLowerCase()); return; }
      if (/phone|mobile|cell|tel|number|wireless|landline/i.test(keyHint)) {
        const p = normalizePhone(s);
        if (p) phones.add(p);
      }
      return;
    }
    if (Array.isArray(node)) {
      for (const item of node) walk(item, keyHint);
      return;
    }
    if (typeof node === 'object') {
      for (const [k, v] of Object.entries(node as Record<string, unknown>)) {
        walk(v, `${keyHint} ${k}`);
      }
    }
  };

  walk(payload);
  return { phones: [...phones], emails: [...emails] };
}

function atPath(body: unknown, path?: string): unknown {
  if (!path) return body;
  let cur: unknown = body;
  for (const seg of path.split('.')) {
    if (cur == null || typeof cur !== 'object') return undefined;
    cur = (cur as Record<string, unknown>)[seg];
  }
  return cur;
}

export interface TraceOptions {
  /** Hard cap per invocation. The build spec sets this at 50. */
  maxRecords?: number;
  /** Reuse a cached trace younger than this. */
  cacheDays?: number;
  /** Price the run without spending anything. */
  dryRun?: boolean;
  http?: HttpClient;
  baseUrlOverride?: string;
  now?: Date;
}

export interface TraceResult {
  requested: number;
  fromCache: number;
  skippedNoName: number;
  traced: number;
  trimmedByBudget: number;
  hits: number;
  phonesFound: number;
  emailsFound: number;
  costCents: number;
  dryRun: boolean;
  warnings: string[];
  errors: string[];
}

const DAY_MS = 86_400_000;

export async function runSkipTrace(
  leads: LeadRecord[],
  store: Store,
  vendor: SkipTraceVendor,
  budget: BudgetConfig,
  opts: TraceOptions = {},
): Promise<TraceResult> {
  const now = opts.now ?? new Date();
  const cacheDays = opts.cacheDays ?? 90;
  const maxRecords = opts.maxRecords ?? 50;
  const warnings: string[] = [];
  const errors: string[] = [];

  const res: TraceResult = {
    requested: leads.length,
    fromCache: 0,
    skippedNoName: 0,
    traced: 0,
    trimmedByBudget: 0,
    hits: 0,
    phonesFound: 0,
    emailsFound: 0,
    costCents: 0,
    dryRun: Boolean(opts.dryRun),
    warnings,
    errors,
  };

  // 1. Anything already traced recently is free, so it never reaches the vendor.
  const needing: LeadRecord[] = [];
  for (const l of leads) {
    if (!l.ownerName) { res.skippedNoName++; continue; }
    const cached = await store.getOwner(l.id);
    if (cached?.skipTracedAt) {
      const age = now.getTime() - new Date(cached.skipTracedAt).getTime();
      if (age < cacheDays * DAY_MS) { res.fromCache++; continue; }
    }
    needing.push(l);
  }

  if (needing.length > maxRecords) {
    warnings.push(
      `${needing.length} leads need tracing but the cap is ${maxRecords} per run. `
      + `Raise it with --max if you mean to.`,
    );
  }
  const batch = needing.slice(0, maxRecords);
  if (!batch.length) return res;

  // 2. The budget decides how much of the batch actually runs.
  const snapshot = await spendThisMonth(store, budget, now);
  const decision = planSpend(snapshot, batch.length, vendor.costPerRecordCents, budget);
  if (decision.warning) warnings.push(decision.warning);
  res.trimmedByBudget = decision.trimmed;
  const allowed = batch.slice(0, decision.allowed);

  if (opts.dryRun) {
    res.costCents = decision.plannedCents;
    res.traced = 0;
    warnings.push(
      `dry run: tracing ${allowed.length} leads would cost `
      + `$${(decision.plannedCents / 100).toFixed(2)}. Nothing was spent.`,
    );
    return res;
  }
  if (!allowed.length) return res;

  // 3. Only now does anything billable happen.
  const key = getEnv(vendor.apiKeyEnv);
  if (!key) throw new Error(`${vendor.apiKeyEnv} is not set, so no skip trace can run.`);

  const http = opts.http ?? new HttpClient({ minIntervalMs: 200 });
  const base = opts.baseUrlOverride ?? vendor.url;
  const authHeader = vendor.authHeader ?? 'x-api-key';
  const headers: Record<string, string> = {
    ...vendor.extraHeaders,
    'content-type': 'application/json',
    [authHeader]: `${vendor.authPrefix ?? ''}${key}`,
  };

  for (const lead of allowed) {
    const values = placeholders(lead);
    try {
      let body: unknown;
      if ((vendor.method ?? 'POST') === 'GET') {
        const params = new URLSearchParams();
        for (const [k, v] of Object.entries(vendor.queryTemplate ?? {})) {
          params.set(k, String(fill(v, values)));
        }
        body = await http.getJson(`${base}?${params.toString()}`, { headers });
      } else {
        body = await http.getJson(base, {
          method: 'POST',
          headers,
          body: JSON.stringify(fill(vendor.requestTemplate ?? {}, values)),
        });
      }

      const record = atPath(body, vendor.recordPath);
      const { phones, emails } = harvestContacts(record ?? body);
      // The record is billable whether or not it returned contacts, so the cost
      // is recorded either way.
      res.traced++;
      res.costCents += vendor.costPerRecordCents;
      if (phones.length || emails.length) {
        res.hits++;
        res.phonesFound += phones.length;
        res.emailsFound += emails.length;
      }

      const name = splitOwnerName(lead.ownerName);
      const owner: OwnerContact & { raw?: unknown } = {
        propertyId: lead.id,
        fullName: lead.ownerName,
        firstName: name.firstName,
        lastName: name.lastName ?? name.companyName,
        mailingAddress: lead.ownerMailingAddress,
        mailingCity: lead.ownerMailingCity,
        mailingState: lead.ownerMailingState,
        mailingZip: lead.ownerMailingZip,
        phones,
        emails,
        skipTracedAt: new Date().toISOString(),
        skipTraceCostCents: vendor.costPerRecordCents,
        source: vendor.name,
        raw: body,
      };
      await store.saveOwner(owner);
    } catch (err) {
      errors.push(`${lead.addressLine ?? lead.id}: ${(err as Error).message}`);
    }
  }

  // 4. Spend is written to ingest_runs so it lands in the same budget ledger as
  // everything else, which is what makes "gf spend" tell the whole truth.
  const startedAt = new Date(now.getTime()).toISOString();
  const runId = await store.startRun({
    jobName: 'skip-trace',
    startedAt,
    status: 'running',
    recordsPulled: 0,
    recordsNew: 0,
    recordsUpdated: 0,
    eventsCreated: 0,
    apiCalls: 0,
    estimatedCostCents: 0,
  });
  await store.finishRun(runId, {
    jobName: 'skip-trace',
    startedAt,
    finishedAt: new Date().toISOString(),
    status: errors.length && !res.traced ? 'error' : errors.length ? 'partial' : 'ok',
    recordsPulled: res.traced,
    recordsNew: res.hits,
    recordsUpdated: 0,
    eventsCreated: 0,
    apiCalls: http.calls,
    estimatedCostCents: res.costCents,
    error: errors.length ? errors.slice(0, 3).join('; ') : undefined,
  });

  return res;
}
