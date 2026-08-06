"use client";

import { useState } from "react";
import { AlertTriangle, ChevronDown, Circle, Info } from "lucide-react";

import { cn } from "@/lib/utils";
import type { Alert, Severity } from "@/lib/alerts";

/**
 * What needs Ben today, above the numbers.
 *
 * Collapsed to the top three by default: the point is a glance, not a queue. An
 * empty feed is a real answer ("nothing needs you"), so it says that rather than
 * disappearing — a missing section reads as broken.
 */

const ICONS: Record<Severity, typeof Info> = {
  critical: AlertTriangle,
  warn: AlertTriangle,
  info: Info,
};

const TONES: Record<Severity, string> = {
  critical: "text-down",
  warn: "text-warn",
  info: "text-ink-dim",
};

const VISIBLE = 3;

export function AttentionFeed({ alerts }: { alerts: Alert[] }) {
  const [expanded, setExpanded] = useState(false);

  const actionable = alerts.filter((alert) => alert.severity !== "info");
  const shown = expanded ? alerts : alerts.slice(0, VISIBLE);
  const hidden = alerts.length - shown.length;

  if (alerts.length === 0) {
    return (
      <div className="flex items-center gap-2 border-t border-line px-4 py-2.5 text-xs text-ink-muted">
        <Circle className="size-3 text-up" />
        Nothing needs you. Every business is on pace.
      </div>
    );
  }

  return (
    <div className="border-t border-line">
      <div className="flex items-center justify-between gap-2 px-4 pt-3 pb-1.5">
        <h3 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-dim">
          Needs attention
        </h3>
        {actionable.length > 0 ? (
          <span className="text-[10px] tabular text-ink-dim">
            {actionable.length} open
          </span>
        ) : null}
      </div>

      <ul>
        {shown.map((alert) => {
          const Icon = ICONS[alert.severity];
          return (
            <li
              key={alert.id}
              className="flex items-start gap-2 px-4 py-1.5"
              title={alert.detail}
            >
              <Icon className={cn("mt-0.5 size-3 shrink-0", TONES[alert.severity])} />
              <div className="min-w-0">
                <p className="truncate text-xs text-ink">{alert.title}</p>
                {expanded ? (
                  <p className="mt-0.5 text-[11px] text-ink-dim">{alert.detail}</p>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>

      {alerts.length > VISIBLE ? (
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="flex w-full items-center justify-center gap-1 px-4 pt-0.5 pb-2 text-[10px] uppercase tracking-[0.12em] text-ink-dim transition-colors hover:text-ink-muted"
        >
          {expanded ? "Collapse" : `${hidden} more`}
          <ChevronDown className={cn("size-3", expanded && "rotate-180")} />
        </button>
      ) : (
        <div className="pb-2" />
      )}
    </div>
  );
}
