/**
 * Tools the agent can call, and the windows their results open.
 *
 * The design Ben asked for: "open up my email" shouldn't need a hand-built email
 * screen — the agent calls a tool, and the call *is* the window. So every tool
 * declares how its result should be rendered, and the UI has one renderer per
 * shape rather than one screen per app.
 */

export type PanelKind = "table" | "email" | "tasks" | "files" | "text";

export interface TableData {
  columns: string[];
  rows: Array<Array<string | number>>;
  /** Optional note under the table — units, caveats, "mock data". */
  footnote?: string;
}

export interface EmailData {
  /** Which account this came from, or "all". */
  account: string;
  messages: Array<{
    id: string;
    from: string;
    subject: string;
    snippet: string;
    date: string;
    unread?: boolean;
    labels?: string[];
  }>;
}

export interface TaskData {
  list: string;
  tasks: Array<{
    id: string;
    name: string;
    status: string;
    due?: string;
    assignee?: string;
    url?: string;
  }>;
}

export interface FileData {
  files: Array<{
    id: string;
    name: string;
    kind: string;
    modified: string;
    url?: string;
  }>;
}

export interface TextData {
  text: string;
}

export type PanelData = TableData | EmailData | TaskData | FileData | TextData;

export interface ToolResult {
  ok: boolean;
  panel: PanelKind;
  /** Window title, e.g. "Inbox · ben@nashvillemma.com". */
  title: string;
  data: PanelData;
  /**
   * Set when the tool refused because it needs Ben's approval first. Carries the
   * sentence shown on the approval prompt.
   */
  needsConfirmation?: string;
  /** Set when the tool can't run yet, naming what's missing. */
  notConnected?: string;
}

export interface ToolContext {
  /** True when Ben approved this tool for this turn. */
  confirmed: boolean;
}

export interface ToolDefinition {
  name: string;
  /** Written for the model: what it does and when to reach for it. */
  description: string;
  inputSchema: {
    type: "object";
    properties: Record<string, unknown>;
    required?: string[];
  };
  /**
   * Outward-facing or hard-to-undo actions — sending mail, moving mail to spam,
   * creating tasks. These refuse until approved, every turn.
   */
  destructive?: boolean;
  run(input: Record<string, unknown>, context: ToolContext): Promise<ToolResult>;
}

/** Standard shape for "I could do this, but I'm missing credentials". */
export function notConnected(
  title: string,
  what: string,
  envVars: string[],
): ToolResult {
  return {
    ok: false,
    panel: "text",
    title,
    notConnected: `${what} is not connected yet. Needs: ${envVars.join(", ")}.`,
    data: {
      text: `${what} is not connected yet.\n\nSet ${envVars.join(" and ")} in .env.local, restart, and this tool starts working — nothing else changes.`,
    },
  };
}

/** Standard shape for "this needs your approval before I do it". */
export function requiresApproval(title: string, sentence: string): ToolResult {
  return {
    ok: false,
    panel: "text",
    title,
    needsConfirmation: sentence,
    data: { text: sentence },
  };
}
