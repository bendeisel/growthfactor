"use client";

import { useEffect, useState } from "react";
import { Repeat } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChatShell } from "@/components/workspace/chat-shell";
import {
  DEFAULT_MODEL_ID,
  MODELS,
  PROVIDERS,
  getModel,
} from "@/lib/models";
import { money } from "@/lib/metrics/format";
import { cn } from "@/lib/utils";
import type { BudgetStatus } from "@/lib/budget";

/**
 * Claude Code tab. Model switch UX is the locked hybrid (spec §7 decision C):
 * one thread with a toggle for the active model, plus a delegate target so a
 * model can hand a subtask to another.
 */
export function ClaudeCodePanel() {
  const [activeId, setActiveId] = useState(DEFAULT_MODEL_ID);
  const [delegateId, setDelegateId] = useState<string>("");
  const [budget, setBudget] = useState<BudgetStatus | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/budget", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((body: BudgetStatus | null) => {
        if (!cancelled && body) setBudget(body);
      })
      .catch(() => {
        /* the meter is informational; a failed read shouldn't break the tab */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const active = getModel(activeId) ?? MODELS[0];
  const provider = PROVIDERS[active.provider];

  function cycle() {
    const index = MODELS.findIndex((m) => m.id === activeId);
    setActiveId(MODELS[(index + 1) % MODELS.length].id);
  }

  return (
    <ChatShell
      agentLabel={active.label}
      endpoint="/api/chat"
      payload={{ agent: "claude-code", modelId: activeId, delegateTo: delegateId || undefined }}
      placeholder={`Message ${active.label} — ⇧⏎ for a new line.`}
      intro="Hybrid model switch: one thread, cycle the active model with the button below, and optionally hand the next turn's subtask to a second model. Provider calls are wired up in Phase 3 — until then a send reports which credential the turn would have needed."
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
              {MODELS.filter((m) => m.id !== activeId).map((model) => (
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
  if (!budget) {
    return <Badge tone="neutral">budget —</Badge>;
  }
  const pct = Math.min(100, Math.round(budget.dayFraction * 100));
  const tone = budget.dayFraction >= 1 ? "danger" : budget.dayFraction >= 0.7 ? "mock" : "neutral";
  return (
    <div className="flex items-center gap-2">
      <div className="h-1 w-16 overflow-hidden rounded-full bg-line">
        <div
          className={cn(
            "h-full rounded-full",
            tone === "danger" ? "bg-down" : tone === "mock" ? "bg-warn" : "bg-accent",
          )}
          style={{ width: `${Math.max(2, pct)}%` }}
        />
      </div>
      <Badge tone={tone}>
        {money(budget.spentTodayCents)} / {money(budget.softCapCents)} today
      </Badge>
    </div>
  );
}
