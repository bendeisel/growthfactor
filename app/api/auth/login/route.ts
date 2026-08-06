import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";

import {
  SESSION_COOKIE,
  SESSION_TTL_SECONDS,
  authConfigured,
  signSession,
} from "@/lib/auth/session";

export const dynamic = "force-dynamic";

/**
 * Attempt throttling, in memory.
 *
 * Single user on a single node, so a Map is the right size of solution — it
 * turns an online password guess into a non-starter without adding Redis to the
 * stack. A restart clears it, which is acceptable for the same reason.
 */
const ATTEMPT_WINDOW_MS = 15 * 60_000;
const MAX_ATTEMPTS = 5;
const attempts = new Map<string, { count: number; first: number }>();

function throttled(key: string): boolean {
  const now = Date.now();
  const record = attempts.get(key);
  if (!record || now - record.first > ATTEMPT_WINDOW_MS) return false;
  return record.count >= MAX_ATTEMPTS;
}

function recordFailure(key: string): void {
  const now = Date.now();
  const record = attempts.get(key);
  if (!record || now - record.first > ATTEMPT_WINDOW_MS) {
    attempts.set(key, { count: 1, first: now });
  } else {
    record.count += 1;
  }
}

function matches(presented: string, expected: string): boolean {
  const a = Buffer.from(presented);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(request: Request) {
  const expected = process.env.COMMAND_CENTER_PASSWORD;
  if (!authConfigured() || !expected) {
    return NextResponse.json(
      { error: "No password is configured on this deployment." },
      { status: 503 },
    );
  }

  // Behind a proxy this is the client IP; on its own it's a coarse key, which is
  // all a single-user throttle needs.
  const key = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (throttled(key)) {
    return NextResponse.json(
      { error: "Too many attempts. Wait 15 minutes." },
      { status: 429 },
    );
  }

  let password = "";
  try {
    const body = (await request.json()) as { password?: unknown };
    if (typeof body.password === "string") password = body.password;
  } catch {
    return NextResponse.json({ error: "Body must be JSON." }, { status: 400 });
  }

  if (!matches(password, expected)) {
    recordFailure(key);
    return NextResponse.json({ error: "Wrong password." }, { status: 401 });
  }

  attempts.delete(key);
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, await signSession(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
  return response;
}
