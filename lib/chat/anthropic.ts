import Anthropic from "@anthropic-ai/sdk";

import {
  MissingCredentialError,
  type ChatEvent,
  type CompletionRequest,
  type Provider,
} from "@/lib/chat/types";

/**
 * Anthropic provider, including the tool loop.
 *
 * Notes on the request shape, since it differs from older Claude code:
 * - Adaptive thinking (`{type: "adaptive"}`), not a token budget.
 * - `effort` inside `output_config` controls depth; `xhigh` for coding work.
 * - Streaming always, so a long build can't hit an HTTP timeout.
 * - `fallbacks: "default"` re-runs a safety-classifier refusal on Anthropic's
 *   recommended fallback model server-side, so a false positive on a benign
 *   request doesn't come back as a dead end.
 *
 * The loop lives here rather than in the orchestrator because the conversation
 * it has to append to — assistant tool_use blocks, then user tool_result blocks —
 * is Anthropic-shaped. The orchestrator only supplies `runTool`.
 */

const BETAS = ["server-side-fallback-2026-07-01"];

/** Ceiling on tool rounds in one turn, so a confused loop can't run forever. */
const MAX_TOOL_ROUNDS = 8;

/** Tool results are summarised into the transcript; keep them bounded. */
const MAX_RESULT_CHARS = 12_000;

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

function toolParams(request: CompletionRequest) {
  if (!request.tools?.length) return {};
  return {
    tools: request.tools.map((tool) => ({
      name: tool.name,
      description: tool.description,
      input_schema: tool.inputSchema,
    })),
  };
}

/** What the model reads back from a tool call. */
function resultForModel(result: {
  ok: boolean;
  title: string;
  data: unknown;
  needsConfirmation?: string;
  notConnected?: string;
}): string {
  if (result.needsConfirmation) {
    return `NOT DONE — waiting on Ben's approval: ${result.needsConfirmation}\nTell him what you're about to do and that the Approve button is on the window.`;
  }
  if (result.notConnected) {
    return `NOT AVAILABLE — ${result.notConnected}\nTell him plainly which credential is missing; do not invent the data.`;
  }
  return JSON.stringify({ title: result.title, data: result.data }).slice(
    0,
    MAX_RESULT_CHARS,
  );
}

export const anthropicProvider: Provider = {
  async *stream(request: CompletionRequest): AsyncGenerator<ChatEvent> {
    const anthropic = client();
    const messages: Anthropic.Beta.BetaMessageParam[] = request.turns.map((turn) => ({
      role: turn.role,
      content: turn.content,
    }));

    let inputTokens = 0;
    let outputTokens = 0;

    for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
      const stream = anthropic.beta.messages.stream({
        model: request.modelId,
        max_tokens: request.maxTokens ?? 32_000,
        system: request.system,
        messages,
        thinking: { type: "adaptive" },
        output_config: { effort: effort() },
        betas: BETAS,
        fallbacks: "default",
        ...toolParams(request),
      });

      for await (const event of stream) {
        if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
          yield { type: "text", text: event.delta.text };
        }
      }

      const message = await stream.finalMessage();
      // Usage accumulates across rounds; the caller logs one total per turn.
      inputTokens += message.usage.input_tokens ?? 0;
      outputTokens += message.usage.output_tokens ?? 0;

      if (message.stop_reason === "refusal") {
        yield {
          type: "notice",
          text: `Declined by ${message.model}${
            message.stop_details?.category ? ` (${message.stop_details.category})` : ""
          }. Try another model from the switch.`,
        };
        break;
      }

      const toolUses = message.content.filter(
        (block): block is Anthropic.Beta.BetaToolUseBlock => block.type === "tool_use",
      );

      if (toolUses.length === 0 || !request.runTool) {
        if (message.stop_reason === "max_tokens") {
          yield {
            type: "notice",
            text: "Response hit the output cap and was cut off. Ask it to continue.",
          };
        }
        break;
      }

      // Echo the assistant turn back verbatim — the tool_use blocks have to be
      // in the history for the tool_results to attach to.
      messages.push({ role: "assistant", content: message.content });

      const resultBlocks: Anthropic.Beta.BetaToolResultBlockParam[] = [];
      for (const call of toolUses) {
        const input = (call.input ?? {}) as Record<string, unknown>;
        yield { type: "tool_call", id: call.id, name: call.name, input };

        const result = await request.runTool(call.name, input);
        yield { type: "tool_result", id: call.id, name: call.name, result };

        resultBlocks.push({
          type: "tool_result",
          tool_use_id: call.id,
          content: resultForModel(result),
          is_error: !result.ok && !result.needsConfirmation && !result.notConnected,
        });
      }

      messages.push({ role: "user", content: resultBlocks });

      if (round === MAX_TOOL_ROUNDS - 1) {
        yield {
          type: "notice",
          text: `Stopped after ${MAX_TOOL_ROUNDS} tool rounds in one turn.`,
        };
      }
    }

    yield { type: "usage", inputTokens, outputTokens };
  },

  async complete(request: CompletionRequest) {
    const stream = client().beta.messages.stream({
      model: request.modelId,
      max_tokens: request.maxTokens ?? 8_000,
      system: request.system,
      messages: request.turns.map((turn) => ({
        role: turn.role,
        content: turn.content,
      })),
      thinking: { type: "adaptive" },
      output_config: { effort: effort() },
      betas: BETAS,
      fallbacks: "default",
    });
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
