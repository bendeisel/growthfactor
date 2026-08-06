import { describe, expect, it } from "vitest";

import { rollUp } from "@/lib/metrics/rollup";
import { EMPTY_WINDOW, type BusinessMetrics } from "@/lib/metrics/types";

function row(overrides: Partial<BusinessMetrics>): BusinessMetrics {
  return {
    businessId: "x",
    source: "glowfox",
    quality: "live",
    fetchedAt: "2026-08-16T12:00:00Z",
    mtd: { ...EMPTY_WINDOW },
    lastMonth: { ...EMPTY_WINDOW },
    activeMembers: 0,
    activeMembersLastMonth: 0,
    ...overrides,
  };
}

describe("rollUp", () => {
  it("sums every window and both member counts", () => {
    const totals = rollUp([
      row({
        mtd: { ...EMPTY_WINDOW, revenueCents: 1000, newMembers: 3, cancellations: 1, sales: 4, pastDueCents: 50 },
        lastMonth: { ...EMPTY_WINDOW, revenueCents: 4000, newMembers: 9 },
        activeMembers: 100,
        activeMembersLastMonth: 98,
      }),
      row({
        mtd: { ...EMPTY_WINDOW, revenueCents: 2500, newMembers: 2, cancellations: 4, sales: 2, pastDueCents: 25 },
        lastMonth: { ...EMPTY_WINDOW, revenueCents: 6000, newMembers: 7 },
        activeMembers: 220,
        activeMembersLastMonth: 230,
      }),
    ]);

    expect(totals.mtd.revenueCents).toBe(3500);
    expect(totals.mtd.newMembers).toBe(5);
    expect(totals.mtd.cancellations).toBe(5);
    expect(totals.mtd.sales).toBe(6);
    expect(totals.mtd.pastDueCents).toBe(75);
    expect(totals.lastMonth.revenueCents).toBe(10_000);
    expect(totals.activeMembers).toBe(320);
    expect(totals.activeMembersLastMonth).toBe(328);
  });

  it("returns zeros for no rows rather than throwing", () => {
    const totals = rollUp([]);
    expect(totals.mtd.revenueCents).toBe(0);
    expect(totals.activeMembers).toBe(0);
  });
});
