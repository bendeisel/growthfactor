import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

const ORIGINAL_ENV = { ...process.env };

/** Each test gets its own MEMORY_DIR, and a fresh module so caps re-read env. */
async function budget() {
  process.env.MEMORY_DIR = await mkdtemp(path.join(tmpdir(), "cc-budget-"));
  return import("@/lib/budget");
}

beforeEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe("budget log", () => {
  it("starts empty", async () => {
    const { getStatus } = await budget();
    const status = await getStatus();
    expect(status.spentTodayCents).toBe(0);
    expect(status.entryCount).toBe(0);
    expect(status.blocked).toBe(false);
  });

  it("accumulates tokens and cost", async () => {
    const { record, getStatus } = await budget();
    const at = new Date().toISOString();
    await record({ at, modelId: "claude-opus-5", inputTokens: 1000, outputTokens: 500, costCents: 25 });
    await record({ at, modelId: "claude-opus-5", inputTokens: 2000, outputTokens: 100, costCents: 15 });

    const status = await getStatus();
    expect(status.spentTodayCents).toBe(40);
    expect(status.entryCount).toBe(2);
  });

  it("counts unpriced turns separately instead of guessing a cost", async () => {
    const { record, getStatus } = await budget();
    await record({
      at: new Date().toISOString(),
      modelId: "gpt-5-codex",
      inputTokens: 500,
      outputTokens: 200,
      costCents: null,
    });

    const status = await getStatus();
    expect(status.spentTodayCents).toBe(0);
    expect(status.unpricedToday).toBe(1);
  });

  it("warns past the daily soft cap but still allows the call", async () => {
    process.env.BUDGET_DAILY_SOFT_CAP_USD = "1";
    const { record, checkBudget } = await budget();
    await record({
      at: new Date().toISOString(),
      modelId: "claude-opus-5",
      inputTokens: 0,
      outputTokens: 0,
      costCents: 150,
    });

    const decision = await checkBudget();
    expect(decision.allowed).toBe(true);
    expect(decision.warning).toContain("soft cap");
  });

  it("refuses the call at the monthly hard cap", async () => {
    process.env.BUDGET_MONTHLY_HARD_CAP_USD = "2";
    const { record, checkBudget } = await budget();
    await record({
      at: new Date().toISOString(),
      modelId: "claude-opus-5",
      inputTokens: 0,
      outputTokens: 0,
      costCents: 250,
    });

    const decision = await checkBudget();
    expect(decision.allowed).toBe(false);
    expect(decision.reason).toContain("hard cap");
    expect(decision.status.blocked).toBe(true);
  });

  it("honours cap overrides from env", async () => {
    process.env.BUDGET_DAILY_SOFT_CAP_USD = "12";
    const { dailySoftCapCents, monthlyHardCapCents } = await budget();
    expect(dailySoftCapCents()).toBe(1200);
    expect(monthlyHardCapCents()).toBe(10_000);
  });
});
