"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import type { CoreState } from "@/components/jarvis/jarvis-core";
import type { ToolResult } from "@/lib/tools/types";

/**
 * The wire between the Command Center and the app column.
 *
 * The chat drives; the right column reflects. When the agent calls a tool the
 * result is pushed here, the matching app tab comes forward, and the window
 * shows what came back — which is what "open my email and I can watch you work"
 * means in practice. The Jarvis core reads `agentState` from the same place.
 */

export type AppKind = "email" | "clickup" | "drive" | "calendar" | "reports";

export interface ToolWindow {
  id: string;
  toolName: string;
  app: AppKind;
  title: string;
  /** Absent until the tool returns. */
  result?: ToolResult;
  input: Record<string, unknown>;
  at: number;
}

/** Which app column a tool's output belongs in. */
export function appForTool(toolName: string): AppKind {
  if (toolName.startsWith("gmail")) return "email";
  if (toolName.startsWith("clickup")) return "clickup";
  if (toolName.startsWith("drive")) return "drive";
  if (toolName.startsWith("calendar")) return "calendar";
  return "reports";
}

interface WorkspaceValue {
  agentState: CoreState;
  setAgentState: (state: CoreState) => void;
  windows: ToolWindow[];
  activeApp: AppKind;
  setActiveApp: (app: AppKind) => void;
  openWindow: (window: Omit<ToolWindow, "at">) => void;
  resolveWindow: (id: string, result: ToolResult) => void;
  /** Newest window for one app, if any. */
  windowFor: (app: AppKind) => ToolWindow | undefined;
  /** Send a message as if Ben typed it; `approve` grants one tool for that turn. */
  ask: (text: string, options?: { approve?: string }) => void;
  registerAsk: (fn: (text: string, options?: { approve?: string }) => void) => void;
}

const WorkspaceContext = createContext<WorkspaceValue | null>(null);

const MAX_WINDOWS = 12;

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [agentState, setAgentState] = useState<CoreState>("idle");
  const [windows, setWindows] = useState<ToolWindow[]>([]);
  const [activeApp, setActiveApp] = useState<AppKind>("reports");
  const askRef = useRef<((text: string, options?: { approve?: string }) => void) | null>(
    null,
  );

  const openWindow = useCallback((window: Omit<ToolWindow, "at">) => {
    setWindows((prev) => [{ ...window, at: Date.now() }, ...prev].slice(0, MAX_WINDOWS));
    // Bring the app forward — the window "pops up" where it belongs.
    setActiveApp(window.app);
  }, []);

  const resolveWindow = useCallback((id: string, result: ToolResult) => {
    setWindows((prev) =>
      prev.map((window) =>
        window.id === id ? { ...window, result, title: result.title || window.title } : window,
      ),
    );
  }, []);

  const windowFor = useCallback(
    (app: AppKind) => windows.find((window) => window.app === app),
    [windows],
  );

  const ask = useCallback((text: string, options?: { approve?: string }) => {
    askRef.current?.(text, options);
  }, []);

  const registerAsk = useCallback(
    (fn: (text: string, options?: { approve?: string }) => void) => {
      askRef.current = fn;
    },
    [],
  );

  const value = useMemo(
    () => ({
      agentState,
      setAgentState,
      windows,
      activeApp,
      setActiveApp,
      openWindow,
      resolveWindow,
      windowFor,
      ask,
      registerAsk,
    }),
    [agentState, windows, activeApp, openWindow, resolveWindow, windowFor, ask, registerAsk],
  );

  return <WorkspaceContext value={value}>{children}</WorkspaceContext>;
}

export function useWorkspace(): WorkspaceValue {
  const value = useContext(WorkspaceContext);
  if (!value) throw new Error("useWorkspace must be used inside WorkspaceProvider");
  return value;
}
