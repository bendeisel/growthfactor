"use client";

import { cn } from "@/lib/utils";
import { money } from "@/lib/metrics/format";

/**
 * Revenue MTD by business, as horizontal bars.
 *
 * Horizontal because the labels are business names, and a name reads better
 * beside its bar than rotated under it. One hue for every bar: identity comes
 * from the label, so colouring by rank would be colour that means nothing.
 * Selection brightens a bar — that's state, not identity.
 */
export interface BarDatum {
  id: string;
  label: string;
  valueCents: number;
  /** Dims the bar and marks the number as not-real. */
  mock?: boolean;
}

export function BarComparison({
  data,
  selectedId,
  onSelect,
}: {
  data: BarDatum[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
}) {
  const max = Math.max(1, ...data.map((datum) => datum.valueCents));

  return (
    <div className="space-y-1.5">
      {data.map((datum) => {
        const selected = datum.id === selectedId;
        const width = Math.max(1.5, (datum.valueCents / max) * 100);
        return (
          <button
            key={datum.id}
            type="button"
            onClick={() => onSelect?.(datum.id)}
            title={`${datum.label}: ${money(datum.valueCents)} MTD${datum.mock ? " (mock)" : ""}`}
            className="group grid w-full grid-cols-[minmax(0,1fr)_4.5rem] items-center gap-2 text-left"
          >
            <span className="min-w-0">
              <span
                className={cn(
                  "block truncate text-[11px]",
                  selected ? "text-ink" : "text-ink-muted group-hover:text-ink",
                )}
              >
                {datum.label}
              </span>
              {/* 2px inset keeps adjacent bars from merging into one block. */}
              <span className="mt-1 block h-1.5 rounded-full bg-line/70">
                <span
                  className={cn(
                    "block h-full rounded-full transition-all",
                    selected ? "bg-accent" : "bg-accent/45 group-hover:bg-accent/70",
                    datum.mock && !selected && "bg-accent/25",
                  )}
                  style={{ width: `${width}%` }}
                />
              </span>
            </span>
            <span
              className={cn(
                "self-end pb-0.5 text-right text-[11px] tabular",
                selected ? "text-ink" : "text-ink-dim",
              )}
            >
              {money(datum.valueCents, true)}
            </span>
          </button>
        );
      })}
    </div>
  );
}
