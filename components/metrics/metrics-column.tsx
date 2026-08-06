"use client";

import { useCallback, useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";

import { AttentionFeed } from "@/components/metrics/attention-feed";
import { MetricRow, ROW_GRID } from "@/components/metrics/metric-row";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { BUSINESSES } from "@/lib/businesses";
import type { DashboardState } from "@/lib/dashboard";
import { count, money, relativeTime } from "@/lib/metrics/format";
import { cn } from "@/lib/utils";

const REFRESH_MS = 60_000;

export function MetricsColumn({ initial }: { initial: DashboardState }) {
  const [state, setState] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Rendered relative times need a tick to stay honest between fetches.
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
    // Background polling reads whatever ingestion has stored — it never forces a
    // vendor call, so an open tab all day doesn't hammer the APIs.
    const poll = setInterval(() => void refresh(), REFRESH_MS);
    const tick = setInterval(() => setTick((value) => value + 1), 15_000);
    return () => {
      clearInterval(poll);
      clearInterval(tick);
    };
  }, [refresh]);

  const { snapshot, alerts, histories } = state;
  const anyMock = snapshot.businesses.some((row) => row.quality !== "live");
  const totals = snapshot.businesses.reduce(
    (acc, row) => ({
      sales: acc.sales + row.mtd.sales,
      revenueCents: acc.revenueCents + row.mtd.revenueCents,
      cancellations: acc.cancellations + row.mtd.cancellations,
    }),
    { sales: 0, revenueCents: 0, cancellations: 0 },
  );

  return (
    <Card className="flex min-h-0 flex-col">
      <CardHeader>
        <div className="flex min-w-0 items-center gap-2">
          <CardTitle>Metrics</CardTitle>
          <span className="truncate text-[11px] text-ink-dim">
            {snapshot.period} · MTD
          </span>
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

      <AttentionFeed alerts={alerts} />

      <div
        className={cn(
          ROW_GRID,
          "border-b border-line px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-dim",
        )}
      >
        <span>Business</span>
        <span className="hidden text-right sm:block">14d</span>
        <span className="text-right">Sales</span>
        <span className="text-right">Revenue</span>
        <span className="text-right">Canc</span>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {BUSINESSES.map((business) => {
          const metrics = snapshot.businesses.find(
            (row) => row.businessId === business.id,
          );
          return metrics ? (
            <MetricRow
              key={business.id}
              business={business}
              metrics={metrics}
              history={histories[business.id] ?? []}
            />
          ) : null;
        })}
      </div>

      <div
        className={cn(
          ROW_GRID,
          "border-t border-line bg-bg-elevated/60 px-4 py-2.5 text-sm tabular",
        )}
      >
        <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-muted">
          All
        </span>
        <span className="hidden sm:block" />
        <span className="text-right text-ink">{count(totals.sales)}</span>
        <span className="text-right font-medium text-ink">
          {money(totals.revenueCents, true)}
        </span>
        <span className="text-right text-ink">{count(totals.cancellations)}</span>
      </div>

      <CardBody className="space-y-1 border-t border-line py-2.5 text-[11px] text-ink-dim">
        {snapshot.sources.map((source) => (
          <div key={source.id} className="flex items-start justify-between gap-3">
            <span className="text-ink-muted">{source.label}</span>
            <span className="text-right">
              {source.configured ? "connected" : (source.note ?? "not configured")}
            </span>
          </div>
        ))}
        {error ? <p className="text-down">Refresh failed: {error}</p> : null}
      </CardBody>
    </Card>
  );
}
