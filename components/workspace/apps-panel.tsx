"use client";

import { useState } from "react";
import {
  BarChart3,
  CalendarDays,
  FolderOpen,
  ListChecks,
  Mail,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Card } from "@/components/ui/card";
import { ToolWindow } from "@/components/workspace/tool-window";
import { useWorkspace, type AppKind } from "@/components/workspace/workspace-context";
import { EMAIL_ACCOUNTS } from "@/lib/tools/google";
import { cn } from "@/lib/utils";

/**
 * The app column: one toggle, one window at a time.
 *
 * Ben doesn't want six app screens open — he wants to summon one. So each tab
 * shows whatever the agent last opened there, and until it has opened something,
 * the quick actions are just prompts: pressing one asks the agent, which calls
 * the tool, which fills this panel. There is no second code path.
 */

interface AppDef {
  kind: AppKind;
  label: string;
  icon: LucideIcon;
  /** Prompts that read like something Ben would say. */
  actions: string[];
}

const APPS: AppDef[] = [
  {
    kind: "email",
    label: "Email",
    icon: Mail,
    actions: [
      "Open my email and show me everything unread.",
      "Anything in the inbox that needs a reply today?",
      "Draft two versions of a reply to the newest one.",
    ],
  },
  {
    kind: "clickup",
    label: "ClickUp",
    icon: ListChecks,
    actions: [
      "Show me all open tasks.",
      "What's assigned to me and overdue?",
      "What did we complete this week?",
    ],
  },
  {
    kind: "reports",
    label: "Reports",
    icon: BarChart3,
    actions: [
      "Pull the numbers for every business — MTD against last month.",
      "Which business is furthest behind pace, and why?",
      "Show me the daily revenue trend for Nashville MMA.",
    ],
  },
  {
    kind: "drive",
    label: "Drive",
    icon: FolderOpen,
    actions: ["What did I work on recently?", "Find the Growth Factor pricing doc."],
  },
  {
    kind: "calendar",
    label: "Calendar",
    icon: CalendarDays,
    actions: ["What's on today?", "What does the rest of the week look like?"],
  },
];

export function AppsPanel() {
  const { activeApp, setActiveApp, windowFor, ask } = useWorkspace();
  const [account, setAccount] = useState<string>("all");

  const app = APPS.find((candidate) => candidate.kind === activeApp) ?? APPS[0];
  const window = windowFor(app.kind);

  return (
    <Card className="flex h-full min-h-0 flex-col overflow-hidden">
      {/* Toggle */}
      <div className="flex items-center gap-1 overflow-x-auto border-b border-line px-2 py-2">
        {APPS.map(({ kind, label, icon: Icon }) => {
          const open = Boolean(windowFor(kind));
          return (
            <button
              key={kind}
              type="button"
              onClick={() => setActiveApp(kind)}
              aria-pressed={activeApp === kind}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs transition-colors",
                activeApp === kind
                  ? "border-accent/50 bg-accent/15 text-accent"
                  : "border-transparent text-ink-dim hover:bg-panel-hover hover:text-ink-muted",
              )}
            >
              <Icon className="size-3.5" />
              {label}
              {open ? <span className="size-1 rounded-full bg-up" /> : null}
            </button>
          );
        })}
      </div>

      {/* Email account switcher — accounts stay visually separated (spec §7). */}
      {app.kind === "email" ? (
        <div className="flex items-center gap-1 overflow-x-auto border-b border-line px-3 py-2">
          {["all", ...EMAIL_ACCOUNTS].map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => {
                setAccount(option);
                ask(
                  option === "all"
                    ? "Open my email — everything unread across all accounts."
                    : `Open the inbox for ${option} — everything unread.`,
                );
              }}
              title={option === "all" ? "All accounts" : option}
              className={cn(
                "shrink-0 rounded-full border px-2 py-0.5 font-mono text-[10px] transition-colors",
                account === option
                  ? "border-accent/50 bg-accent/10 text-accent"
                  : "border-line-bright text-ink-dim hover:text-ink-muted",
              )}
            >
              {/* The domain is what tells them apart, and it fits. */}
              {option === "all" ? "all" : option.split("@")[1]}
            </button>
          ))}
        </div>
      ) : null}

      {window ? (
        <ToolWindow window={window} />
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          <p className="text-sm text-ink-muted">
            Nothing open here yet. Ask the Command Center — the window appears as it
            works.
          </p>
          <div className="mt-3 space-y-1.5">
            {app.actions.map((action) => (
              <button
                key={action}
                type="button"
                onClick={() => ask(action)}
                className="w-full rounded-lg border border-line bg-bg-elevated/60 px-3 py-2 text-left text-xs text-ink-muted transition-colors hover:border-accent/40 hover:text-ink"
              >
                “{action}”
              </button>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
