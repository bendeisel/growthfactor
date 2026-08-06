import Anthropic from "@anthropic-ai/sdk";

import {
  MissingCredentialError,
  type ChatEvent,
  type CompletionRequest,
  type Provider,
} from "@/lib/chat/types";

/**
 * Anthropic provider for the Claude Code tab.
 *
 * Notes on the request shape, since it differs from older Claude code:
 * - Adaptive thinking (`{type: "adaptive"}`), not a token budget.
 * - `effort` inside `output_config` controls depth; `xhigh` for coding work.
 * - Streaming always, so a long build can't hit an HTTP timeout.
 * - `fallbacks: "default"` re-runs a safety-classifier refusal on Anthropic's
 *   recommended fallback model server-side, so a false positive on a benign
 *   request doesn't come back as a dead end.
 */

const BETAS = ["server-side-fallback-2026-07-01"];

function client(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new MissingCredentialError("ANTHROPIC_API_KEY is not set.");
  }
  return new Anthropic({ apiKey });
}

function effort(): "low" | "medium" | "high" | "xhigh" | "max" {
  const value = process.env.ANTHROPIC_EFFORT;
  return value === "low" ||
    value === "medium" ||
    value === "high" ||
    value === "xhigh" ||
    value === "max"
    ? value
    : "xhigh";
}

function params(request: CompletionRequest) {
  return {
    model: request.modelId,
    max_tokens: request.maxTokens ?? 32_000,
    system: request.system,
    messages: request.turns.map((turn) => ({
      role: turn.role,
      content: turn.content,
    })),
    thinking: { type: "adaptive" as const },
    output_config: { effort: effort() },
    betas: BETAS,
    fallbacks: "default" as const,
  };
}

export const anthropicProvider: Provider = {
  async *stream(request: CompletionRequest): AsyncGenerator<ChatEvent> {
    const stream = client().beta.messages.stream(params(request));

    for await (const event of stream) {
      if (
        event.type === "content_block_delta" &&
        event.delta.type === "text_delta"
      ) {
        yield { type: "text", text: event.delta.text };
      }
    }

    const message = await stream.finalMessage();

    if (message.stop_reason === "refusal") {
      yield {
        type: "notice",
        text: `Declined by ${message.model}${
          message.stop_details?.category
            ? ` (${message.stop_details.category})`
            : ""
        }. Try a different model from the switch.`,
      };
    } else if (message.stop_reason === "max_tokens") {
      yield {
        type: "notice",
        text: "Response hit the output cap and was cut off. Ask it to continue.",
      };
    }

    // A fallback block means a different model answered than the one selected.
    const served = message.content.some((block) => block.type === "fallback")
      ? message.model
      : null;
    if (served && served !== request.modelId) {
      yield { type: "notice", text: `Answered by ${served} after a refusal.` };
    }

    yield {
      type: "usage",
      inputTokens: message.usage.input_tokens ?? 0,
      outputTokens: message.usage.output_tokens ?? 0,
    };
  },

  async complete(request: CompletionRequest) {
    const stream = client().beta.messages.stream(params(request));
    const message = await stream.finalMessage();
    const text = message.content
      .filter((block): block is Anthropic.Beta.BetaTextBlock => block.type === "text")
      .map((block) => block.text)
      .join("");
    return {
      text,
      inputTokens: message.usage.input_tokens ?? 0,
      outputTokens: message.usage.output_tokens ?? 0,
    };
  },
};
