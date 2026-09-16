// Alien Kind: mail.
//
// One inbox across every linked account, filtered by account when Ben wants it
// split. Reading only. Anything that writes, a reply or a calendar event, goes
// through the agent in chat where there is a conversation to approve it in.
//
// Superhuman is reached over the Claude API's MCP connector rather than by
// calling their endpoints directly, so their tool names and schemas are
// discovered at run time instead of hardcoded here. When they change something,
// this keeps working.

import Anthropic from "npm:@anthropic-ai/sdk@^0.71.0";
import { zodOutputFormat } from "npm:@anthropic-ai/sdk@^0.71.0/helpers/zod";
import { createClient } from "npm:@supabase/supabase-js@^2.49.0";
import { z } from "npm:zod@^3.23.8";

const MODEL = "claude-opus-5";
const MCP_BETA = "mcp-client-2025-11-20";
const SERVER = "superhuman";

const CORS = {
  "Access-Control-Allow-Origin": Deno.env.get("DASHBOARD_ORIGIN") ?? "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status, headers: { ...CORS, "content-type": "application/json" },
  });

// ---------------------------------------------------------------- schemas --
const Accounts = z.object({
  accounts: z.array(z.object({
    email: z.string(),
    primary: z.boolean(),
  })),
});

const Digest = z.object({
  threads: z.array(z.object({
    id: z.string().describe("The thread id, exactly as the mail tool returned it"),
    account: z.string().describe("Which linked account this thread belongs to"),
    from: z.string().describe("Sender name, or their address when there is no name"),
    subject: z.string(),
    snippet: z.string().describe("One line. What the thread is actually about."),
    date: z.string().describe("ISO 8601 timestamp of the most recent message"),
    unread: z.boolean(),
    needsReply: z.boolean().describe("True when someone is waiting on Ben for something"),
  })),
});

const Thread = z.object({
  id: z.string(),
  account: z.string(),
  subject: z.string(),
  messages: z.array(z.object({
    from: z.string(),
    to: z.string(),
    date: z.string(),
    body: z.string().describe("Plain text. Quoted history and signatures stripped."),
  })),
});

const SHAPES = {
  accounts: { schema: Accounts, name: "accounts" },
  list: { schema: Digest, name: "digest" },
  thread: { schema: Thread, name: "thread" },
} as const;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "POST only" }, 405);

  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) return json({ error: "Not signed in" }, 401);

  const db = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  );
  const { data: auth, error: authError } = await db.auth.getUser();
  if (authError || !auth?.user) return json({ error: "Not signed in" }, 401);

  const mcpUrl = Deno.env.get("SUPERHUMAN_MCP_URL");
  const mcpToken = Deno.env.get("SUPERHUMAN_MCP_TOKEN");
  if (!mcpUrl) {
    // Not an error, just not wired up. The Mail tab says so rather than
    // showing an empty inbox that looks like you have no mail.
    return json({ error: "not_configured", message:
      "Mail is not connected yet. Set SUPERHUMAN_MCP_URL and SUPERHUMAN_MCP_TOKEN " +
      "in the Supabase function secrets." }, 503);
  }

  let body: { action?: keyof typeof SHAPES; accounts?: string[]; threadId?: string; query?: string };
  try { body = await req.json(); } catch { return json({ error: "Body must be JSON" }, 400); }

  const action = body.action ?? "list";
  const shape = SHAPES[action];
  if (!shape) return json({ error: "Unknown action" }, 400);

  const scope = body.accounts?.length
    ? `Only these accounts: ${body.accounts.join(", ")}.`
    : "Every linked account, combined into one list.";

  const ask = action === "accounts"
    ? "List every mail account linked to this connection."
    : action === "thread"
      ? `Open thread ${body.threadId} and return every message in it, oldest first.`
      : [
          "List the most recent inbox threads.", scope,
          body.query ? `Filter to: ${body.query}` : "",
          "Cover every account before you answer, one call per account, and merge",
          "the results newest first. Return at most 40 threads.",
          "Do not send, draft, archive, or change anything. This is a read.",
        ].filter(Boolean).join(" ");

  const anthropic = new Anthropic({ apiKey: Deno.env.get("ANTHROPIC_API_KEY")! });

  try {
    const res = await anthropic.beta.messages.create({
      model: MODEL,
      max_tokens: 16000,
      betas: [MCP_BETA],
      mcp_servers: [{
        type: "url", url: mcpUrl, name: SERVER,
        ...(mcpToken ? { authorization_token: mcpToken } : {}),
      }],
      tools: [{ type: "mcp_toolset", mcp_server_name: SERVER }],
      output_config: { format: zodOutputFormat(shape.schema, shape.name) },
      messages: [{ role: "user", content: ask }],
    });

    if (res.stop_reason === "refusal") {
      return json({ error: "refused", message: res.stop_details?.explanation ?? "" }, 502);
    }

    const text = res.content.filter((b) => b.type === "text").map((b) => b.text).join("");
    if (!text) return json({ error: "Mail returned nothing" }, 502);

    // The model is told to emit this shape, so a parse failure is a real
    // failure rather than something to paper over with an empty list.
    try {
      return json(JSON.parse(text));
    } catch {
      return json({ error: "Mail came back in an unreadable shape" }, 502);
    }
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : String(err) }, 502);
  }
});
