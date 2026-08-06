import { ChatShell } from "@/components/workspace/chat-shell";

/**
 * Megatron — same brain as Telegram (spec §9), embedded here.
 *
 * Runs on OpenClaw / minimax through the shared provider layer, with the live
 * dashboard numbers in its system prompt. Phase 3 swaps the transport for the
 * real Megatron endpoint so the Telegram thread and this one are one thread;
 * until then this is the same model with the same context, separate history.
 */
export function MegatronPanel() {
  return (
    <ChatShell
      agent="megatron"
      agentLabel="Megatron"
      placeholder="Ask Megatron anything — it can see the numbers on the left."
      intro="Megatron runs on OpenClaw / minimax and can see today's metrics and alerts. Set OPENCLAW_API_KEY to talk to it. Shared history with Telegram lands in Phase 3."
    />
  );
}
