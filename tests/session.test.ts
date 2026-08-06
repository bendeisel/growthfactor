import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  SESSION_TTL_SECONDS,
  authConfigured,
  authRequired,
  signSession,
  verifySession,
} from "@/lib/auth/session";

const ORIGINAL_ENV = { ...process.env };

beforeEach(() => {
  process.env = { ...ORIGINAL_ENV, COMMAND_CENTER_PASSWORD: "correct horse" };
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe("session tokens", () => {
  it("round-trips a freshly signed token", async () => {
    const token = await signSession();
    const payload = await verifySession(token);
    expect(payload).not.toBeNull();
    expect(payload!.exp - payload!.iat).toBe(SESSION_TTL_SECONDS);
  });

  it("rejects a tampered payload", async () => {
    const [, signature] = (await signSession()).split(".");
    const forged = `${Buffer.from(JSON.stringify({ iat: 0, exp: 9_999_999_999 }))
      .toString("base64url")}.${signature}`;
    expect(await verifySession(forged)).toBeNull();
  });

  it("rejects a token signed with a different password", async () => {
    const token = await signSession();
    process.env.COMMAND_CENTER_PASSWORD = "rotated";
    expect(await verifySession(token)).toBeNull();
  });

  it("rejects an expired token", async () => {
    const token = await signSession(new Date("2020-01-01T00:00:00Z"));
    expect(await verifySession(token)).toBeNull();
  });

  it("rejects malformed input", async () => {
    expect(await verifySession(undefined)).toBeNull();
    expect(await verifySession("")).toBeNull();
    expect(await verifySession("nonsense")).toBeNull();
    expect(await verifySession("a.b.c")).toBeNull();
  });

  it("prefers an explicit AUTH_SECRET when one is set", async () => {
    process.env.AUTH_SECRET = "a-dedicated-signing-secret";
    const token = await signSession();
    // Rotating the password no longer invalidates sessions.
    process.env.COMMAND_CENTER_PASSWORD = "rotated";
    expect(await verifySession(token)).not.toBeNull();
  });
});

describe("auth configuration", () => {
  it("is on exactly when a password is set", () => {
    expect(authConfigured()).toBe(true);
    delete process.env.COMMAND_CENTER_PASSWORD;
    expect(authConfigured()).toBe(false);
  });

  it("is mandatory in production only", () => {
    // NODE_ENV is read at call time, so flip it for the assertion.
    const env = process.env as Record<string, string | undefined>;
    env.NODE_ENV = "production";
    expect(authRequired()).toBe(true);
    env.NODE_ENV = "development";
    expect(authRequired()).toBe(false);
  });
});
