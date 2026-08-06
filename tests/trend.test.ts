import { describe, expect, it } from "vitest";

import { dailyRevenueCents } from "@/lib/metrics/trend";
import type { HistoryPoint } from "@/lib/store/types";

function history(revenues: number[]): HistoryPoint[] {
  return revenues.map((revenueCents, index) => ({
    date: `2026-08-${String(index + 1).padStart(2, "0")}`,
    revenueCents,
    sales: 0,
    cancellations: 0,
    activeMembers: 0,
  }));
}

describe("dailyRevenueCents", () => {
  it("differences cumulative MTD readings into daily revenue", () => {
    expect(dailyRevenueCents(history([100, 250, 400]))).toEqual([150, 150]);
  });

  it("drops the first reading, whose own day is unknowable", () => {
    expect(dailyRevenueCents(history([100, 250]))).toHaveLength(1);
    expect(dailyRevenueCents(history([100]))).toEqual([]);
    expect(dailyRevenueCents([])).toEqual([]);
  });

  it("reads a drop as a new month rather than negative revenue", () => {
    // ...the 30th, the 31st, then the 1st: MTD resets to that day's takings.
    const daily = dailyRevenueCents(history([900, 1000, 120, 300]));
    expect(daily).toEqual([100, 120, 180]);
    expect(daily.every((value) => value >= 0)).toBe(true);
  });

  it("handles a flat day", () => {
    expect(dailyRevenueCents(history([500, 500]))).toEqual([0]);
  });
});
