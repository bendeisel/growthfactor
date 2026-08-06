import { appendFile, mkdir, readFile, stat } from "node:fs/promises";
import path from "node:path";

import type { BusinessMetrics } from "@/lib/metrics/types";
import type { HistoryPoint, MetricsStore, StoredSnapshot } from "@/lib/store/types";

/**
 * JSONL-on-disk store — one line per reading, appended.
 *
 * This is deliberate rather than a placeholder for Postgres. The command center
 * is single-user on a single node (spec §7: Hostinger), the write rate is a
 * handful of rows per ingest, and a year of history is a file you can open in a
 * text editor and hand to anyone. Postgres earns its place at the white-label
 * step in Phase 5, when there is more than one tenant to keep apart; the
 * MetricsStore interface is where that swap happens.
 */

const MAX_LINES = 200_000; // ~2 years of hourly ingests for 7 businesses.

export class FileMetricsStore implements MetricsStore {
  constructor(private readonly file: string) {}

  private async readLines(): Promise<StoredSnapshot[]> {
    let raw: string;
    try {
      raw = await readFile(this.file, "utf8");
    } catch {
      return [];
    }
    const rows: StoredSnapshot[] = [];
    // A truncated final line (killed mid-write) is skipped rather than fatal.
    for (const line of raw.split("\n")) {
      if (!line.trim()) continue;
      try {
        rows.push(JSON.parse(line) as StoredSnapshot);
      } catch {
        continue;
      }
    }
    return rows.length > MAX_LINES ? rows.slice(-MAX_LINES) : rows;
  }

  async put(snapshots: BusinessMetrics[]): Promise<void> {
    if (snapshots.length === 0) return;
    const storedAt = new Date().toISOString();
    const payload = snapshots
      .map((snapshot) => JSON.stringify({ ...snapshot, storedAt }))
      .join("\n");
    await mkdir(path.dirname(this.file), { recursive: true });
    await appendFile(this.file, `${payload}\n`, "utf8");
  }

  async latest(): Promise<Map<string, StoredSnapshot>> {
    const rows = await this.readLines();
    const latest = new Map<string, StoredSnapshot>();
    for (const row of rows) {
      const held = latest.get(row.businessId);
      if (!held || row.fetchedAt >= held.fetchedAt) latest.set(row.businessId, row);
    }
    return latest;
  }

  async history(businessId: string, days: number): Promise<HistoryPoint[]> {
    return (await this.historyAll(days)).get(businessId) ?? [];
  }

  async historyAll(days: number): Promise<Map<string, HistoryPoint[]>> {
    const rows = await this.readLines();
    const cutoff = Date.now() - days * 86_400_000;
    // Last reading of each day wins: MTD counters climb through the day.
    const byBusinessDay = new Map<string, Map<string, StoredSnapshot>>();
    for (const row of rows) {
      const at = Date.parse(row.fetchedAt);
      if (!Number.isFinite(at) || at < cutoff) continue;
      const date = row.fetchedAt.slice(0, 10);
      let days = byBusinessDay.get(row.businessId);
      if (!days) {
        days = new Map();
        byBusinessDay.set(row.businessId, days);
      }
      const held = days.get(date);
      if (!held || row.fetchedAt >= held.fetchedAt) days.set(date, row);
    }

    const out = new Map<string, HistoryPoint[]>();
    for (const [businessId, days] of byBusinessDay) {
      out.set(
        businessId,
        [...days.entries()]
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([date, row]) => ({
            date,
            revenueCents: row.mtd.revenueCents,
            sales: row.mtd.sales,
            cancellations: row.mtd.cancellations,
            activeMembers: row.activeMembers,
          })),
      );
    }
    return out;
  }

  async lastWriteAt(): Promise<string | null> {
    try {
      return (await stat(this.file)).mtime.toISOString();
    } catch {
      return null;
    }
  }
}
