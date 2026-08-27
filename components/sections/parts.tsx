"use client";

import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function PageHead({
  title,
  sub,
  children,
}: {
  title: string;
  sub: string;
  children?: ReactNode;
}) {
  return (
    <header className="mb-5 flex flex-wrap items-start gap-x-5 gap-y-3">
      <div className="min-w-0">
        <h1 className="text-2xl font-extrabold tracking-tight md:text-3xl">{title}</h1>
        <p className="mt-0.5 text-sm text-ink-muted">{sub}</p>
      </div>
      {children ? <div className="ml-auto flex flex-wrap items-center gap-2">{children}</div> : null}
    </header>
  );
}

export function Panel({
  title,
  note,
  children,
  className,
}: {
  title?: string;
  note?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("card-surface flex min-w-0 flex-col", className)}>
      {title ? (
        <div className="flex items-center gap-3 border-b border-line px-4 py-3">
          <h2 className="text-[15px] font-bold tracking-tight">{title}</h2>
          {note ? <span className="ml-auto text-xs text-ink-dim">{note}</span> : null}
        </div>
      ) : null}
      <div className="min-w-0 flex-1 p-4">{children}</div>
    </section>
  );
}

export type StatTone = "up" | "down" | "warn" | "flat";

const ACCENT: Record<string, string> = {
  brand: "bg-brand-soft text-brand",
  teal: "bg-teal-soft text-teal",
  violet: "bg-violet-soft text-violet",
  warn: "bg-warn-soft text-warn",
  down: "bg-down-soft text-down",
  up: "bg-up-soft text-up",
};

export function StatCard({
  label,
  value,
  detail,
  tone = "flat",
  accent = "brand",
  Icon,
}: {
  label: string;
  value: string;
  detail: string;
  tone?: StatTone;
  accent?: keyof typeof ACCENT;
  Icon: LucideIcon;
}) {
  return (
    <div className="card-surface p-4">
      <span className={cn("mb-3 grid size-9 place-content-center rounded-lg", ACCENT[accent])}>
        <Icon className="size-[18px]" aria-hidden />
      </span>
      <p className="text-[13px] font-medium text-ink-muted">{label}</p>
      <p className="hero-number mt-1 text-2xl md:text-[26px]">{value}</p>
      <p
        className={cn(
          "mt-1 text-xs font-semibold",
          tone === "up" && "text-up",
          tone === "down" && "text-down",
          tone === "warn" && "text-warn",
          tone === "flat" && "font-medium text-ink-dim",
        )}
      >
        {detail}
      </p>
    </div>
  );
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: { id: T; label: string }[];
  value: T;
  onChange: (id: T) => void;
  label: string;
}) {
  return (
    <div role="tablist" aria-label={label} className="card-surface flex gap-1 p-1">
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          role="tab"
          aria-selected={option.id === value}
          onClick={() => onChange(option.id)}
          className={cn(
            "rounded-lg px-3 py-1.5 text-[13px] font-semibold transition-colors",
            option.id === value
              ? "bg-brand text-white"
              : "text-ink-muted hover:bg-surface-hover hover:text-ink",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function Picker({
  value,
  onChange,
  options,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { id: string; name: string }[];
  label: string;
}) {
  return (
    <select
      aria-label={label}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="card-surface max-w-full min-w-0 truncate px-3 py-2 text-[13px] font-semibold"
    >
      {options.map((option) => (
        <option key={option.id} value={option.id}>
          {option.name}
        </option>
      ))}
    </select>
  );
}

/**
 * Says a number isn't real. The convention is that nothing appears on screen
 * without one of these unless a vendor actually reported it.
 */
export function QualityBadge({ quality, note }: { quality: string; note?: string }) {
  if (quality === "live") return null;
  const tone =
    quality === "error" ? "bg-down-soft text-down" : quality === "stale" ? "bg-warn-soft text-warn" : "bg-surface-2 text-ink-muted";
  return (
    <span title={note} className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold", tone)}>
      {quality}
    </span>
  );
}

export function NotConnected({ what, needs }: { what: string; needs: string[] }) {
  return (
    <div className="tile flex flex-wrap items-center gap-x-2 gap-y-1 p-3 text-xs">
      <span className="font-semibold text-warn">Sample data</span>
      <span className="text-ink-muted">
        {what} isn&apos;t connected yet — needs {needs.join(", ")}.
      </span>
    </div>
  );
}
