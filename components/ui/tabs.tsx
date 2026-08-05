"use client";

import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";

import { cn } from "@/lib/utils";

export const Tabs = TabsPrimitive.Root;

export function TabsList({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      className={cn(
        "flex min-w-0 items-center gap-1 overflow-x-auto border-b border-line px-2",
        className,
      )}
      {...props}
    />
  );
}

export function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        "relative flex shrink-0 items-center gap-2 rounded-t-lg px-3 py-2.5 text-sm text-ink-dim transition-colors",
        "hover:text-ink-muted",
        "data-[state=active]:text-ink data-[state=active]:bg-panel-hover/60",
        "after:absolute after:inset-x-2 after:bottom-0 after:h-px after:bg-transparent data-[state=active]:after:bg-accent",
        "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent",
        className,
      )}
      {...props}
    />
  );
}

export function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      className={cn(
        "min-h-0 flex-1 focus-visible:outline-none data-[state=inactive]:hidden",
        className,
      )}
      {...props}
    />
  );
}
