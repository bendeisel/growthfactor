import { describe, expect, it } from "vitest";

import { BUSINESSES } from "@/lib/businesses";
import { mockHistory, mockMetricsFor } from "@/lib/metrics/adapters/mock";

const gym = BUSINESSES[0];

describe("mock adapter", () => {
  it("is deterministic for a given business and time", () => {
    const at = new Date("2026-08-16T12:00:00Z");
    expect(mockMetricsFor(gym, at)).toEqual(mockMetricsFor(gym, at));
  });

  it("gives different businesses different numbers", () => {
    const at = new Date("2026-08-16T12:00:00Z");
    const a = mockMetricsFor(BUSINESSES[0], at).mtd.revenueCents;
    const b = mockMetricsFor(BUSINESSES[1], at).mtd.revenueCents;
    expect(a).not.toBe(b);
  });

  it("marks itself as mock so the UI can badge it", () => {
    const row = mockMetricsFor(gym, new Date("2026-08-16T12:00:00Z"));
    expect(row.quality).toBe("mock");
    expect(row.source).toBe("mock");
  });

  it("accumulates through the month like a real MTD figure", () => {
    const early = mockMetricsFor(gym, new Date("2026-08-03T12:00:00Z"));
    const late = mockMetricsFor(gym, new Date("2026-08-28T12:00:00Z"));
    expect(late.mtd.revenueCents).toBeGreaterThan(early.mtd.revenueCents);
  });

  it("produces history oldest-first with one point per day", () => {
    const points = mockHistory(gym, 14, new Date("2026-08-16T12:00:00Z"));
    expect(points).toHaveLength(14);
    expect(points[0].date).toBe("2026-08-03");
    expect(points.at(-1)?.date).toBe("2026-08-16");
    expect(new Set(points.map((point) => point.date)).size).toBe(14);
  });
});

describe("mock history across a month boundary", () => {
  it("keeps active members stable, since they are a running total", () => {
    // A 14-day window ending on the 6th spans two months; seeding members per
    // month used to make that look like a sudden membership collapse.
    const points = mockHistory(gym, 14, new Date("2026-08-06T12:00:00Z"));
    const members = new Set(points.map((point) => point.activeMembers));
    expect(members.size).toBe(1);
  });
});
