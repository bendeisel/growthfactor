import { NextResponse, type NextRequest } from "next/server";

import {
  SESSION_COOKIE,
  authConfigured,
  authRequired,
  verifySession,
} from "@/lib/auth/session";

/**
 * Gate every request in one place.
 *
 * The dashboard shows every business's revenue and will hold mail and calendar
 * access, so "reachable from any computer" (spec §1) has to mean "reachable by
 * Ben from any computer". Ingestion authenticates with its own bearer token
 * instead of a session, because n8n is a machine.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // n8n → /api/ingest carries INGEST_TOKEN; the route checks it itself.
  if (pathname.startsWith("/api/ingest")) return NextResponse.next();

  if (!authConfigured()) {
    if (!authRequired()) return NextResponse.next();
    // Deployed without a password: refuse to serve rather than expose numbers.
    return new NextResponse(
      "Command Center is not configured: set COMMAND_CENTER_PASSWORD (and restart) before serving this in production.",
      { status: 503, headers: { "content-type": "text/plain; charset=utf-8" } },
    );
  }

  if (pathname === "/login" || pathname.startsWith("/api/auth/")) {
    return NextResponse.next();
  }

  return verifySession(request.cookies.get(SESSION_COOKIE)?.value).then(
    (session) => {
      if (session) return NextResponse.next();

      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
      }
      const login = new URL("/login", request.url);
      if (pathname !== "/") login.searchParams.set("next", pathname);
      return NextResponse.redirect(login);
    },
  );
}

export const config = {
  // Everything except Next's own assets and the favicon.
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
