import { NextResponse } from "next/server";

import { getMetricsSnapshot } from "@/lib/metrics/registry";

export const dynamic = "force-dynamic";

export async function GET() {
  const snapshot = await getMetricsSnapshot();
  return NextResponse.json(snapshot, {
    headers: { "cache-control": "no-store" },
  });
}
