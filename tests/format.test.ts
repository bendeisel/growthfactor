import { describe, expect, it } from "vitest";

import {
  count,
  deltaPct,
  fractionOfMonthElapsed,
  money,
  relativeTime,
} from "@/lib/metrics/format";

describe("money", () => {
  it("formats cents as whole dollars", () => {
    expect(money(1_845_050)).toBe("$18,451");
    expect(money(0)).toBe("$0");
  });

  it("only compacts once the number is large enough to need it", () => {
    expect(money(999_900, true)).toBe("$9,999");
    expect(money(4_980_000, true)).toBe("$49.8K");
  });

  it("drops the trailing zero on a round compact value", () => {
    // Intl compact notation renders this as "$40.0K" in Node and "$40K" in
    // Chrome, which is a hydration mismatch — hence our own formatter.
    expect(money(4_000_000, true)).toBe("$40K");
    expect(money(150_000_000, true)).toBe("$1.5M");
    expect(money(-4_000_000, true)).toBe("-$40K");
  });

  it("keeps negatives signed", () => {
    expect(money(-12_300)).toBe("-$123");
  });
});

describe("deltaPct", () => {
  it("returns null without a baseline, so the UI can hide the delta", () => {
    expect(deltaPct(100, 0)).toBeNull();
    expect(deltaPct(100, -5)).toBeNull();
  });

  it("computes percentage change against the baseline", () => {
    expect(deltaPct(150, 100)).toBeCloseTo(50);
    expect(deltaPct(80, 100)).toBeCloseTo(-20);
  });
});

describe("fractionOfMonthElapsed", () => {
  it("is small at the start of the month and 1 at the end", () => {
    expect(fractionOfMonthElapsed(new Date("2026-08-01T00:00:00Z"))).toBeCloseTo(
      0.02,
    );
    expect(
      fractionOfMonthElapsed(new Date("2026-08-31T23:59:00Z")),
    ).toBeGreaterThan(0.99);
  });

  it("is about half way through a 31-day month on the 16th", () => {
    const fraction = fractionOfMonthElapsed(new Date("2026-08-16T12:00:00Z"));
    expect(fraction).toBeGreaterThan(0.45);
    expect(fraction).toBeLessThan(0.55);
  });
});

describe("relativeTime", () => {
  it("describes recent timestamps in the coarsest useful unit", () => {
    const now = new Date("2026-08-06T12:00:00Z");
    expect(relativeTime("2026-08-06T11:59:55Z", now)).toBe("just now");
    expect(relativeTime("2026-08-06T11:58:00Z", now)).toBe("2m ago");
    expect(relativeTime("2026-08-06T09:00:00Z", now)).toBe("3h ago");
    expect(relativeTime("2026-08-04T12:00:00Z", now)).toBe("2d ago");
  });
});

describe("count", () => {
  it("groups thousands", () => {
    expect(count(1234)).toBe("1,234");
  });
});
