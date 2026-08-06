import { BUSINESSES, getBusiness } from "@/lib/businesses";
import { fractionOfMonthElapsed } from "@/lib/metrics/format";
import type { MetricsSnapshot } from "@/lib/metrics/types";
import type { HistoryPoint } from "@/lib/store/types";

/**
 * What needs Ben today.
 *
 * A wall of numbers still leaves you to scan seven businesses and do the
 * arithmetic. These rules do the scan: anything that isn't flagged is fine, so
 * an empty feed is a real answer, not an empty state.
 */

export type Severity = "critical" | "warn" | "info";

export interface Alert {
  id: string;
  severity: Severity;
  /** Business it belongs to, or null for dashboard-wide notices. */
  businessId: string | null;
  title: string;
  detail: string;
}

export const ALERT_THRESHOLDS = {
  /** Fraction behind a pro-rated last month before revenue pace is flagged. */
  paceWarn: 0.15,
  paceCritical: 0.3,
  /** Cancellations must clear this floor before the trend multiplier applies. */
  cancellationFloor: 4,
  /** MTD cancellations over (pro-rated last month × this) is a spike. */
  cancellationMultiple: 1.5,
  pastDueWarnCents: 100_000,
  pastDueCriticalCents: 300_000,
  /** Active-member drop across the history window that counts as decline. */
  memberDeclineFraction: 0.02,
  /** Hours without an ingest before the data itself is the problem. */
  staleAfterHours: 24,
} as const;

const SEVERITY_RANK: Record<Severity, number> = {
  critical: 0,
  warn: 1,
  info: 2,
};

function pct(value: number): string {
  return `${Math.round(Math.abs(value) * 100)}%`;
}

function usd(cents: number): string {
  return `$${Math.round(cents / 100).toLocaleString("en-US")}`;
}

export interface AlertInput {
  snapshot: MetricsSnapshot;
  histories: Record<string, HistoryPoint[]>;
  now?: Date;
}

export function buildAlerts({
  snapshot,
  histories,
  now = new Date(),
}: AlertInput): Alert[] {
  const alerts: Alert[] = [];
  const elapsed = fractionOfMonthElapsed(now);

  for (const metrics of snapshot.businesses) {
    const business = getBusiness(metrics.businessId);
    if (!business) continue;
    const name = business.name;

    // --- revenue pace ------------------------------------------------------
    const paced = metrics.lastMonth.revenueCents * elapsed;
    if (paced > 0) {
      const shortfall = (paced - metrics.mtd.revenueCents) / paced;
      if (shortfall >= ALERT_THRESHOLDS.paceWarn) {
        alerts.push({
          id: `pace:${business.id}`,
          severity:
            shortfall >= ALERT_THRESHOLDS.paceCritical ? "critical" : "warn",
          businessId: business.id,
          title: `${name} is ${pct(shortfall)} behind pace`,
          detail: `${usd(metrics.mtd.revenueCents)} MTD against ${usd(paced)} at this point last month.`,
        });
      }
    }

    // --- cancellation spike ------------------------------------------------
    const pacedCancels = metrics.lastMonth.cancellations * elapsed;
    if (
      metrics.mtd.cancellations >= ALERT_THRESHOLDS.cancellationFloor &&
      (pacedCancels === 0 ||
        metrics.mtd.cancellations >=
          pacedCancels * ALERT_THRESHOLDS.cancellationMultiple)
    ) {
      alerts.push({
        id: `cancellations:${business.id}`,
        severity: "warn",
        businessId: business.id,
        title: `${name}: ${metrics.mtd.cancellations} cancellations MTD`,
        detail:
          pacedCancels > 0
            ? `Running ahead of last month's ${Math.round(pacedCancels)} at the same point.`
            : "No cancellations at this point last month.",
      });
    }

    // --- past due ----------------------------------------------------------
    if (metrics.mtd.pastDueCents >= ALERT_THRESHOLDS.pastDueWarnCents) {
      alerts.push({
        id: `pastdue:${business.id}`,
        severity:
          metrics.mtd.pastDueCents >= ALERT_THRESHOLDS.pastDueCriticalCents
            ? "critical"
            : "warn",
        businessId: business.id,
        title: `${name}: ${usd(metrics.mtd.pastDueCents)} past due`,
        detail: "Worth a collections pass before month end.",
      });
    }

    // --- membership decline ------------------------------------------------
    const history = histories[business.id] ?? [];
    if (business.membership && history.length >= 2) {
      const first = history[0].activeMembers;
      const last = history[history.length - 1].activeMembers;
      if (first > 0) {
        const drop = (first - last) / first;
        if (drop >= ALERT_THRESHOLDS.memberDeclineFraction) {
          alerts.push({
            id: `members:${business.id}`,
            severity: "warn",
            businessId: business.id,
            title: `${name} lost ${pct(drop)} of active members`,
            detail: `${first} → ${last} across the last ${history.length} days on record.`,
          });
        }
      }
    }

    // --- gaps in the data itself -------------------------------------------
    if (metrics.quality === "error") {
      alerts.push({
        id: `missing:${business.id}`,
        severity: "critical",
        businessId: business.id,
        title: `${name} is missing from its source payload`,
        detail: metrics.note ?? "The source responded without a row for it.",
      });
    }
  }

  // --- dashboard-wide ------------------------------------------------------
  const staleRows = snapshot.businesses.filter((row) => row.quality === "stale");
  if (staleRows.length > 0) {
    alerts.push({
      id: "stale",
      severity: "warn",
      businessId: null,
      title: `${staleRows.length} of ${snapshot.businesses.length} businesses are showing stale numbers`,
      detail: "Last ingest is older than the freshness window — check n8n.",
    });
  }

  if (snapshot.lastIngestAt) {
    const hours = (now.getTime() - Date.parse(snapshot.lastIngestAt)) / 3_600_000;
    if (hours >= ALERT_THRESHOLDS.staleAfterHours) {
      alerts.push({
        id: "no-ingest",
        severity: "critical",
        businessId: null,
        title: `No ingest for ${Math.round(hours)} hours`,
        detail: "The scheduled push has stopped. Numbers below are the last known.",
      });
    }
  }

  const mockCount = snapshot.businesses.filter((row) => row.quality === "mock").length;
  if (mockCount > 0) {
    alerts.push({
      id: "mock",
      severity: "info",
      businessId: null,
      title: `${mockCount} of ${BUSINESSES.length} businesses are on mock data`,
      detail: snapshot.sources
        .filter((source) => !source.configured)
        .map((source) => source.note ?? `${source.label} unconfigured`)
        .join(" · "),
    });
  }

  return alerts.sort(
    (a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity],
  );
}
