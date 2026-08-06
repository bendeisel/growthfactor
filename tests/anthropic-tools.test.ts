import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { anthropicProvider } from "@/lib/chat/anthropic";
import type { ChatEvent } from "@/lib/chat/types";
import { MissingCredentialError } from "@/lib/chat/types";
import type { ToolResult } from "@/lib/tools/types";

/**
 * The tool loop, driven by canned Anthropic responses.
 *
 * This is the part with the most moving pieces: parse tool_use out of a stream,
 * run the tool, append assistant + tool_result turns in the shape the API
 * expects, and go round again. Stubbing at the fetch layer exercises the real
 * SDK parsing rather than a mock of it.
 */

const ORIGINAL_ENV = { ...process.env };
const ORIGINAL_FETCH = globalThis.fetch;

function sse(frames: Array<Record<string, unknown>>): Response {
  const body = frames
    .map((frame) => `event: ${String(frame.type)}\ndata: ${JSON.stringify(frame)}\n\n`)
    .join("");
  return new Response(body, {
    status: 200,
    headers: { "content-type": "text/event-stream" },
  });
}

/** A turn that emits one tool_use block and stops for tool results. */
function toolUseTurn(name: string, input: Record<string, unknown>) {
  const json = JSON.stringify(input);
  return sse([
    {
      type: "message_start",
      message: {
        id: "msg_1",
        type: "message",
        role: "assistant",
        model: "claude-opus-5",
        content: [],
        stop_reason: null,
        stop_sequence: null,
        usage: { input_tokens: 100, output_tokens: 0 },
      },
    },
    {
      type: "content_block_start",
      index: 0,
      content_block: { type: "tool_use", id: "toolu_1", name, input: {} },
    },
    {
      type: "content_block_delta",
      index: 0,
      delta: { type: "input_json_delta", partial_json: json },
    },
    { type: "content_block_stop", index: 0 },
    {
      type: "message_delta",
      delta: { stop_reason: "tool_use", stop_sequence: null },
      usage: { output_tokens: 20 },
    },
    { type: "message_stop" },
  ]);
}

/** A turn that just says something and ends. */
function textTurn(text: string, stopReason = "end_turn") {
  return sse([
    {
      type: "message_start",
      message: {
        id: "msg_2",
        type: "message",
        role: "assistant",
        model: "claude-opus-5",
        content: [],
        stop_reason: null,
        stop_sequence: null,
        usage: { input_tokens: 200, output_tokens: 0 },
      },
    },
    { type: "content_block_start", index: 0, content_block: { type: "text", text: "" } },
    {
      type: "content_block_delta",
      index: 0,
      delta: { type: "text_delta", text },
    },
    { type: "content_block_stop", index: 0 },
    {
      type: "message_delta",
      delta: { stop_reason: stopReason, stop_sequence: null },
      usage: { output_tokens: 30 },
    },
    { type: "message_stop" },
  ]);
}

const okResult: ToolResult = {
  ok: true,
  panel: "table",
  title: "All businesses",
  data: { columns: ["Business"], rows: [["Nashville MMA"]] },
};

async function collect(stream: AsyncGenerator<ChatEvent>): Promise<ChatEvent[]> {
  const events: ChatEvent[] = [];
  for await (const event of stream) events.push(event);
  return events;
}

const request = {
  modelId: "claude-opus-5",
  system: "You are a test.",
  turns: [{ role: "user" as const, content: "How is Nashville doing?" }],
};

beforeEach(() => {
  process.env = { ...ORIGINAL_ENV, ANTHROPIC_API_KEY: "sk-ant-test" };
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
  globalThis.fetch = ORIGINAL_FETCH;
  vi.restoreAllMocks();
});

describe("Anthropic provider", () => {
  it("names the missing key rather than failing obscurely", async () => {
    delete process.env.ANTHROPIC_API_KEY;
    await expect(collect(anthropicProvider.stream(request))).rejects.toBeInstanceOf(
      MissingCredentialError,
    );
  });

  it("runs a tool, feeds the result back, and streams the follow-up answer", async () => {
    const runTool = vi.fn(async () => okResult);
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(toolUseTurn("get_metrics", { business_id: "nashville-mma" }))
      .mockResolvedValueOnce(textTurn("Nashville is ahead of pace."));
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const events = await collect(
      anthropicProvider.stream({ ...request, tools: [], runTool }),
    );

    // The tool ran once, with the input the model sent.
    expect(runTool).toHaveBeenCalledTimes(1);
    expect(runTool).toHaveBeenCalledWith("get_metrics", {
      business_id: "nashville-mma",
    });

    const call = events.find((event) => event.type === "tool_call");
    const result = events.find((event) => event.type === "tool_result");
    expect(call).toMatchObject({ name: "get_metrics", id: "toolu_1" });
    expect(result).toMatchObject({ name: "get_metrics", result: { ok: true } });

    // And the answer after the tool came through as text.
    const text = events
      .filter((event) => event.type === "text")
      .map((event) => event.text)
      .join("");
    expect(text).toBe("Nashville is ahead of pace.");

    // Usage is summed across both rounds, so one turn logs one total.
    expect(events.at(-1)).toEqual({
      type: "usage",
      inputTokens: 300,
      outputTokens: 50,
    });

    // Second request carried the assistant tool_use and the user tool_result.
    const secondBody = JSON.parse(
      (fetchMock.mock.calls[1][1] as RequestInit).body as string,
    ) as { messages: Array<{ role: string; content: unknown }> };
    expect(secondBody.messages).toHaveLength(3);
    expect(secondBody.messages[1].role).toBe("assistant");
    expect(secondBody.messages[2].role).toBe("user");
    expect(JSON.stringify(secondBody.messages[2].content)).toContain("toolu_1");
  });

  it("tells the model to ask for approval instead of retrying, when a tool is gated", async () => {
    const runTool = vi.fn(async () => ({
      ok: false,
      panel: "text" as const,
      title: "Send mail",
      needsConfirmation: "Send “Hello” to sam@example.com?",
      data: { text: "Send “Hello” to sam@example.com?" },
    }));
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(toolUseTurn("gmail_send", { to: "sam@example.com" }))
      .mockResolvedValueOnce(textTurn("Say the word and I'll send it."));
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    await collect(anthropicProvider.stream({ ...request, tools: [], runTool }));

    const toolResultBlock = JSON.stringify(
      JSON.parse((fetchMock.mock.calls[1][1] as RequestInit).body as string),
    );
    expect(toolResultBlock).toContain("waiting on Ben's approval");
    // A gate is not an error — flagging it as one makes the model retry.
    expect(toolResultBlock).not.toContain('"is_error":true');
  });

  it("passes a not-connected result through as information, not failure", async () => {
    const runTool = vi.fn(async () => ({
      ok: false,
      panel: "text" as const,
      title: "Inbox",
      notConnected: "Gmail is not connected yet. Needs: GOOGLE_OAUTH_CLIENT_ID.",
      data: { text: "..." },
    }));
    globalThis.fetch = vi
      .fn()
      .mockResolvedValueOnce(toolUseTurn("gmail_search", { query: "is:unread" }))
      .mockResolvedValueOnce(textTurn("Gmail isn't connected yet.")) as unknown as typeof fetch;

    const events = await collect(
      anthropicProvider.stream({ ...request, tools: [], runTool }),
    );
    const result = events.find((event) => event.type === "tool_result");
    expect(result).toMatchObject({ result: { notConnected: expect.any(String) } });
  });

  it("stops after the round cap instead of looping forever", async () => {
    const runTool = vi.fn(async () => okResult);
    // Always asks for another tool call — the model that never finishes.
    globalThis.fetch = vi.fn(async () =>
      toolUseTurn("get_metrics", {}),
    ) as unknown as typeof fetch;

    const events = await collect(
      anthropicProvider.stream({ ...request, tools: [], runTool }),
    );

    expect(runTool.mock.calls.length).toBeLessThanOrEqual(8);
    expect(
      events.some(
        (event) => event.type === "notice" && event.text.includes("tool rounds"),
      ),
    ).toBe(true);
  });

  it("does not call tools when none are offered", async () => {
    globalThis.fetch = vi.fn(async () =>
      textTurn("Just answering."),
    ) as unknown as typeof fetch;

    const events = await collect(anthropicProvider.stream(request));
    expect(events.some((event) => event.type === "tool_call")).toBe(false);
    expect(events.filter((event) => event.type === "text")).toHaveLength(1);
  });

  it("surfaces a refusal as a notice rather than empty output", async () => {
    globalThis.fetch = vi.fn(async () =>
      sse([
        {
          type: "message_start",
          message: {
            id: "msg_3",
            type: "message",
            role: "assistant",
            model: "claude-opus-5",
            content: [],
            stop_reason: null,
            stop_sequence: null,
            usage: { input_tokens: 10, output_tokens: 0 },
          },
        },
        {
          type: "message_delta",
          delta: {
            stop_reason: "refusal",
            stop_sequence: null,
            stop_details: { type: "refusal", category: "cyber" },
          },
          usage: { output_tokens: 0 },
        },
        { type: "message_stop" },
      ]),
    ) as unknown as typeof fetch;

    const events = await collect(anthropicProvider.stream(request));
    expect(
      events.some((event) => event.type === "notice" && event.text.includes("Declined")),
    ).toBe(true);
  });
});
