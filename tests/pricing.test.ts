import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { costCentsFor, rateFor } from "@/lib/pricing";

const ORIGINAL_ENV = { ...process.env };

beforeEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe("pricing", () => {
  it("prices Anthropic models from published rates", () => {
    // 1M in + 1M out on Opus 5 = $5 + $25.
    expect(costCentsFor("claude-opus-5", 1_000_000, 1_000_000)).toBeCloseTo(3000);
    expect(costCentsFor("claude-sonnet-5", 1_000_000, 0)).toBeCloseTo(300);
  });

  it("lets an env override win, so a price change needs no deploy", () => {
    process.env.ANTHROPIC_INPUT_CENTS_PER_MTOK = "100";
    process.env.ANTHROPIC_OUTPUT_CENTS_PER_MTOK = "100";
    expect(costCentsFor("claude-opus-5", 1_000_000, 0)).toBeCloseTo(100);
  });

  it("ignores a half-configured override rather than reading it as zero", () => {
    // One of the pair missing means Number("") is NaN — which must not become a
    // free model, because a zero rate in a budget guard silently disables it.
    process.env.ANTHROPIC_INPUT_CENTS_PER_MTOK = "100";
    expect(costCentsFor("claude-opus-5", 1_000_000, 1_000_000)).toBeCloseTo(3000);
  });

  it("is null for a model this deployment doesn't have", () => {
    // Never a guess: an unknown model logs tokens and reports cost as unpriced.
    expect(rateFor("gpt-5-codex")).toBeNull();
    expect(rateFor("gemini-3-pro")).toBeNull();
    expect(rateFor("not-a-model")).toBeNull();
    expect(costCentsFor("not-a-model", 1_000_000, 1_000_000)).toBeNull();
  });
});
