import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";

import type { BusinessMetrics } from "@/lib/metrics/types";
import { EMPTY_WINDOW } from "@/lib/metrics/types";
import { FileMetricsStore } from "@/lib/store/file-store";

async function store() {
  const dir = await mkdtemp(path.join(tmpdir(), "cc-store-"));
  return {
    dir,
    store: new FileMetricsStore(path.join(dir, "metrics.jsonl")),
  };
}

function reading(
  businessId: string,
  fetchedAt: string,
  revenueCents: number,
  activeMembers = 300,
): BusinessMetrics {
  return {
    businessId,
    source: "glowfox",
    quality: "live",
    fetchedAt,
    mtd: { ...EMPTY_WINDOW, revenueCents },
    lastMonth: { ...EMPTY_WINDOW },
    activeMembers,
    activeMembersLastMonth: activeMembers,
  };
}

describe("FileMetricsStore", () => {
  it("reads back nothing before anything is written", async () => {
    const { store: subject } = await store();
    expect((await subject.latest()).size).toBe(0);
    expect(await subject.lastWriteAt()).toBeNull();
    expect(await subject.history("nashville-mma", 14)).toEqual([]);
  });

  it("keeps the newest reading per business", async () => {
    const { store: subject } = await store();
    await subject.put([reading("a", "2026-08-16T08:00:00Z", 100)]);
    await subject.put([
      reading("a", "2026-08-16T12:00:00Z", 200),
      reading("b", "2026-08-16T12:00:00Z", 50),
    ]);

    const latest = await subject.latest();
    expect(latest.get("a")?.mtd.revenueCents).toBe(200);
    expect(latest.get("b")?.mtd.revenueCents).toBe(50);
    expect(latest.get("a")?.storedAt).toBeTypeOf("string");
  });

  it("does not let an out-of-order write overwrite a newer reading", async () => {
    const { store: subject } = await store();
    await subject.put([reading("a", "2026-08-16T12:00:00Z", 200)]);
    await subject.put([reading("a", "2026-08-16T08:00:00Z", 100)]);

    expect((await subject.latest()).get("a")?.mtd.revenueCents).toBe(200);
  });

  it("collapses each day to its last reading, oldest first", async () => {
    const { store: subject } = await store();
    const today = new Date();
    const yesterday = new Date(today.getTime() - 86_400_000);
    const day = (at: Date, hour: number) =>
      `${at.toISOString().slice(0, 10)}T${String(hour).padStart(2, "0")}:00:00Z`;

    await subject.put([
      reading("a", day(yesterday, 6), 100),
      reading("a", day(yesterday, 20), 400),
      reading("a", day(today, 9), 500),
    ]);

    const history = await subject.history("a", 14);
    expect(history).toHaveLength(2);
    expect(history[0].revenueCents).toBe(400);
    expect(history[1].revenueCents).toBe(500);
  });

  it("drops readings older than the window", async () => {
    const { store: subject } = await store();
    await subject.put([reading("a", "2020-01-01T00:00:00Z", 999)]);
    expect(await subject.history("a", 14)).toEqual([]);
  });

  it("skips a torn final line rather than failing the read", async () => {
    const { dir, store: subject } = await store();
    const file = path.join(dir, "metrics.jsonl");
    await subject.put([reading("a", "2026-08-16T12:00:00Z", 200)]);
    await writeFile(file, `${'{"businessId":"a","mtd"'}`, { flag: "a" });

    expect((await subject.latest()).get("a")?.mtd.revenueCents).toBe(200);
  });

  it("returns history for every business in one pass", async () => {
    const { store: subject } = await store();
    const now = new Date().toISOString();
    await subject.put([reading("a", now, 100), reading("b", now, 200)]);

    const all = await subject.historyAll(14);
    expect([...all.keys()].sort()).toEqual(["a", "b"]);
  });
});
