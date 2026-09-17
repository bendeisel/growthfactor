"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Menu, Moon, Sparkles, Sun } from "lucide-react";
import { AnimatedBadge } from "@/components/ui/animated-badge";
import { Orb } from "./orb";

/* The Unicorn scene fetches its runtime and project data from unicorn.studio at
   run time, so it only draws on a real origin and never during the server
   render. Off by default because a full bleed canvas behind a dense dashboard
   is a taste call, and the switch is in the rail. */
const Scene = dynamic(
  () => import("@/components/ui/bloim-animation-background").then((m) => m.Component),
  { ssr: false },
);
import { Card, Label, Meter, PaceChart, Row, StatTile } from "./parts";
import {
  ACCOUNTS, AGENTS, ATTENTION, BUSINESSES, GLOFOX, MAIL, PACE, REVENUE, SCRIPTS, SESSIONS,
  kindColour, type AgentId, type Line,
} from "./data";

type Dest = "terminal" | "triage" | "reporting" | "glofox" | "sessions" | "attention";

const DESTS: { id: Dest; label: string; mark: string }[] = [
  { id: "terminal", label: "Alien Kind", mark: "AK" },
  { id: "triage", label: "Email triage", mark: "@" },
  { id: "reporting", label: "Business reporting", mark: "$" },
  { id: "glofox", label: "Glofox", mark: "G" },
  { id: "sessions", label: "Interface", mark: "I" },
];

const TITLES: Record<Dest, [string, string]> = {
  terminal: ["Alien Kind", "One terminal. Ask for anything and the window opens on the right as it works."],
  triage: ["Email triage", "Three accounts in one list. Replies are drafted, never sent without you."],
  reporting: ["Business reporting", "Month to date, against last month's pace."],
  glofox: ["Glofox", "Members, classes, and where it disagrees with GHL."],
  sessions: ["Interface", "Every session running, across every tool."],
  attention: ["Needs attention", "What moved the wrong way."],
};

export function Dashboard() {
  const [dest, setDest] = useState<Dest>("terminal");
  const [agent, setAgent] = useState<AgentId>("kevin");
  const [biz, setBiz] = useState("All businesses (7)");
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [railOpen, setRailOpen] = useState(false);
  const [scene, setScene] = useState(false);

  useEffect(() => {
    let saved: string | null = null;
    try { saved = localStorage.getItem("ak-theme"); } catch {}
    if (saved === "light" || saved === "dark") setTheme(saved);
  }, []);
  useEffect(() => {
    if (theme === "light") document.documentElement.setAttribute("data-theme", "light");
    else document.documentElement.removeAttribute("data-theme");
    try { localStorage.setItem("ak-theme", theme); } catch {}
  }, [theme]);

  const [title, sub] = TITLES[dest];
  const go = (d: Dest) => { setDest(d); setRailOpen(false); };

  const navBtn = (
    key: string, label: string, mark: string, markBg: string, markFg: string,
    count: number | null, on: boolean, hot: boolean, onClick: () => void
  ) => (
    <button key={key} onClick={onClick} aria-current={on}
      className={`mb-0.5 flex w-full items-center gap-2.5 rounded-lg border p-2 text-left transition-colors
        ${on ? "border-line bg-panel text-ink" : "border-transparent text-[color:var(--ink-2)] hover:bg-panel hover:text-ink"}`}>
      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-lg font-mono text-[11px] font-bold"
            style={{ background: markBg, color: markFg }}>{mark}</span>
      <span className="min-w-0 flex-1 truncate text-[13.5px] font-medium">{label}</span>
      {count !== null && (
        <span className="rounded-full px-1.5 py-px font-mono text-[11px]"
              style={hot ? { background: "color-mix(in srgb, var(--bad) 14%, transparent)", color: "var(--bad)" }
                         : { background: "var(--raised)", color: "var(--ink-3)" }}>{count}</span>
      )}
    </button>
  );

  return (
    <div className="relative grid min-h-screen md:grid-cols-[238px_minmax(0,1fr)]">
      {scene && (
        <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden opacity-40" aria-hidden>
          <Scene />
        </div>
      )}
      {/* ------------------------------------------------------------ rail */}
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-[264px] flex-col overflow-y-auto border-r border-line-soft bg-void
                         transition-transform md:static md:w-auto md:translate-x-0
                         ${railOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex items-center gap-2.5 border-b border-line-soft px-3.5 pb-3.5 pt-4">
          <span className="grid h-[30px] w-[30px] shrink-0 place-items-center rounded-[9px] font-mono text-xs font-bold"
                style={{ background: "var(--orange)", color: "#201f1d" }}>AK</span>
          <span>
            <b className="block text-sm font-semibold leading-tight">Alien Kind</b>
            <span className="block text-[11.5px] text-[color:var(--ink-3)]">Ben Grove</span>
          </span>
        </div>

        <div className="px-2.5 pb-0.5 pt-3.5">
          <span className="block px-1.5 pb-2"><Label>Agents</Label></span>
          {AGENTS.map((a) => navBtn(a.id, `${a.name}, ${a.scope}`, a.name[0],
            `color-mix(in srgb, ${a.colour} 14%, transparent)`, a.colour,
            a.open, agent === a.id, false, () => setAgent(a.id)))}
        </div>

        <div className="px-2.5 pb-0.5 pt-3.5">
          <span className="block px-1.5 pb-2"><Label>Do</Label></span>
          {DESTS.map((d) => navBtn(d.id, d.label, d.mark, "var(--wash)", "var(--orange)",
            null, dest === d.id, false, () => go(d.id)))}
        </div>

        <div className="px-2.5 pb-0.5 pt-3.5">
          <span className="block px-1.5 pb-2"><Label>Watch</Label></span>
          {navBtn("attention", "Needs attention", "!", "color-mix(in srgb, var(--bad) 14%, transparent)",
            "var(--bad)", ATTENTION.length, dest === "attention", true, () => go("attention"))}
        </div>

        <div className="mt-auto border-t border-line-soft p-2.5">
          <button onClick={() => setScene(!scene)}
            className="flex w-full items-center gap-2.5 rounded-lg p-2 text-left text-[color:var(--ink-2)] hover:bg-panel hover:text-ink">
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-lg"
                  style={scene ? { background: "var(--wash)", color: "var(--orange)" } : { background: "var(--raised)" }}>
              <Sparkles className="h-3.5 w-3.5" />
            </span>
            <span className="flex-1 text-[13.5px] font-medium">{scene ? "Scene on" : "Scene off"}</span>
          </button>
          <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="flex w-full items-center gap-2.5 rounded-lg p-2 text-left text-[color:var(--ink-2)] hover:bg-panel hover:text-ink">
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-raised">
              {theme === "dark" ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
            </span>
            <span className="flex-1 text-[13.5px] font-medium">{theme === "dark" ? "Switch to light" : "Switch to dark"}</span>
          </button>
        </div>
      </aside>

      {railOpen && <button aria-label="Close menu" onClick={() => setRailOpen(false)}
        className="fixed inset-0 z-30 bg-black/50 md:hidden" />}

      {/* ------------------------------------------------------------ main */}
      <main className="relative z-10 flex min-h-screen min-w-0 flex-col">
        <div className="h-[5px] shrink-0"
             style={{ backgroundImage: "repeating-linear-gradient(90deg,var(--line) 0 1px,transparent 1px 34px)" }} />
        <header className="flex shrink-0 flex-wrap items-end justify-between gap-4 px-4 pb-4 pt-5 md:px-6">
          <div>
            <h1 className="text-[25px] font-bold tracking-tight">{title}</h1>
            <p className="mt-1 max-w-[62ch] text-[13.5px] text-[color:var(--ink-3)]">{sub}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider"
                  style={{ borderColor: "var(--warn)", color: "var(--warn)" }}>Sample data</span>
            <span className="rounded-full border border-line px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-[color:var(--ink-3)]">
              {AGENTS.find((a) => a.id === agent)!.name}
            </span>
            <button onClick={() => setRailOpen(true)}
              className="rounded-lg border border-line bg-panel p-1.5 md:hidden" aria-label="Menu">
              <Menu className="h-4 w-4" />
            </button>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-8 md:px-6">
          {dest === "terminal" && <Terminal />}
          {dest === "reporting" && <Reporting biz={biz} setBiz={setBiz} />}
          {dest === "triage" && <Triage />}
          {dest === "glofox" && <Glofox />}
          {dest === "sessions" && <Sessions agent={agent} />}
          {dest === "attention" && <Attention />}
        </div>
      </main>
    </div>
  );
}

/* ------------------------------------------------------------- terminal -- */
function Terminal() {
  const [lines, setLines] = useState<Line[]>([
    { kind: "bot", text: "Standing by. Ask for numbers, mail or classes and the window opens on the right as I work." },
  ]);
  const [working, setWorking] = useState(false);
  const [state, setState] = useState("Standing by");
  const [app, setApp] = useState("Reports");
  const [opened, setOpened] = useState(false);
  const [draft, setDraft] = useState("");
  const [gate, setGate] = useState<"open" | "approved" | "held" | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ block: "end" }); }, [lines]);

  const run = (q: string) => {
    const script = SCRIPTS[q];
    setLines((l) => [...l, { kind: "you", text: q }]);
    setWorking(true);
    setState(script ? script.state : "Thinking");
    setGate(null);
    const queue = script ? script.lines : [{ kind: "bot" as const, text: "Scripted mockup, so there is no answer written for that one yet. Try a suggestion." }];
    queue.forEach((line, i) => {
      setTimeout(() => {
        setLines((l) => [...l, line]);
        if (line.kind === "gate") setGate("open");
        if (i === queue.length - 1) {
          setWorking(false);
          setState("Standing by");
          if (script) { setApp(script.app); setOpened(true); }
        }
      }, 380 + i * 520);
    });
  };

  return (
    <div className="grid min-h-[520px] gap-3 lg:grid-cols-[minmax(0,1fr)_330px]">
      <div className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-line-soft bg-panel">
        <div className="relative">
          <Orb working={working} />
          <div className="pointer-events-none absolute left-3.5 top-3">
            <Label>Alien Kind</Label>
            <div className="pointer-events-auto mt-1"><AnimatedBadge text={state} /></div>
          </div>
          <div className="absolute right-3.5 top-3 flex items-center gap-2">
            <span className="h-1 w-14 overflow-hidden rounded-full bg-line">
              <i className="block h-full w-[12%] rounded-full" style={{ background: "var(--orange)" }} />
            </span>
            <span className="num text-[10px] text-[color:var(--ink-3)]">$0.62 / $5</span>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto p-3">
          {lines.map((l, i) => {
            if (l.kind === "tool" || l.kind === "gate") {
              const amber = l.kind === "gate";
              return (
                <div key={i} className="flex items-center gap-2 px-0.5 font-mono text-[11px]"
                     style={{ color: amber ? "var(--warn)" : "var(--ink-3)" }}>
                  <span className="h-[5px] w-[5px] shrink-0 rounded-full"
                        style={{ background: amber ? "var(--warn)" : "var(--orange)" }} />
                  {l.text}
                </div>
              );
            }
            const mine = l.kind === "you";
            return (
              <div key={i} className={`max-w-[88%] rounded-xl px-3 py-2.5 text-[13.5px] ${mine ? "self-end" : "self-start bg-raised"}`}
                   style={mine ? { background: "var(--wash)" } : undefined}>
                {!mine && <span className="mb-1 block font-mono text-[9.5px] uppercase tracking-wider text-[color:var(--ink-3)]">Alien Kind</span>}
                <p className="m-0 whitespace-pre-wrap">{l.text}</p>
              </div>
            );
          })}

          {gate === "open" && (
            <div className="flex gap-2 self-stretch">
              <button onClick={() => { setGate("approved"); setLines((l) => [...l, { kind: "tool", text: "approved, draft saved" }]); }}
                className="flex-1 rounded-lg px-3 py-1.5 text-[13px] font-semibold"
                style={{ background: "var(--orange)", color: "#201f1d" }}>Approve</button>
              <button onClick={() => { setGate("held"); setLines((l) => [...l, { kind: "tool", text: "held" }]); }}
                className="flex-1 rounded-lg border border-line px-3 py-1.5 text-[13px]">Not yet</button>
            </div>
          )}
          <div ref={endRef} />
        </div>

        <div className="flex shrink-0 flex-col gap-1.5 px-3 pb-2.5">
          {Object.keys(SCRIPTS).map((q) => (
            <button key={q} onClick={() => run(q)}
              className="rounded-lg border border-transparent bg-raised px-3 py-2.5 text-left text-[12.5px] text-[color:var(--ink-2)] hover:border-[color:var(--orange)] hover:text-ink">
              &ldquo;{q}&rdquo;
            </button>
          ))}
        </div>

        <div className="flex shrink-0 gap-2 border-t border-line-soft p-3">
          <textarea rows={1} value={draft} onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); if (draft.trim()) { run(draft.trim()); setDraft(""); } } }}
            placeholder="Ask Alien Kind"
            className="min-h-[42px] flex-1 resize-none rounded-lg border border-line bg-raised px-3 py-2.5 text-[13.5px] outline-none placeholder:text-[color:var(--ink-3)]" />
          <button onClick={() => { if (draft.trim()) { run(draft.trim()); setDraft(""); } }}
            className="rounded-lg px-4 text-[13px] font-semibold" style={{ background: "var(--orange)", color: "#201f1d" }}>
            Send
          </button>
        </div>
      </div>

      <div className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-line-soft bg-panel">
        <div className="flex shrink-0 flex-wrap gap-1 px-2.5 pt-2.5">
          {["Superhuman", "Glofox", "Reports", "Calendar"].map((a) => (
            <button key={a} onClick={() => { setApp(a); setOpened(true); }} aria-selected={a === app}
              className={`rounded-lg border px-2.5 py-1.5 text-xs ${a === app ? "font-semibold" : "border-transparent text-[color:var(--ink-3)] hover:text-ink"}`}
              style={a === app ? { background: "var(--wash)", borderColor: "var(--orange)", color: "var(--orange)" } : undefined}>
              {a}
            </button>
          ))}
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-3.5 py-3">
          {!opened && <p className="text-[12.5px] text-[color:var(--ink-3)]">Nothing open yet. Ask and the window appears as it works.</p>}
          {opened && app === "Superhuman" && MAIL.map((m) => (
            <Row key={m.from} dot={m.kind} title={m.from} sub={`${m.subject}  ·  ${m.account}`} right={m.when} />
          ))}
          {opened && app === "Glofox" && GLOFOX.recon.map((r) => (
            <Row key={r.metric} dot={r.kind} title={r.metric} sub={`GHL ${r.ghl}  ·  Glofox ${r.glofox}`} />
          ))}
          {opened && app === "Reports" && ATTENTION.map((a, i) => (
            <div key={i} className="mb-1 border-l-[3px] py-2.5 pl-3" style={{ borderColor: kindColour(a.kind) }}>
              <p className="m-0 text-[13px] text-[color:var(--ink-2)]">{a.text}</p>
            </div>
          ))}
          {opened && app === "Calendar" && <p className="text-[12.5px] text-[color:var(--ink-3)]">Calendar is wired in the real build.</p>}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------- the rest -- */
function Reporting({ biz, setBiz }: { biz: string; setBiz: (b: string) => void }) {
  const max = Math.max(...REVENUE.map((r) => r.value));
  return (
    <>
      <div className="mb-4 flex flex-wrap gap-1.5">
        {Object.keys(BUSINESSES).map((b) => (
          <button key={b} onClick={() => setBiz(b)}
            className="rounded-lg border px-3 py-1.5 text-[13px]"
            style={b === biz ? { background: "var(--wash)", borderColor: "var(--orange)", color: "var(--orange)", fontWeight: 600 }
                             : { borderColor: "var(--line)", background: "var(--panel)", color: "var(--ink-2)" }}>
            {b}
          </button>
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {BUSINESSES[biz].map((t) => <StatTile key={t.name} tile={t} />)}
      </div>
      <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <Card title="Pace vs last month" note="colour = whether it is a problem"><PaceChart rows={PACE[biz]} /></Card>
        <Card title="Revenue MTD by business">
          {REVENUE.map((r) => (
            <Meter key={r.name} name={r.name} label={r.label}
                   pct={Math.round((r.value / max) * 100)} colour="var(--orange)" />
          ))}
        </Card>
      </div>
    </>
  );
}

function Triage() {
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {ACCOUNTS.map((a) => (
          <StatTile key={a.address} tile={{
            name: a.address, value: String(a.unread),
            delta: a.reply ? `${a.reply} need a reply` : "nothing waiting",
            dir: a.reply ? "down" : "flat",
          }} />
        ))}
      </div>
      <div className="mt-3">
        <Card title="Top of inbox" note="all three accounts">
          {MAIL.map((m) => <Row key={m.from} dot={m.kind} title={m.from} sub={`${m.subject}  ·  ${m.account}`} right={m.when} />)}
        </Card>
      </div>
    </>
  );
}

function Glofox() {
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {GLOFOX.tiles.map((t) => <StatTile key={t.name} tile={t} />)}
      </div>
      <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <Card title="Glofox against GHL" note="rows that disagree are the work">
          {GLOFOX.recon.map((r) => (
            <Row key={r.metric} dot={r.kind} title={r.metric} sub={`GHL ${r.ghl}  ·  Glofox ${r.glofox}`} />
          ))}
        </Card>
        <Card title="Class fill rate">
          {GLOFOX.classes.map((c) => {
            const pct = Math.round((c.booked / c.cap) * 100);
            return <Meter key={c.name} name={c.name} label={`${c.booked} / ${c.cap}`} pct={pct}
                          colour={pct >= 80 ? "var(--good)" : pct >= 55 ? "var(--warn)" : "var(--bad)"} />;
          })}
        </Card>
      </div>
    </>
  );
}

function Sessions({ agent }: { agent: AgentId }) {
  const mine = SESSIONS.filter((s) => s.agent === agent);
  const who = AGENTS.find((a) => a.id === agent)!;
  return (
    <Card title="Open sessions" note={`${who.name} only`}>
      {mine.length === 0 && <p className="text-[12.5px] text-[color:var(--ink-3)]">Nothing open for this agent.</p>}
      {mine.map((s) => <Row key={s.name} dot={who.colour} title={s.name} sub={who.name} badge={s.tool} right={s.when} />)}
    </Card>
  );
}

function Attention() {
  return (
    <Card title="Needs attention" note="what moved the wrong way">
      {ATTENTION.map((a, i) => (
        <div key={i} className="mb-1 border-l-[3px] py-2.5 pl-3" style={{ borderColor: kindColour(a.kind) }}>
          <p className="m-0 text-[13px] text-[color:var(--ink-2)]">{a.text}</p>
        </div>
      ))}
    </Card>
  );
}
