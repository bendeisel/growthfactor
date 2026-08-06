import { clickUpCreateTaskTool, clickUpTasksTool } from "@/lib/tools/clickup";
import {
  calendarAgendaTool,
  driveSearchTool,
  gmailDraftTool,
  gmailLabelTool,
  gmailSearchTool,
  gmailSendTool,
} from "@/lib/tools/google";
import { getMetricsTool, getTrendTool, listAlertsTool } from "@/lib/tools/metrics";
import type { ToolDefinition, ToolResult } from "@/lib/tools/types";

/**
 * Every tool the agent can reach. Order matters only for display; the model
 * picks by description.
 */
export const TOOLS: ToolDefinition[] = [
  getMetricsTool,
  getTrendTool,
  listAlertsTool,
  gmailSearchTool,
  gmailDraftTool,
  gmailLabelTool,
  gmailSendTool,
  clickUpTasksTool,
  clickUpCreateTaskTool,
  driveSearchTool,
  calendarAgendaTool,
];

export function getTool(name: string): ToolDefinition | undefined {
  return TOOLS.find((tool) => tool.name === name);
}

/**
 * Runs one tool call.
 *
 * `approved` is the set of tool names Ben approved for *this turn only* — an
 * approval never carries over to the next message, so "send the email" can't be
 * granted once and then reused by a later turn.
 */
export async function runTool(
  name: string,
  input: Record<string, unknown>,
  approved: Set<string> = new Set(),
): Promise<ToolResult> {
  const tool = getTool(name);
  if (!tool) {
    return {
      ok: false,
      panel: "text",
      title: "Unknown tool",
      data: { text: `No tool named "${name}".` },
    };
  }

  try {
    return await tool.run(input, { confirmed: approved.has(name) });
  } catch (error) {
    return {
      ok: false,
      panel: "text",
      title: `${name} failed`,
      data: {
        text: error instanceof Error ? error.message : String(error),
      },
    };
  }
}

export type { PanelKind, ToolDefinition, ToolResult } from "@/lib/tools/types";
