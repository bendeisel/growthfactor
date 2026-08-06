"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

import { BrainGraph } from "@/components/brain/brain-graph";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function TopBar({
  businessCount,
  protected: isProtected,
  openAlerts,
}: {
  businessCount: number;
  /** Whether a password is configured on this deployment. */
  protected: boolean;
  openAlerts: number;
}) {
  const router = useRouter();
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

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }

  return (
    <header className="relative isolate h-24 shrink-0 overflow-hidden border-b border-line sm:h-40">
      <BrainGraph className="absolute inset-0 -z-10" />
      {/* Fade the graph out behind the text so labels stay readable. */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-r from-bg via-bg/35 to-bg/75" />

      <div className="flex h-full items-center justify-between gap-4 px-4 sm:px-5">
        <div className="min-w-0">
          <h1 className="text-base font-semibold tracking-[0.2em] text-ink uppercase sm:text-2xl sm:tracking-[0.24em]">
            Command Center
          </h1>
          <p className="mt-1 truncate text-[10px] tracking-[0.16em] text-ink-dim uppercase sm:text-[11px] sm:tracking-[0.18em]">
            Growth Factor AI · Ben Grove
          </p>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2">
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-ink-muted tabular sm:text-xs">
              {now ?? "—"}
            </span>
            {isProtected ? (
              <Button
                variant="ghost"
                size="icon"
                onClick={signOut}
                title="Sign out"
                aria-label="Sign out"
              >
                <LogOut className="size-3.5" />
              </Button>
            ) : null}
          </div>
          <div className="hidden flex-wrap justify-end gap-1.5 sm:flex">
            {openAlerts > 0 ? (
              <Badge tone="danger">{openAlerts} need attention</Badge>
            ) : (
              <Badge tone="live">all on pace</Badge>
            )}
            <Badge tone="accent">{businessCount} businesses</Badge>
            {/* A deployment without a password is a real risk, so say so on screen. */}
            {isProtected ? null : <Badge tone="mock">unprotected</Badge>}
          </div>
        </div>
      </div>
    </header>
  );
}
