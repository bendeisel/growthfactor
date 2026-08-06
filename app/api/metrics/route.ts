import { NextResponse } from "next/server";

import { getDashboardState } from "@/lib/dashboard";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * `?force=1` re-pulls configured sources instead of serving the stored reading —
 * that's the refresh button. Background polling omits it, so an all-day tab
 * reads storage rather than hitting vendor APIs every minute.
 */
export async function GET(request: Request) {
  const force = new URL(request.url).searchParams.get("force") === "1";
  const state = await getDashboardState({ force });
  return NextResponse.json(state, {
    headers: { "cache-control": "no-store" },
  });
}
