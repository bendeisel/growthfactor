import {
  notConnected,
  requiresApproval,
  type ToolDefinition,
} from "@/lib/tools/types";

/**
 * ClickUp. Same pattern as the Google tools: real surface, honest gap.
 * A token is all `run` is waiting for.
 */

const CLICKUP_ENV = ["CLICKUP_API_TOKEN", "CLICKUP_TEAM_ID"];

function clickUpReady(): boolean {
  return CLICKUP_ENV.every((name) => Boolean(process.env[name]));
}

export const clickUpTasksTool: ToolDefinition = {
  name: "clickup_tasks",
  description:
    "Ben's ClickUp tasks. Use it for 'open ClickUp', 'show me all open tasks', 'what's assigned to me', 'what did we finish this week'. `filter` picks the view; `list` narrows to one project.",
  inputSchema: {
    type: "object",
    properties: {
      filter: {
        type: "string",
        enum: ["mine", "open", "overdue", "completed"],
        description: "Default: open.",
      },
      list: { type: "string", description: "List or project name." },
      max_results: { type: "integer" },
    },
  },
  async run(input) {
    if (!clickUpReady()) {
      return notConnected(
        `ClickUp · ${typeof input.filter === "string" ? input.filter : "open"}`,
        "ClickUp",
        CLICKUP_ENV,
      );
    }
    return notConnected("ClickUp", "ClickUp read", ["Phase 3 implementation"]);
  },
};

export const clickUpCreateTaskTool: ToolDefinition = {
  name: "clickup_create_task",
  description:
    "Create a ClickUp task. Use it when Ben says to add, capture, or track something. Requires his approval before it's written.",
  destructive: true,
  inputSchema: {
    type: "object",
    properties: {
      name: { type: "string" },
      description: { type: "string" },
      list: { type: "string" },
      due: { type: "string", description: "ISO date." },
      assignee: { type: "string" },
    },
    required: ["name"],
  },
  async run(input, context) {
    if (!context.confirmed) {
      return requiresApproval(
        "Create task",
        `Create ClickUp task "${String(input.name)}"${input.list ? ` in ${String(input.list)}` : ""}?`,
      );
    }
    if (!clickUpReady()) {
      return notConnected("Create task", "ClickUp", CLICKUP_ENV);
    }
    return notConnected("Create task", "ClickUp write", ["Phase 3 implementation"]);
  },
};
