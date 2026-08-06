import path from "node:path";

import { FileMetricsStore } from "@/lib/store/file-store";
import type { MetricsStore } from "@/lib/store/types";

/**
 * Single store instance per process. `DATA_DIR` lets the host put the log on a
 * persistent volume instead of next to the build output.
 */
let store: MetricsStore | undefined;

export function getStore(): MetricsStore {
  if (!store) {
    const dir = process.env.DATA_DIR ?? path.join(process.cwd(), "data");
    store = new FileMetricsStore(path.join(dir, "metrics.jsonl"));
  }
  return store;
}

export type { HistoryPoint, MetricsStore, StoredSnapshot } from "@/lib/store/types";
