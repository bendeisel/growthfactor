import { PanelPlaceholder } from "@/components/workspace/panels/panel-placeholder";

export function ClickUpPanel() {
  return (
    <PanelPlaceholder
      phase="Phase 3"
      source="ClickUp API / embed"
      features={[
        "Task list for the active project, filtered to what's due and overdue",
        "Quick-add: one field, drops a task into the current list",
        "Project switcher across all workspaces",
        "Delivery metrics feed back into the left column via the ClickUp adapter",
      ]}
      needs={["CLICKUP_API_TOKEN", "CLICKUP_TEAM_ID"]}
    />
  );
}
