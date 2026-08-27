"use client";

import { Send, Terminal } from "lucide-react";
import { useState } from "react";
import { PageHead, Segmented } from "@/components/sections/parts";
import { cn } from "@/lib/utils";

/**
 * Four Claude Code sessions on screen at once.
 *
 * Claude Code only, by Ben's decision — no Codex, no ChatGPT, no second chat
 * identity. That keeps one tool loop, one system prompt, and one set of
 * permissions, and it's why a session header carries a repo rather than a
 * provider badge: there's only ever one provider.
 */
interface Session {
  id: string;
  title: string;
  repo: string;
  live: boolean;
  turns: { role: "ben" | "claude"; text?: string; tools?: string[]; reply?: string }[];
}

const SESSIONS: Session[] = [
  {
    id: "s1",
    title: "GHL adapter — four locations",
    repo: "growthfactor",
    live: true,
    turns: [
      { role: "ben", text: "Pull 30 days for all four locations and show me where the numbers disagree with Glofox." },
      {
        role: "claude",
        text: "Running against the four private integrations.",
        tools: ["ghl_locations → 4 sub-accounts", "glofox_members → 512 rows"],
        reply:
          "Three disagreements, all Fighters Boxing. GHL counts 11 new members, Glofox counts 14 — the gap is re-joins. Which definition goes on the wall?",
      },
    ],
  },
  {
    id: "s2",
    title: "Nashville MMA — site rebuild",
    repo: "nmma-web",
    live: true,
    turns: [
      { role: "ben", text: "Move the schedule above the fold and cut the testimonial carousel." },
      {
        role: "claude",
        tools: ["sanity_pages → 12 docs", "edit home.schedule.order"],
        reply: "Done on the draft. Publish, or leave it for you to look at first?",
      },
    ],
  },
  {
    id: "s3",
    title: "CI board — migration script",
    repo: "ci-dashboard",
    live: false,
    turns: [
      { role: "ben", text: "Write the ClickUp export mapper against the plan's schema." },
      {
        role: "claude",
        tools: ["write migrate/clickup.ts", "vitest run — 12 passed"],
        reply:
          "73 tasks map cleanly, 4 go to unmapped.json — subtasks whose parent list isn't migrating. Promote them or drop them?",
      },
    ],
  },
  {
    id: "s4",
    title: "SEO rank grid — DataForSEO",
    repo: "growthfactor",
    live: false,
    turns: [
      { role: "ben", text: "Cost this out at a weekly 7×7 across the four clients." },
      {
        role: "claude",
        tools: ["dataforseo_pricing"],
        reply:
          "490 calls per location per run. Four clients weekly lands near $18/month, so weekly is affordable — monthly would cost less and tell you much less.",
      },
    ],
  },
  {
    id: "s5",
    title: "Budget guardrails",
    repo: "growthfactor",
    live: false,
    turns: [
      { role: "ben", text: "What did I spend yesterday?" },
      { role: "claude", tools: ["read_budget 2026-08-19"], reply: "$3.12 against the $5 daily cap. Nothing hit the monthly cap." },
    ],
  },
];

type LayoutId = "quad" | "single";

export function BridgeSection() {
  const [layout, setLayout] = useState<LayoutId>("quad");
  const [open, setOpen] = useState(["s1", "s2", "s3", "s4"]);
  const [focus, setFocus] = useState("s1");

  const shown = layout === "quad" ? open : [focus];
  const spare = SESSIONS.filter((session) => !shown.includes(session.id));

  return (
    <>
      <PageHead title="Bridge" sub="Claude Code sessions — four at once, or one full width">
        <Segmented
          label="Layout"
          value={layout}
          onChange={setLayout}
          options={[
            { id: "quad", label: "Four" },
            { id: "single", label: "One" },
          ]}
        />
      </PageHead>

      <div
        className={cn(
          "grid gap-4",
          layout === "quad" ? "md:grid-cols-2 md:grid-rows-2 xl:h-[calc(100dvh-13rem)]" : "",
        )}
      >
        {shown.map((id) => {
          const session = SESSIONS.find((s) => s.id === id);
          return session ? <Pane key={id} session={session} /> : null;
        })}
      </div>

      {spare.length ? (
        <section className="card-surface mt-4">
          <div className="border-b border-line px-4 py-3">
            <h2 className="text-[15px] font-bold tracking-tight">Not on screen</h2>
          </div>
          <div className="flex flex-wrap gap-2 p-4">
            {spare.map((session) => (
              <button
                key={session.id}
                type="button"
                onClick={() =>
                  layout === "quad"
                    ? setOpen((current) => [...current.slice(0, 3), session.id])
                    : setFocus(session.id)
                }
                className="tile flex items-center gap-2 px-3 py-2 text-[13px] font-semibold transition-colors hover:bg-surface-hover"
              >
                <Terminal className="size-3.5 text-ink-dim" aria-hidden />
                {session.title}
              </button>
            ))}
          </div>
        </section>
      ) : null}
    </>
  );
}

function Pane({ session }: { session: Session }) {
  return (
    <section className="card-surface flex min-h-72 min-w-0 flex-col">
      <header className="flex items-center gap-2 border-b border-line px-4 py-3">
        {session.live ? (
          <span className="breathe size-1.5 shrink-0 rounded-full bg-up" aria-label="running" />
        ) : null}
        <h3 className="min-w-0 flex-1 truncate text-[13px] font-bold tracking-tight">
          {session.title}
        </h3>
        <span className="rounded-full bg-surface-2 px-2 py-0.5 font-mono text-[10px] text-ink-muted">
          {session.repo}
        </span>
      </header>

      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-4">
        {session.turns.map((turn, i) =>
          turn.role === "ben" ? (
            <p key={i} className="tile ml-auto max-w-[88%] px-3 py-2 text-[13px]">
              {turn.text}
            </p>
          ) : (
            <div key={i} className="max-w-[92%] text-[13px] leading-relaxed">
              {turn.text ? <p className="mb-1.5">{turn.text}</p> : null}
              {turn.tools?.map((tool) => (
                <p
                  key={tool}
                  className="my-1 rounded-lg bg-brand-soft px-2.5 py-1.5 font-mono text-[11px] text-brand"
                >
                  {tool}
                </p>
              ))}
              {turn.reply ? <p className="mt-1.5">{turn.reply}</p> : null}
            </div>
          ),
        )}
      </div>

      <footer className="flex items-center gap-2 border-t border-line p-3">
        <span className="tile flex-1 truncate px-3 py-2 text-[13px] text-ink-dim">
          Reply to this session…
        </span>
        <button
          type="button"
          className="grid size-9 shrink-0 place-content-center rounded-lg bg-brand text-white transition-opacity hover:opacity-90"
          aria-label="Send"
        >
          <Send className="size-4" aria-hidden />
        </button>
      </footer>
    </section>
  );
}
