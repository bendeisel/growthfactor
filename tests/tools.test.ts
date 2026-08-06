import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { BUSINESSES } from "@/lib/businesses";
import type { TableData, TextData } from "@/lib/tools/types";

const ORIGINAL_ENV = { ...process.env };

/** Fresh module graph per test so DATA_DIR and credentials are re-read. */
async function tools() {
  process.env.DATA_DIR = await mkdtemp(path.join(tmpdir(), "cc-tools-"));
  return import("@/lib/tools");
}

beforeEach(() => {
  process.env = { ...ORIGINAL_ENV };
  delete process.env.GOOGLE_OAUTH_CLIENT_ID;
  delete process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  delete process.env.CLICKUP_API_TOKEN;
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe("tool registry", () => {
  it("exposes tools with model-facing descriptions and object schemas", async () => {
    const { TOOLS } = await tools();
    expect(TOOLS.length).toBeGreaterThan(6);
    for (const tool of TOOLS) {
      expect(tool.name).toMatch(/^[a-z_]+$/);
      expect(tool.description.length).toBeGreaterThan(40);
      expect(tool.inputSchema.type).toBe("object");
    }
  });

  it("reports an unknown tool instead of throwing", async () => {
    const { runTool } = await tools();
    const result = await runTool("not_a_tool", {});
    expect(result.ok).toBe(false);
    expect((result.data as TextData).text).toContain("not_a_tool");
  });
});

describe("approval gate", () => {
  it("refuses a destructive tool until it is approved", async () => {
    const { runTool } = await tools();
    const result = await runTool("gmail_send", {
      to: "someone@example.com",
      subject: "Hello",
      body: "Hi",
    });

    expect(result.ok).toBe(false);
    expect(result.needsConfirmation).toContain("Send");
    // Crucially: it did not fall through to a "not connected" attempt.
    expect(result.notConnected).toBeUndefined();
  });

  it("proceeds past the gate once approved, then reports the missing credential", async () => {
    const { runTool } = await tools();
    const result = await runTool(
      "gmail_send",
      { to: "someone@example.com", subject: "Hello", body: "Hi" },
      new Set(["gmail_send"]),
    );

    expect(result.needsConfirmation).toBeUndefined();
    expect(result.notConnected).toContain("Gmail");
  });

  it("does not let approval of one tool approve another", async () => {
    const { runTool } = await tools();
    const result = await runTool(
      "clickup_create_task",
      { name: "Ship it" },
      new Set(["gmail_send"]),
    );
    expect(result.needsConfirmation).toContain("Create ClickUp task");
  });

  it("lets read-only tools run without approval", async () => {
    const { runTool } = await tools();
    const result = await runTool("gmail_search", { query: "is:unread" });
    expect(result.needsConfirmation).toBeUndefined();
    expect(result.notConnected).toContain("Gmail");
  });
});

describe("metrics tools", () => {
  it("returns every business plus a total row", async () => {
    const { runTool } = await tools();
    const result = await runTool("get_metrics", {});
    const data = result.data as TableData;

    expect(result.ok).toBe(true);
    expect(result.panel).toBe("table");
    expect(data.rows).toHaveLength(BUSINESSES.length + 1);
    expect(data.rows.at(-1)?.[0]).toBe("ALL");
    // Mock rows must be flagged, not passed off as vendor-reported.
    expect(data.footnote).toContain("mock");
  });

  it("scopes to one business and drops the total row", async () => {
    const { runTool } = await tools();
    const result = await runTool("get_metrics", { business_id: "fighters-boxing" });
    const data = result.data as TableData;

    expect(data.rows).toHaveLength(1);
    expect(data.rows[0][0]).toBe("Fighters Boxing Gym");
  });

  it("says so for an unknown business id", async () => {
    const { runTool } = await tools();
    const result = await runTool("get_metrics", { business_id: "nope" });
    expect(result.ok).toBe(false);
    expect((result.data as TextData).text).toContain("nashville-mma");
  });

  it("lists alerts as a table", async () => {
    const { runTool } = await tools();
    const result = await runTool("list_alerts", {});
    expect(result.ok).toBe(true);
    // With an empty store every business is mock, which is itself one alert.
    expect(result.panel).toBe("table");
    expect((result.data as TableData).columns[0]).toBe("Severity");
  });

  it("explains an empty trend rather than drawing nothing", async () => {
    const { runTool } = await tools();
    const result = await runTool("get_revenue_trend", { business_id: "aeterna-club" });
    expect(result.ok).toBe(true);
    // Mock businesses have regenerated history, so this returns real rows.
    expect(["table", "text"]).toContain(result.panel);
  });
});
