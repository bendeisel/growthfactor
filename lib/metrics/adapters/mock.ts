import type { Business } from "@/lib/businesses";
import type { BusinessMetrics, MetricWindow, MetricsAdapter } from "@/lib/metrics/types";

/**
 * Deterministic mock adapter — Phase 1's data source.
 *
 * Numbers are derived from a hash of (businessId + month), so a given business
 * keeps the same monthly shape across reloads instead of jittering randomly.
 * Month-to-date figures scale with how far into the month we are, which makes
 * the column behave like real MTD reporting while the real adapters land.
 */

function hash(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Small, fast seeded PRNG (mulberry32). */
function rng(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function monthKey(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

function fractionOfMonthElapsed(now: Date): number {
  const start = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1);
  const end = Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1);
  return Math.min(1, Math.max(0.02, (now.getTime() - start) / (end - start)));
}

interface Shape {
  monthlyRevenueCents: number;
  monthlySales: number;
  cancellationRate: number;
  activeMembers: number;
  pastDueCents: number;
}

function shapeFor(business: Business, month: string): Shape {
  const rand = rng(hash(`${business.id}:${month}`));
  // Active members are a running total, not a monthly figure, so they're seeded
  // per business only. Seeding them per month made a history window that
  // crossed a month boundary look like a sudden membership collapse.
  const members = rng(hash(business.id));
  const scale = business.membership ? 1 : 1.6; // agency/programs bill larger, less often
  const monthlyRevenueCents = Math.round(
    (18_000 + rand() * 42_000) * 100 * (business.membership ? 1 : 0.8) * scale,
  );
  const monthlySales = Math.round(
    business.membership ? 14 + rand() * 40 : 2 + rand() * 9,
  );
  return {
    monthlyRevenueCents,
    monthlySales,
    cancellationRate: 0.04 + rand() * 0.08,
    activeMembers: business.membership ? Math.round(120 + members() * 380) : 0,
    pastDueCents: Math.round((400 + rand() * 5_200) * 100),
  };
}

function windowFrom(shape: Shape, portion: number, drift: number): MetricWindow {
  const sales = Math.max(0, Math.round(shape.monthlySales * portion * drift));
  return {
    sales,
    revenueCents: Math.round(shape.monthlyRevenueCents * portion * drift),
    cancellations: Math.max(
      0,
      Math.round(shape.monthlySales * shape.cancellationRate * portion * 4),
    ),
    newMembers: sales,
    pastDueCents: Math.round(shape.pastDueCents * portion),
  };
}

export function mockMetricsFor(business: Business, now = new Date()): BusinessMetrics {
  const thisMonth = monthKey(now);
  const prev = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1),
  );

  const shape = shapeFor(business, thisMonth);
  const prevShape = shapeFor(business, monthKey(prev));
  const portion = fractionOfMonthElapsed(now);

  // Gentle intra-day movement so a refresh visibly ticks, without inventing
  // a different month every reload.
  const drift = 0.97 + (hash(`${business.id}:${now.getUTCHours()}`) % 60) / 1000;

  return {
    businessId: business.id,
    source: "mock",
    quality: "mock",
    fetchedAt: now.toISOString(),
    mtd: windowFrom(shape, portion, drift),
    lastMonth: windowFrom(prevShape, 1, 1),
    activeMembers: shape.activeMembers,
    note: "Mock data — real adapter lands in Phase 2.",
  };
}

/**
 * Mock readings are never written to the snapshot store, so there is no real
 * history behind them. This regenerates the same deterministic shape at each
 * past date, which is what lets the sparklines demo honestly: same numbers you
 * would have seen on that day, still badged as mock.
 */
export function mockHistory(business: Business, days: number, now = new Date()) {
  const points: Array<{
    date: string;
    revenueCents: number;
    sales: number;
    cancellations: number;
    activeMembers: number;
  }> = [];

  for (let back = days - 1; back >= 0; back--) {
    const at = new Date(now.getTime() - back * 86_400_000);
    const snapshot = mockMetricsFor(business, at);
    points.push({
      date: at.toISOString().slice(0, 10),
      revenueCents: snapshot.mtd.revenueCents,
      sales: snapshot.mtd.sales,
      cancellations: snapshot.mtd.cancellations,
      activeMembers: snapshot.activeMembers,
    });
  }
  return points;
}

export const mockAdapter: MetricsAdapter = {
  id: "mock",
  label: "Mock",
  isConfigured: () => true,
  missingReason: () => undefined,
  async fetchMetrics(businesses) {
    const now = new Date();
    return businesses.map((b) => mockMetricsFor(b, now));
  },
};
