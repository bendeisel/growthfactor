// Alien Kind: the model proxy.
//
// The dashboard is a static page. It never sees the Anthropic key, because the
// key lives here, in Supabase's function secrets. The page sends an agent, a
// thread and a message; this function assembles that agent's view of the world,
// calls Claude, streams the answer back, and writes both turns to Postgres.
//
// Three agents share this one function. What separates them is what gets
// assembled below: shared rules and shared memory for all of them, then the
// agent's own brief and its own memory on top.

import Anthropic from "npm:@anthropic-ai/sdk@^0.71.0";
import { createClient } from "npm:@supabase/supabase-js@^2.49.0";

const MODEL = "claude-opus-5";

// Claude Opus 5 can decline a request outright. With server-side fallbacks on,
// the API re-runs the same request on a fallback model inside the same call
// instead of just stopping. "default" routes by refusal category, so there is
// no model list to maintain.
const FALLBACK_BETA = "server-side-fallback-2026-07-01";

// Mail and calendar reach the agents through the MCP connector, so tool names
// and schemas are discovered at run time rather than hardcoded. Optional: with
// no URL set the agents simply have no mail tools.
const MCP_BETA = "mcp-client-2025-11-20";
const MCP_SERVER = "superhuman";

const CORS = {
  "Access-Control-Allow-Origin": Deno.env.get("DASHBOARD_ORIGIN") ?? "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const HOUSE_RULES = [
  "You work for Growth Factor AI, Ben's agency. It grows businesses with",
  "WordPress, SEO, ads, AI agents and GHL automation. The slogan is Automate",
  "Everything. The mission is under promise, over deliver.",
  "",
  "Writing rules that are not negotiable:",
  "- Never use an em dash. Rewrite with a comma, a period, or a colon.",
  "- No dated marketing language. Words like premier, elite, unleash, step into",
  "  and start your journey are banned.",
  "- Short, concise, attention grabbing. Change the reader's perspective.",
  "",
  "Ben works on Windows. Give Windows paths and shortcuts, never Mac ones.",
  "",
  "You are one of three agents with separate jobs. Stay inside yours. If Ben",
  "raises something that clearly belongs to one of the others, answer what you",
  "usefully can and tell him which one it belongs to.",
  "",
  "Mail is not split between you. Every agent reads every linked account, so",
  "say which account a message is on rather than assuming it is yours.",
  "",
  "Never send an email or delete anything without Ben saying so in this",
  "conversation first. Draft it, show him the draft, and wait. Creating and",
  "updating calendar events is fine without asking, because those are easy to",
  "undo and he asked for them to be quick.",
].join("\n");

type Turn = { role: "user" | "assistant"; content: string };

function sse(payload: Record<string, unknown>): Uint8Array {
  return new TextEncoder().encode(`data: ${JSON.stringify(payload)}\n\n`);
}

function fail(message: string, status: number): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...CORS, "content-type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return fail("POST only", 405);

  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) return fail("Not signed in", 401);

  // The anon client carries the caller's JWT, so every query below runs under
  // their own row level security. A bug here cannot read someone else's rows.
  const db = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  );

  const { data: auth, error: authError } = await db.auth.getUser();
  if (authError || !auth?.user) return fail("Not signed in", 401);
  const userId = auth.user.id;

  let body: { agentId?: string; threadId?: string; message?: string; device?: string };
  try {
    body = await req.json();
  } catch {
    return fail("Body must be JSON", 400);
  }

  const message = (body.message ?? "").trim();
  const device = (body.device ?? "unknown").slice(0, 60);
  if (!message) return fail("Empty message", 400);
  if (!body.agentId) return fail("No agent chosen", 400);

  const { data: agent, error: agentError } = await db
    .from("agents").select("id, name, role, brief").eq("id", body.agentId).single();
  if (agentError || !agent) return fail("That agent does not exist", 404);

  // A missing thread id means this is a new conversation with this agent. Title
  // it from the opening line so the list is readable without opening anything.
  let threadId = body.threadId;
  if (!threadId) {
    const title = message.length > 60 ? `${message.slice(0, 57)}...` : message;
    const { data, error } = await db
      .from("threads")
      .insert({ user_id: userId, agent_id: agent.id, title })
      .select("id")
      .single();
    if (error || !data) return fail(`Could not open a thread: ${error?.message}`, 500);
    threadId = data.id;
  }

  // This agent's view: the shared rules, the memory it can see, and this
  // thread's history. Read fresh on every call, so an edit made on one device
  // is in force on the next message sent from any other.
  const [sharedRes, memoryRes, historyRes] = await Promise.all([
    db.from("instructions").select("body").eq("user_id", userId).maybeSingle(),
    db.from("memory").select("label, body, agent_id").eq("pinned", true)
      .or(`agent_id.is.null,agent_id.eq.${agent.id}`)
      .order("updated_at", { ascending: true }),
    db.from("messages").select("role, content").eq("thread_id", threadId)
      .order("created_at", { ascending: true }).limit(200),
  ]);

  if (historyRes.error) return fail(`Could not read the thread: ${historyRes.error.message}`, 500);

  const rows = memoryRes.data ?? [];
  const shared = rows.filter((r) => !r.agent_id);
  const mine = rows.filter((r) => r.agent_id);
  const list = (rs: typeof rows) => rs.map((r) => `- ${r.label}: ${r.body}`).join("\n");

  const identity = [
    `You are ${agent.name}.`,
    agent.role && `Your job: ${agent.role}.`,
    "Everything outside that belongs to one of the other agents.",
  ].filter(Boolean).join(" ");

  const systemText = [
    identity,
    "",
    HOUSE_RULES,
    (sharedRes.data?.body ?? "").trim() &&
      `\nInstructions that apply to all three agents:\n${(sharedRes.data!.body).trim()}`,
    agent.brief.trim() && `\nYour own instructions:\n${agent.brief.trim()}`,
    shared.length && `\nWhat every agent knows:\n${list(shared)}`,
    mine.length && `\nWhat you know that the others do not:\n${list(mine)}`,
  ].filter(Boolean).join("\n");

  const history: Turn[] = (historyRes.data ?? []) as Turn[];
  const turns: Turn[] = [...history, { role: "user", content: message }];

  const anthropic = new Anthropic({ apiKey: Deno.env.get("ANTHROPIC_API_KEY")! });

  // Both halves or neither: a server in mcp_servers with no toolset referencing
  // it is rejected as a validation error.
  const mcpUrl = Deno.env.get("SUPERHUMAN_MCP_URL");
  const mcpToken = Deno.env.get("SUPERHUMAN_MCP_TOKEN");
  const mail = mcpUrl
    ? {
        betas: [FALLBACK_BETA, MCP_BETA],
        mcp_servers: [{
          type: "url" as const, url: mcpUrl, name: MCP_SERVER,
          ...(mcpToken ? { authorization_token: mcpToken } : {}),
        }],
        tools: [{ type: "mcp_toolset" as const, mcp_server_name: MCP_SERVER }],
      }
    : { betas: [FALLBACK_BETA] };

  const stream = new ReadableStream({
    async start(controller) {
      let answer = "";
      let usage: unknown = null;

      try {
        controller.enqueue(sse({ type: "thread", threadId }));

        // Write the user turn before the model runs. If the model call dies,
        // what Ben typed is still on the thread rather than lost.
        await db.from("messages").insert({
          thread_id: threadId, user_id: userId,
          role: "user", content: message, device,
        });

        const run = anthropic.beta.messages.stream({
          model: MODEL,
          max_tokens: 64000,
          ...mail,
          fallbacks: "default",
          // Adaptive thinking lets Claude decide how hard to think per message.
          // Summarized display means the dashboard can show that it is working
          // instead of sitting silent on anything that takes a while.
          thinking: { type: "adaptive", display: "summarized" },
          // The identity, rules and memory are stable across a conversation, so
          // they sit behind a cache breakpoint. The turns after it are volatile.
          system: [{ type: "text", text: systemText, cache_control: { type: "ephemeral" } }],
          messages: turns,
        });

        for await (const event of run) {
          if (event.type === "content_block_delta") {
            if (event.delta.type === "text_delta") {
              answer += event.delta.text;
              controller.enqueue(sse({ type: "text", text: event.delta.text }));
            } else if (event.delta.type === "thinking_delta") {
              controller.enqueue(sse({ type: "thinking", text: event.delta.thinking }));
            }
          }
        }

        const final = await run.finalMessage();
        usage = final.usage;

        // A refusal is an HTTP 200 with nothing usable in content, so it has to
        // be checked rather than assumed away. With fallbacks on, reaching here
        // means the fallback model declined too.
        if (final.stop_reason === "refusal") {
          controller.enqueue(sse({
            type: "error",
            message: `Declined: ${final.stop_details?.explanation ?? "no reason given"}`,
          }));
          controller.close();
          return;
        }

        if (answer) {
          await db.from("messages").insert({
            thread_id: threadId, user_id: userId,
            role: "assistant", content: answer, device: "server", usage,
          });
        }

        controller.enqueue(sse({ type: "done", threadId, usage, model: final.model }));
      } catch (err) {
        const detail = err instanceof Error ? err.message : String(err);
        // Half an answer is better than none. Keep whatever streamed so the
        // thread stays coherent when the connection drops mid-reply.
        if (answer) {
          await db.from("messages").insert({
            thread_id: threadId, user_id: userId,
            role: "assistant", content: answer, device: "server", usage,
          });
        }
        controller.enqueue(sse({ type: "error", message: detail }));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { ...CORS, "content-type": "text/event-stream", "cache-control": "no-cache" },
  });
});
