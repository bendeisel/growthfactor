import {
  notConnected,
  requiresApproval,
  type ToolDefinition,
} from "@/lib/tools/types";

/**
 * Gmail, Drive and Calendar.
 *
 * The tool surface is real — descriptions, schemas, the approval gate on
 * anything that leaves the building — and each one reports the credential it
 * needs instead of pretending. When the OAuth client is added in Phase 3/4, the
 * `run` bodies get their implementation and nothing above them changes.
 */

const GOOGLE_ENV = ["GOOGLE_OAUTH_CLIENT_ID", "GOOGLE_OAUTH_CLIENT_SECRET"];

/** Ben's accounts, per spec §4. The rest arrive at OAuth time. */
export const EMAIL_ACCOUNTS = [
  "ben@nashvillemma.com",
  "ben@fightersboxing.com",
  "support@growth-factor.ai",
] as const;

function googleReady(): boolean {
  return GOOGLE_ENV.every((name) => Boolean(process.env[name]));
}

export const gmailSearchTool: ToolDefinition = {
  name: "gmail_search",
  description:
    "Read mail across Ben's accounts. Use it for 'open my email', 'what's unread', 'find the email from X'. Supports Gmail search syntax in `query` (e.g. 'is:unread newer_than:2d'). Omit `account` to search all of them.",
  inputSchema: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description: "Gmail search query. Default: is:unread.",
      },
      account: {
        type: "string",
        enum: [...EMAIL_ACCOUNTS],
        description: "One account, or omit for all.",
      },
      max_results: { type: "integer", description: "Default 25, max 100." },
    },
  },
  async run(input) {
    if (!googleReady()) {
      return notConnected(
        `Inbox · ${typeof input.account === "string" ? input.account : "all accounts"}`,
        "Gmail",
        [...GOOGLE_ENV, "scope: gmail.modify"],
      );
    }
    // Phase 4: list + get messages, map into EmailData.
    return notConnected("Inbox", "Gmail read", ["Phase 4 implementation"]);
  },
};

export const gmailLabelTool: ToolDefinition = {
  name: "gmail_modify",
  description:
    "Archive, mark as spam, mark read, or apply and remove labels on specific messages. Requires message ids from gmail_search. Ben must approve before this runs.",
  destructive: true,
  inputSchema: {
    type: "object",
    properties: {
      message_ids: {
        type: "array",
        items: { type: "string" },
        description: "Ids returned by gmail_search.",
      },
      action: {
        type: "string",
        enum: ["archive", "spam", "mark_read", "label"],
      },
      label: { type: "string", description: "Label name, when action is label." },
    },
    required: ["message_ids", "action"],
  },
  async run(input, context) {
    const ids = Array.isArray(input.message_ids) ? input.message_ids : [];
    if (!context.confirmed) {
      return requiresApproval(
        "Modify mail",
        `Apply "${String(input.action)}" to ${ids.length} message(s)?`,
      );
    }
    if (!googleReady()) {
      return notConnected("Modify mail", "Gmail", [...GOOGLE_ENV, "scope: gmail.modify"]);
    }
    return notConnected("Modify mail", "Gmail write", ["Phase 4 implementation"]);
  },
};

export const gmailDraftTool: ToolDefinition = {
  name: "gmail_draft",
  description:
    "Write a reply or new message into drafts, in Ben's voice, without sending it. Pass two variants when he asks to see options. Drafts are safe — nothing leaves the account until he sends it.",
  inputSchema: {
    type: "object",
    properties: {
      account: { type: "string", enum: [...EMAIL_ACCOUNTS] },
      to: { type: "string" },
      subject: { type: "string" },
      body: { type: "string" },
      alternate_body: {
        type: "string",
        description: "A second version, when he asked for options.",
      },
      reply_to_message_id: { type: "string" },
    },
    required: ["to", "subject", "body"],
  },
  async run() {
    if (!googleReady()) {
      return notConnected("Draft", "Gmail", [...GOOGLE_ENV, "scope: gmail.compose"]);
    }
    return notConnected("Draft", "Gmail draft", ["Phase 4 implementation"]);
  },
};

export const gmailSendTool: ToolDefinition = {
  name: "gmail_send",
  description:
    "Send a message. Prefer gmail_draft and let Ben send it himself; only use this when he explicitly says to send. Requires his approval.",
  destructive: true,
  inputSchema: {
    type: "object",
    properties: {
      account: { type: "string", enum: [...EMAIL_ACCOUNTS] },
      to: { type: "string" },
      subject: { type: "string" },
      body: { type: "string" },
    },
    required: ["to", "subject", "body"],
  },
  async run(input, context) {
    if (!context.confirmed) {
      return requiresApproval(
        "Send mail",
        `Send "${String(input.subject)}" to ${String(input.to)}?`,
      );
    }
    if (!googleReady()) {
      return notConnected("Send mail", "Gmail", [...GOOGLE_ENV, "scope: gmail.send"]);
    }
    return notConnected("Send mail", "Gmail send", ["Phase 4 implementation"]);
  },
};

export const driveSearchTool: ToolDefinition = {
  name: "drive_search",
  description:
    "Find files in Ben's Google Drive by name or content, or list what he touched recently. Use it for 'pull up the X doc' or 'what did I work on yesterday'.",
  inputSchema: {
    type: "object",
    properties: {
      query: { type: "string", description: "Omit to list recent files." },
      max_results: { type: "integer" },
    },
  },
  async run() {
    if (!googleReady()) {
      return notConnected("Drive", "Google Drive", [
        ...GOOGLE_ENV,
        "scope: drive.readonly",
      ]);
    }
    return notConnected("Drive", "Drive search", ["Phase 3 implementation"]);
  },
};

export const calendarAgendaTool: ToolDefinition = {
  name: "calendar_agenda",
  description:
    "Ben's agenda across all his calendars for the next few days. Use it for 'what's on today', scheduling questions, or before proposing a meeting time.",
  inputSchema: {
    type: "object",
    properties: {
      days: { type: "integer", description: "How many days ahead. Default 7." },
    },
  },
  async run() {
    if (!googleReady()) {
      return notConnected("Agenda", "Google Calendar", [
        ...GOOGLE_ENV,
        "scope: calendar.events",
      ]);
    }
    return notConnected("Agenda", "Calendar", ["Phase 3 implementation"]);
  },
};
