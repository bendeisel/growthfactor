import { runChat } from "@/lib/chat";
import type { ChatTurn } from "@/lib/chat/types";
import { DEFAULT_MODEL_ID } from "@/lib/models";

export const dynamic = "force-dynamic";
// Needs Node: the provider SDKs and the budget log both touch the filesystem.
export const runtime = "nodejs";

interface ChatRequest {
  turns?: unknown;
  agent?: unknown;
  modelId?: unknown;
  delegateTo?: unknown;
  approvedTools?: unknown;
}

function parseTurns(value: unknown): ChatTurn[] | null {
  if (!Array.isArray(value) || value.length === 0) return null;
  const turns: ChatTurn[] = [];
  for (const entry of value) {
    const role = (entry as ChatTurn)?.role;
    const content = (entry as ChatTurn)?.content;
    if ((role !== "user" && role !== "assistant") || typeof content !== "string") {
      return null;
    }
    if (content.length > 100_000) return null;
    turns.push({ role, content });
  }
  // Conversations must end on the user's turn for the model to answer it.
  return turns.at(-1)?.role === "user" ? turns : null;
}

/**
 * Streams a turn as Server-Sent Events, one JSON `ChatEvent` per frame, so the
 * UI paints tokens as they arrive instead of waiting for a long build to finish.
 */
export async function POST(request: Request) {
  let body: ChatRequest;
  try {
    body = (await request.json()) as ChatRequest;
  } catch {
    return Response.json({ error: "Body must be JSON." }, { status: 400 });
  }

  const turns = parseTurns(body.turns);
  if (!turns) {
    return Response.json(
      { error: "`turns` must be a non-empty history ending with a user turn." },
      { status: 400 },
    );
  }

  const agent = body.agent === "megatron" ? "megatron" : "claude-code";
  const modelId =
    typeof body.modelId === "string" && agent === "claude-code"
      ? body.modelId
      : DEFAULT_MODEL_ID;
  const delegateTo =
    typeof body.delegateTo === "string" && body.delegateTo ? body.delegateTo : undefined;
  // Approvals are per-request: whatever Ben ticked for this send, nothing more.
  const approvedTools = Array.isArray(body.approvedTools)
    ? body.approvedTools.filter((name): name is string => typeof name === "string")
    : [];

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (payload: unknown) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
      try {
        for await (const event of runChat({
          agent,
          modelId,
          turns,
          delegateTo,
          approvedTools,
        })) {
          send(event);
        }
      } catch (error) {
        send({
          type: "error",
          text: error instanceof Error ? error.message : String(error),
        });
      } finally {
        send({ type: "done" });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-store, no-transform",
      connection: "keep-alive",
    },
  });
}
