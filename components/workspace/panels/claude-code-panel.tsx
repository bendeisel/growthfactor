"use client";

import { useCallback, useEffect, useState } from "react";
import { Repeat } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChatShell } from "@/components/workspace/chat-shell";
import { DEFAULT_MODEL_ID, MODELS, PROVIDERS, getModel } from "@/lib/models";
import { money } from "@/lib/metrics/format";
import { cn } from "@/lib/utils";
import type { BudgetStatus } from "@/lib/budget";

/**
 * Claude Code tab. Model switch is the locked hybrid (spec §7 decision C): one
 * thread with a toggle for the active model, plus a delegate target so the
 * active model can hand a subtask to another before answering.
 */
export function ClaudeCodePanel() {
  const [activeId, setActiveId] = useState(DEFAULT_MODEL_ID);
  const [delegateId, setDelegateId] = useState<string>("");
  const [budget, setBudget] = useState<BudgetStatus | null>(null);

  const loadBudget = useCallback(() => {
    fetch("/api/budget", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((body: BudgetStatus | null) => {
        if (body) setBudget(body);
      })
      .catch(() => {
        /* the meter is informational; a failed read shouldn't break the tab */
      });
  }, []);

  useEffect(loadBudget, [loadBudget]);

  const active = getModel(activeId) ?? MODELS[0];
  const provider = PROVIDERS[active.provider];

  function cycle() {
    const index = MODELS.findIndex((model) => model.id === activeId);
    setActiveId(MODELS[(index + 1) % MODELS.length].id);
  }

  return (
    <ChatShell
      agent="claude-code"
      agentLabel={active.label}
      payload={{ modelId: activeId, delegateTo: delegateId || undefined }}
      placeholder={`Message ${active.label} — ⇧⏎ for a new line.`}
      intro="One thread, cycle the active model with the button below, and optionally hand this turn's subtask to a second model first. The model can see today's metrics and open alerts."
      onTurnComplete={loadBudget}
      toolbar={
        <>
          <Button variant="outline" size="sm" onClick={cycle} title="Cycle active model">
            <Repeat className="size-3.5" />
            {provider.short} · {active.label}
          </Button>

          <div className="flex flex-wrap items-center gap-1">
            {MODELS.map((model) => (
              <button
                key={model.id}
                type="button"
                onClick={() => setActiveId(model.id)}
                title={`${PROVIDERS[model.provider].label} — ${model.blurb}`}
                className={cn(
                  "rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-[0.08em] transition-colors",
                  model.id === activeId
                    ? "border-accent/60 bg-accent/15 text-accent"
                    : "border-line-bright text-ink-dim hover:text-ink-muted",
                )}
              >
                {model.label}
              </button>
            ))}
          </div>

          <label className="ml-auto flex items-center gap-1.5 text-[10px] uppercase tracking-[0.08em] text-ink-dim">
            Delegate
            <select
              value={delegateId}
              onChange={(event) => setDelegateId(event.target.value)}
              className="rounded-md border border-line bg-bg-elevated px-1.5 py-1 text-[11px] normal-case tracking-normal text-ink-muted"
            >
              <option value="">none</option>
              {MODELS.filter((model) => model.id !== activeId).map((model) => (
                <option key={model.id} value={model.id}>
                  {model.label}
                </option>
              ))}
            </select>
          </label>

          <BudgetMeter budget={budget} />
        </>
      }
    />
  );
}

function BudgetMeter({ budget }: { budget: BudgetStatus | null }) {
  if (!budget) return <Badge tone="neutral">budget —</Badge>;

  // The day meter is the one Ben watches; the month cap is the one that stops
  // spend, so it wins the badge colour once it's the binding constraint.
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
      <div className="h-1 w-16 overflow-hidden rounded-full bg-line">
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
          : `${money(budget.spentTodayCents)} / ${money(budget.softCapCents)} today`}
      </Badge>
    </div>
  );
}
