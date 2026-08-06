import { KpiTile } from "@/components/ui/kpi-tile";
import {
  count,
  deltaPct,
  fractionOfMonthElapsed,
  money,
} from "@/lib/metrics/format";
import type { MetricTotals } from "@/lib/metrics/rollup";

/**
 * The four numbers Ben asked for, each month-to-date with last month beside it:
 * revenue, new members, lost members, total members.
 *
 * The three flows are compared against a pro-rated slice of last month, so half
 * a month of revenue isn't judged against a whole one. Total members is a stock
 * and compares to where last month closed.
 */
export function KpiGrid({
  totals,
  membership,
  now = new Date(),
}: {
  totals: MetricTotals;
  /** Hide member tiles for businesses that don't have members. */
  membership: boolean;
  now?: Date;
}) {
  const elapsed = fractionOfMonthElapsed(now);
  const pace = (lastMonthValue: number) => lastMonthValue * elapsed;

  return (
    <div className="grid grid-cols-2 gap-2">
      <KpiTile
        label="Revenue MTD"
        size="lg"
        value={money(totals.mtd.revenueCents, true)}
        lastMonth={money(totals.lastMonth.revenueCents, true)}
        deltaPct={deltaPct(totals.mtd.revenueCents, pace(totals.lastMonth.revenueCents))}
      />

      {membership ? (
        <KpiTile
          label="Total members"
          size="lg"
          value={count(totals.activeMembers)}
          lastMonth={count(totals.activeMembersLastMonth)}
          deltaPct={deltaPct(totals.activeMembers, totals.activeMembersLastMonth)}
          basis="last-month"
        />
      ) : (
        <KpiTile
          label="Sales MTD"
          size="lg"
          value={count(totals.mtd.sales)}
          lastMonth={count(totals.lastMonth.sales)}
          deltaPct={deltaPct(totals.mtd.sales, pace(totals.lastMonth.sales))}
        />
      )}

      <KpiTile
        label={membership ? "New members MTD" : "New clients MTD"}
        value={count(totals.mtd.newMembers)}
        lastMonth={count(totals.lastMonth.newMembers)}
        deltaPct={deltaPct(totals.mtd.newMembers, pace(totals.lastMonth.newMembers))}
      />

      <KpiTile
        label={membership ? "Lost members MTD" : "Cancellations MTD"}
        value={count(totals.mtd.cancellations)}
        lastMonth={count(totals.lastMonth.cancellations)}
        deltaPct={deltaPct(
          totals.mtd.cancellations,
          pace(totals.lastMonth.cancellations),
        )}
        direction="down-good"
      />
    </div>
  );
}
