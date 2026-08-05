import type { Business } from "@/lib/businesses";
import type {
  BusinessMetrics,
  MetricWindow,
  Quality,
  SourceId,
} from "@/lib/metrics/types";
import { EMPTY_WINDOW } from "@/lib/metrics/types";

/**
 * Shared upstream contract for the real adapters.
 *
 * Both GHL and Glow Fox reach us through a normalizing hop (n8n workflow or a
 * thin serverless function) rather than the dashboard talking to vendor APIs
 * directly. That keeps vendor-shaped JSON — and vendor credentials — out of
 * the frontend, and means adding a source later is a new URL, not new UI.
 *
 * Expected response body:
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

interface UpstreamWindow {
  sales?: number;
  revenue?: number;
  cancellations?: number;
  newMembers?: number;
  pastDue?: number;
}

interface UpstreamBusiness {
  id?: string;
  activeMembers?: number;
  mtd?: UpstreamWindow;
  lastMonth?: UpstreamWindow;
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

export interface NormalizedFetchOptions {
  source: SourceId;
  url: string;
  token?: string;
  businesses: Business[];
  /** Abort the upstream call after this many ms. */
  timeoutMs?: number;
}

/**
 * Calls a normalizing endpoint and maps its payload onto our metrics shape.
 * Businesses missing from the response come back with `quality: "error"` so the
 * UI can flag a gap instead of silently showing zeros as if they were real.
 */
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

  const body = (await response.json()) as { businesses?: UpstreamBusiness[] };
  const byId = new Map<string, UpstreamBusiness>();
  for (const entry of body.businesses ?? []) {
    if (entry?.id) byId.set(entry.id, entry);
  }

  const fetchedAt = new Date().toISOString();
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
