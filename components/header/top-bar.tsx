"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

/**
 * A slim bar, deliberately. The Jarvis core in the centre column is the
 * centrepiece now, so the header's job is just identity, time, and the one
 * number that decides whether Ben needs to look at anything.
 */
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
    <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-line px-3 sm:px-5">
      <div className="flex min-w-0 items-baseline gap-2 sm:gap-3">
        <h1 className="text-sm font-semibold tracking-[0.2em] text-ink uppercase sm:text-base sm:tracking-[0.24em]">
          Command Center
        </h1>
        <p className="hidden truncate text-[10px] tracking-[0.16em] text-ink-dim uppercase sm:block">
          Growth Factor AI
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {openAlerts > 0 ? (
          <Badge tone="danger">{openAlerts} need attention</Badge>
        ) : (
          <Badge tone="live">all on pace</Badge>
        )}
        <Badge tone="accent" className="hidden sm:inline-flex">
          {businessCount} businesses
        </Badge>
        {/* A deployment without a password is a real risk, so say so on screen. */}
        {isProtected ? null : <Badge tone="mock">unprotected</Badge>}
        <span className="text-[11px] text-ink-muted tabular">{now ?? "—"}</span>
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
    </header>
  );
}
