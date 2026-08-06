import type { Business } from "@/lib/businesses";

export type SourceId = "ghl" | "glowfox" | "clickup" | "mock";

/** How much to trust a number on screen. */
export type Quality = "live" | "mock" | "stale" | "error";

/** One reporting window (month-to-date, last month, ...). */
export interface MetricWindow {
  /** Count of closed sales / new contracts. */
  sales: number;
  /** Collected revenue in cents. */
  revenueCents: number;
  cancellations: number;
  newMembers: number;
  /** Outstanding balance in cents. */
  pastDueCents: number;
}

export interface BusinessMetrics {
  businessId: string;
  source: SourceId;
  quality: Quality;
  /** ISO timestamp of when the numbers were produced. */
  fetchedAt: string;
  mtd: MetricWindow;
  lastMonth: MetricWindow;
  activeMembers: number;
  /** Why the data is mock / stale / errored, when it is. */
  note?: string;
}

export interface MetricsSnapshot {
  fetchedAt: string;
  /** Period label, e.g. "August 2026". */
  period: string;
  businesses: BusinessMetrics[];
  /** Per-source status, for the footer readout. */
  sources: SourceStatus[];
  /** Last write to the snapshot store, or null before the first ingest. */
  lastIngestAt: string | null;
}

export interface SourceStatus {
  id: SourceId;
  label: string;
  configured: boolean;
  note?: string;
}

export interface MetricsAdapter {
  id: SourceId;
  label: string;
  /**
   * True when the credentials / endpoints this adapter needs are present.
   * The registry falls back to mock data when false, so the dashboard never
   * renders an empty column.
   */
  isConfigured(): boolean;
  /** Reason shown in the UI when {@link isConfigured} is false. */
  missingReason(): string | undefined;
  fetchMetrics(businesses: Business[]): Promise<BusinessMetrics[]>;
}

export const EMPTY_WINDOW: MetricWindow = {
  sales: 0,
  revenueCents: 0,
  cancellations: 0,
  newMembers: 0,
  pastDueCents: 0,
};
