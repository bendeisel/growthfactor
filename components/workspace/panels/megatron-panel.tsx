import { ChatShell } from "@/components/workspace/chat-shell";

/**
 * Megatron — same brain as Telegram (spec §9), embedded here.
 * Phase 3 points this at the Megatron web endpoint / WebSocket; Phase 1 ships
 * the surface and tells you what is still unwired.
 */
export function MegatronPanel() {
  return (
    <ChatShell
      agentLabel="Megatron"
      endpoint="/api/chat"
      payload={{ agent: "megatron" }}
      placeholder="Ask Megatron anything — same context as Telegram."
      intro="Megatron runs on OpenClaw / minimax and shares state with Telegram. The web transport is wired up in Phase 3; until then this tab reports what it needs rather than answering."
    />
  );
}
