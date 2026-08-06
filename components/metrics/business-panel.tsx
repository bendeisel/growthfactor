"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronDown, RefreshCw } from "lucide-react";

import { BarComparison } from "@/components/charts/bar-comparison";
import { TrendChart } from "@/components/charts/trend-chart";
import { AttentionFeed } from "@/components/metrics/attention-feed";
import { KpiGrid } from "@/components/metrics/kpi-grid";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { BUSINESSES } from "@/lib/businesses";
import type { DashboardState } from "@/lib/dashboard";
import { relativeTime } from "@/lib/metrics/format";
import { rollUp } from "@/lib/metrics/rollup";
import { dailyRevenueCents } from "@/lib/metrics/trend";

const REFRESH_MS = 60_000;
const ALL = "all";

/**
 * "My businesses" — the always-on wall.
 *
 * Ben's ask: the four numbers for every business in one place, deeper reporting
 * on demand from the Command Center rather than by clicking around. So this is a
 * selector, the four tiles, and one chart: all businesses compared when nothing
 * is selected, that business's own trend when one is.
 */
export function BusinessPanel({ initial }: { initial: DashboardState }) {
  const [state, setState] = useState(initial);
  const [selectedId, setSelectedId] = useState<string>(ALL);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, setTick] = useState(0);

  const refresh = useCallback(async (force = false) => {
    setLoading(true);
    try {
      const response = await fetch(force ? "/api/metrics?force=1" : "/api/metrics", {
        cache: "no-store",
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      setState((await response.json()) as DashboardState);
      setError(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "refresh failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Background polling reads whatever ingestion stored — it never forces a
    // vendor call, so a tab open all day doesn't hammer the APIs.
    const poll = setInterval(() => void refresh(), REFRESH_MS);
    const tick = setInterval(() => setTick((value) => value + 1), 15_000);
    return () => {
      clearInterval(poll);
      clearInterval(tick);
    };
  }, [refresh]);

  const { snapshot, alerts, histories } = state;
  const selected = selectedId === ALL ? null : BUSINESSES.find((b) => b.id === selectedId);

  const rows = useMemo(
    () =>
      selected
        ? snapshot.businesses.filter((row) => row.businessId === selected.id)
        : snapshot.businesses,
    [snapshot.businesses, selected],
  );
  const totals = useMemo(() => rollUp(rows), [rows]);

  const membership = selected ? selected.membership : true;
  const anyMock = rows.some((row) => row.quality !== "live");
  const quality = rows[0]?.quality;

  const trend = selected
    ? dailyRevenueCents(histories[selected.id] ?? []).map((valueCents, index) => ({
        date: (histories[selected.id] ?? [])[index + 1]?.date ?? "",
        valueCents,
      }))
    : [];

  return (
    <Card className="flex h-full min-h-0 flex-col">
      <CardHeader>
        <div className="flex min-w-0 items-center gap-2">
          <CardTitle>My businesses</CardTitle>
          <span className="shrink-0 text-[11px] text-ink-dim">{snapshot.period}</span>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone={anyMock ? "mock" : "live"}>
            <span className="size-1.5 rounded-full bg-current breathe" />
            {anyMock ? "mock" : "live"}
          </Badge>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => void refresh(true)}
            disabled={loading}
            title={`Updated ${relativeTime(snapshot.fetchedAt)}${
              snapshot.lastIngestAt
                ? ` · last ingest ${relativeTime(snapshot.lastIngestAt)}`
                : " · no ingest yet"
            }`}
            aria-label="Refresh metrics from source"
          >
            <RefreshCw className={loading ? "size-3.5 animate-spin" : "size-3.5"} />
          </Button>
        </div>
      </CardHeader>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3">
        {/* Selector — the dropdown from Ben's sketch. */}
        <label className="relative block">
          <select
            value={selectedId}
            onChange={(event) => setSelectedId(event.target.value)}
            className="w-full appearance-none rounded-lg border border-line bg-bg-elevated py-2 pr-8 pl-3 text-sm text-ink focus-visible:border-accent/60 focus-visible:outline-none"
            aria-label="Choose a business"
          >
            <option value={ALL}>All businesses ({BUSINESSES.length})</option>
            {BUSINESSES.map((business) => (
              <option key={business.id} value={business.id}>
                {business.name}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-ink-dim" />
        </label>

        {quality && quality !== "live" ? (
          <p className="text-[11px] text-warn">
            {quality === "mock"
              ? "Mock numbers — connect the source to see real ones."
              : "Stale numbers — last ingest is older than the freshness window."}
          </p>
        ) : null}

        <KpiGrid totals={totals} membership={membership} />

        {selected ? (
          <div className="tile p-3">
            <TrendChart points={trend} title="Daily revenue" />
          </div>
        ) : (
          <div className="tile p-3">
            <p className="pb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-dim">
              Revenue MTD by business
            </p>
            <BarComparison
              data={snapshot.businesses.map((row) => ({
                id: row.businessId,
                label:
                  BUSINESSES.find((business) => business.id === row.businessId)?.name ??
                  row.businessId,
                valueCents: row.mtd.revenueCents,
                mock: row.quality !== "live",
              }))}
              selectedId={selectedId === ALL ? null : selectedId}
              onSelect={setSelectedId}
            />
          </div>
        )}

        {error ? <p className="text-[11px] text-down">Refresh failed: {error}</p> : null}
      </div>

      <AttentionFeed alerts={alerts} />
    </Card>
  );
}
