import type { Business } from "@/lib/businesses";
import type {
  BusinessMetrics,
  MetricWindow,
  Quality,
  SourceId,
} from "@/lib/metrics/types";
import { EMPTY_WINDOW } from "@/lib/metrics/types";

/**
 * Shared upstream contract for real metrics, used by both directions:
 *
 * - **push** (preferred): n8n POSTs this body to `/api/ingest` on a schedule.
 * - **pull**: an adapter fetches it when a URL is configured.
 *
 * Either way a normalizing hop (n8n workflow or a thin function) owns the vendor
 * credentials and the vendor-shaped JSON, so adding a source later is a new URL
 * rather than new UI.
 *
 * Expected body:
 * {
 *   "businesses": [
 *     {
 *       "id": "nashville-mma",
 *       "activeMembers": 312,
 *       "mtd":       { "sales": 21, "revenue": 18450.5, "cancellations": 4,
 *                      "newMembers": 21, "pastDue": 1220 },
 *       "lastMonth": { ... same shape ... }
 *     }
 *   ]
 * }
 *
 * Money arrives as dollars (what n8n gets from the vendors) and is stored in
 * cents so arithmetic in the UI stays exact.
 */

export interface UpstreamWindow {
  sales?: number;
  revenue?: number;
  cancellations?: number;
  newMembers?: number;
  pastDue?: number;
}

export interface UpstreamBusiness {
  id?: string;
  activeMembers?: number;
  mtd?: UpstreamWindow;
  lastMonth?: UpstreamWindow;
}

export interface UpstreamPayload {
  businesses?: UpstreamBusiness[];
}

function num(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function toWindow(raw: UpstreamWindow | undefined): MetricWindow {
  if (!raw) return { ...EMPTY_WINDOW };
  return {
    sales: Math.round(num(raw.sales)),
    revenueCents: Math.round(num(raw.revenue) * 100),
    cancellations: Math.round(num(raw.cancellations)),
    newMembers: Math.round(num(raw.newMembers)),
    pastDueCents: Math.round(num(raw.pastDue) * 100),
  };
}

export class NotConfiguredError extends Error {}

/**
 * Maps an upstream body onto our metrics shape.
 *
 * Businesses missing from the body come back with `quality: "error"` so a gap
 * is visible as a gap, rather than showing zeros as if they were measured.
 */
export function parseNormalizedPayload(
  source: SourceId,
  businesses: Business[],
  body: UpstreamPayload,
  now = new Date(),
): BusinessMetrics[] {
  const byId = new Map<string, UpstreamBusiness>();
  for (const entry of body.businesses ?? []) {
    if (entry?.id) byId.set(entry.id, entry);
  }

  const fetchedAt = now.toISOString();
  return businesses.map((business) => {
    const raw = byId.get(business.accountRef ?? business.id) ?? byId.get(business.id);
    const quality: Quality = raw ? "live" : "error";
    return {
      businessId: business.id,
      source,
      quality,
      fetchedAt,
      mtd: toWindow(raw?.mtd),
      lastMonth: toWindow(raw?.lastMonth),
      activeMembers: Math.round(num(raw?.activeMembers)),
      note: raw ? undefined : `No row for ${business.id} in the ${source} payload.`,
    };
  });
}

export interface NormalizedFetchOptions {
  source: SourceId;
  url: string;
  token?: string;
  businesses: Business[];
  /** Abort the upstream call after this many ms. */
  timeoutMs?: number;
}

/** Pull path: call a normalizing endpoint and map its payload. */
export async function fetchNormalized({
  source,
  url,
  token,
  businesses,
  timeoutMs = 8000,
}: NormalizedFetchOptions): Promise<BusinessMetrics[]> {
  const target = new URL(url);
  for (const business of businesses) {
    target.searchParams.append("business", business.accountRef ?? business.id);
  }

  const response = await fetch(target, {
    headers: {
      accept: "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    signal: AbortSignal.timeout(timeoutMs),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`${source}: upstream responded ${response.status}`);
  }

  return parseNormalizedPayload(
    source,
    businesses,
    (await response.json()) as UpstreamPayload,
  );
}
