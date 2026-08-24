// Spend control.
//
// The whole point of this pipeline is that the data is free. Skip trace is the one
// place money can leak, and it leaks per record, which is exactly the shape that
// gets away from you. So the cap is enforced in code before any billable call,
// not reported afterwards.
//
// Every dollar of spend flows through ingest_runs, including skip trace, so one
// query answers "what have I spent this month".

import type { Store } from '../store/index.ts';

export interface BudgetConfig {
  /** Hard ceiling per calendar month. Nothing billable runs past it. */
  monthlyCapUsd: number;
  /** Warn once month to date spend crosses this share of the cap. */
  warnAtPercent?: number;
  /**
   * When true, a call that would exceed the cap is refused outright. When false,
   * it is trimmed to whatever the remaining budget affords.
   */
  hardStop?: boolean;
}

export const DEFAULT_BUDGET: BudgetConfig = {
  monthlyCapUsd: 200,
  warnAtPercent: 75,
  hardStop: true,
};

export interface SpendSnapshot {
  monthStart: string;
  capCents: number;
  spentCents: number;
  remainingCents: number;
  percentUsed: number;
  byJob: Array<{ jobName: string; cents: number; records: number }>;
  /** Straight line projection to month end, based on days elapsed. */
  projectedCents: number;
  daysElapsed: number;
  daysInMonth: number;
}

export function monthStartIso(now = new Date()): string {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
}

export function centsToUsd(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export async function spendThisMonth(
  store: Store,
  cfg: BudgetConfig = DEFAULT_BUDGET,
  now = new Date(),
): Promise<SpendSnapshot> {
  const monthStart = monthStartIso(now);
  const rows = await store.spendSince(monthStart);

  const byJobMap = new Map<string, { cents: number; records: number }>();
  let spentCents = 0;
  for (const r of rows) {
    spentCents += r.cents;
    const prev = byJobMap.get(r.jobName) ?? { cents: 0, records: 0 };
    byJobMap.set(r.jobName, { cents: prev.cents + r.cents, records: prev.records + r.records });
  }

  const capCents = Math.round(cfg.monthlyCapUsd * 100);
  const daysInMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0)).getUTCDate();
  const daysElapsed = Math.max(1, now.getUTCDate());

  return {
    monthStart,
    capCents,
    spentCents,
    remainingCents: Math.max(0, capCents - spentCents),
    percentUsed: capCents > 0 ? Math.round((spentCents / capCents) * 100) : 0,
    byJob: [...byJobMap.entries()]
      .map(([jobName, v]) => ({ jobName, ...v }))
      .sort((a, b) => b.cents - a.cents),
    projectedCents: Math.round((spentCents / daysElapsed) * daysInMonth),
    daysElapsed,
    daysInMonth,
  };
}

export class BudgetExceededError extends Error {
  constructor(plannedCents: number, snapshot: SpendSnapshot) {
    super(
      `refusing to spend ${centsToUsd(plannedCents)}: `
      + `${centsToUsd(snapshot.spentCents)} of ${centsToUsd(snapshot.capCents)} already used this month, `
      + `${centsToUsd(snapshot.remainingCents)} left. `
      + `Raise monthlyCapUsd in config/budget.json if this is deliberate.`,
    );
    this.name = 'BudgetExceededError';
  }
}

export interface BudgetDecision {
  /** How many records the budget actually allows. */
  allowed: number;
  /** How many were requested but cannot be afforded. */
  trimmed: number;
  plannedCents: number;
  warning?: string;
}

/**
 * Decide how much of a planned billable batch the budget permits.
 * Throws under hardStop when nothing can be afforded, so a caller cannot
 * accidentally treat "zero allowed" as success.
 */
export function planSpend(
  snapshot: SpendSnapshot,
  requestedRecords: number,
  centsPerRecord: number,
  cfg: BudgetConfig = DEFAULT_BUDGET,
): BudgetDecision {
  if (centsPerRecord <= 0) {
    return { allowed: requestedRecords, trimmed: 0, plannedCents: 0 };
  }
  const wantCents = Math.round(requestedRecords * centsPerRecord);
  if (wantCents <= snapshot.remainingCents) {
    const decision: BudgetDecision = { allowed: requestedRecords, trimmed: 0, plannedCents: wantCents };
    const afterPercent = snapshot.capCents > 0
      ? Math.round(((snapshot.spentCents + wantCents) / snapshot.capCents) * 100)
      : 0;
    const warnAt = cfg.warnAtPercent ?? 75;
    if (afterPercent >= warnAt) {
      decision.warning = `this run puts you at ${afterPercent} percent of the ${centsToUsd(snapshot.capCents)} monthly cap`;
    }
    return decision;
  }

  const affordable = Math.floor(snapshot.remainingCents / centsPerRecord);
  if (cfg.hardStop !== false || affordable <= 0) {
    throw new BudgetExceededError(wantCents, snapshot);
  }
  return {
    allowed: affordable,
    trimmed: requestedRecords - affordable,
    plannedCents: affordable * centsPerRecord,
    warning: `trimmed to ${affordable} records to stay inside the monthly cap`,
  };
}
