import { BUSINESSES, type Business } from "@/lib/businesses";
import { ghlAdapter } from "@/lib/metrics/adapters/ghl";
import { glowFoxAdapter } from "@/lib/metrics/adapters/glowfox";
import { mockAdapter, mockMetricsFor } from "@/lib/metrics/adapters/mock";
import type {
  BusinessMetrics,
  MetricsAdapter,
  MetricsSnapshot,
  SourceId,
  SourceStatus,
} from "@/lib/metrics/types";

const ADAPTERS: Record<SourceId, MetricsAdapter> = {
  ghl: ghlAdapter,
  glowfox: glowFoxAdapter,
  clickup: mockAdapter, // Phase 2: ClickUp-derived delivery metrics.
  mock: mockAdapter,
};

/** Register a new source here and it shows up in the column — no UI changes. */
export function listAdapters(): MetricsAdapter[] {
  return [ghlAdapter, glowFoxAdapter];
}

function statusFor(adapter: MetricsAdapter): SourceStatus {
  return {
    id: adapter.id,
    label: adapter.label,
    configured: adapter.isConfigured(),
    note: adapter.missingReason(),
  };
}

function periodLabel(now: Date): string {
  return now.toLocaleString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

function groupBySource(businesses: Business[]): Map<SourceId, Business[]> {
  const groups = new Map<SourceId, Business[]>();
  for (const business of businesses) {
    const existing = groups.get(business.source);
    if (existing) existing.push(business);
    else groups.set(business.source, [business]);
  }
  return groups;
}

/**
 * Fetches every business's metrics, one call per source.
 *
 * A source that is unconfigured or failing degrades to mock data for its own
 * businesses instead of failing the whole snapshot — one dead vendor should
 * never blank the column.
 */
export async function getMetricsSnapshot(
  businesses: Business[] = BUSINESSES,
): Promise<MetricsSnapshot> {
  const now = new Date();
  const groups = groupBySource(businesses);

  const results = await Promise.all(
    [...groups].map(async ([source, group]): Promise<BusinessMetrics[]> => {
      const adapter = ADAPTERS[source] ?? mockAdapter;
      if (!adapter.isConfigured()) {
        return group.map((business) => ({
          ...mockMetricsFor(business, now),
          note: adapter.missingReason() ?? `${adapter.label} is not configured yet.`,
        }));
      }
      try {
        return await adapter.fetchMetrics(group);
      } catch (error) {
        const reason = error instanceof Error ? error.message : String(error);
        return group.map((business) => ({
          ...mockMetricsFor(business, now),
          quality: "stale" as const,
          note: `${adapter.label} fetch failed (${reason}) — showing mock values.`,
        }));
      }
    }),
  );

  // Preserve the configured business order rather than source-group order.
  const byId = new Map(results.flat().map((m) => [m.businessId, m]));

  return {
    fetchedAt: now.toISOString(),
    period: periodLabel(now),
    businesses: businesses.map(
      (business) => byId.get(business.id) ?? mockMetricsFor(business, now),
    ),
    sources: listAdapters().map(statusFor),
  };
}
