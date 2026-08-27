"use client";

import {
  AlertTriangle,
  Building2,
  LayoutGrid,
  Mail,
  Moon,
  SquareKanban,
  Sun,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { BridgeSection } from "@/components/sections/bridge";
import { BusinessesSection } from "@/components/sections/businesses";
import { ClickUpSection } from "@/components/sections/clickup";
import { ClientsSection } from "@/components/sections/clients";
import { AttentionSection, MailSection } from "@/components/sections/inbox";
import { Sidebar, type SidebarItem } from "@/components/ui/sidebar";
import type { DashboardState } from "@/lib/dashboard";
import { cn } from "@/lib/utils";

const THEME_KEY = "cc-theme";
const RAIL_KEY = "cc-rail";

export type SectionId = "biz" | "clients" | "bridge" | "mail" | "clickup" | "attn";

/**
 * The whole product. One section fills the main area at a time, chosen from the
 * rail on desktop or the tab bar on a phone — which is the layout Ben asked
 * for, and also the only one that survives a 390px screen.
 */
export function CommandCenter({ state }: { state: DashboardState }) {
  const [section, setSection] = useState<SectionId>("biz");
  const [railOpen, setRailOpen] = useState(true);
  const [dark, setDark] = useState(false);

  // Read what the pre-paint script already applied, so the toggle starts in sync.
  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
    try {
      setRailOpen(localStorage.getItem(RAIL_KEY) !== "closed");
    } catch {
      /* storage can be blocked; the default stands */
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setDark((wasDark) => {
      const next = !wasDark;
      document.documentElement.classList.toggle("dark", next);
      try {
        localStorage.setItem(THEME_KEY, next ? "dark" : "light");
      } catch {
        /* the class is what matters; persistence is a bonus */
      }
      return next;
    });
  }, []);

  const toggleRail = useCallback(() => {
    setRailOpen((open) => {
      try {
        localStorage.setItem(RAIL_KEY, open ? "closed" : "open");
      } catch {
        /* ignore */
      }
      return !open;
    });
  }, []);

  const urgent = state.alerts.filter((alert) => alert.severity !== "info").length;

  const items: SidebarItem[] = [
    { id: "biz", title: "My Businesses", Icon: Building2, count: 3 },
    { id: "clients", title: "Client OS", Icon: Users, count: 4 },
    { id: "bridge", title: "Bridge", Icon: LayoutGrid, count: 4 },
    { id: "mail", title: "Superhuman", Icon: Mail, count: 14 },
    { id: "clickup", title: "ClickUp", Icon: SquareKanban, count: 7 },
    {
      id: "attn",
      title: "Needs attention",
      Icon: AlertTriangle,
      count: urgent,
      urgent: true,
      group: "Watch",
    },
  ];

  return (
    <div className="flex h-dvh w-full bg-bg text-ink">
      <Sidebar
        items={items}
        selected={section}
        onSelect={(id) => setSection(id as SectionId)}
        open={railOpen}
        onToggle={toggleRail}
        dark={dark}
        onToggleTheme={toggleTheme}
        subtitle="Ben Grove"
      />

      {/* The rail carries the theme toggle on desktop, but it's hidden on a
          phone — so the phone gets its own, floating clear of the content. */}
      <button
        type="button"
        onClick={toggleTheme}
        aria-pressed={dark}
        aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
        className="card-surface fixed right-3 top-3 z-30 grid size-10 place-content-center text-ink-muted md:hidden"
      >
        {dark ? <Sun className="size-4" aria-hidden /> : <Moon className="size-4" aria-hidden />}
      </button>

      {/* pb-24 clears the phone tab bar; md drops it again. */}
      <main className="min-w-0 flex-1 overflow-y-auto px-4 pb-24 pt-5 md:px-7 md:pb-10 md:pt-7">
        <Section id={section} state={state} />
      </main>

      <TabBar items={items} selected={section} onSelect={(id) => setSection(id as SectionId)} />
    </div>
  );
}

function Section({ id, state }: { id: SectionId; state: DashboardState }) {
  switch (id) {
    case "biz":
      return <BusinessesSection state={state} />;
    case "clients":
      return <ClientsSection />;
    case "bridge":
      return <BridgeSection />;
    case "mail":
      return <MailSection />;
    case "clickup":
      return <ClickUpSection />;
    case "attn":
      return <AttentionSection alerts={state.alerts} />;
  }
}

/** Phone navigation. Six icons, thumb-reachable, above the home indicator. */
function TabBar({
  items,
  selected,
  onSelect,
}: {
  items: SidebarItem[];
  selected: string;
  onSelect: (id: string) => void;
}) {
  return (
    <nav
      aria-label="Sections"
      className="fixed inset-x-0 bottom-0 z-30 flex border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      {items.map(({ id, title, Icon, count, urgent }) => {
        const active = id === selected;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onSelect(id)}
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition-colors",
              active ? "text-brand" : "text-ink-dim",
            )}
          >
            <Icon className="size-5" aria-hidden />
            <span className="max-w-full truncate px-0.5">{title.split(" ")[0]}</span>
            {count ? (
              <span
                className={cn(
                  "tabular absolute right-1/2 top-1 translate-x-4 rounded-full px-1 text-[9px] font-bold leading-4",
                  urgent ? "bg-down text-on-tone" : "bg-surface-2 text-ink-muted",
                )}
              >
                {count}
              </span>
            ) : null}
          </button>
        );
      })}
    </nav>
  );
}
