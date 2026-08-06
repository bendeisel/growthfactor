import { describe, expect, it } from "vitest";

import { buildAlerts } from "@/lib/alerts";
import type { BusinessMetrics, MetricsSnapshot } from "@/lib/metrics/types";
import { EMPTY_WINDOW } from "@/lib/metrics/types";
import type { HistoryPoint } from "@/lib/store/types";

// Mid-month: about half of last month's totals is "on pace".
const NOW = new Date("2026-08-16T12:00:00Z");

function row(overrides: Partial<BusinessMetrics> = {}): BusinessMetrics {
  return {
    businessId: "nashville-mma",
    source: "glowfox",
    quality: "live",
    fetchedAt: NOW.toISOString(),
    mtd: { ...EMPTY_WINDOW },
    lastMonth: { ...EMPTY_WINDOW },
    activeMembers: 300,
    activeMembersLastMonth: 300,
    ...overrides,
  };
}

function snapshot(rows: BusinessMetrics[]): MetricsSnapshot {
  return {
    fetchedAt: NOW.toISOString(),
    period: "August 2026",
    businesses: rows,
    sources: [{ id: "glowfox", label: "Glow Fox (n8n)", configured: true }],
    lastIngestAt: NOW.toISOString(),
  };
}

function history(members: number[]): HistoryPoint[] {
  return members.map((activeMembers, index) => ({
    date: `2026-08-${String(index + 1).padStart(2, "0")}`,
    revenueCents: 1000 * (index + 1),
    sales: index,
    cancellations: 0,
    activeMembers,
  }));
}

describe("buildAlerts", () => {
  it("says nothing when every business is on pace", () => {
    const alerts = buildAlerts({
      snapshot: snapshot([
        row({
          mtd: { ...EMPTY_WINDOW, revenueCents: 2_000_000 },
          lastMonth: { ...EMPTY_WINDOW, revenueCents: 3_800_000 },
        }),
      ]),
      histories: {},
      now: NOW,
    });

    expect(alerts).toHaveLength(0);
  });

  it("escalates a large revenue shortfall to critical", () => {
    const alerts = buildAlerts({
      snapshot: snapshot([
        row({
          mtd: { ...EMPTY_WINDOW, revenueCents: 500_000 },
          lastMonth: { ...EMPTY_WINDOW, revenueCents: 4_000_000 },
        }),
      ]),
      histories: {},
      now: NOW,
    });

    const pace = alerts.find((alert) => alert.id.startsWith("pace:"));
    expect(pace?.severity).toBe("critical");
    expect(pace?.title).toContain("behind pace");
  });

  it("ignores a shortfall when there is no baseline to compare against", () => {
    const alerts = buildAlerts({
      snapshot: snapshot([row({ mtd: { ...EMPTY_WINDOW, revenueCents: 0 } })]),
      histories: {},
      now: NOW,
    });

    expect(alerts.some((alert) => alert.id.startsWith("pace:"))).toBe(false);
  });

  it("flags a cancellation spike but not a normal month", () => {
    const spiking = buildAlerts({
      snapshot: snapshot([
        row({
          mtd: { ...EMPTY_WINDOW, cancellations: 9 },
          lastMonth: { ...EMPTY_WINDOW, cancellations: 8 },
        }),
      ]),
      histories: {},
      now: NOW,
    });
    expect(spiking.some((alert) => alert.id.startsWith("cancellations:"))).toBe(true);

    const steady = buildAlerts({
      snapshot: snapshot([
        row({
          mtd: { ...EMPTY_WINDOW, cancellations: 4 },
          lastMonth: { ...EMPTY_WINDOW, cancellations: 10 },
        }),
      ]),
      histories: {},
      now: NOW,
    });
    expect(steady.some((alert) => alert.id.startsWith("cancellations:"))).toBe(false);
  });

  it("grades past due by size", () => {
    const warn = buildAlerts({
      snapshot: snapshot([row({ mtd: { ...EMPTY_WINDOW, pastDueCents: 150_000 } })]),
      histories: {},
      now: NOW,
    });
    expect(warn.find((alert) => alert.id.startsWith("pastdue:"))?.severity).toBe("warn");

    const critical = buildAlerts({
      snapshot: snapshot([row({ mtd: { ...EMPTY_WINDOW, pastDueCents: 400_000 } })]),
      histories: {},
      now: NOW,
    });
    expect(critical.find((alert) => alert.id.startsWith("pastdue:"))?.severity).toBe(
      "critical",
    );
  });

  it("notices membership decline for membership businesses", () => {
    const alerts = buildAlerts({
      snapshot: snapshot([row()]),
      histories: { "nashville-mma": history([320, 315, 305, 300]) },
      now: NOW,
    });

    const decline = alerts.find((alert) => alert.id.startsWith("members:"));
    expect(decline?.title).toContain("lost");
  });

  it("treats a missing source row as critical", () => {
    const alerts = buildAlerts({
      snapshot: snapshot([row({ quality: "error", note: "No row for it." })]),
      histories: {},
      now: NOW,
    });

    expect(alerts.find((alert) => alert.id.startsWith("missing:"))?.severity).toBe(
      "critical",
    );
  });

  it("raises the alarm when ingestion has stopped", () => {
    const stale = snapshot([row({ quality: "stale" })]);
    stale.lastIngestAt = "2026-08-14T12:00:00Z";

    const alerts = buildAlerts({ snapshot: stale, histories: {}, now: NOW });
    expect(alerts.find((alert) => alert.id === "no-ingest")?.severity).toBe("critical");
    expect(alerts.some((alert) => alert.id === "stale")).toBe(true);
  });

  it("collapses mock businesses into one informational notice", () => {
    const alerts = buildAlerts({
      snapshot: snapshot([
        row({ businessId: "nashville-mma", quality: "mock" }),
        row({ businessId: "fighters-boxing", quality: "mock" }),
      ]),
      histories: {},
      now: NOW,
    });

    const mock = alerts.filter((alert) => alert.id === "mock");
    expect(mock).toHaveLength(1);
    expect(mock[0].severity).toBe("info");
  });

  it("sorts critical first so the collapsed view shows the worst", () => {
    const alerts = buildAlerts({
      snapshot: snapshot([
        row({ businessId: "nashville-mma", quality: "mock" }),
        row({
          businessId: "fighters-boxing",
          mtd: { ...EMPTY_WINDOW, pastDueCents: 400_000 },
        }),
      ]),
      histories: {},
      now: NOW,
    });

    expect(alerts[0].severity).toBe("critical");
    expect(alerts.at(-1)?.severity).toBe("info");
  });
});
