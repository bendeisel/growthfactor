import { PanelPlaceholder } from "@/components/workspace/panels/panel-placeholder";

export function CalendarPanel() {
  return (
    <PanelPlaceholder
      phase="Phase 3"
      source="Google Calendar API"
      features={[
        "Today and the next seven days as a single agenda",
        "All calendars merged, colour-coded by account",
        "Accept / decline without leaving the tab",
        "Megatron can propose times and write the invite",
      ]}
      needs={[
        "GOOGLE_OAUTH_CLIENT_ID",
        "GOOGLE_OAUTH_CLIENT_SECRET",
        "scope: calendar.events",
      ]}
    />
  );
}
