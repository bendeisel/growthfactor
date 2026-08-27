"use client";

import { CheckCircle2, Clock, FileText, Inbox } from "lucide-react";
import { NotConnected, PageHead, Panel, StatCard } from "@/components/sections/parts";
import type { Alert } from "@/lib/alerts";
import { cn } from "@/lib/utils";

const MAIL: { from: string; subject: string; when: string; tone: "up" | "warn" | "down" }[] = [
  { from: "Aeterna Club", subject: "Re: e-sign landing in spam — can we sort the dedicated domain?", when: "09:14", tone: "down" },
  { from: "Glofox Support", subject: "API access request #4471 escalated to partnerships", when: "08:02", tone: "warn" },
  { from: "David Blunk", subject: "CI board — schema questions before I start the importer", when: "Wed", tone: "up" },
  { from: "Furst Place MMA", subject: "A2P registration approved, texts are sending again", when: "Wed", tone: "up" },
  { from: "Search Console", subject: "Coverage issue detected on fightersboxing.com", when: "Tue", tone: "warn" },
];

/**
 * Superhuman is a client on top of Gmail, so the integration behind this is
 * Gmail OAuth — there is no Superhuman API to read.
 */
export function MailSection() {
  return (
    <>
      <PageHead title="Superhuman" sub="Four accounts, one inbox" />
      <div className="mb-4">
        <NotConnected what="Mail" needs={["Google OAuth (Gmail)"]} />
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 md:gap-4 xl:grid-cols-4">
        <StatCard Icon={Inbox} accent="brand" label="Unread" value="14" detail="4 accounts" />
        <StatCard Icon={Clock} accent="down" label="Needs reply" value="5" detail="2 overdue" tone="down" />
        <StatCard Icon={FileText} accent="violet" label="Drafted" value="3" detail="waiting on you" />
        <StatCard Icon={CheckCircle2} accent="up" label="Cleared today" value="28" detail="best this week" tone="up" />
      </div>

      <Panel title="Top of inbox">
        <ul>
          {MAIL.map((mail) => (
            <li key={mail.subject} className="flex items-start gap-3 border-b border-line py-3 last:border-0">
              <span className={cn("w-0.5 shrink-0 self-stretch rounded-full", stripe(mail.tone))} />
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-semibold">{mail.from}</p>
                <p className="truncate text-xs text-ink-muted">{mail.subject}</p>
              </div>
              <span className="shrink-0 text-xs text-ink-dim">{mail.when}</span>
            </li>
          ))}
        </ul>
      </Panel>
    </>
  );
}

/** Real alerts from lib/alerts.ts — worst first, thresholds in one place. */
export function AttentionSection({ alerts }: { alerts: Alert[] }) {
  const urgent = alerts.filter((alert) => alert.severity !== "info").length;

  return (
    <>
      <PageHead
        title="Needs attention"
        sub={urgent ? `Worst first. ${urgent} ${urgent === 1 ? "thing needs" : "things need"} you.` : "Nothing needs you right now."}
      />
      <Panel>
        {alerts.length === 0 ? (
          <p className="py-10 text-center text-sm text-ink-dim">
            Every business is inside its thresholds.
          </p>
        ) : (
          <ul>
            {alerts.map((alert) => (
              <li key={alert.id} className="flex items-start gap-3 border-b border-line py-3 last:border-0">
                <span
                  className={cn(
                    "w-0.5 shrink-0 self-stretch rounded-full",
                    stripe(alert.severity === "critical" ? "down" : alert.severity === "warn" ? "warn" : "up"),
                  )}
                />
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold">{alert.title}</p>
                  <p className="text-xs leading-relaxed text-ink-muted">{alert.detail}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </>
  );
}

const stripe = (tone: "up" | "warn" | "down") =>
  tone === "down" ? "bg-down" : tone === "warn" ? "bg-warn" : "bg-up";
