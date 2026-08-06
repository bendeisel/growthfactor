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
import { getStore } from "@/lib/store";

const ADAPTERS: Record<SourceId, MetricsAdapter> = {
  ghl: ghlAdapter,
  glowfox: glowFoxAdapter,
  clickup: mockAdapter, // Phase 2: ClickUp-derived delivery metrics.
  mock: mockAdapter,
};

/** How old a stored reading may be before the UI calls it stale. */
function freshWindowMs(): number {
  const minutes = Number(process.env.METRICS_FRESH_MINUTES ?? 90);
  return (Number.isFinite(minutes) && minutes > 0 ? minutes : 90) * 60_000;
}

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

/** Pull one source's businesses, degrading to mock rather than throwing. */
async function pull(
  source: SourceId,
  group: Business[],
  now: Date,
): Promise<BusinessMetrics[]> {
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
}

export interface SnapshotOptions {
  businesses?: Business[];
  /** Re-pull configured sources even if the stored reading is still fresh. */
  force?: boolean;
}

/**
 * Reads the dashboard's numbers.
 *
 * Stored readings come first: once n8n is pushing to `/api/ingest`, page loads
 * never wait on a vendor and a vendor outage shows as *stale*, not as a blank
 * column. Only businesses with no usable stored reading trigger a live pull,
 * and a successful pull is written back so it also builds history.
 *
 * Mock readings are never persisted — mock numbers in the log would poison the
 * trends the moment real data arrives.
 */
export async function getMetricsSnapshot(
  options: SnapshotOptions = {},
): Promise<MetricsSnapshot> {
  const businesses = options.businesses ?? BUSINESSES;
  const now = new Date();
  const store = getStore();
  const stored = await store.latest();
  const staleBefore = now.getTime() - freshWindowMs();

  const usable = new Map<string, BusinessMetrics>();
  const needsPull: Business[] = [];

  for (const business of businesses) {
    const row = stored.get(business.id);
    const at = row ? Date.parse(row.fetchedAt) : NaN;
    const fresh = Number.isFinite(at) && at >= staleBefore;

    if (row && fresh && !options.force) {
      usable.set(business.id, row);
    } else if (row && !options.force) {
      // Keep showing the last known numbers, but say they're old.
      usable.set(business.id, {
        ...row,
        quality: "stale",
        note: `Last ingest ${row.fetchedAt}. Check the n8n schedule.`,
      });
    } else {
      needsPull.push(business);
    }
  }

  if (needsPull.length > 0) {
    const groups = groupBySource(needsPull);
    const pulled = (
      await Promise.all([...groups].map(([source, group]) => pull(source, group, now)))
    ).flat();

    for (const row of pulled) usable.set(row.businessId, row);

    // Persist only what a vendor actually told us.
    const real = pulled.filter((row) => row.quality === "live");
    if (real.length > 0) await store.put(real);
  }

  return {
    fetchedAt: now.toISOString(),
    period: periodLabel(now),
    businesses: businesses.map(
      (business) => usable.get(business.id) ?? mockMetricsFor(business, now),
    ),
    sources: listAdapters().map(statusFor),
    lastIngestAt: await store.lastWriteAt(),
  };
}
