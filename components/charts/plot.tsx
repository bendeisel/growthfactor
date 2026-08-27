"use client";

import { cn } from "@/lib/utils";

/** Where a value sits against a threshold. Drives colour, and only colour. */
export type Tone = "up" | "warn" | "down";

const TONE_VAR: Record<Tone, string> = {
  up: "var(--cc-up)",
  warn: "var(--cc-warn)",
  down: "var(--cc-down)",
};

function points(series: number[]) {
  const max = Math.max(...series);
  const min = Math.min(...series);
  const span = max - min || 1;
  return series.map((v, i) => ({
    x: (i / Math.max(1, series.length - 1)) * 100,
    y: 100 - ((v - min) / span) * 88 - 6,
    v,
  }));
}

const GRID = [25, 50, 75];

interface SeriesProps {
  series: number[];
  /** Rendered into the hover title, e.g. money(v) or v.toLocaleString(). */
  format: (v: number) => string;
  labels?: string[];
  height?: number;
  className?: string;
}

/**
 * Trend area. The SVG stretches to fill its box, so the emphasised endpoint is
 * an HTML dot positioned over it — a <circle> inside a non-uniformly scaled
 * viewBox renders as an ellipse.
 */
export function AreaPlot({ series, format, labels, height = 160, className }: SeriesProps) {
  const p = points(series);
  const line = p.map((q, i) => `${i ? "L" : "M"}${q.x.toFixed(2)},${q.y.toFixed(2)}`).join("");
  const last = p[p.length - 1];
  const cell = 100 / series.length;
  const id = `area-${series.length}-${Math.round(series[0] ?? 0)}`;

  return (
    <div className={cn("relative", className)}>
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        style={{ height }}
        className="w-full overflow-visible"
        role="img"
        aria-label={`Trend, ${format(series[0])} to ${format(last.v)}`}
      >
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--cc-brand)" stopOpacity="0.26" />
            <stop offset="100%" stopColor="var(--cc-brand)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {GRID.map((y) => (
          <line key={y} x1="0" y1={y} x2="100" y2={y} stroke="var(--cc-line)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
        ))}
        <path d={`${line}L100,100L0,100Z`} fill={`url(#${id})`} />
        <path
          d={line}
          fill="none"
          stroke="var(--cc-brand)"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
        {p.map((q, i) => (
          <rect key={i} x={q.x - cell / 2} y="0" width={cell} height="100" fill="transparent">
            <title>{`${labels?.[i] ?? `Day ${i + 1}`}: ${format(q.v)}`}</title>
          </rect>
        ))}
      </svg>
      <span
        aria-hidden
        className="pointer-events-none absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand ring-3 ring-surface"
        style={{ left: `${last.x}%`, top: `${last.y}%` }}
      />
    </div>
  );
}

/** Daily bars. One series only — two measures on one axis is a lie. */
export function BarPlot({ series, format, labels, height = 160, className }: SeriesProps) {
  const max = Math.max(...series);
  const gap = 1.5;
  const width = (100 - (series.length - 1) * gap) / series.length;

  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      style={{ height }}
      className={cn("w-full overflow-visible", className)}
      role="img"
      aria-label={`Daily bars, latest ${format(series[series.length - 1])}`}
    >
      {GRID.map((y) => (
        <line key={y} x1="0" y1={y} x2="100" y2={y} stroke="var(--cc-line)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
      ))}
      {series.map((v, i) => {
        const h = Math.max(2, (v / max) * 92);
        return (
          <rect
            key={i}
            x={i * (width + gap)}
            y={100 - h}
            width={width}
            height={h}
            rx="1.2"
            fill="var(--cc-brand)"
            opacity={0.85}
          >
            <title>{`${labels?.[i] ?? `Day ${i + 1}`}: ${format(v)}`}</title>
          </rect>
        );
      })}
    </svg>
  );
}

export interface PaceBar {
  label: string;
  /** Percent of last month's pace. 100 means exactly on pace. */
  percent: number;
  tone: Tone;
  /** The figure printed above the bar — always visible, so colour never carries it alone. */
  caption: string;
}

/**
 * Pace against last month. Height is the magnitude; colour is the judgement.
 * The dashed line marks 100%, drawn over the fill so you can see a bar cross it.
 */
export function PaceBars({ bars }: { bars: PaceBar[] }) {
  const ceiling = Math.max(150, ...bars.map((b) => b.percent));
  const baseline = (100 / ceiling) * 100;

  return (
    <div>
      <div className="grid grid-cols-4 items-end gap-3">
        {bars.map((bar) => (
          <div key={bar.label} className="flex flex-col items-center gap-2">
            <span className="tabular text-sm font-bold" style={{ color: TONE_VAR[bar.tone] }}>
              {bar.caption}
            </span>
            <div
              className="relative flex h-32 w-full items-end overflow-hidden rounded-lg bg-surface-2"
              title={`${bar.label}: ${bar.caption} of last month's pace`}
            >
              <div
                className="w-full rounded-t-lg transition-[height] duration-500"
                style={{
                  height: `${Math.max(4, Math.min(100, (bar.percent / ceiling) * 100))}%`,
                  background: TONE_VAR[bar.tone],
                }}
              />
              <div
                aria-hidden
                className="absolute inset-x-0 border-t-2 border-dashed border-ink-dim"
                style={{ bottom: `${baseline}%` }}
              />
            </div>
            <span className="text-center text-xs text-ink-muted">{bar.label}</span>
          </div>
        ))}
      </div>
      <Legend
        items={[
          ["up", "Ahead of pace"],
          ["warn", "Slightly behind"],
          ["down", "Behind, or moving the wrong way"],
        ]}
        note="dashed line = last month's pace"
      />
    </div>
  );
}

/**
 * Local rank grid: one search per point, anchored at that point's coordinates.
 * Three bands, not four — at four, orange and red are too close for a
 * colourblind reader to separate. Every cell prints its rank, so colour is
 * never the only encoding.
 */
export function RankGrid({ ranks, size = 7 }: { ranks: number[]; size?: number }) {
  const centre = Math.floor(ranks.length / 2);
  return (
    <div>
      <div
        className="grid max-w-md gap-1.5"
        style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}
      >
        {ranks.map((rank, i) => (
          <div
            key={i}
            title={`Grid point ${i + 1} — rank ${rank}`}
            className={cn(
              "tabular grid aspect-square place-content-center rounded-lg text-xs font-bold text-on-tone transition-transform hover:scale-110",
              i === centre && "ring-2 ring-ink ring-offset-2 ring-offset-surface",
            )}
            style={{ background: TONE_VAR[rankTone(rank)] }}
          >
            {rank}
          </div>
        ))}
      </div>
      <Legend
        items={[
          ["up", "1–3"],
          ["warn", "4–10"],
          ["down", "11+"],
        ]}
        note="ringed cell = searched from the business address"
      />
    </div>
  );
}

export function rankTone(rank: number): Tone {
  if (rank <= 3) return "up";
  if (rank <= 10) return "warn";
  return "down";
}

/** Horizontal meter. Colour is semantic, so the number is always shown too. */
export function StatMeter({
  label,
  value,
  percent,
  tone,
}: {
  label: string;
  value: string;
  percent: number;
  tone: Tone;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <span className="text-sm font-medium text-ink-muted">{label}</span>
        <span className="tabular text-sm font-bold" style={{ color: TONE_VAR[tone] }}>
          {value}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-surface-2">
        <div
          className="h-full rounded-full transition-[width] duration-500"
          style={{ width: `${Math.max(2, Math.min(100, percent))}%`, background: TONE_VAR[tone] }}
        />
      </div>
    </div>
  );
}

function Legend({ items, note }: { items: [Tone, string][]; note?: string }) {
  return (
    <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line pt-3">
      {items.map(([tone, label]) => (
        <span key={label} className="flex items-center gap-1.5 text-xs text-ink-muted">
          <i className="size-2.5 rounded-sm" style={{ background: TONE_VAR[tone] }} />
          {label}
        </span>
      ))}
      {note ? <span className="text-xs text-ink-dim">{note}</span> : null}
    </div>
  );
}
