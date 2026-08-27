import { CommandCenter } from "@/components/command-center";
import { getDashboardState } from "@/lib/dashboard";

// Live numbers; never serve them from the build.
export const dynamic = "force-dynamic";

/**
 * The whole product on one screen: a rail of sections on the left (a tab bar on
 * a phone) and one section filling the rest.
 */
export default async function CommandCenterPage() {
  const state = await getDashboardState();
  return <CommandCenter state={state} />;
}
