import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";

import { BUSINESSES, getBusiness } from "@/lib/businesses";
import {
  parseNormalizedPayload,
  type UpstreamPayload,
} from "@/lib/metrics/adapters/normalized";
import type { SourceId } from "@/lib/metrics/types";
import { getStore } from "@/lib/store";

export const dynamic = "force-dynamic";

/**
 * Push ingestion — the preferred path for real metrics.
 *
 * n8n already runs on a schedule and already holds the vendor credentials, so
 * it should push rather than have the dashboard pull: page loads never wait on
 * a vendor, and one slow API doesn't slow the screen Ben keeps open all day.
 *
 *   POST /api/ingest
 *   Authorization: Bearer $INGEST_TOKEN
 *   { "source": "glowfox", "businesses": [ ...normalized rows... ] }
 *
 * Payload shape: lib/metrics/adapters/normalized.ts.
 */

const SOURCES: SourceId[] = ["ghl", "glowfox", "clickup"];

function authorized(request: Request): boolean {
  const expected = process.env.INGEST_TOKEN;
  if (!expected) return false;
  const header = request.headers.get("authorization") ?? "";
  const presented = header.startsWith("Bearer ") ? header.slice(7) : header;
  const a = Buffer.from(presented);
  const b = Buffer.from(expected);
  // Compare in constant time, and only when lengths match (timingSafeEqual
  // throws otherwise, which would itself leak the length).
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(request: Request) {
  if (!process.env.INGEST_TOKEN) {
    return NextResponse.json(
      { error: "Ingestion is disabled: set INGEST_TOKEN." },
      { status: 503 },
    );
  }
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let body: UpstreamPayload & { source?: unknown };
  try {
    body = (await request.json()) as UpstreamPayload & { source?: unknown };
  } catch {
    return NextResponse.json({ error: "Body must be JSON." }, { status: 400 });
  }

  const source = SOURCES.find((candidate) => candidate === body.source);
  if (!source) {
    return NextResponse.json(
      { error: `\`source\` must be one of: ${SOURCES.join(", ")}.` },
      { status: 400 },
    );
  }
  if (!Array.isArray(body.businesses) || body.businesses.length === 0) {
    return NextResponse.json(
      { error: "`businesses` must be a non-empty array." },
      { status: 400 },
    );
  }

  // Only accept rows for businesses we know about, and only for the businesses
  // this source owns — a misconfigured workflow shouldn't be able to overwrite
  // another source's numbers.
  const ids = body.businesses
    .map((entry) => entry?.id)
    .filter((id): id is string => typeof id === "string");
  const unknown = ids.filter((id) => !getBusiness(id));
  const targets = BUSINESSES.filter(
    (business) => business.source === source && ids.includes(business.id),
  );

  if (targets.length === 0) {
    return NextResponse.json(
      {
        error: `No known ${source} businesses in the payload.`,
        unknownIds: unknown,
      },
      { status: 422 },
    );
  }

  const rows = parseNormalizedPayload(source, targets, body);
  await getStore().put(rows);

  return NextResponse.json({
    ingested: rows.length,
    businesses: rows.map((row) => row.businessId),
    ignoredIds: unknown,
    at: rows[0]?.fetchedAt,
  });
}
