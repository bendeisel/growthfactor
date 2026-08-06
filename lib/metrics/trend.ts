import type { HistoryPoint } from "@/lib/store/types";

/**
 * Daily revenue, derived from the stored month-to-date readings.
 *
 * Plotting MTD directly looks like a business that collapses on the 1st of every
 * month — that's the counter resetting, not the business. Differencing the
 * readings gives the day's own revenue, which is the trend worth a glance.
 *
 * A reading lower than the one before it means a new month started, so that
 * day's revenue is the new MTD figure itself. The first reading is dropped: with
 * nothing before it, its day's revenue is unknowable.
 */
export function dailyRevenueCents(points: HistoryPoint[]): number[] {
  const daily: number[] = [];
  for (let i = 1; i < points.length; i++) {
    const current = points[i].revenueCents;
    const previous = points[i - 1].revenueCents;
    daily.push(current >= previous ? current - previous : current);
  }
  return daily;
}
