/**
 * Single-user session tokens.
 *
 * Deliberately dependency-free and Web Crypto only, so the exact same verify
 * runs in edge middleware (which gates every request) and in route handlers.
 * The signing key is derived from the password, which means changing the
 * password invalidates every existing session — the behaviour you want from a
 * single-user dashboard.
 */

export const SESSION_COOKIE = "cc_session";
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;

export interface SessionPayload {
  /** Issued at, seconds since epoch. */
  iat: number;
  /** Expires at, seconds since epoch. */
  exp: number;
}

/** Auth is on whenever a password is configured. */
export function authConfigured(): boolean {
  return Boolean(process.env.COMMAND_CENTER_PASSWORD);
}

/**
 * Production must not serve revenue data unauthenticated, so a missing password
 * there is a hard stop rather than an open door. Local dev stays open.
 */
export function authRequired(): boolean {
  return process.env.NODE_ENV === "production";
}

function keyMaterial(): string {
  const secret = process.env.AUTH_SECRET;
  if (secret) return secret;
  return `${process.env.COMMAND_CENTER_PASSWORD ?? ""}|command-center-session`;
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(value: string): Uint8Array {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(padded + "=".repeat((4 - (padded.length % 4)) % 4));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function hmacKey(): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(keyMaterial()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

export async function signSession(now = new Date()): Promise<string> {
  const iat = Math.floor(now.getTime() / 1000);
  const payload: SessionPayload = { iat, exp: iat + SESSION_TTL_SECONDS };
  const body = toBase64Url(new TextEncoder().encode(JSON.stringify(payload)));
  const signature = await crypto.subtle.sign(
    "HMAC",
    await hmacKey(),
    new TextEncoder().encode(body),
  );
  return `${body}.${toBase64Url(new Uint8Array(signature))}`;
}

/** Returns the payload for a valid, unexpired token, or null. */
export async function verifySession(
  token: string | undefined,
  now = new Date(),
): Promise<SessionPayload | null> {
  if (!token) return null;
  const [body, signature] = token.split(".");
  if (!body || !signature) return null;

  let valid: boolean;
  try {
    // crypto.subtle.verify does the constant-time comparison for us.
    valid = await crypto.subtle.verify(
      "HMAC",
      await hmacKey(),
      fromBase64Url(signature) as unknown as ArrayBuffer,
      new TextEncoder().encode(body),
    );
  } catch {
    return null;
  }
  if (!valid) return null;

  try {
    const payload = JSON.parse(
      new TextDecoder().decode(fromBase64Url(body)),
    ) as SessionPayload;
    if (typeof payload.exp !== "number") return null;
    if (payload.exp * 1000 <= now.getTime()) return null;
    return payload;
  } catch {
    return null;
  }
}
