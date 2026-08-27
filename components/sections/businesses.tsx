"use client";

import { ArrowDownRight, ArrowUpRight, DollarSign, Users } from "lucide-react";
import { useState } from "react";
import { AreaPlot, PaceBars, StatMeter, type PaceBar, type Tone } from "@/components/charts/plot";
import { PageHead, Panel, Picker, QualityBadge, StatCard } from "@/components/sections/parts";
import { OWNED } from "@/lib/businesses";
import type { DashboardState } from "@/lib/dashboard";
import { count, fractionOfMonthElapsed, money } from "@/lib/metrics/format";
import { dailyRevenueCents } from "@/lib/metrics/trend";
import type { BusinessMetrics } from "@/lib/metrics/types";

/**
 * The four numbers Ben asked for, then how they're tracking. Flows compare
 * against a pro-rated slice of last month — half a month of revenue judged
 * against a whole one always looks like a collapse.
 */
export function BusinessesSection({ state }: { state: DashboardState }) {
  const [id, setId] = useState(OWNED[0]?.id ?? "");
  const business = OWNED.find((b) => b.id === id) ?? OWNED[0];
  const row = state.snapshot.businesses.find((b) => b.businessId === business?.id);
  const history = state.histories[business?.id ?? ""] ?? [];
  const daily = dailyRevenueCents(history);

  if (!business || !row) {
    return <PageHead title="My Businesses" sub="No business configured yet." />;
  }

  const elapsed = fractionOfMonthElapsed();
  const bars = paceBars(row, elapsed);

  return (
    <>
      <PageHead title="My Businesses" sub="Month to date, against last month's pace">
        <QualityBadge quality={row.quality} note={row.note} />
        <Picker
          label="Business"
          value={business.id}
          onChange={setId}
          options={OWNED.map((b) => ({ id: b.id, name: b.name }))}
        />
      </PageHead>

      <div className="mb-4 grid grid-cols-2 gap-3 md:gap-4 xl:grid-cols-4">
        <StatCard
          Icon={DollarSign}
          accent="brand"
          label="Revenue"
          value={money(row.mtd.revenueCents, true)}
          detail={`${money(row.lastMonth.revenueCents, true)} last month`}
          tone={bars[0].tone === "up" ? "up" : bars[0].tone === "warn" ? "warn" : "down"}
        />
        <StatCard
          Icon={Users}
          accent="teal"
          label={business.membership ? "Total members" : "Active clients"}
          value={count(row.activeMembers)}
          detail={netDetail(row)}
          tone={row.activeMembers >= row.activeMembersLastMonth ? "up" : "down"}
        />
        <StatCard
          Icon={ArrowUpRight}
          accent="violet"
          label="New"
          value={count(row.mtd.newMembers)}
          detail={`${count(row.lastMonth.newMembers)} last month`}
          tone={bars[1].tone === "up" ? "up" : bars[1].tone === "warn" ? "warn" : "down"}
        />
        <StatCard
          Icon={ArrowDownRight}
          accent="down"
          label="Lost"
          value={count(row.mtd.cancellations)}
          detail={`${count(row.lastMonth.cancellations)} last month`}
          tone={bars[2].tone === "down" ? "down" : "up"}
        />
      </div>

      <div className="mb-4 grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <Panel title="Pace vs last month" note="colour = whether it's a problem">
          <PaceBars bars={bars} />
        </Panel>
        <Panel title="Quick stats">
          <div className="flex flex-col gap-4">
            <StatMeter {...pastDueMeter(row)} />
            <StatMeter
              label="Net member change"
              value={netDetail(row)}
              percent={Math.min(100, Math.abs(row.activeMembers - row.activeMembersLastMonth) * 6)}
              tone={row.activeMembers >= row.activeMembersLastMonth ? "up" : "down"}
            />
            <StatMeter
              label="Month elapsed"
              value={`${Math.round(elapsed * 100)}%`}
              percent={elapsed * 100}
              tone="warn"
            />
          </div>
        </Panel>
      </div>

      <Panel title="Daily revenue" note={`last ${daily.length} days`}>
        {daily.length > 1 ? (
          <AreaPlot series={daily} format={(v) => money(v)} />
        ) : (
          <p className="py-8 text-center text-sm text-ink-dim">
            Not enough stored history yet — the trend needs two days of readings.
          </p>
        )}
      </Panel>
    </>
  );
}

function netDetail(row: BusinessMetrics): string {
  const net = row.activeMembers - row.activeMembersLastMonth;
  return `${net >= 0 ? "+" : ""}${count(net)} net`;
}

/**
 * A flow is behind if it trails the same fraction of last month that the month
 * itself has burned through. Lost members invert: more is worse.
 */
function paceBars(row: BusinessMetrics, elapsed: number): PaceBar[] {
  const ratio = (current: number, baseline: number) =>
    baseline <= 0 ? (current > 0 ? 200 : 100) : (current / (baseline * elapsed)) * 100;

  const revenue = ratio(row.mtd.revenueCents, row.lastMonth.revenueCents);
  const added = ratio(row.mtd.newMembers, row.lastMonth.newMembers);
  const lost = ratio(row.mtd.cancellations, row.lastMonth.cancellations);
  const members =
    row.activeMembersLastMonth <= 0
      ? 100
      : (row.activeMembers / row.activeMembersLastMonth) * 100;

  return [
    { label: "Revenue", percent: revenue, tone: higherIsBetter(revenue), caption: pct(revenue) },
    { label: "New", percent: added, tone: higherIsBetter(added), caption: pct(added) },
    { label: "Lost", percent: lost, tone: lowerIsBetter(lost), caption: pct(lost) },
    { label: "Members", percent: members, tone: higherIsBetter(members), caption: pct(members) },
  ];
}

const higherIsBetter = (value: number): Tone =>
  value >= 100 ? "up" : value >= 90 ? "warn" : "down";
const lowerIsBetter = (value: number): Tone =>
  value <= 100 ? "up" : value <= 115 ? "warn" : "down";
const pct = (value: number) => `${value >= 100 ? "+" : ""}${Math.round(value - 100)}%`;

function pastDueMeter(row: BusinessMetrics) {
  const cents = row.mtd.pastDueCents;
  const tone: Tone = cents >= 300_000 ? "down" : cents >= 100_000 ? "warn" : "up";
  return {
    label: "Past due",
    value: money(cents),
    percent: Math.min(100, (cents / 400_000) * 100),
    tone,
  };
}
