import {
  MissingCredentialError,
  type ChatEvent,
  type CompletionRequest,
  type Provider,
} from "@/lib/chat/types";

/**
 * One provider for both OpenAI and OpenClaw / minimax.
 *
 * Both speak the OpenAI `/chat/completions` shape, so this is a single fetch
 * implementation with two base URLs rather than two SDKs — and it works for any
 * future OpenAI-compatible endpoint Ben wants to route to.
 */

export interface OpenAICompatibleConfig {
  label: string;
  apiKeyEnv: string;
  baseUrlEnv: string;
  defaultBaseUrl: string;
}

interface Delta {
  choices?: Array<{ delta?: { content?: string }; finish_reason?: string | null }>;
  usage?: { prompt_tokens?: number; completion_tokens?: number };
}

export function createOpenAICompatibleProvider(
  config: OpenAICompatibleConfig,
): Provider {
  function credentials() {
    const apiKey = process.env[config.apiKeyEnv];
    if (!apiKey) {
      throw new MissingCredentialError(`${config.apiKeyEnv} is not set.`);
    }
    const baseUrl = process.env[config.baseUrlEnv] ?? config.defaultBaseUrl;
    return { apiKey, baseUrl: baseUrl.replace(/\/$/, "") };
  }

  function body(request: CompletionRequest, stream: boolean) {
    return JSON.stringify({
      model: request.modelId,
      stream,
      // Ask for usage on the final chunk so spend logging works while streaming.
      ...(stream ? { stream_options: { include_usage: true } } : {}),
      max_tokens: request.maxTokens ?? 8_000,
      messages: [
        { role: "system", content: request.system },
        ...request.turns.map((turn) => ({
          role: turn.role,
          content: turn.content,
        })),
      ],
    });
  }

  async function post(request: CompletionRequest, stream: boolean) {
    const { apiKey, baseUrl } = credentials();
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${apiKey}`,
      },
      body: body(request, stream),
    });
    if (!response.ok || !response.body) {
      const detail = (await response.text().catch(() => "")).slice(0, 300);
      throw new Error(
        `${config.label} responded ${response.status}${detail ? `: ${detail}` : ""}`,
      );
    }
    return response;
  }

  return {
    async *stream(request: CompletionRequest): AsyncGenerator<ChatEvent> {
      const response = await post(request, true);
      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let inputTokens = 0;
      let outputTokens = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        // SSE frames are separated by a blank line; keep any partial frame.
        const frames = buffer.split("\n\n");
        buffer = frames.pop() ?? "";

        for (const frame of frames) {
          for (const line of frame.split("\n")) {
            if (!line.startsWith("data:")) continue;
            const data = line.slice(5).trim();
            if (!data || data === "[DONE]") continue;
            let chunk: Delta;
            try {
              chunk = JSON.parse(data) as Delta;
            } catch {
              continue;
            }
            const text = chunk.choices?.[0]?.delta?.content;
            if (text) yield { type: "text", text };
            if (chunk.usage) {
              inputTokens = chunk.usage.prompt_tokens ?? inputTokens;
              outputTokens = chunk.usage.completion_tokens ?? outputTokens;
            }
          }
        }
      }

      yield { type: "usage", inputTokens, outputTokens };
    },

    async complete(request: CompletionRequest) {
      const response = await post(request, false);
      const parsed = (await response.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
        usage?: { prompt_tokens?: number; completion_tokens?: number };
      };
      return {
        text: parsed.choices?.[0]?.message?.content ?? "",
        inputTokens: parsed.usage?.prompt_tokens ?? 0,
        outputTokens: parsed.usage?.completion_tokens ?? 0,
      };
    },
  };
}

export const openAIProvider = createOpenAICompatibleProvider({
  label: "OpenAI",
  apiKeyEnv: "OPENAI_API_KEY",
  baseUrlEnv: "OPENAI_BASE_URL",
  defaultBaseUrl: "https://api.openai.com/v1",
});

export const openClawProvider = createOpenAICompatibleProvider({
  label: "OpenClaw / minimax",
  apiKeyEnv: "OPENCLAW_API_KEY",
  // OpenClaw fronts minimax; whoever holds the key sets the endpoint.
  baseUrlEnv: "OPENCLAW_BASE_URL",
  defaultBaseUrl: "https://api.minimax.io/v1",
});
