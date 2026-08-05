"use client";

import { useEffect, useState } from "react";

import { BrainGraph } from "@/components/brain/brain-graph";
import { Badge } from "@/components/ui/badge";

export function TopBar({ businessCount }: { businessCount: number }) {
  const [now, setNow] = useState<string | null>(null);

  // Rendered client-side only — a server-rendered clock would hydrate stale.
  useEffect(() => {
    const format = () =>
      new Date().toLocaleString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
    setNow(format());
    const timer = setInterval(() => setNow(format()), 30_000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="relative isolate h-32 shrink-0 overflow-hidden border-b border-line sm:h-40">
      <BrainGraph className="absolute inset-0 -z-10" />
      {/* Fade the graph out behind the text so labels stay readable. */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-r from-bg via-bg/35 to-bg/75" />

      <div className="flex h-full items-center justify-between gap-4 px-5">
        <div className="min-w-0">
          <h1 className="text-lg font-semibold tracking-[0.24em] text-ink uppercase sm:text-2xl">
            Command Center
          </h1>
          <p className="mt-1 truncate text-[11px] tracking-[0.18em] text-ink-dim uppercase">
            Growth Factor AI · Ben Grove
          </p>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2">
          <span className="text-xs text-ink-muted tabular">{now ?? "—"}</span>
          <div className="flex flex-wrap justify-end gap-1.5">
            <Badge tone="accent">{businessCount} businesses</Badge>
            <Badge tone="neutral">v1 · phase 1</Badge>
          </div>
        </div>
      </div>
    </header>
  );
}
