/**
 * Model registry for the Claude Code tab's model switch.
 *
 * Locked decision (spec §7): hybrid UX. One chat thread with a toggle for the
 * active model, and any model can be called as a subtask by another. Phase 1
 * ships the switch and the delegation affordance; the provider calls land in
 * Phase 3.
 */

export type ProviderId = "anthropic" | "openai" | "openclaw";

/** What a model is reached for. */
export type Tier = "cheap" | "general" | "heavy";

export interface ModelOption {
  id: string;
  label: string;
  provider: ProviderId;
  tier: Tier;
  /** One line on when to reach for it. */
  blurb: string;
  /** Env var that must be set before this provider can be called (Phase 3). */
  envVar: string;
}

export interface Provider {
  id: ProviderId;
  label: string;
  /** Short name for the toggle pill. */
  short: string;
  accent: string;
}

export const PROVIDERS: Record<ProviderId, Provider> = {
  anthropic: {
    id: "anthropic",
    label: "Anthropic",
    short: "Anthropic",
    accent: "var(--color-accent)",
  },
  openai: {
    id: "openai",
    label: "OpenAI",
    short: "OpenAI",
    accent: "var(--color-up)",
  },
  openclaw: {
    id: "openclaw",
    label: "OpenClaw / minimax",
    short: "OpenClaw",
    accent: "var(--color-violet)",
  },
};

export const MODELS: ModelOption[] = [
  {
    id: "claude-opus-5",
    label: "Opus 5",
    provider: "anthropic",
    tier: "heavy",
    blurb: "Heavy reasoning, code generation, long builds.",
    envVar: "ANTHROPIC_API_KEY",
  },
  {
    id: "claude-sonnet-5",
    label: "Sonnet 5",
    provider: "anthropic",
    tier: "general",
    blurb: "Fast coding and agentic work at lower cost than Opus.",
    envVar: "ANTHROPIC_API_KEY",
  },
  {
    id: "gpt-5",
    label: "GPT-5",
    provider: "openai",
    tier: "general",
    blurb: "General purpose second opinion.",
    envVar: "OPENAI_API_KEY",
  },
  {
    id: "minimax-m3",
    label: "minimax M3",
    provider: "openclaw",
    tier: "cheap",
    blurb: "Cheap default. Routing, triage, quick answers.",
    envVar: "OPENCLAW_API_KEY",
  },
  {
    id: "minimax-m2.7",
    label: "minimax M2.7",
    provider: "openclaw",
    tier: "cheap",
    blurb: "Cheapest tier for bulk work.",
    envVar: "OPENCLAW_API_KEY",
  },
];

/** Cheap model default, per the budget guardrails in spec §3. */
export const DEFAULT_MODEL_ID = "minimax-m3";

export function getModel(id: string): ModelOption | undefined {
  return MODELS.find((m) => m.id === id);
}

export function modelsByProvider(provider: ProviderId): ModelOption[] {
  return MODELS.filter((m) => m.provider === provider);
}

/**
 * Per-model token rates are deliberately absent — they get filled from each
 * provider's current pricing page when the calls are wired up in Phase 3.
 * The budget meter reads spend from the daily log, not from estimates here.
 */
