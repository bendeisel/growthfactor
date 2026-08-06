const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

/**
 * Compact currency is hand-rolled rather than `Intl` compact notation: Node and
 * Chrome ship different ICU versions and disagree on trailing zeros ($40.0K vs
 * $40K), which is a hydration mismatch on every server-rendered total.
 */
function compactUsd(dollars: number): string {
  const sign = dollars < 0 ? "-" : "";
  const abs = Math.abs(dollars);
  const [value, unit] =
    abs >= 1_000_000 ? [abs / 1_000_000, "M"] : [abs / 1_000, "K"];
  const rounded = Math.round(value * 10) / 10;
  return `${sign}$${Number.isInteger(rounded) ? rounded : rounded.toFixed(1)}${unit}`;
}

export function money(cents: number, compact = false): string {
  const dollars = cents / 100;
  return compact && Math.abs(dollars) >= 10_000
    ? compactUsd(dollars)
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
