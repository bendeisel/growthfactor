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

  it("returns null rather than a guess for models with no configured rate", () => {
    expect(rateFor("gpt-5")).toBeNull();
    expect(costCentsFor("gpt-5", 1_000_000, 1_000_000)).toBeNull();
    expect(costCentsFor("minimax-m3", 500, 500)).toBeNull();
  });

  it("takes rates from env when set, so a price change needs no deploy", () => {
    process.env.OPENAI_INPUT_CENTS_PER_MTOK = "125";
    process.env.OPENAI_OUTPUT_CENTS_PER_MTOK = "1000";
    expect(costCentsFor("gpt-5", 1_000_000, 1_000_000)).toBeCloseTo(1125);
  });

  it("lets an env override win over a built-in rate", () => {
    process.env.ANTHROPIC_INPUT_CENTS_PER_MTOK = "100";
    process.env.ANTHROPIC_OUTPUT_CENTS_PER_MTOK = "100";
    expect(costCentsFor("claude-opus-5", 1_000_000, 0)).toBeCloseTo(100);
  });

  it("is null for an unknown model id", () => {
    expect(rateFor("not-a-model")).toBeNull();
  });
});
