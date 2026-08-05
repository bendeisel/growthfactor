import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";

export interface PanelPlaceholderProps {
  /** Where the data will come from, e.g. "Google Drive API". */
  source: string;
  /** Build phase that lights this panel up. */
  phase: string;
  /** What the panel does once connected — the v1 scope, not a wishlist. */
  features: string[];
  /** Env vars / OAuth apps still needed. */
  needs?: string[];
  children?: ReactNode;
}

/**
 * Every v1 tab renders its real scope and its real blockers rather than a
 * "coming soon" box, so Phase 3/4 work starts from a checklist.
 */
export function PanelPlaceholder({
  source,
  phase,
  features,
  needs,
  children,
}: PanelPlaceholderProps) {
  return (
    <div className="h-full overflow-y-auto p-5">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="pending">{phase}</Badge>
        <span className="text-xs text-ink-dim">{source}</span>
      </div>

      <ul className="mt-4 space-y-2">
        {features.map((feature) => (
          <li key={feature} className="flex gap-2.5 text-sm text-ink-muted">
            <span className="mt-[0.45rem] size-1.5 shrink-0 rounded-full bg-accent/70" />
            {feature}
          </li>
        ))}
      </ul>

      {children ? <div className="mt-5">{children}</div> : null}

      {needs?.length ? (
        <div className="mt-5 rounded-lg border border-line bg-bg-elevated/70 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-dim">
            Needs
          </p>
          <ul className="mt-2 space-y-1">
            {needs.map((need) => (
              <li key={need} className="font-mono text-[11px] text-ink-muted">
                {need}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
