"use client";

import { BarChart3, MousePointerClick, Target, TrendingUp } from "lucide-react";
import { useState } from "react";
import { AreaPlot, BarPlot, RankGrid, StatMeter, rankTone } from "@/components/charts/plot";
import {
  NotConnected,
  PageHead,
  Panel,
  Picker,
  Segmented,
  StatCard,
} from "@/components/sections/parts";
import { CLIENTS } from "@/lib/businesses";
import { CLIENT_REPORTS, type ReportId } from "@/lib/reports";
import { money } from "@/lib/metrics/format";

const REPORTS: { id: ReportId; label: string }[] = [
  { id: "ads", label: "Ads" },
  { id: "seo", label: "SEO" },
  { id: "web", label: "Website" },
];

const NEEDS: Record<ReportId, string[]> = {
  ads: ["AdKit", "Google Ads + Meta"],
  seo: ["a DataForSEO key"],
  web: ["GA4", "Search Console"],
};

/**
 * A client, then which report. Each report is one source, so adding a fourth
 * is a new entry here plus an adapter — not a new screen.
 */
export function ClientsSection() {
  const [id, setId] = useState(CLIENTS[0]?.id ?? "");
  const [report, setReport] = useState<ReportId>("ads");
  const client = CLIENTS.find((c) => c.id === id) ?? CLIENTS[0];
  const data = CLIENT_REPORTS[client?.id ?? ""];

  if (!client || !data) {
    return <PageHead title="Client OS" sub="No done-for-you client configured yet." />;
  }

  return (
    <>
      <PageHead title="Client OS" sub={`${client.name} — done-for-you reporting`}>
        <Segmented label="Report" options={REPORTS} value={report} onChange={setReport} />
        <Picker
          label="Client"
          value={client.id}
          onChange={setId}
          options={CLIENTS.map((c) => ({ id: c.id, name: c.name }))}
        />
      </PageHead>

      <div className="mb-4">
        <NotConnected what={REPORTS.find((r) => r.id === report)!.label} needs={NEEDS[report]} />
      </div>

      {report === "ads" ? <Ads data={data.ads} /> : null}
      {report === "seo" ? <Seo data={data.seo} /> : null}
      {report === "web" ? <Web data={data.web} /> : null}
    </>
  );
}

function Ads({ data }: { data: (typeof CLIENT_REPORTS)[string]["ads"] }) {
  return (
    <>
      <div className="mb-4 grid grid-cols-2 gap-3 md:gap-4 xl:grid-cols-4">
        <StatCard Icon={BarChart3} accent="brand" label="Spend" value={money(data.spendCents, true)} detail="month to date" />
        <StatCard Icon={Target} accent="teal" label="Leads" value={String(data.leads)} detail="from ads" />
        <StatCard Icon={MousePointerClick} accent="violet" label="Cost / lead" value={money(data.costPerLeadCents)} detail="blended" />
        <StatCard Icon={TrendingUp} accent="up" label="ROAS" value={`${data.roas}×`} detail="reported" tone="up" />
      </div>
      <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <Panel title="Daily spend" note="last 14 days">
          <BarPlot series={data.dailySpendCents} format={(v) => money(v)} />
        </Panel>
        <Panel title="Delivery">
          <dl className="flex flex-col gap-3">
            {data.delivery.map(([label, value]) => (
              <div key={label} className="flex items-baseline justify-between gap-3 border-b border-line pb-2 last:border-0">
                <dt className="text-sm text-ink-muted">{label}</dt>
                <dd className="tabular text-sm font-bold">{value}</dd>
              </div>
            ))}
          </dl>
        </Panel>
      </div>
    </>
  );
}

function Seo({ data }: { data: (typeof CLIENT_REPORTS)[string]["seo"] }) {
  const top3 = data.grid.filter((r) => r <= 3).length;
  const mid = data.grid.filter((r) => r > 3 && r <= 10).length;
  const tail = data.grid.length - top3 - mid;
  const average = data.grid.reduce((sum, r) => sum + r, 0) / data.grid.length;

  return (
    <>
      <div className="mb-4 grid grid-cols-2 gap-3 md:gap-4 xl:grid-cols-4">
        <StatCard Icon={Target} accent="brand" label="Avg map rank" value={average.toFixed(1)} detail={data.city} tone={rankTone(average) === "up" ? "up" : rankTone(average) === "warn" ? "warn" : "down"} />
        <StatCard Icon={TrendingUp} accent="up" label="In top 3" value={`${top3} / ${data.grid.length}`} detail="grid points" />
        <StatCard Icon={BarChart3} accent="violet" label="Keywords" value={String(data.keywords)} detail="fixed list" />
        <StatCard Icon={MousePointerClick} accent="teal" label="Grid" value="7 × 7" detail="per keyword" />
      </div>
      <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <Panel title={`Rank grid — ${data.city}`} note={`${data.keywords} keywords`}>
          <RankGrid ranks={data.grid} />
        </Panel>
        <Panel title="Distribution">
          <div className="flex flex-col gap-4">
            <StatMeter label="Top 3" value={`${top3} pts`} percent={(top3 / data.grid.length) * 100} tone="up" />
            <StatMeter label="4–10" value={`${mid} pts`} percent={(mid / data.grid.length) * 100} tone="warn" />
            <StatMeter label="11+" value={`${tail} pts`} percent={(tail / data.grid.length) * 100} tone="down" />
          </div>
        </Panel>
      </div>
    </>
  );
}

function Web({ data }: { data: (typeof CLIENT_REPORTS)[string]["web"] }) {
  return (
    <>
      <div className="mb-4 grid grid-cols-2 gap-3 md:gap-4 xl:grid-cols-4">
        <StatCard Icon={TrendingUp} accent="brand" label="Sessions" value={data.sessions.toLocaleString("en-US")} detail="month to date" />
        <StatCard Icon={Target} accent="teal" label="Conversions" value={String(data.conversions)} detail="forms + calls" />
        <StatCard Icon={MousePointerClick} accent="violet" label="Conv. rate" value={`${data.conversionRate}%`} detail="of sessions" />
        <StatCard Icon={BarChart3} accent="warn" label="Avg position" value={String(data.avgPosition)} detail="Search Console" />
      </div>
      <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <Panel title="Sessions" note="last 14 days">
          <AreaPlot series={data.dailySessions} format={(v) => v.toLocaleString("en-US")} />
        </Panel>
        <Panel title="Search Console">
          <dl className="flex flex-col gap-3">
            {data.search.map(([label, value]) => (
              <div key={label} className="flex items-baseline justify-between gap-3 border-b border-line pb-2 last:border-0">
                <dt className="text-sm text-ink-muted">{label}</dt>
                <dd className="tabular text-sm font-bold">{value}</dd>
              </div>
            ))}
          </dl>
        </Panel>
      </div>
    </>
  );
}
