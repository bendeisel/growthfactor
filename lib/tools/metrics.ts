import { BUSINESSES, getBusiness } from "@/lib/businesses";
import { getDashboardState } from "@/lib/dashboard";
import { count, money } from "@/lib/metrics/format";
import { rollUp } from "@/lib/metrics/rollup";
import { dailyRevenueCents } from "@/lib/metrics/trend";
import type { TableData, ToolDefinition } from "@/lib/tools/types";

/**
 * The tools that work today, with no credentials to add.
 *
 * They read the same snapshot store the dashboard reads, so "pull the numbers
 * for Fighters" in chat and the tile on the left can't disagree.
 */

function qualityNote(qualities: string[]): string | undefined {
  const mock = qualities.filter((quality) => quality !== "live").length;
  return mock > 0
    ? `${mock} of ${qualities.length} rows are mock or stale, not vendor-reported.`
    : undefined;
}

export const getMetricsTool: ToolDefinition = {
  name: "get_metrics",
  description:
    "Month-to-date and last-month figures for Ben's businesses: revenue, new members, lost members (cancellations), total members, sales and past due. Call this whenever he asks how a business is doing, for a comparison between businesses, or for any number that appears on the dashboard. Omit business_id for all of them.",
  inputSchema: {
    type: "object",
    properties: {
      business_id: {
        type: "string",
        description: `One of: ${BUSINESSES.map((business) => business.id).join(", ")}. Omit for every business.`,
      },
    },
  },
  async run(input) {
    const businessId = typeof input.business_id === "string" ? input.business_id : undefined;
    const { snapshot } = await getDashboardState();

    const rows = businessId
      ? snapshot.businesses.filter((row) => row.businessId === businessId)
      : snapshot.businesses;

    if (rows.length === 0) {
      return {
        ok: false,
        panel: "text",
        title: "Unknown business",
        data: {
          text: `No business with id "${businessId}". Known ids: ${BUSINESSES.map((b) => b.id).join(", ")}.`,
        },
      };
    }

    const data: TableData = {
      columns: [
        "Business",
        "Revenue MTD",
        "Revenue last mo",
        "New MTD",
        "New last mo",
        "Lost MTD",
        "Lost last mo",
        "Members now",
        "Members last mo",
        "Past due",
        "Data",
      ],
      rows: rows.map((row) => [
        getBusiness(row.businessId)?.name ?? row.businessId,
        money(row.mtd.revenueCents),
        money(row.lastMonth.revenueCents),
        count(row.mtd.newMembers),
        count(row.lastMonth.newMembers),
        count(row.mtd.cancellations),
        count(row.lastMonth.cancellations),
        count(row.activeMembers),
        count(row.activeMembersLastMonth),
        money(row.mtd.pastDueCents),
        row.quality,
      ]),
      footnote: qualityNote(rows.map((row) => row.quality)),
    };

    if (rows.length > 1) {
      const totals = rollUp(rows);
      data.rows.push([
        "ALL",
        money(totals.mtd.revenueCents),
        money(totals.lastMonth.revenueCents),
        count(totals.mtd.newMembers),
        count(totals.lastMonth.newMembers),
        count(totals.mtd.cancellations),
        count(totals.lastMonth.cancellations),
        count(totals.activeMembers),
        count(totals.activeMembersLastMonth),
        money(totals.mtd.pastDueCents),
        "—",
      ]);
    }

    return {
      ok: true,
      panel: "table",
      title: businessId
        ? `${getBusiness(businessId)?.name ?? businessId} · ${snapshot.period}`
        : `All businesses · ${snapshot.period}`,
      data,
    };
  },
};

export const getTrendTool: ToolDefinition = {
  name: "get_revenue_trend",
  description:
    "Day-by-day revenue for one business over the recent window, derived from stored readings. Use it for questions about direction, momentum, or which days were strong or weak.",
  inputSchema: {
    type: "object",
    properties: {
      business_id: {
        type: "string",
        description: `One of: ${BUSINESSES.map((business) => business.id).join(", ")}.`,
      },
    },
    required: ["business_id"],
  },
  async run(input) {
    const businessId = String(input.business_id ?? "");
    const business = getBusiness(businessId);
    if (!business) {
      return {
        ok: false,
        panel: "text",
        title: "Unknown business",
        data: { text: `No business with id "${businessId}".` },
      };
    }

    const { histories } = await getDashboardState();
    const history = histories[businessId] ?? [];
    const daily = dailyRevenueCents(history);

    if (daily.length === 0) {
      return {
        ok: true,
        panel: "text",
        title: `${business.name} · trend`,
        data: {
          text: "Not enough stored readings yet — a trend needs at least two days of ingests.",
        },
      };
    }

    return {
      ok: true,
      panel: "table",
      title: `${business.name} · daily revenue`,
      data: {
        columns: ["Date", "Revenue that day", "Members"],
        rows: daily.map((valueCents, index) => [
          history[index + 1]?.date ?? "",
          money(valueCents),
          count(history[index + 1]?.activeMembers ?? 0),
        ]),
      } satisfies TableData,
    };
  },
};

export const listAlertsTool: ToolDefinition = {
  name: "list_alerts",
  description:
    "What currently needs Ben's attention across all businesses: revenue behind pace, cancellation spikes, past due, membership decline, missing or stale data. Call this for 'what needs me', 'what's wrong', or to start a daily review.",
  inputSchema: { type: "object", properties: {} },
  async run() {
    const { alerts } = await getDashboardState();

    if (alerts.length === 0) {
      return {
        ok: true,
        panel: "text",
        title: "Nothing needs attention",
        data: { text: "Every business is on pace and every source is reporting." },
      };
    }

    return {
      ok: true,
      panel: "table",
      title: `${alerts.length} open`,
      data: {
        columns: ["Severity", "What", "Detail"],
        rows: alerts.map((alert) => [alert.severity, alert.title, alert.detail]),
      } satisfies TableData,
    };
  },
};
