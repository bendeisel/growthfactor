/**
 * The models the Command Center can talk to.
 *
 * Claude is the brain. This is Anthropic-only by default, with Codex (OpenAI)
 * and Gemini as slots that appear in the selector *only* once their key and
 * model id are configured — an option that can't work has no business being in
 * the list.
 *
 * Their model ids come from env rather than being hard-coded: whoever holds the
 * key knows which model that key is entitled to, and guessing a model id is the
 * same class of mistake as guessing a price.
 */

export type ProviderId = "anthropic" | "openai" | "gemini";

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
  openai: { id: "openai", label: "OpenAI", short: "Codex" },
  gemini: { id: "gemini", label: "Google", short: "Gemini" },
};

/** Always offered: these are the brains this thing is built around. */
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

/**
 * Optional providers. Both halves have to be set — the key to call it, and the
 * model id to name. Tools stay off: the loop is written against Anthropic's
 * tool_use shape, so these answer but don't act (yet).
 */
function optionalModels(): ModelOption[] {
  const optional: ModelOption[] = [];

  const openaiModel = process.env.OPENAI_MODEL;
  if (openaiModel && process.env.OPENAI_API_KEY) {
    optional.push({
      id: openaiModel,
      label: `Codex (${openaiModel})`,
      provider: "openai",
      tier: "heavy",
      blurb: "Second opinion. Can't drive the tools yet.",
      envVar: "OPENAI_API_KEY",
      tools: false,
    });
  }

  const geminiModel = process.env.GEMINI_MODEL;
  if (geminiModel && process.env.GEMINI_API_KEY) {
    optional.push({
      id: geminiModel,
      label: `Gemini (${geminiModel})`,
      provider: "gemini",
      tier: "heavy",
      blurb: "Second opinion. Can't drive the tools yet.",
      envVar: "GEMINI_API_KEY",
      tools: false,
    });
  }

  return optional;
}

/**
 * Every model available on this deployment. Server-side — the page reads it and
 * hands the list to the selector, since env isn't visible in the browser.
 */
export function listModels(): ModelOption[] {
  return [...ANTHROPIC_MODELS, ...optionalModels()];
}

/** The model a request gets when it doesn't name one. */
export const DEFAULT_MODEL_ID = "claude-opus-5";

export function getModel(id: string): ModelOption | undefined {
  return listModels().find((model) => model.id === id);
}
