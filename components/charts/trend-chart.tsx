"use client";

import { useState } from "react";

import { money } from "@/lib/metrics/format";

/**
 * Daily revenue over the trend window: one series, so no legend — the title
 * names it. 2px line over a soft fill, recessive axis labels, and a crosshair
 * that reads out the day you're pointing at, because a chart you can't query is
 * just a shape.
 */
export interface TrendPoint {
  date: string;
  valueCents: number;
}

const WIDTH = 320;
const HEIGHT = 96;
const PAD_Y = 8;

export function TrendChart({
  points,
  title,
  emptyHint = "Two days of readings needed before a trend appears.",
}: {
  points: TrendPoint[];
  title: string;
  emptyHint?: string;
}) {
  const [hover, setHover] = useState<number | null>(null);

  if (points.length < 2) {
    return (
      <div className="flex h-24 items-center justify-center rounded-lg border border-dashed border-line px-3 text-center text-[11px] text-ink-dim">
        {emptyHint}
      </div>
    );
  }

  const max = Math.max(...points.map((point) => point.valueCents));
  const min = Math.min(...points.map((point) => point.valueCents), 0);
  const span = max - min || 1;
  const usable = HEIGHT - PAD_Y * 2;

  const x = (index: number) => (index / (points.length - 1)) * WIDTH;
  const y = (value: number) => PAD_Y + (1 - (value - min) / span) * usable;

  const line = points
    .map((point, index) => `${index === 0 ? "M" : "L"}${x(index).toFixed(1)} ${y(point.valueCents).toFixed(1)}`)
    .join(" ");
  const area = `${line} L${WIDTH} ${HEIGHT} L0 ${HEIGHT} Z`;

  const active = hover === null ? null : points[hover];

  return (
    <figure className="relative">
      <figcaption className="flex items-baseline justify-between gap-2 pb-1">
        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-dim">
          {title}
        </span>
        <span className="text-[10px] tabular text-ink-dim">
          {active
            ? `${active.date} · ${money(active.valueCents)}`
            : `peak ${money(max, true)}`}
        </span>
      </figcaption>

      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="h-24 w-full"
        preserveAspectRatio="none"
        role="img"
        aria-label={`${title}. ${points.length} days, peak ${money(max)}.`}
        onMouseLeave={() => setHover(null)}
        onMouseMove={(event) => {
          const rect = event.currentTarget.getBoundingClientRect();
          const ratio = (event.clientX - rect.left) / rect.width;
          setHover(
            Math.min(
              points.length - 1,
              Math.max(0, Math.round(ratio * (points.length - 1))),
            ),
          );
        }}
      >
        <defs>
          <linearGradient id="trend-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.28" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        </defs>

        <path d={area} fill="url(#trend-fill)" className="text-accent" />
        <path
          d={line}
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
          className="text-accent"
        />

        {hover !== null ? (
          <g className="text-accent">
            <line
              x1={x(hover)}
              x2={x(hover)}
              y1={0}
              y2={HEIGHT}
              stroke="currentColor"
              strokeWidth={1}
              strokeOpacity={0.4}
              vectorEffect="non-scaling-stroke"
            />
            <circle
              cx={x(hover)}
              cy={y(points[hover].valueCents)}
              r={3}
              fill="currentColor"
            />
          </g>
        ) : null}
      </svg>

      <div className="flex justify-between pt-0.5 text-[10px] tabular text-ink-dim">
        <span>{points[0].date.slice(5)}</span>
        <span>{points.at(-1)?.date.slice(5)}</span>
      </div>
    </figure>
  );
}
