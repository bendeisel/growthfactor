import { buildAlerts, type Alert } from "@/lib/alerts";
import { BUSINESSES } from "@/lib/businesses";
import { mockHistory } from "@/lib/metrics/adapters/mock";
import { getMetricsSnapshot, type SnapshotOptions } from "@/lib/metrics/registry";
import type { MetricsSnapshot } from "@/lib/metrics/types";
import { getStore } from "@/lib/store";
import type { HistoryPoint } from "@/lib/store/types";

/** Days of trend shown in the sparklines and used by the decline rule. */
export const HISTORY_DAYS = 14;

export interface DashboardState {
  snapshot: MetricsSnapshot;
  alerts: Alert[];
  /** Trailing history per business id, oldest first. */
  histories: Record<string, HistoryPoint[]>;
}

/**
 * Everything the screen needs, in one call: numbers, trend, and what needs
 * attention. The page renders this server-side and the client re-fetches it.
 */
export async function getDashboardState(
  options: SnapshotOptions = {},
): Promise<DashboardState> {
  const now = new Date();
  const snapshot = await getMetricsSnapshot(options);
  const stored = await getStore().historyAll(HISTORY_DAYS);

  const histories: Record<string, HistoryPoint[]> = {};
  for (const business of BUSINESSES) {
    const real = stored.get(business.id) ?? [];
    // Mock rows have no stored history by design; regenerate the same
    // deterministic shape so the trend line matches the mock number above it.
    const isMock =
      snapshot.businesses.find((row) => row.businessId === business.id)?.quality ===
      "mock";
    histories[business.id] =
      real.length >= 2 ? real : isMock ? mockHistory(business, HISTORY_DAYS, now) : real;
  }

  return {
    snapshot,
    alerts: buildAlerts({ snapshot, histories, now }),
    histories,
  };
}
