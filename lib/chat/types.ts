import type { ToolDefinition, ToolResult } from "@/lib/tools/types";

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

/**
 * One provider-agnostic event out of a streaming completion.
 *
 * `notice` carries things the user must see but the model didn't say — a
 * refusal, a budget warning, a delegated subtask's result — so the UI can style
 * them as system text rather than passing them off as the model's answer.
 */
export type ChatEvent =
  | { type: "text"; text: string }
  | { type: "notice"; text: string }
  | { type: "usage"; inputTokens: number; outputTokens: number }
  | { type: "error"; text: string }
  /** The agent reached for a tool — the UI shows this as a window opening. */
  | { type: "tool_call"; id: string; name: string; input: Record<string, unknown> }
  /** That tool's result, which the UI renders as the window's contents. */
  | { type: "tool_result"; id: string; name: string; result: ToolResult };

export interface CompletionRequest {
  modelId: string;
  system: string;
  turns: ChatTurn[];
  /** Cap on output tokens for this call. */
  maxTokens?: number;
  /** Tools the model may call. Omit for a plain chat turn. */
  tools?: ToolDefinition[];
  /** Executes a tool call. Required when `tools` is set. */
  runTool?: (
    name: string,
    input: Record<string, unknown>,
  ) => Promise<ToolResult>;
}

export interface Provider {
  /** Streaming completion; yields text as it arrives, usage at the end. */
  stream(request: CompletionRequest): AsyncGenerator<ChatEvent>;
  /** Single-shot completion, used for delegated subtasks. */
  complete(request: CompletionRequest): Promise<{
    text: string;
    inputTokens: number;
    outputTokens: number;
  }>;
}

export class MissingCredentialError extends Error {}
