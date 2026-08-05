"use client";

import { useCallback, useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricRow } from "@/components/metrics/metric-row";
import { BUSINESSES } from "@/lib/businesses";
import { count, money, relativeTime } from "@/lib/metrics/format";
import type { MetricsSnapshot } from "@/lib/metrics/types";

const REFRESH_MS = 60_000;

export function MetricsColumn({ initial }: { initial: MetricsSnapshot }) {
  const [snapshot, setSnapshot] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Rendered relative times need a tick to stay honest between fetches.
  const [, setNow] = useState(0);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/metrics", { cache: "no-store" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      setSnapshot((await response.json()) as MetricsSnapshot);
      setError(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "refresh failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const poll = setInterval(refresh, REFRESH_MS);
    const tick = setInterval(() => setNow((n) => n + 1), 15_000);
    return () => {
      clearInterval(poll);
      clearInterval(tick);
    };
  }, [refresh]);

  const anyMock = snapshot.businesses.some((b) => b.quality !== "live");
  const totals = snapshot.businesses.reduce(
    (acc, b) => ({
      sales: acc.sales + b.mtd.sales,
      revenueCents: acc.revenueCents + b.mtd.revenueCents,
      cancellations: acc.cancellations + b.mtd.cancellations,
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
            onClick={refresh}
            disabled={loading}
            title={`Updated ${relativeTime(snapshot.fetchedAt)}`}
            aria-label="Refresh metrics"
          >
            <RefreshCw className={loading ? "size-3.5 animate-spin" : "size-3.5"} />
          </Button>
        </div>
      </CardHeader>

      <div className="grid grid-cols-[minmax(0,1fr)_3.5rem_5.5rem_3.5rem] gap-2 border-b border-line px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-dim">
        <span>Business</span>
        <span className="text-right">Sales</span>
        <span className="text-right">Revenue</span>
        <span className="text-right">Cancels</span>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {BUSINESSES.map((business) => {
          const metrics = snapshot.businesses.find(
            (m) => m.businessId === business.id,
          );
          return metrics ? (
            <MetricRow key={business.id} business={business} metrics={metrics} />
          ) : null;
        })}
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)_3.5rem_5.5rem_3.5rem] gap-2 border-t border-line bg-bg-elevated/60 px-4 py-2.5 text-sm tabular">
        <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-muted">
          All
        </span>
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
