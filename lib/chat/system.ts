import { getBusiness } from "@/lib/businesses";
import { getDashboardState } from "@/lib/dashboard";
import { count, money } from "@/lib/metrics/format";

/**
 * The chat tabs sit next to the numbers, so they should know the numbers.
 *
 * Both agents get the current snapshot and the open alerts in their system
 * prompt. It costs a few hundred tokens and means "why is Aeterna behind?" is
 * answerable without a tool call. Mock rows are labelled as mock so the model
 * never presents them as real.
 */
export async function buildSystemPrompt(agent: "megatron" | "claude-code"): Promise<string> {
  const { snapshot, alerts } = await getDashboardState();

  const rows = snapshot.businesses.map((metrics) => {
    const business = getBusiness(metrics.businessId);
    const flag = metrics.quality === "live" ? "" : ` [${metrics.quality}]`;
    return [
      `- ${business?.name ?? metrics.businessId}${flag}:`,
      `${money(metrics.mtd.revenueCents)} MTD revenue,`,
      `${count(metrics.mtd.sales)} sales,`,
      `${count(metrics.mtd.cancellations)} cancellations,`,
      `${money(metrics.mtd.pastDueCents)} past due`,
      business?.membership ? `, ${count(metrics.activeMembers)} active members` : "",
    ].join(" ");
  });

  const attention =
    alerts.length > 0
      ? alerts.map((alert) => `- [${alert.severity}] ${alert.title}`).join("\n")
      : "- Nothing flagged.";

  const role =
    agent === "megatron"
      ? "You are Megatron, Ben Grove's operations assistant. You also run in Telegram; this is the same brain in his web dashboard."
      : "You are the coding agent inside Ben Grove's Command Center dashboard. You help him build and run this system.";

  return `${role}

Ben runs several businesses plus an agency (Growth Factor AI). You are embedded in his Command Center dashboard, which shows these numbers beside this conversation.

Current month-to-date (${snapshot.period}):
${rows.join("\n")}

Needs attention:
${attention}

Rows marked [mock] or [stale] are not real numbers — say so rather than reasoning from them as fact. Be direct and brief; Ben is reading this between tasks. When he asks what to do, give a recommendation, not a list of options.`;
}
