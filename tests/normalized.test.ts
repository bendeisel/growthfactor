import { describe, expect, it } from "vitest";

import type { Business } from "@/lib/businesses";
import { parseNormalizedPayload } from "@/lib/metrics/adapters/normalized";

const gym: Business = {
  id: "nashville-mma",
  name: "Nashville MMA Training Camp",
  kind: "MMA gym",
  source: "glowfox",
  membership: true,
};

const agency: Business = {
  id: "growth-factor-ai",
  name: "Growth Factor AI",
  kind: "Agency",
  source: "ghl",
  membership: false,
};

describe("parseNormalizedPayload", () => {
  it("converts upstream dollars to cents", () => {
    const [row] = parseNormalizedPayload("glowfox", [gym], {
      businesses: [
        {
          id: "nashville-mma",
          activeMembers: 312,
          mtd: { sales: 21, revenue: 18450.5, cancellations: 4, newMembers: 21, pastDue: 1220 },
          lastMonth: { sales: 44, revenue: 39100, cancellations: 9, newMembers: 44, pastDue: 980 },
        },
      ],
    });

    expect(row.quality).toBe("live");
    expect(row.mtd.revenueCents).toBe(1_845_050);
    expect(row.mtd.pastDueCents).toBe(122_000);
    expect(row.lastMonth.revenueCents).toBe(3_910_000);
    expect(row.activeMembers).toBe(312);
  });

  it("flags a business the payload omits instead of reporting zeros as real", () => {
    const [row] = parseNormalizedPayload("ghl", [agency], { businesses: [] });

    expect(row.quality).toBe("error");
    expect(row.mtd.revenueCents).toBe(0);
    expect(row.note).toContain("growth-factor-ai");
  });

  it("survives junk values without throwing", () => {
    const [row] = parseNormalizedPayload("ghl", [agency], {
      businesses: [
        {
          id: "growth-factor-ai",
          activeMembers: Number.NaN,
          // @ts-expect-error deliberately wrong upstream types
          mtd: { sales: "12", revenue: null, cancellations: undefined },
        },
      ],
    });

    expect(row.quality).toBe("live");
    expect(row.mtd.sales).toBe(0);
    expect(row.mtd.revenueCents).toBe(0);
    expect(row.activeMembers).toBe(0);
  });

  it("matches on accountRef when one is configured", () => {
    const [row] = parseNormalizedPayload(
      "glowfox",
      [{ ...gym, accountRef: "loc_9912" }],
      { businesses: [{ id: "loc_9912", mtd: { revenue: 100 } }] },
    );

    expect(row.businessId).toBe("nashville-mma");
    expect(row.quality).toBe("live");
    expect(row.mtd.revenueCents).toBe(10_000);
  });
});
