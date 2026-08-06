import { EMPTY_WINDOW, type BusinessMetrics, type MetricWindow } from "@/lib/metrics/types";

/**
 * The shape the KPI tiles read. A single business's reading already satisfies
 * it, and so does a roll-up across all of them, so "All businesses" and one
 * business use the same component.
 */
export interface MetricTotals {
  mtd: MetricWindow;
  lastMonth: MetricWindow;
  activeMembers: number;
  activeMembersLastMonth: number;
}

function addWindows(a: MetricWindow, b: MetricWindow): MetricWindow {
  return {
    sales: a.sales + b.sales,
    revenueCents: a.revenueCents + b.revenueCents,
    cancellations: a.cancellations + b.cancellations,
    newMembers: a.newMembers + b.newMembers,
    pastDueCents: a.pastDueCents + b.pastDueCents,
  };
}

/** Sums every business into one set of numbers. */
export function rollUp(rows: BusinessMetrics[]): MetricTotals {
  return rows.reduce<MetricTotals>(
    (totals, row) => ({
      mtd: addWindows(totals.mtd, row.mtd),
      lastMonth: addWindows(totals.lastMonth, row.lastMonth),
      activeMembers: totals.activeMembers + row.activeMembers,
      activeMembersLastMonth:
        totals.activeMembersLastMonth + row.activeMembersLastMonth,
    }),
    {
      mtd: { ...EMPTY_WINDOW },
      lastMonth: { ...EMPTY_WINDOW },
      activeMembers: 0,
      activeMembersLastMonth: 0,
    },
  );
}
