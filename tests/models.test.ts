import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { DEFAULT_MODEL_ID, getModel, listModels } from "@/lib/models";

const ORIGINAL_ENV = { ...process.env };

beforeEach(() => {
  process.env = { ...ORIGINAL_ENV };
  delete process.env.OPENAI_API_KEY;
  delete process.env.OPENAI_MODEL;
  delete process.env.GEMINI_API_KEY;
  delete process.env.GEMINI_MODEL;
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe("model registry", () => {
  it("offers only the Claude models by default", () => {
    expect(listModels().map((model) => model.id)).toEqual([
      "claude-opus-5",
      "claude-sonnet-5",
    ]);
  });

  it("defaults to a model that exists", () => {
    expect(getModel(DEFAULT_MODEL_ID)).toBeDefined();
  });

  it("lets the Claude models drive tools", () => {
    expect(listModels().every((model) => model.tools)).toBe(true);
  });

  it("adds Codex only when both its key and model id are set", () => {
    process.env.OPENAI_API_KEY = "sk-test";
    expect(listModels()).toHaveLength(2);

    process.env.OPENAI_MODEL = "gpt-5-codex";
    const models = listModels();
    expect(models).toHaveLength(3);
    expect(models[2]).toMatchObject({
      id: "gpt-5-codex",
      provider: "openai",
      // The tool loop is Anthropic-shaped, so these answer but can't act yet.
      tools: false,
    });
  });

  it("adds Gemini the same way", () => {
    process.env.GEMINI_MODEL = "gemini-3-pro";
    expect(listModels()).toHaveLength(2); // key still missing

    process.env.GEMINI_API_KEY = "key";
    expect(getModel("gemini-3-pro")).toMatchObject({
      provider: "gemini",
      tools: false,
    });
  });

  it("never invents a model id", () => {
    // Nothing is offered that the deployment can't actually call.
    expect(getModel("gpt-5")).toBeUndefined();
    expect(getModel("minimax-m3")).toBeUndefined();
  });
});
