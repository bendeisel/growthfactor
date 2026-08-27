"use client";

import { PageHead, Panel } from "@/components/sections/parts";
import { cn } from "@/lib/utils";

/**
 * The board, mirrored read-only until the CI build lands. Columns are the
 * single status set from docs/CI-BOARD-PLAN.md, not ClickUp's two.
 */
const COLUMNS: { name: string; tone: string; tasks: { title: string; priority: string; client: string }[] }[] = [
  {
    name: "Brief",
    tone: "bg-down",
    tasks: [
      { title: "Rebuild Nashville MMA website", priority: "urgent", client: "Nashville MMA" },
      { title: "A2P compliance — Furst Place", priority: "urgent", client: "Furst Place" },
      { title: "GBP categories audit", priority: "normal", client: "Fuel Fortress" },
    ],
  },
  {
    name: "In progress",
    tone: "bg-warn",
    tasks: [
      { title: "GHL adapter — four locations", priority: "high", client: "Growth Factor" },
      { title: "Reactivation campaign", priority: "urgent", client: "Fuel Fortress" },
    ],
  },
  {
    name: "Client review",
    tone: "bg-violet",
    tasks: [{ title: "Fighters Boxing review agent", priority: "high", client: "Fighters Boxing" }],
  },
  {
    name: "Revisions",
    tone: "bg-up",
    tasks: [{ title: "Nashville MMA schedule block", priority: "normal", client: "Nashville MMA" }],
  },
];

const PRIORITY: Record<string, string> = {
  urgent: "bg-down",
  high: "bg-warn",
  normal: "bg-ink-dim",
};

export function ClickUpSection() {
  return (
    <>
      <PageHead title="ClickUp" sub="Read-only mirror until the CI board replaces it" />
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {COLUMNS.map((column) => (
          <Panel key={column.name}>
            <h2 className="mb-3 flex items-center gap-2 text-[13px] font-bold">
              <span className={cn("size-2 rounded-full", column.tone)} />
              {column.name}
              <span className="tabular ml-auto text-xs font-normal text-ink-dim">
                {column.tasks.length}
              </span>
            </h2>
            <div className="flex flex-col gap-2">
              {column.tasks.map((task) => (
                <article key={task.title} className="tile p-3">
                  <p className="mb-2 text-xs font-semibold leading-snug">{task.title}</p>
                  <p className="flex items-center gap-2">
                    <span className={cn("size-1.5 shrink-0 rounded-full", PRIORITY[task.priority])} />
                    <span className="rounded-full bg-surface-hover px-2 py-0.5 text-[10px] font-semibold text-ink-muted">
                      {task.client}
                    </span>
                  </p>
                </article>
              ))}
            </div>
          </Panel>
        ))}
      </div>
    </>
  );
}
