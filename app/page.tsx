import { CommandCenterPanel } from "@/components/command-center-panel";
import { CommandCenterShell } from "@/components/command-center-shell";
import { TopBar } from "@/components/header/top-bar";
import { BusinessPanel } from "@/components/metrics/business-panel";
import { AppsPanel } from "@/components/workspace/apps-panel";
import { authConfigured } from "@/lib/auth/session";
import { BUSINESSES } from "@/lib/businesses";
import { getDashboardState } from "@/lib/dashboard";

// Live numbers; never serve them from the build.
export const dynamic = "force-dynamic";

/**
 * The whole product on one screen: businesses on the left, the Command Center in
 * the middle, and whichever app the agent has opened on the right.
 */
export default async function CommandCenter() {
  const state = await getDashboardState();

  return (
    <main className="flex h-dvh min-h-0 flex-col">
      <TopBar
        businessCount={BUSINESSES.length}
        protected={authConfigured()}
        openAlerts={state.alerts.filter((alert) => alert.severity !== "info").length}
      />

      <CommandCenterShell
        businesses={<BusinessPanel initial={state} />}
        command={<CommandCenterPanel />}
        apps={<AppsPanel />}
      />
    </main>
  );
}
