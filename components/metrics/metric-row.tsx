import { Sparkline } from "@/components/metrics/sparkline";
import { cn } from "@/lib/utils";
import type { Business } from "@/lib/businesses";
import {
  count,
  deltaPct,
  fractionOfMonthElapsed,
  money,
} from "@/lib/metrics/format";
import { dailyRevenueCents } from "@/lib/metrics/trend";
import type { BusinessMetrics } from "@/lib/metrics/types";
import type { HistoryPoint } from "@/lib/store/types";

/**
 * Column template, shared by the header, the rows and the totals so they stay
 * aligned. The trend column is dropped on narrow screens rather than squeezing
 * the numbers.
 */
export const ROW_GRID =
  "grid grid-cols-[minmax(0,1fr)_3rem_5rem_3rem] sm:grid-cols-[minmax(0,1fr)_3.5rem_3rem_5.5rem_3rem] gap-2";

/**
 * One business, one row. No drill-down (spec §2) — the secondary line carries
 * the rest of the locked Glow Fox pulls (active members, past due, new members)
 * so nothing needs a click.
 */
export function MetricRow({
  business,
  metrics,
  history,
}: {
  business: Business;
  metrics: BusinessMetrics;
  history: HistoryPoint[];
}) {
  // MTD compared against the same slice of last month, not the whole month.
  const pacedBaseline = metrics.lastMonth.revenueCents * fractionOfMonthElapsed();
  const delta = deltaPct(metrics.mtd.revenueCents, pacedBaseline);

  return (
    <div
      className={cn(
        ROW_GRID,
        "items-center border-b border-line/60 px-4 py-2.5 transition-colors hover:bg-panel-hover/50",
      )}
      title={metrics.note ?? business.kind}
    >
      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          <span
            className={cn(
              "size-1.5 shrink-0 rounded-full",
              metrics.quality === "live" && "bg-up",
              metrics.quality === "mock" && "bg-warn",
              metrics.quality === "stale" && "bg-warn/60",
              metrics.quality === "error" && "bg-down",
            )}
          />
          <p className="truncate text-sm font-medium text-ink">{business.name}</p>
        </div>
        <p className="mt-0.5 truncate text-[11px] text-ink-dim tabular">
          {business.membership ? `${count(metrics.activeMembers)} active · ` : ""}
          {money(metrics.mtd.pastDueCents)} past due
          {metrics.mtd.newMembers > 0 ? ` · +${count(metrics.mtd.newMembers)} new` : ""}
        </p>
      </div>

      <div className="hidden justify-self-end text-accent/70 sm:block">
        <Sparkline
          points={dailyRevenueCents(history)}
          label={`${business.name} daily revenue, last ${Math.max(0, history.length - 1)} days`}
        />
      </div>

      <span className="text-right text-sm text-ink tabular">
        {count(metrics.mtd.sales)}
      </span>

      <div className="text-right">
        <p className="text-sm font-medium text-ink tabular">
          {money(metrics.mtd.revenueCents, true)}
        </p>
        {delta !== null ? (
          <p
            className={cn(
              "text-[10px] tabular",
              delta >= 0 ? "text-up" : "text-down",
            )}
          >
            {delta >= 0 ? "▲" : "▼"} {Math.abs(delta).toFixed(0)}% pace
          </p>
        ) : null}
      </div>

      <span
        className={cn(
          "text-right text-sm tabular",
          metrics.mtd.cancellations > 0 ? "text-down" : "text-ink-dim",
        )}
      >
        {count(metrics.mtd.cancellations)}
      </span>
    </div>
  );
}
