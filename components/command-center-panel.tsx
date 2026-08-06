"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";

import { JarvisCore } from "@/components/jarvis/jarvis-core";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ChatShell } from "@/components/workspace/chat-shell";
import { useWorkspace } from "@/components/workspace/workspace-context";
import type { BudgetStatus } from "@/lib/budget";
import { money } from "@/lib/metrics/format";
import { MODELS, PROVIDERS, getModel } from "@/lib/models";
import { cn } from "@/lib/utils";

/**
 * The Command Center: one terminal.
 *
 * Ben's sketch has a single centre column with a brain selector, not a tab per
 * agent — so Megatron and the coding models are entries in one list over one
 * thread. Anthropic models can drive the tools; the others answer but can't act,
 * and the panel says so rather than letting him find out by asking.
 */

interface Brain {
  id: string;
  label: string;
  sublabel: string;
  agent: "megatron" | "claude-code";
  modelId: string;
  tools: boolean;
}

const BRAINS: Brain[] = [
  {
    id: "megatron",
    label: "Megatron",
    sublabel: "OpenClaw · same brain as Telegram",
    agent: "megatron",
    modelId: "minimax-m3",
    tools: false,
  },
  ...MODELS.map((model) => ({
    id: model.id,
    label: model.label,
    sublabel: `${PROVIDERS[model.provider].label} · ${model.blurb}`,
    agent: "claude-code" as const,
    modelId: model.id,
    tools: model.provider === "anthropic",
  })),
];

const STATE_COPY = {
  idle: "Standing by",
  thinking: "Thinking",
  working: "Working",
} as const;

export function CommandCenterPanel() {
  const { agentState } = useWorkspace();
  const [brainId, setBrainId] = useState<string>("claude-opus-5");
  const [delegateId, setDelegateId] = useState<string>("");
  const [budget, setBudget] = useState<BudgetStatus | null>(null);

  const loadBudget = useCallback(() => {
    fetch("/api/budget", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((body: BudgetStatus | null) => {
        if (body) setBudget(body);
      })
      .catch(() => {
        /* the meter is informational; a failed read shouldn't break the panel */
      });
  }, []);

  useEffect(loadBudget, [loadBudget]);

  const brain = BRAINS.find((candidate) => candidate.id === brainId) ?? BRAINS[0];

  return (
    <Card className="flex h-full min-h-0 flex-col overflow-hidden">
      {/* Jarvis core — centrepiece and status light in one. */}
      <div className="relative isolate h-44 shrink-0 overflow-hidden border-b border-line sm:h-56">
        <JarvisCore state={agentState} className="absolute inset-0" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-panel via-transparent to-transparent" />

        <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between p-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-ink-dim">
              Command Center
            </p>
            <p
              className={cn(
                "mt-0.5 text-sm",
                agentState === "idle" ? "text-ink-muted" : "text-accent",
              )}
            >
              {STATE_COPY[agentState]}
              {agentState !== "idle" ? <span className="breathe"> ●</span> : null}
            </p>
          </div>
          <BudgetMeter budget={budget} />
        </div>
      </div>

      <ChatShell
        agent={brain.agent}
        agentLabel={brain.label}
        payload={{ modelId: brain.modelId, delegateTo: delegateId || undefined }}
        placeholder={`Ask ${brain.label} — ⇧⏎ for a new line.`}
        intro={
          "One terminal. Ask for numbers, mail, tasks or files and the window opens on the right as it works. " +
          "Anything that leaves the building — sending mail, moving mail to spam, creating a task — stops for your approval first."
        }
        onTurnComplete={loadBudget}
        toolbar={
          <>
            {/* Brain selector — the dropdown from Ben's sketch. */}
            <label className="relative min-w-0 flex-1">
              <select
                value={brainId}
                onChange={(event) => setBrainId(event.target.value)}
                aria-label="Choose a brain"
                className="w-full appearance-none rounded-lg border border-line bg-bg-elevated py-1.5 pr-7 pl-2.5 text-xs text-ink focus-visible:border-accent/60 focus-visible:outline-none"
              >
                {BRAINS.map((candidate) => (
                  <option key={candidate.id} value={candidate.id}>
                    {candidate.label} — {candidate.sublabel}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute top-1/2 right-2 size-3.5 -translate-y-1/2 text-ink-dim" />
            </label>

            <Badge tone={brain.tools ? "accent" : "neutral"} title={
              brain.tools
                ? "Can open email, tasks, files and reports"
                : "Answers, but can't call tools yet — pick an Anthropic model to let it act"
            }>
              {brain.tools ? "tools on" : "chat only"}
            </Badge>

            <label className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.08em] text-ink-dim">
              Delegate
              <select
                value={delegateId}
                onChange={(event) => setDelegateId(event.target.value)}
                className="rounded-md border border-line bg-bg-elevated px-1.5 py-1 text-[11px] normal-case tracking-normal text-ink-muted"
              >
                <option value="">none</option>
                {MODELS.filter((model) => model.id !== brain.modelId).map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.label}
                  </option>
                ))}
              </select>
            </label>
          </>
        }
      />
    </Card>
  );
}

function BudgetMeter({ budget }: { budget: BudgetStatus | null }) {
  if (!budget) return <Badge tone="neutral">budget —</Badge>;

  const dayPct = Math.min(100, Math.round(budget.dayFraction * 100));
  const tone = budget.blocked
    ? "danger"
    : budget.monthFraction >= 0.8 || budget.dayFraction >= 1
      ? "mock"
      : "neutral";

  return (
    <div
      className="flex items-center gap-2"
      title={`Month: ${money(budget.spentMonthCents)} of ${money(budget.hardCapCents)} hard cap${
        budget.unpricedToday > 0
          ? ` · ${budget.unpricedToday} turn(s) today have no configured rate`
          : ""
      }`}
    >
      <div className="h-1 w-14 overflow-hidden rounded-full bg-line">
        <div
          className={cn(
            "h-full rounded-full",
            tone === "danger" ? "bg-down" : tone === "mock" ? "bg-warn" : "bg-accent",
          )}
          style={{ width: `${Math.max(2, dayPct)}%` }}
        />
      </div>
      <Badge tone={tone}>
        {budget.blocked
          ? "capped"
          : `${money(budget.spentTodayCents)} / ${money(budget.softCapCents)}`}
      </Badge>
    </div>
  );
}
