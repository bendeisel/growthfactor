import { NextResponse } from "next/server";

import { DEFAULT_MODEL_ID, PROVIDERS, getModel } from "@/lib/models";

export const dynamic = "force-dynamic";

interface ChatRequest {
  message?: unknown;
  agent?: unknown;
  modelId?: unknown;
  delegateTo?: unknown;
}

/**
 * Phase 1 chat endpoint.
 *
 * It deliberately does not answer as a model. Provider calls land in Phase 3;
 * until then this reports exactly which provider and credential the turn would
 * have needed, so a fake reply never gets mistaken for a real one.
 */
export async function POST(request: Request) {
  let body: ChatRequest;
  try {
    body = (await request.json()) as ChatRequest;
  } catch {
    return NextResponse.json({ error: "Body must be JSON." }, { status: 400 });
  }

  const message = typeof body.message === "string" ? body.message.trim() : "";
  if (!message) {
    return NextResponse.json(
      { error: "`message` is required." },
      { status: 400 },
    );
  }

  const agent = body.agent === "megatron" ? "megatron" : "claude-code";
  const requestedId =
    typeof body.modelId === "string" ? body.modelId : DEFAULT_MODEL_ID;
  const model =
    agent === "megatron"
      ? getModel(DEFAULT_MODEL_ID)
      : (getModel(requestedId) ?? getModel(DEFAULT_MODEL_ID));

  if (!model) {
    return NextResponse.json(
      { error: `Unknown model: ${requestedId}` },
      { status: 400 },
    );
  }

  const provider = PROVIDERS[model.provider];
  const configured = Boolean(process.env[model.envVar]);
  const delegate =
    typeof body.delegateTo === "string" ? getModel(body.delegateTo) : undefined;

  const lines = [
    `Not sent — ${provider.label} is not wired up yet (Phase 3).`,
    `Active model: ${model.label} (${model.id}).`,
    configured
      ? `${model.envVar} is set, so this turn is one transport away from working.`
      : `Missing ${model.envVar}.`,
  ];
  if (delegate) {
    lines.push(
      `Subtask would be delegated to ${delegate.label} via ${PROVIDERS[delegate.provider].label}.`,
    );
  }
  if (agent === "megatron") {
    lines.push("Megatron also needs MEGATRON_WEBHOOK_URL to share Telegram state.");
  }

  return NextResponse.json({
    role: "system",
    text: lines.join(" "),
    modelLabel: model.label,
  });
}
