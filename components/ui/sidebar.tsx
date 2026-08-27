"use client";

import type { LucideIcon } from "lucide-react";
import { ChevronDown, ChevronsRight, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SidebarItem {
  id: string;
  title: string;
  Icon: LucideIcon;
  /** Count shown on the right. Omitted or 0 renders nothing. */
  count?: number;
  /** Draws the count in the "this needs you" colour rather than the quiet one. */
  urgent?: boolean;
  /** Items after a divider, under a small caption. */
  group?: string;
}

interface SidebarProps {
  items: SidebarItem[];
  selected: string;
  onSelect: (id: string) => void;
  open: boolean;
  onToggle: () => void;
  dark: boolean;
  onToggleTheme: () => void;
  /** Shown under the workspace name. */
  subtitle: string;
}

/**
 * Collapsed to a 4rem rail or open to 16rem. On phones the shell hides this
 * entirely and swaps in a bottom tab bar — a 16rem drawer over a 390px screen
 * leaves nothing to read.
 */
export function Sidebar({
  items,
  selected,
  onSelect,
  open,
  onToggle,
  dark,
  onToggleTheme,
  subtitle,
}: SidebarProps) {
  const groups = groupItems(items);

  return (
    <nav
      aria-label="Sections"
      className={cn(
        "sticky top-0 hidden h-dvh shrink-0 flex-col border-r border-line bg-surface transition-[width] duration-300 ease-in-out md:flex",
        open ? "w-64" : "w-16",
      )}
    >
      <div className="border-b border-line p-3">
        <div className="flex items-center gap-3 rounded-lg p-1">
          <span className="grid size-10 shrink-0 place-content-center rounded-xl bg-brand text-white">
            <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden>
              <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
              <circle cx="12" cy="12" r="4.2" />
            </svg>
          </span>
          {open ? (
            <>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold">Growth Factor</span>
                <span className="block truncate text-xs text-ink-dim">{subtitle}</span>
              </span>
              <ChevronDown className="size-4 shrink-0 text-ink-dim" aria-hidden />
            </>
          ) : null}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {groups.map(({ group, entries }) => (
          <div key={group ?? "main"} className={group ? "mt-4 border-t border-line pt-3" : ""}>
            {group && open ? (
              <p className="px-3 pb-1 text-[10px] font-medium uppercase tracking-[0.14em] text-ink-dim">
                {group}
              </p>
            ) : null}
            {entries.map((item) => (
              <SidebarButton
                key={item.id}
                item={item}
                open={open}
                active={item.id === selected}
                onSelect={onSelect}
              />
            ))}
          </div>
        ))}
      </div>

      <div className="border-t border-line p-2">
        <button
          type="button"
          onClick={onToggleTheme}
          className="flex h-11 w-full items-center rounded-lg text-ink-muted transition-colors hover:bg-surface-hover hover:text-ink"
          aria-pressed={dark}
        >
          <span className="grid h-full w-12 shrink-0 place-content-center">
            {dark ? <Sun className="size-4" aria-hidden /> : <Moon className="size-4" aria-hidden />}
          </span>
          {open ? <span className="text-sm font-medium">{dark ? "Light mode" : "Dark mode"}</span> : null}
        </button>

        <button
          type="button"
          onClick={onToggle}
          className="flex h-11 w-full items-center rounded-lg text-ink-muted transition-colors hover:bg-surface-hover hover:text-ink"
          aria-expanded={open}
        >
          <span className="grid h-full w-12 shrink-0 place-content-center">
            <ChevronsRight
              className={cn("size-4 transition-transform duration-300", open && "rotate-180")}
              aria-hidden
            />
          </span>
          {open ? <span className="text-sm font-medium">Hide</span> : null}
        </button>
      </div>
    </nav>
  );
}

function SidebarButton({
  item,
  open,
  active,
  onSelect,
}: {
  item: SidebarItem;
  open: boolean;
  active: boolean;
  onSelect: (id: string) => void;
}) {
  const { Icon } = item;
  return (
    <button
      type="button"
      onClick={() => onSelect(item.id)}
      title={open ? undefined : item.title}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative flex h-11 w-full items-center rounded-lg transition-colors",
        active
          ? "bg-brand-soft font-semibold text-brand"
          : "text-ink-muted hover:bg-surface-hover hover:text-ink",
      )}
    >
      <span className="grid h-full w-12 shrink-0 place-content-center">
        <Icon className="size-4" aria-hidden />
      </span>
      {open ? <span className="truncate text-sm font-medium">{item.title}</span> : null}
      {item.count ? (
        <span
          className={cn(
            "tabular absolute grid h-5 min-w-5 place-content-center rounded-full px-1.5 text-[11px] font-semibold",
            open ? "right-3" : "right-1 top-1 h-4 min-w-4 px-1 text-[9px]",
            item.urgent ? "bg-down text-on-tone" : "bg-surface-2 text-ink-muted",
          )}
        >
          {item.count}
        </span>
      ) : null}
    </button>
  );
}

function groupItems(items: SidebarItem[]): { group?: string; entries: SidebarItem[] }[] {
  const out: { group?: string; entries: SidebarItem[] }[] = [];
  for (const item of items) {
    const tail = out[out.length - 1];
    if (tail && tail.group === item.group) tail.entries.push(item);
    else out.push({ group: item.group, entries: [item] });
  }
  return out;
}
