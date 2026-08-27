import { describe, expect, it } from "vitest";

import { DEFAULT_MODEL_ID, getModel, listModels } from "@/lib/models";

describe("model registry", () => {
  it("offers the two Claude models and nothing else", () => {
    expect(listModels().map((model) => model.id)).toEqual([
      "claude-opus-5",
      "claude-sonnet-5",
    ]);
  });

  it("defaults to a model that exists", () => {
    expect(getModel(DEFAULT_MODEL_ID)).toBeDefined();
  });

  it("lets every offered model drive the tools", () => {
    // One provider means one tool shape, so there is no chat-only tier.
    expect(listModels().every((model) => model.tools)).toBe(true);
  });

  it("cannot be talked into a second provider by env alone", () => {
    // These used to summon Codex and Gemini into the selector. Setting them now
    // does nothing, which is the point: an option that exists has to be one the
    // tool loop can actually drive.
    process.env.OPENAI_API_KEY = "sk-test";
    process.env.OPENAI_MODEL = "gpt-5-codex";
    process.env.GEMINI_API_KEY = "key";
    process.env.GEMINI_MODEL = "gemini-3-pro";
    try {
      expect(listModels()).toHaveLength(2);
      expect(getModel("gpt-5-codex")).toBeUndefined();
      expect(getModel("gemini-3-pro")).toBeUndefined();
    } finally {
      delete process.env.OPENAI_API_KEY;
      delete process.env.OPENAI_MODEL;
      delete process.env.GEMINI_API_KEY;
      delete process.env.GEMINI_MODEL;
    }
  });

  it("never invents a model id", () => {
    expect(getModel("gpt-5")).toBeUndefined();
    expect(getModel("minimax-m3")).toBeUndefined();
  });
});
