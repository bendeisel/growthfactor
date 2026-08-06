import { anthropicProvider } from "@/lib/chat/anthropic";
import { openAIProvider, openClawProvider } from "@/lib/chat/openai-compatible";
import { buildSystemPrompt } from "@/lib/chat/system";
import {
  MissingCredentialError,
  type ChatEvent,
  type ChatTurn,
  type Provider,
} from "@/lib/chat/types";
import { checkBudget, record } from "@/lib/budget";
import { DEFAULT_MODEL_ID, getModel, type ProviderId } from "@/lib/models";
import { costCentsFor } from "@/lib/pricing";

const PROVIDERS: Record<ProviderId, Provider> = {
  anthropic: anthropicProvider,
  openai: openAIProvider,
  openclaw: openClawProvider,
};

export interface ChatRunOptions {
  agent: "megatron" | "claude-code";
  modelId: string;
  turns: ChatTurn[];
  /** Hand this turn's subtask to a second model first (hybrid switch, spec §7). */
  delegateTo?: string;
}

/** Log spend for one call. Never throws — a logging failure must not eat a reply. */
async function logUsage(
  modelId: string,
  inputTokens: number,
  outputTokens: number,
  note: string,
): Promise<void> {
  try {
    await record({
      at: new Date().toISOString(),
      modelId,
      inputTokens,
      outputTokens,
      costCents: costCentsFor(modelId, inputTokens, outputTokens),
      note,
    });
  } catch {
    // Budget log is best-effort; the meter will simply be behind.
  }
}

/**
 * Runs one turn and yields provider-agnostic events.
 *
 * Order matters: budget first (a cap checked after the call isn't a cap), then
 * the optional delegated subtask, then the streamed answer. Every provider call
 * that returns usage gets logged, including the subtask.
 */
export async function* runChat(options: ChatRunOptions): AsyncGenerator<ChatEvent> {
  const model = getModel(options.modelId) ?? getModel(DEFAULT_MODEL_ID);
  if (!model) {
    yield { type: "error", text: `Unknown model: ${options.modelId}` };
    return;
  }

  const budget = await checkBudget();
  if (!budget.allowed) {
    yield { type: "error", text: budget.reason ?? "Budget cap reached." };
    return;
  }
  if (budget.warning) {
    yield { type: "notice", text: budget.warning };
  }

  const system = await buildSystemPrompt(options.agent);
  let turns = options.turns;

  // --- delegated subtask ---------------------------------------------------
  const delegate = options.delegateTo ? getModel(options.delegateTo) : undefined;
  if (delegate && delegate.id !== model.id) {
    const question = turns.at(-1)?.content ?? "";
    try {
      const result = await PROVIDERS[delegate.provider].complete({
        modelId: delegate.id,
        system: `${system}\n\nYou are being called as a subtask by another model. Answer the specific question directly and briefly; your answer is passed on as context, not shown to the user.`,
        turns: [{ role: "user", content: question }],
        maxTokens: 2_000,
      });
      await logUsage(delegate.id, result.inputTokens, result.outputTokens, "subtask");
      yield { type: "notice", text: `Subtask → ${delegate.label}: ${result.text}` };
      turns = [
        ...turns.slice(0, -1),
        {
          role: "user",
          content: `${question}\n\n<subtask_result model="${delegate.id}">\n${result.text}\n</subtask_result>`,
        },
      ];
    } catch (error) {
      yield {
        type: "notice",
        text: `Subtask to ${delegate.label} failed: ${describe(error)}. Continuing without it.`,
      };
    }
  }

  // --- main answer ---------------------------------------------------------
  let inputTokens = 0;
  let outputTokens = 0;
  try {
    for await (const event of PROVIDERS[model.provider].stream({
      modelId: model.id,
      system,
      turns,
    })) {
      if (event.type === "usage") {
        inputTokens = event.inputTokens;
        outputTokens = event.outputTokens;
        continue;
      }
      yield event;
    }
  } catch (error) {
    yield { type: "error", text: describe(error) };
  }

  if (inputTokens > 0 || outputTokens > 0) {
    await logUsage(model.id, inputTokens, outputTokens, options.agent);
    yield { type: "usage", inputTokens, outputTokens };
  }
}

function describe(error: unknown): string {
  if (error instanceof MissingCredentialError) {
    return `${error.message} Add it to .env.local and restart.`;
  }
  return error instanceof Error ? error.message : String(error);
}
