// Signed cookie for the admin UI. Nothing sensitive lives in the cookie; it
// only says "this browser proved it knows the admin password, until <expiry>".

const COOKIE_NAME = 'gfb_admin';
const TTL_MS = 1000 * 60 * 60 * 12;

function b64url(bytes) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function hmac(secret, message) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message));
  return b64url(new Uint8Array(sig));
}

/** Constant-time-ish comparison, so a wrong signature leaks no timing signal. */
export function safeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function createSessionCookie(secret) {
  const expires = Date.now() + TTL_MS;
  const payload = String(expires);
  const signature = await hmac(secret, payload);
  const value = `${payload}.${signature}`;
  // SameSite=None so the admin still works inside a HighLevel custom menu link
  // iframe; Secure keeps it https-only.
  return `${COOKIE_NAME}=${value}; Path=/; Max-Age=${Math.floor(TTL_MS / 1000)}; HttpOnly; Secure; SameSite=None`;
}

export function clearSessionCookie() {
  return `${COOKIE_NAME}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=None`;
}

export async function isAuthenticated(request, secret) {
  if (!secret) return false;
  const header = request.headers.get('Cookie') || '';
  const match = header.match(new RegExp(`(?:^|;\\s*)${COOKIE_NAME}=([^;]+)`));
  if (!match) return false;

  const [payload, signature] = decodeURIComponent(match[1]).split('.');
  if (!payload || !signature) return false;
  if (Number(payload) < Date.now()) return false;

  return safeEqual(signature, await hmac(secret, payload));
}
