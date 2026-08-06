import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * One number, read from across the room, with the comparison that makes it mean
 * something underneath.
 *
 * Ben asked for every metric as "month to date, and what it was last month", so
 * the comparison is part of the tile rather than an optional extra. `direction`
 * says which way is good: fewer lost members is an improvement, so the same
 * arrow gets the opposite colour.
 */
export interface KpiTileProps {
  label: string;
  /** Formatted month-to-date figure. */
  value: string;
  /** Formatted same figure for last month, shown as the comparison. */
  lastMonth?: string;
  /** Percent change vs last month, or null when there's no baseline. */
  deltaPct?: number | null;
  /** Whether up is good ("more revenue") or bad ("more cancellations"). */
  direction?: "up-good" | "down-good";
  /**
   * What the delta is measured against. Flows (revenue, joins, cancellations)
   * compare to a pro-rated slice of last month, because half a month of revenue
   * against a whole one always looks like a collapse. Stocks (total members)
   * compare to where last month ended.
   */
  basis?: "pace" | "last-month";
  /** Small mark shown beside the label — a data-quality dot, usually. */
  badge?: ReactNode;
  className?: string;
  /** Compact variant for dense rows. */
  size?: "md" | "lg";
}

export function KpiTile({
  label,
  value,
  lastMonth,
  deltaPct,
  direction = "up-good",
  basis = "pace",
  badge,
  className,
  size = "md",
}: KpiTileProps) {
  const rising = (deltaPct ?? 0) >= 0;
  const good = direction === "up-good" ? rising : !rising;

  return (
    <div className={cn("tile flex flex-col justify-between p-3", className)}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-dim">
          {label}
        </p>
        {badge}
      </div>

      <p
        className={cn(
          "hero-number mt-2 text-ink",
          size === "lg" ? "text-3xl sm:text-4xl" : "text-2xl",
        )}
      >
        {value}
      </p>

      <div className="mt-1.5 flex items-baseline gap-1.5 text-[11px] tabular">
        {deltaPct === null || deltaPct === undefined ? (
          <span className="text-ink-dim">no prior month</span>
        ) : (
          <span className={good ? "text-up" : "text-down"}>
            {rising ? "▲" : "▼"} {Math.abs(deltaPct).toFixed(0)}%
            {basis === "pace" ? " pace" : ""}
          </span>
        )}
        {lastMonth ? (
          <span className="truncate text-ink-dim">vs {lastMonth} last mo</span>
        ) : null}
      </div>
    </div>
  );
}
