"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { CornerDownLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type ChatRole = "user" | "agent" | "system";

export interface ChatMessage {
  id: string;
  role: ChatRole;
  text: string;
  /** Which model produced (or would have produced) the turn. */
  modelLabel?: string;
}

export interface ChatShellProps {
  /** Who the user is talking to, shown on agent turns. */
  agentLabel: string;
  /** Sits above the composer — the model switch lives here in the Claude Code tab. */
  toolbar?: ReactNode;
  placeholder: string;
  /** Opening message, so an empty tab still explains itself. */
  intro: string;
  /** POST target. Phase 1 answers with a connection notice, not a completion. */
  endpoint: string;
  /** Extra fields sent with every message (agent id, active model, ...). */
  payload?: Record<string, unknown>;
}

let seq = 0;
function nextId(prefix: string) {
  seq += 1;
  return `${prefix}-${seq}`;
}

export function ChatShell({
  agentLabel,
  toolbar,
  placeholder,
  intro,
  endpoint,
  payload,
}: ChatShellProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: "intro", role: "system", text: intro },
  ]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  async function send() {
    const text = draft.trim();
    if (!text || sending) return;
    setDraft("");
    setMessages((prev) => [
      ...prev,
      { id: nextId("user"), role: "user", text },
    ]);
    setSending(true);

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message: text, ...payload }),
      });
      const body = (await response.json()) as {
        role?: ChatRole;
        text?: string;
        modelLabel?: string;
      };
      setMessages((prev) => [
        ...prev,
        {
          id: nextId("reply"),
          role: body.role ?? "system",
          text: body.text ?? "No response body.",
          modelLabel: body.modelLabel,
        },
      ]);
    } catch (cause) {
      setMessages((prev) => [
        ...prev,
        {
          id: nextId("reply"),
          role: "system",
          text: `Request failed: ${cause instanceof Error ? cause.message : "unknown error"}`,
        },
      ]);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div ref={scrollRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
        {messages.map((message) => (
          <Bubble key={message.id} message={message} agentLabel={agentLabel} />
        ))}
        {sending ? (
          <p className="text-xs text-ink-dim breathe">Thinking…</p>
        ) : null}
      </div>

      <div className="border-t border-line">
        {toolbar ? (
          <div className="flex flex-wrap items-center gap-2 border-b border-line px-3 py-2">
            {toolbar}
          </div>
        ) : null}
        <form
          className="flex items-end gap-2 p-3"
          onSubmit={(event) => {
            event.preventDefault();
            void send();
          }}
        >
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void send();
              }
            }}
            rows={2}
            placeholder={placeholder}
            className="min-h-[2.75rem] flex-1 resize-none rounded-lg border border-line bg-bg-elevated px-3 py-2 text-sm text-ink placeholder:text-ink-dim focus-visible:border-accent/60 focus-visible:outline-none"
          />
          <Button type="submit" variant="solid" disabled={!draft.trim() || sending}>
            Send
            <CornerDownLeft className="size-3.5" />
          </Button>
        </form>
      </div>
    </div>
  );
}

function Bubble({
  message,
  agentLabel,
}: {
  message: ChatMessage;
  agentLabel: string;
}) {
  if (message.role === "system") {
    return (
      <p className="rounded-lg border border-line bg-bg-elevated/70 px-3 py-2 text-xs leading-relaxed text-ink-muted">
        {message.text}
      </p>
    );
  }

  const isUser = message.role === "user";
  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[85%] rounded-xl px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap",
          isUser
            ? "bg-accent/15 text-ink"
            : "border border-line bg-panel text-ink",
        )}
      >
        {!isUser ? (
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-dim">
            {message.modelLabel ?? agentLabel}
          </p>
        ) : null}
        {message.text}
      </div>
    </div>
  );
}
