const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const usdCompact = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 1,
});

export function money(cents: number, compact = false): string {
  const dollars = cents / 100;
  return compact && Math.abs(dollars) >= 10_000
    ? usdCompact.format(dollars)
    : usd.format(dollars);
}

export function count(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

/**
 * Percent change vs. the comparison value, or null when there's no baseline.
 * Compared against a pro-rated slice of last month so an MTD number early in
 * the month isn't judged against a full month of revenue.
 */
export function deltaPct(current: number, baseline: number): number | null {
  if (baseline <= 0) return null;
  return ((current - baseline) / baseline) * 100;
}

export function fractionOfMonthElapsed(now = new Date()): number {
  const start = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1);
  const end = Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1);
  return Math.min(1, Math.max(0.02, (now.getTime() - start) / (end - start)));
}

export function relativeTime(iso: string, now = new Date()): string {
  const seconds = Math.max(0, Math.round((now.getTime() - Date.parse(iso)) / 1000));
  if (seconds < 10) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}
