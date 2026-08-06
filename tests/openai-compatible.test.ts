import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createOpenAICompatibleProvider } from "@/lib/chat/openai-compatible";
import { MissingCredentialError, type ChatEvent } from "@/lib/chat/types";

const ORIGINAL_ENV = { ...process.env };
const ORIGINAL_FETCH = globalThis.fetch;

const provider = createOpenAICompatibleProvider({
  label: "Test provider",
  apiKeyEnv: "TEST_API_KEY",
  baseUrlEnv: "TEST_BASE_URL",
  defaultBaseUrl: "https://example.invalid/v1",
});

const request = {
  modelId: "test-model",
  system: "You are a test.",
  turns: [{ role: "user" as const, content: "hello" }],
};

/** Serves the given chunks as a streaming response body, verbatim. */
function streamingResponse(chunks: string[]) {
  const encoder = new TextEncoder();
  return new Response(
    new ReadableStream({
      start(controller) {
        for (const chunk of chunks) controller.enqueue(encoder.encode(chunk));
        controller.close();
      },
    }),
    { status: 200, headers: { "content-type": "text/event-stream" } },
  );
}

function delta(text: string) {
  return `data: ${JSON.stringify({ choices: [{ delta: { content: text } }] })}\n\n`;
}

async function collect(stream: AsyncGenerator<ChatEvent>): Promise<ChatEvent[]> {
  const events: ChatEvent[] = [];
  for await (const event of stream) events.push(event);
  return events;
}

beforeEach(() => {
  process.env = { ...ORIGINAL_ENV, TEST_API_KEY: "sk-test" };
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
  globalThis.fetch = ORIGINAL_FETCH;
  vi.restoreAllMocks();
});

describe("OpenAI-compatible provider", () => {
  it("refuses to call without a key, naming the variable to set", async () => {
    delete process.env.TEST_API_KEY;
    await expect(collect(provider.stream(request))).rejects.toBeInstanceOf(
      MissingCredentialError,
    );
    await expect(collect(provider.stream(request))).rejects.toThrow("TEST_API_KEY");
  });

  it("yields text deltas in order, then usage", async () => {
    globalThis.fetch = vi.fn(async () =>
      streamingResponse([
        delta("Hello"),
        delta(" world"),
        `data: ${JSON.stringify({
          choices: [{ delta: {}, finish_reason: "stop" }],
          usage: { prompt_tokens: 42, completion_tokens: 7 },
        })}\n\n`,
        "data: [DONE]\n\n",
      ]),
    ) as unknown as typeof fetch;

    const events = await collect(provider.stream(request));

    expect(
      events.filter((event) => event.type === "text").map((event) => event.text),
    ).toEqual(["Hello", " world"]);
    expect(events.at(-1)).toEqual({
      type: "usage",
      inputTokens: 42,
      outputTokens: 7,
    });
  });

  it("reassembles a frame split across network chunks", async () => {
    const frame = delta("split");
    const half = Math.floor(frame.length / 2);
    globalThis.fetch = vi.fn(async () =>
      streamingResponse([frame.slice(0, half), frame.slice(half), "data: [DONE]\n\n"]),
    ) as unknown as typeof fetch;

    const events = await collect(provider.stream(request));
    expect(
      events.filter((event) => event.type === "text").map((event) => event.text),
    ).toEqual(["split"]);
  });

  it("skips keep-alive comments and malformed frames instead of dying", async () => {
    globalThis.fetch = vi.fn(async () =>
      streamingResponse([
        ": keep-alive\n\n",
        "data: {not json}\n\n",
        delta("survived"),
        "data: [DONE]\n\n",
      ]),
    ) as unknown as typeof fetch;

    const events = await collect(provider.stream(request));
    expect(
      events.filter((event) => event.type === "text").map((event) => event.text),
    ).toEqual(["survived"]);
  });

  it("reports zero usage rather than guessing when the provider omits it", async () => {
    globalThis.fetch = vi.fn(async () =>
      streamingResponse([delta("hi"), "data: [DONE]\n\n"]),
    ) as unknown as typeof fetch;

    const events = await collect(provider.stream(request));
    expect(events.at(-1)).toEqual({ type: "usage", inputTokens: 0, outputTokens: 0 });
  });

  it("surfaces an HTTP error with the provider's own detail", async () => {
    globalThis.fetch = vi.fn(
      async () => new Response("model not found", { status: 404 }),
    ) as unknown as typeof fetch;

    await expect(collect(provider.stream(request))).rejects.toThrow(
      /Test provider responded 404: model not found/,
    );
  });

  it("sends the system prompt first and asks for usage while streaming", async () => {
    const fetchMock = vi.fn(async () => streamingResponse(["data: [DONE]\n\n"]));
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    await collect(provider.stream(request));

    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://example.invalid/v1/chat/completions");
    expect((init.headers as Record<string, string>).authorization).toBe("Bearer sk-test");
    const body = JSON.parse(init.body as string) as {
      messages: Array<{ role: string }>;
      stream_options?: { include_usage?: boolean };
    };
    expect(body.messages[0].role).toBe("system");
    expect(body.stream_options?.include_usage).toBe(true);
  });

  it("honours a base URL override and trims a trailing slash", async () => {
    process.env.TEST_BASE_URL = "https://openclaw.example/v1/";
    const fetchMock = vi.fn(async (_url: string | URL, _init?: RequestInit) =>
      streamingResponse(["data: [DONE]\n\n"]),
    );
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    await collect(provider.stream(request));
    expect(String(fetchMock.mock.calls[0][0])).toBe(
      "https://openclaw.example/v1/chat/completions",
    );
  });

  it("returns text and usage from a non-streaming completion", async () => {
    globalThis.fetch = vi.fn(
      async () =>
        new Response(
          JSON.stringify({
            choices: [{ message: { content: "subtask answer" } }],
            usage: { prompt_tokens: 10, completion_tokens: 4 },
          }),
          { status: 200, headers: { "content-type": "application/json" } },
        ),
    ) as unknown as typeof fetch;

    const result = await provider.complete(request);
    expect(result).toEqual({
      text: "subtask answer",
      inputTokens: 10,
      outputTokens: 4,
    });
  });
});
