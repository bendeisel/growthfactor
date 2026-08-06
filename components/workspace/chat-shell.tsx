"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { CornerDownLeft, Square, Trash2, Wrench } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  appForTool,
  useWorkspace,
} from "@/components/workspace/workspace-context";
import { cn } from "@/lib/utils";
import type { ToolResult } from "@/lib/tools/types";

export type ChatRole = "user" | "assistant" | "system";

export interface ChatMessage {
  id: string;
  role: ChatRole;
  text: string;
  modelLabel?: string;
  tone?: "notice" | "error";
  usage?: { inputTokens: number; outputTokens: number };
  /** Compact inline record of a tool the agent reached for. */
  tool?: { name: string; ok: boolean; title: string };
}

export interface ChatShellProps {
  /** Storage key + payload discriminator. */
  agent: "megatron" | "claude-code";
  agentLabel: string;
  toolbar?: ReactNode;
  placeholder: string;
  intro: string;
  /** Extra fields sent with every message (active model, delegate target). */
  payload?: Record<string, unknown>;
  /** Fired after a turn completes, so the budget meter can refresh. */
  onTurnComplete?: () => void;
}

interface StreamEvent {
  type: "text" | "notice" | "usage" | "error" | "tool_call" | "tool_result" | "done";
  text?: string;
  inputTokens?: number;
  outputTokens?: number;
  id?: string;
  name?: string;
  input?: Record<string, unknown>;
  result?: ToolResult;
}

let seq = 0;
function nextId(prefix: string) {
  seq += 1;
  return `${prefix}-${Date.now()}-${seq}`;
}

const STORAGE_KEY = "cc.thread.command-center";

export function ChatShell({
  agent,
  agentLabel,
  toolbar,
  placeholder,
  intro,
  payload,
  onTurnComplete,
}: ChatShellProps) {
  const { setAgentState, openWindow, resolveWindow, registerAsk } = useWorkspace();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [streaming, setStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  // The live history, so `ask()` from another panel doesn't send a stale thread.
  const messagesRef = useRef<ChatMessage[]>([]);
  messagesRef.current = messages;

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setMessages(JSON.parse(saved) as ChatMessage[]);
    } catch {
      /* corrupt or unavailable storage just starts a fresh thread */
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-100)));
    } catch {
      /* quota or private mode — the thread simply won't persist */
    }
  }, [messages]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setStreaming(false);
    setAgentState("idle");
  }, [setAgentState]);

  const send = useCallback(
    async (text: string, options?: { approve?: string }) => {
      const body = text.trim();
      if (!body || abortRef.current) return;

      const userMessage: ChatMessage = { id: nextId("user"), role: "user", text: body };
      const history = [...messagesRef.current, userMessage];
      setMessages(history);
      setDraft("");
      setStreaming(true);
      setAgentState("thinking");

      const replyId = nextId("assistant");
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "content-type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            agent,
            ...payload,
            approvedTools: options?.approve ? [options.approve] : [],
            turns: history
              .filter((message) => message.role !== "system" && !message.tool)
              .map((message) => ({ role: message.role, content: message.text })),
          }),
        });

        if (!response.ok || !response.body) {
          const detail = await response.text().catch(() => "");
          throw new Error(detail.slice(0, 200) || `HTTP ${response.status}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const frames = buffer.split("\n\n");
          buffer = frames.pop() ?? "";

          for (const frame of frames) {
            const line = frame.split("\n").find((candidate) => candidate.startsWith("data:"));
            if (!line) continue;
            let event: StreamEvent;
            try {
              event = JSON.parse(line.slice(5).trim()) as StreamEvent;
            } catch {
              continue;
            }
            applyEvent(event, replyId, {
              setMessages,
              setAgentState,
              openWindow,
              resolveWindow,
            });
          }
        }
      } catch (cause) {
        if (!(cause instanceof DOMException && cause.name === "AbortError")) {
          setMessages((prev) => [
            ...prev,
            {
              id: nextId("error"),
              role: "system",
              tone: "error",
              text: cause instanceof Error ? cause.message : "Request failed.",
            },
          ]);
        }
      } finally {
        abortRef.current = null;
        setStreaming(false);
        setAgentState("idle");
        onTurnComplete?.();
      }
    },
    [agent, onTurnComplete, openWindow, payload, resolveWindow, setAgentState],
  );

  // Let the app column and Approve buttons drive this thread.
  useEffect(() => {
    registerAsk((text, options) => void send(text, options));
  }, [registerAsk, send]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div ref={scrollRef} className="min-h-0 flex-1 space-y-2.5 overflow-y-auto p-3">
        {messages.length === 0 ? (
          <p className="rounded-lg border border-line bg-bg-elevated/70 px-3 py-2 text-xs leading-relaxed text-ink-muted">
            {intro}
          </p>
        ) : null}
        {messages.map((message) => (
          <Bubble key={message.id} message={message} agentLabel={agentLabel} />
        ))}
        {streaming ? <p className="text-xs text-ink-dim breathe">Working…</p> : null}
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
            void send(draft);
          }}
        >
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void send(draft);
              }
            }}
            rows={2}
            placeholder={placeholder}
            className="min-h-[2.75rem] flex-1 resize-none rounded-lg border border-line bg-bg-elevated px-3 py-2 text-sm text-ink placeholder:text-ink-dim focus-visible:border-accent/60 focus-visible:outline-none"
          />
          {messages.length > 0 ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              title="Clear thread"
              aria-label="Clear thread"
              onClick={() => setMessages([])}
            >
              <Trash2 className="size-3.5" />
            </Button>
          ) : null}
          {streaming ? (
            <Button type="button" variant="outline" onClick={stop}>
              <Square className="size-3" />
              Stop
            </Button>
          ) : (
            <Button type="submit" variant="solid" disabled={!draft.trim()}>
              Send
              <CornerDownLeft className="size-3.5" />
            </Button>
          )}
        </form>
      </div>
    </div>
  );
}

/** Folds one stream event into the transcript and the workspace. */
function applyEvent(
  event: StreamEvent,
  replyId: string,
  deps: {
    setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
    setAgentState: (state: "idle" | "thinking" | "working") => void;
    openWindow: ReturnType<typeof useWorkspace>["openWindow"];
    resolveWindow: ReturnType<typeof useWorkspace>["resolveWindow"];
  },
) {
  const { setMessages, setAgentState, openWindow, resolveWindow } = deps;

  if (event.type === "text" && event.text) {
    const chunk = event.text;
    setMessages((prev) => {
      const index = prev.findIndex((message) => message.id === replyId);
      if (index === -1) {
        return [...prev, { id: replyId, role: "assistant", text: chunk }];
      }
      const next = [...prev];
      next[index] = { ...next[index], text: next[index].text + chunk };
      return next;
    });
    return;
  }

  if (event.type === "tool_call" && event.id && event.name) {
    setAgentState("working");
    openWindow({
      id: event.id,
      toolName: event.name,
      app: appForTool(event.name),
      title: event.name.replace(/_/g, " "),
      input: event.input ?? {},
    });
    return;
  }

  if (event.type === "tool_result" && event.id && event.name && event.result) {
    setAgentState("thinking");
    resolveWindow(event.id, event.result);
    const result = event.result;
    setMessages((prev) => [
      ...prev,
      {
        id: nextId("tool"),
        role: "system",
        text: result.needsConfirmation
          ? `${event.name} — waiting on your approval`
          : result.notConnected
            ? `${event.name} — not connected`
            : `${event.name} — ${result.title}`,
        tool: { name: event.name!, ok: result.ok, title: result.title },
      },
    ]);
    return;
  }

  if ((event.type === "notice" || event.type === "error") && event.text) {
    const text = event.text;
    const tone = event.type;
    setMessages((prev) => [...prev, { id: nextId(tone), role: "system", tone, text }]);
    return;
  }

  if (event.type === "usage") {
    const usage = {
      inputTokens: event.inputTokens ?? 0,
      outputTokens: event.outputTokens ?? 0,
    };
    setMessages((prev) =>
      prev.map((message) => (message.id === replyId ? { ...message, usage } : message)),
    );
  }
}

function Bubble({
  message,
  agentLabel,
}: {
  message: ChatMessage;
  agentLabel: string;
}) {
  if (message.tool) {
    return (
      <p className="flex items-center gap-2 px-1 text-[11px] text-ink-dim">
        <Wrench className={cn("size-3", message.tool.ok ? "text-accent" : "text-warn")} />
        <span className="truncate">{message.text}</span>
      </p>
    );
  }

  if (message.role === "system") {
    return (
      <p
        className={cn(
          "rounded-lg border px-3 py-2 text-xs leading-relaxed",
          message.tone === "error"
            ? "border-down/40 bg-down/10 text-down"
            : "border-line bg-bg-elevated/70 text-ink-muted",
        )}
      >
        {message.text}
      </p>
    );
  }

  const isUser = message.role === "user";
  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[88%] rounded-xl px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap",
          isUser ? "bg-accent/15 text-ink" : "border border-line bg-panel text-ink",
        )}
      >
        {!isUser ? (
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-dim">
            {message.modelLabel ?? agentLabel}
          </p>
        ) : null}
        {message.text}
        {message.usage ? (
          <p className="mt-1.5 text-[10px] tabular text-ink-dim">
            {message.usage.inputTokens.toLocaleString()} in ·{" "}
            {message.usage.outputTokens.toLocaleString()} out
          </p>
        ) : null}
      </div>
    </div>
  );
}
