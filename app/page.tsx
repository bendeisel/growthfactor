import { TopBar } from "@/components/header/top-bar";
import { MetricsColumn } from "@/components/metrics/metrics-column";
import { WorkspaceTabs } from "@/components/workspace/workspace-tabs";
import { BUSINESSES } from "@/lib/businesses";
import { getMetricsSnapshot } from "@/lib/metrics/registry";

// Metrics are live numbers; never serve them from the build.
export const dynamic = "force-dynamic";

/**
 * The whole product: one tab, two columns (spec §2).
 * Left column always visible, right column is the tabbed workspace.
 */
export default async function CommandCenter() {
  const snapshot = await getMetricsSnapshot();

  return (
    <main className="flex h-dvh min-h-0 flex-col">
      <TopBar businessCount={BUSINESSES.length} />

      <div className="grid min-h-0 flex-1 gap-3 overflow-hidden p-3 lg:grid-cols-[minmax(24rem,32rem)_minmax(0,1fr)]">
        <MetricsColumn initial={snapshot} />
        <WorkspaceTabs />
      </div>
    </main>
  );
}
