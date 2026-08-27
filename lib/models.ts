/**
 * The models the Command Center can talk to.
 *
 * Claude only, and specifically Claude Code — Ben's decision. Codex, Gemini and
 * the OpenAI-compatible path they shared are gone rather than left switched
 * off, because a provider you keep "just in case" still has to be kept working:
 * a second tool shape, a second price table, a second failure mode in the
 * budget guard. One provider means one tool loop and one set of permissions.
 */

export type ProviderId = "anthropic";

/** What a model is reached for. */
export type Tier = "fast" | "heavy";

export interface ModelOption {
  id: string;
  label: string;
  provider: ProviderId;
  tier: Tier;
  /** One line on when to reach for it. */
  blurb: string;
  /** Env var that must be set before this provider can be called. */
  envVar: string;
  /** Whether this model can drive the tools (open email, tasks, files...). */
  tools: boolean;
}

export interface Provider {
  id: ProviderId;
  label: string;
  /** Short name for the selector. */
  short: string;
}

export const PROVIDERS: Record<ProviderId, Provider> = {
  anthropic: { id: "anthropic", label: "Anthropic", short: "Claude" },
};

const ANTHROPIC_MODELS: ModelOption[] = [
  {
    id: "claude-opus-5",
    label: "Opus 5",
    provider: "anthropic",
    tier: "heavy",
    blurb: "Best at running the tools and long builds.",
    envVar: "ANTHROPIC_API_KEY",
    tools: true,
  },
  {
    id: "claude-sonnet-5",
    label: "Sonnet 5",
    provider: "anthropic",
    tier: "fast",
    blurb: "Quicker and cheaper for routine questions.",
    envVar: "ANTHROPIC_API_KEY",
    tools: true,
  },
];

/** Every model available on this deployment. */
export function listModels(): ModelOption[] {
  return [...ANTHROPIC_MODELS];
}

/** The model a request gets when it doesn't name one. */
export const DEFAULT_MODEL_ID = "claude-opus-5";

export function getModel(id: string): ModelOption | undefined {
  return listModels().find((model) => model.id === id);
}
