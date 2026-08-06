import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

/**
 * Budget guardrails (spec §3): $5/day soft cap, $100/month hard cap, tokens
 * logged daily to /memory/budget-YYYY-MM-DD.json.
 *
 * The soft cap warns; the hard cap actually refuses to spend. Enforcement runs
 * before a provider call, not after, because a cap you check afterwards isn't a
 * cap. Ben can lift either one from env without a deploy.
 *
 * Server-side only.
 */

export const DAILY_SOFT_CAP_USD = 5;
export const MONTHLY_HARD_CAP_USD = 100;

function memoryDir(): string {
  return process.env.MEMORY_DIR ?? path.join(process.cwd(), "memory");
}

function capCents(envVar: string, fallbackUsd: number): number {
  const override = Number(process.env[envVar]);
  return Math.round(
    (Number.isFinite(override) && override > 0 ? override : fallbackUsd) * 100,
  );
}

export function dailySoftCapCents(): number {
  return capCents("BUDGET_DAILY_SOFT_CAP_USD", DAILY_SOFT_CAP_USD);
}

export function monthlyHardCapCents(): number {
  return capCents("BUDGET_MONTHLY_HARD_CAP_USD", MONTHLY_HARD_CAP_USD);
}

export interface UsageEntry {
  at: string;
  modelId: string;
  inputTokens: number;
  outputTokens: number;
  /** Cost in cents, or null when the model has no configured rate. */
  costCents: number | null;
  /** Free-text label for what the spend was for. */
  note?: string;
}

export interface DailyBudget {
  date: string;
  entries: UsageEntry[];
  totals: {
    inputTokens: number;
    outputTokens: number;
    costCents: number;
    /** Turns whose cost we couldn't price. */
    unpriced: number;
  };
}

export interface BudgetStatus {
  date: string;
  spentTodayCents: number;
  spentMonthCents: number;
  softCapCents: number;
  hardCapCents: number;
  /** 0–1 of the daily soft cap; can exceed 1 once Ben approves an overage. */
  dayFraction: number;
  monthFraction: number;
  entryCount: number;
  unpricedToday: number;
  /** True once the month's hard cap is reached — no further spend allowed. */
  blocked: boolean;
}

export function todayKey(now = new Date()): string {
  return now.toISOString().slice(0, 10);
}

function fileFor(date: string): string {
  return path.join(memoryDir(), `budget-${date}.json`);
}

function emptyDay(date: string): DailyBudget {
  return {
    date,
    entries: [],
    totals: { inputTokens: 0, outputTokens: 0, costCents: 0, unpriced: 0 },
  };
}

export async function readDay(date = todayKey()): Promise<DailyBudget> {
  try {
    const parsed = JSON.parse(await readFile(fileFor(date), "utf8")) as DailyBudget;
    // A hand-edited or partial file shouldn't break the dashboard.
    return {
      date: parsed.date ?? date,
      entries: Array.isArray(parsed.entries) ? parsed.entries : [],
      totals: { ...emptyDay(date).totals, ...parsed.totals },
    };
  } catch {
    return emptyDay(date);
  }
}

export async function record(entry: UsageEntry): Promise<DailyBudget> {
  const date = todayKey(new Date(entry.at));
  const day = await readDay(date);
  day.entries.push(entry);
  day.totals = {
    inputTokens: day.totals.inputTokens + entry.inputTokens,
    outputTokens: day.totals.outputTokens + entry.outputTokens,
    costCents: day.totals.costCents + (entry.costCents ?? 0),
    unpriced: day.totals.unpriced + (entry.costCents === null ? 1 : 0),
  };
  await mkdir(memoryDir(), { recursive: true });
  await writeFile(fileFor(date), `${JSON.stringify(day, null, 2)}\n`, "utf8");
  return day;
}

/** Sum of every daily log in the given month (YYYY-MM). */
export async function monthSpendCents(month = todayKey().slice(0, 7)): Promise<number> {
  let files: string[];
  try {
    // The log directory is chosen at runtime (MEMORY_DIR), so the bundler can't
    // trace it — and shouldn't try to, since nothing here ships with the build.
    files = await readdir(/* turbopackIgnore: true */ memoryDir());
  } catch {
    return 0;
  }
  const prefix = `budget-${month}`;
  let total = 0;
  for (const file of files) {
    if (!file.startsWith(prefix) || !file.endsWith(".json")) continue;
    const day = await readDay(file.slice("budget-".length, -".json".length));
    total += day.totals.costCents;
  }
  return total;
}

export async function getStatus(date = todayKey()): Promise<BudgetStatus> {
  const day = await readDay(date);
  const softCapCents = dailySoftCapCents();
  const hardCapCents = monthlyHardCapCents();
  const spentMonthCents = await monthSpendCents(date.slice(0, 7));
  return {
    date,
    spentTodayCents: day.totals.costCents,
    spentMonthCents,
    softCapCents,
    hardCapCents,
    dayFraction: day.totals.costCents / softCapCents,
    monthFraction: spentMonthCents / hardCapCents,
    entryCount: day.entries.length,
    unpricedToday: day.totals.unpriced,
    blocked: spentMonthCents >= hardCapCents,
  };
}

export interface BudgetDecision {
  allowed: boolean;
  /** Present when the soft cap is passed but the call is still allowed. */
  warning?: string;
  /** Present when the call is refused. */
  reason?: string;
  status: BudgetStatus;
}

/**
 * Checked before every provider call. The monthly hard cap refuses; the daily
 * soft cap warns and keeps going, which is what "Ben approves overages" means
 * in practice — he sees it and decides.
 */
export async function checkBudget(): Promise<BudgetDecision> {
  const status = await getStatus();
  if (status.blocked) {
    return {
      allowed: false,
      reason: `Monthly hard cap reached ($${(status.spentMonthCents / 100).toFixed(2)} of $${(status.hardCapCents / 100).toFixed(0)}). Raise BUDGET_MONTHLY_HARD_CAP_USD to continue.`,
      status,
    };
  }
  if (status.dayFraction >= 1) {
    return {
      allowed: true,
      warning: `Past today's $${(status.softCapCents / 100).toFixed(0)} soft cap — running on your approval.`,
      status,
    };
  }
  return { allowed: true, status };
}
