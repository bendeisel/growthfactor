import { cn } from "@/lib/utils";

/**
 * Revenue trend for one business.
 *
 * Deliberately a bare 2px line: one series, so no legend, no axes, no grid, no
 * per-point markers. It stays a single recessive hue rather than turning green
 * or red — the labelled "% pace" figure beside it already carries the polarity,
 * and status colours are reserved for status. The exact number is in the same
 * row, so this only has to answer "which way, how steadily".
 */
export function Sparkline({
  points,
  label,
  width = 56,
  height = 16,
  className,
}: {
  /** Oldest first. */
  points: number[];
  /** Accessible description, e.g. "Nashville MMA revenue, last 14 days". */
  label: string;
  width?: number;
  height?: number;
  className?: string;
}) {
  if (points.length < 2) {
    return <div className={cn("h-4", className)} aria-hidden="true" />;
  }

  const min = Math.min(...points);
  const max = Math.max(...points);
  // A flat series would divide by zero; draw it down the middle instead.
  const span = max - min || 1;
  const inset = 1.5; // keep the 2px stroke inside the box
  const usable = height - inset * 2;

  const path = points
    .map((value, index) => {
      const x = (index / (points.length - 1)) * width;
      const y = inset + (1 - (value - min) / span) * usable;
      return `${index === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");

  const first = points[0];
  const last = points[points.length - 1];

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      className={cn("overflow-visible", className)}
      role="img"
      aria-label={label}
      preserveAspectRatio="none"
    >
      <title>{`${label}: ${Math.round(first / 100).toLocaleString()} → ${Math.round(last / 100).toLocaleString()} over ${points.length} days`}</title>
      <path
        d={path}
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
