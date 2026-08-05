import { cn } from "@/lib/utils";
import type { Business } from "@/lib/businesses";
import {
  count,
  deltaPct,
  fractionOfMonthElapsed,
  money,
} from "@/lib/metrics/format";
import type { BusinessMetrics } from "@/lib/metrics/types";

/**
 * One business, one row. No drill-down (spec §2) — the secondary line carries
 * the rest of the locked Glow Fox pulls (active members, past due, new members)
 * so nothing needs a click.
 */
export function MetricRow({
  business,
  metrics,
}: {
  business: Business;
  metrics: BusinessMetrics;
}) {
  // MTD compared against the same slice of last month, not the whole month.
  const pacedBaseline = metrics.lastMonth.revenueCents * fractionOfMonthElapsed();
  const delta = deltaPct(metrics.mtd.revenueCents, pacedBaseline);

  return (
    <div
      className="grid grid-cols-[minmax(0,1fr)_3.5rem_5.5rem_3.5rem] items-center gap-2 border-b border-line/60 px-4 py-2.5 transition-colors hover:bg-panel-hover/50"
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
          {business.membership
            ? `${count(metrics.activeMembers)} active · `
            : ""}
          {money(metrics.mtd.pastDueCents)} past due
          {metrics.mtd.newMembers > 0
            ? ` · +${count(metrics.mtd.newMembers)} new`
            : ""}
        </p>
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
