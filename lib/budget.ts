import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

/**
 * Budget guardrails (spec §3): $5/day soft cap, $100/month hard cap, tokens
 * logged daily to /memory/budget-YYYY-MM-DD.json.
 *
 * Server-side only. Phase 1 reads and displays; the model calls that write to
 * it land in Phase 3, so `record()` is here and working but not yet called
 * from a chat path.
 */

export const DAILY_SOFT_CAP_USD = 5;
export const MONTHLY_HARD_CAP_USD = 100;

const MEMORY_DIR = path.join(process.cwd(), "memory");

export interface UsageEntry {
  at: string;
  modelId: string;
  inputTokens: number;
  outputTokens: number;
  /** Cost in cents, as reported by the provider or computed at call time. */
  costCents: number;
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
  };
}

export interface BudgetStatus {
  date: string;
  spentTodayCents: number;
  softCapCents: number;
  hardCapCents: number;
  /** 0–1 of the daily soft cap. Can exceed 1 when Ben approves an overage. */
  dayFraction: number;
  entryCount: number;
}

export function todayKey(now = new Date()): string {
  return now.toISOString().slice(0, 10);
}

function fileFor(date: string): string {
  return path.join(MEMORY_DIR, `budget-${date}.json`);
}

function emptyDay(date: string): DailyBudget {
  return {
    date,
    entries: [],
    totals: { inputTokens: 0, outputTokens: 0, costCents: 0 },
  };
}

export async function readDay(date = todayKey()): Promise<DailyBudget> {
  try {
    const raw = await readFile(fileFor(date), "utf8");
    const parsed = JSON.parse(raw) as DailyBudget;
    // A hand-edited or partial file shouldn't break the dashboard.
    return {
      date: parsed.date ?? date,
      entries: Array.isArray(parsed.entries) ? parsed.entries : [],
      totals: parsed.totals ?? emptyDay(date).totals,
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
    costCents: day.totals.costCents + entry.costCents,
  };
  await mkdir(MEMORY_DIR, { recursive: true });
  await writeFile(fileFor(date), `${JSON.stringify(day, null, 2)}\n`, "utf8");
  return day;
}

export async function getStatus(date = todayKey()): Promise<BudgetStatus> {
  const day = await readDay(date);
  const softCapCents = DAILY_SOFT_CAP_USD * 100;
  return {
    date,
    spentTodayCents: day.totals.costCents,
    softCapCents,
    hardCapCents: MONTHLY_HARD_CAP_USD * 100,
    dayFraction: day.totals.costCents / softCapCents,
    entryCount: day.entries.length,
  };
}
