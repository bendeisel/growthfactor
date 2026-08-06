"use client";

import { useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Two columns on a desktop; one column plus a switch on a phone.
 *
 * "From any computer" (spec §1) in practice includes the phone in Ben's pocket,
 * and a 24rem metrics column next to a chat pane doesn't fit there. Both panes
 * stay mounted either way, so switching never loses a half-typed message.
 */
export function CommandCenterShell({
  metrics,
  workspace,
}: {
  metrics: ReactNode;
  workspace: ReactNode;
}) {
  const [view, setView] = useState<"metrics" | "workspace">("metrics");

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden p-2 sm:gap-3 sm:p-3">
      <div className="flex shrink-0 gap-1 lg:hidden">
        {(["metrics", "workspace"] as const).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setView(option)}
            aria-pressed={view === option}
            className={cn(
              "flex-1 rounded-lg border px-3 py-1.5 text-[11px] uppercase tracking-[0.12em] transition-colors",
              view === option
                ? "border-accent/50 bg-accent/15 text-accent"
                : "border-line text-ink-dim",
            )}
          >
            {option}
          </button>
        ))}
      </div>

      <div className="grid min-h-0 flex-1 gap-3 overflow-hidden lg:grid-cols-[minmax(23rem,30rem)_minmax(0,1fr)]">
        <div
          className={cn(
            "min-h-0 lg:block",
            view === "metrics" ? "block" : "hidden",
          )}
        >
          {metrics}
        </div>
        <div
          className={cn(
            "min-h-0 lg:block",
            view === "workspace" ? "block" : "hidden",
          )}
        >
          {workspace}
        </div>
      </div>
    </div>
  );
}
