import type { BusinessMetrics } from "@/lib/metrics/types";

/**
 * One stored reading for one business. Append-only: we never overwrite a
 * reading, so month-over-month and "what did this look like on Tuesday" both
 * come out of the same log.
 */
export interface StoredSnapshot extends BusinessMetrics {
  /** When we wrote it, which can differ from when the vendor measured it. */
  storedAt: string;
}

export interface HistoryPoint {
  /** Day key, YYYY-MM-DD. */
  date: string;
  revenueCents: number;
  sales: number;
  cancellations: number;
  activeMembers: number;
}

export interface MetricsStore {
  /** Persist a batch of readings. */
  put(snapshots: BusinessMetrics[]): Promise<void>;
  /** Most recent reading per business, newest wins. */
  latest(): Promise<Map<string, StoredSnapshot>>;
  /**
   * One point per day for the trailing `days`, using the last reading of each
   * day — MTD figures climb through a day, so the last one is the day's truth.
   */
  history(businessId: string, days: number): Promise<HistoryPoint[]>;
  /** Same as {@link history} for every business in one pass. */
  historyAll(days: number): Promise<Map<string, HistoryPoint[]>>;
  /** When anything was last written, or null on an empty store. */
  lastWriteAt(): Promise<string | null>;
}
