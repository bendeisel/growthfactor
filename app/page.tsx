import { CommandCenterShell } from "@/components/command-center-shell";
import { TopBar } from "@/components/header/top-bar";
import { MetricsColumn } from "@/components/metrics/metrics-column";
import { WorkspaceTabs } from "@/components/workspace/workspace-tabs";
import { authConfigured } from "@/lib/auth/session";
import { BUSINESSES } from "@/lib/businesses";
import { getDashboardState } from "@/lib/dashboard";

// Live numbers; never serve them from the build.
export const dynamic = "force-dynamic";

/**
 * The whole product: one tab, two columns (spec §2).
 * Left column always visible, right column is the tabbed workspace.
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
        metrics={<MetricsColumn initial={state} />}
        workspace={<WorkspaceTabs />}
      />
    </main>
  );
}
