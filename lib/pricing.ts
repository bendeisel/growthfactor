import { getModel } from "@/lib/models";

/**
 * Token rates, in cents per million tokens.
 *
 * Anthropic rates are the published list prices (Claude Opus 5 $5/$25, Claude
 * Sonnet 5 $3/$15 per MTok). Sonnet 5 also has introductory pricing running to
 * 2026-08-31, which makes real spend *lower* than what we log — the safe
 * direction for a budget cap, so we deliberately don't model it.
 *
 * Rates for the other providers are not hard-coded: whoever sets the API key
 * sets the rate, via env, from that provider's current pricing page. A model
 * with no rate still logs tokens; its spend is reported as unpriced rather than
 * guessed, because a made-up rate in a budget guardrail is worse than a gap.
 */

export interface Rate {
  inputCentsPerMTok: number;
  outputCentsPerMTok: number;
}

const ANTHROPIC_RATES: Record<string, Rate> = {
  "claude-opus-5": { inputCentsPerMTok: 500, outputCentsPerMTok: 2500 },
  "claude-sonnet-5": { inputCentsPerMTok: 300, outputCentsPerMTok: 1500 },
};

function envRate(provider: string): Rate | null {
  const prefix = provider.toUpperCase();
  const input = Number(process.env[`${prefix}_INPUT_CENTS_PER_MTOK`]);
  const output = Number(process.env[`${prefix}_OUTPUT_CENTS_PER_MTOK`]);
  if (!Number.isFinite(input) || !Number.isFinite(output)) return null;
  return { inputCentsPerMTok: input, outputCentsPerMTok: output };
}

export function rateFor(modelId: string): Rate | null {
  const model = getModel(modelId);
  if (!model) return null;
  // An env override wins, so a price change never needs a deploy.
  return envRate(model.provider) ?? ANTHROPIC_RATES[modelId] ?? null;
}

/** Cost in cents, or null when the model has no known rate. */
export function costCentsFor(
  modelId: string,
  inputTokens: number,
  outputTokens: number,
): number | null {
  const rate = rateFor(modelId);
  if (!rate) return null;
  return (
    (inputTokens * rate.inputCentsPerMTok) / 1_000_000 +
    (outputTokens * rate.outputCentsPerMTok) / 1_000_000
  );
}
