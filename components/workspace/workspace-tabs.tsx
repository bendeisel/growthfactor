"use client";

import {
  Bot,
  CalendarDays,
  FolderOpen,
  ListChecks,
  Mail,
  Terminal,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarPanel } from "@/components/workspace/panels/calendar-panel";
import { ClaudeCodePanel } from "@/components/workspace/panels/claude-code-panel";
import { ClickUpPanel } from "@/components/workspace/panels/clickup-panel";
import { DrivePanel } from "@/components/workspace/panels/drive-panel";
import { GmailPanel } from "@/components/workspace/panels/gmail-panel";
import { MegatronPanel } from "@/components/workspace/panels/megatron-panel";

interface TabDef {
  value: string;
  label: string;
  icon: LucideIcon;
  panel: React.ReactNode;
}

/** The locked v1 panel list (spec §9), in order. Google Photos is deferred. */
const TABS: TabDef[] = [
  { value: "megatron", label: "Megatron", icon: Bot, panel: <MegatronPanel /> },
  {
    value: "claude-code",
    label: "Claude Code",
    icon: Terminal,
    panel: <ClaudeCodePanel />,
  },
  { value: "clickup", label: "ClickUp", icon: ListChecks, panel: <ClickUpPanel /> },
  { value: "drive", label: "Drive", icon: FolderOpen, panel: <DrivePanel /> },
  { value: "gmail", label: "Gmail", icon: Mail, panel: <GmailPanel /> },
  {
    value: "calendar",
    label: "Calendar",
    icon: CalendarDays,
    panel: <CalendarPanel />,
  },
];

export function WorkspaceTabs() {
  return (
    <Card className="flex min-h-0 flex-col overflow-hidden">
      <Tabs
        defaultValue="megatron"
        className="flex min-h-0 flex-1 flex-col"
        // Panels stay mounted so a half-typed message survives a tab switch.
      >
        <TabsList>
          {TABS.map(({ value, label, icon: Icon }) => (
            <TabsTrigger key={value} value={value}>
              <Icon className="size-3.5" />
              {label}
            </TabsTrigger>
          ))}
        </TabsList>

        {TABS.map(({ value, panel }) => (
          <TabsContent key={value} value={value} forceMount>
            {panel}
          </TabsContent>
        ))}
      </Tabs>
    </Card>
  );
}
