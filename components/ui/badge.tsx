import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badge = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.1em] whitespace-nowrap",
  {
    variants: {
      tone: {
        neutral: "border-line-bright text-ink-muted",
        live: "border-up/40 bg-up/10 text-up",
        mock: "border-warn/40 bg-warn/10 text-warn",
        pending: "border-violet/40 bg-violet/10 text-violet",
        accent: "border-accent/40 bg-accent/10 text-accent",
        danger: "border-down/40 bg-down/10 text-down",
      },
    },
    defaultVariants: { tone: "neutral" },
  },
);

export type BadgeProps = React.ComponentProps<"span"> &
  VariantProps<typeof badge>;

export function Badge({ className, tone, ...props }: BadgeProps) {
  return <span className={cn(badge({ tone }), className)} {...props} />;
}
