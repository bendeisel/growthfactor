"use client";

import { useState, type ReactNode } from "react";

import { WorkspaceProvider } from "@/components/workspace/workspace-context";
import { cn } from "@/lib/utils";

/**
 * Three columns on a desktop — businesses, Command Center, apps — one at a time
 * on a phone, with a switch.
 *
 * All three stay mounted whichever is showing, so switching never loses a
 * half-typed message or a window the agent just opened.
 */

type Column = "businesses" | "command" | "apps";

const LABELS: Record<Column, string> = {
  businesses: "Metrics",
  command: "Command",
  apps: "Apps",
};

export function CommandCenterShell({
  businesses,
  command,
  apps,
}: {
  businesses: ReactNode;
  command: ReactNode;
  apps: ReactNode;
}) {
  const [column, setColumn] = useState<Column>("command");

  return (
    <WorkspaceProvider>
      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden p-2 sm:gap-3 sm:p-3">
        <div className="flex shrink-0 gap-1 xl:hidden">
          {(Object.keys(LABELS) as Column[]).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setColumn(option)}
              aria-pressed={column === option}
              className={cn(
                "flex-1 rounded-lg border px-3 py-1.5 text-[11px] uppercase tracking-[0.12em] transition-colors",
                column === option
                  ? "border-accent/50 bg-accent/15 text-accent"
                  : "border-line text-ink-dim",
              )}
            >
              {LABELS[option]}
            </button>
          ))}
        </div>

        <div className="grid min-h-0 flex-1 gap-3 overflow-hidden xl:grid-cols-[minmax(20rem,25rem)_minmax(0,1fr)_minmax(20rem,28rem)]">
          <div className={cn("min-h-0 xl:block", column === "businesses" ? "block" : "hidden")}>
            {businesses}
          </div>
          <div className={cn("flex min-h-0 flex-col xl:flex", column === "command" ? "flex" : "hidden")}>
            {command}
          </div>
          <div className={cn("min-h-0 xl:block", column === "apps" ? "block" : "hidden")}>
            {apps}
          </div>
        </div>
      </div>
    </WorkspaceProvider>
  );
}
