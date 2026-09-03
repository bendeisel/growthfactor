// Cloudflare Worker entry point.
//
//   GET  /injector.js      the script the HighLevel app loads in the browser
//   POST /api/buttons      which buttons this user should see on this contact
//   POST /api/run          execute one button
//   GET  /admin            configuration UI (embeds in a custom menu link)
//   *    /admin/api/*      admin JSON API, cookie authenticated
//   GET  /oauth/callback   optional agency marketplace install

import INJECTOR_SOURCE from './generated/injector-source.js';
import ADMIN_HTML from './generated/admin-html.js';
import { decryptSession } from './lib/sso.js';
import { Ghl } from './lib/ghl.js';
import { runButton } from './lib/actions.js';
import { createSessionCookie, clearSessionCookie, isAuthenticated, safeEqual } from './lib/session.js';
import {
  getAgencyConfig,
  putAgencyConfig,
  getLocationConfig,
  putLocationConfig,
  mergeButtons,
  mergeSettings,
  getLocationCredentials,
  putLocationCredentials,
  putAgencyInstall,
  resolveLocationToken,
  writeLog,
  listLogs,
  listConfiguredLocations,
} from './lib/store.js';

const JSON_HEADERS = { 'Content-Type': 'application/json; charset=utf-8' };

function json(data, init = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: { ...JSON_HEADERS, ...(init.headers || {}) },
  });
}

function allowedOrigins(env) {
  return (env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean)
    .concat(env.WHITELABEL_ORIGIN ? [env.WHITELABEL_ORIGIN.trim()] : []);
}

function corsHeaders(request, env) {
  const origin = request.headers.get('Origin');
  const allowed = allowedOrigins(env);
  if (!origin || !allowed.includes(origin)) return {};
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}

/**
 * Establishes who is calling one of the /api routes. The browser hands us the
 * blob HighLevel gave it; only the real shared secret can open it, and the
 * sub-account inside it has to be the one being acted on.
 */
async function authenticate(env, body) {
  if (!env.GHL_SSO_KEY) {
    if (env.ALLOW_UNVERIFIED_SESSIONS === 'true') {
      return { userId: null, email: null, unverified: true };
    }
    throw new HttpError(500, 'GHL_SSO_KEY is not set on the worker');
  }

  let session;
  try {
    session = await decryptSession(body.sso, env.GHL_SSO_KEY);
  } catch (err) {
    throw new HttpError(401, err.message);
  }

  const active = session.activeLocation || session.locationId;
  if (active && body.locationId && active !== body.locationId) {
    throw new HttpError(403, 'Session is for a different sub-account');
  }
  return session;
}

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function matchesVisibility(button, contactTags) {
  const rules = button.visibleIf;
  if (!rules) return true;
  const tags = new Set((contactTags || []).map((t) => String(t).toLowerCase()));
  const has = (rules.hasTag || []).map((t) => t.toLowerCase());
  const missing = (rules.missingTag || []).map((t) => t.toLowerCase());
  if (has.length && !has.some((t) => tags.has(t))) return false;
  if (missing.length && missing.some((t) => tags.has(t))) return false;
  return true;
}

// --- /api ----------------------------------------------------------------

async function handleButtons(request, env, body) {
  const session = await authenticate(env, body);
  const { locationId, contactId } = body;
  if (!locationId) throw new HttpError(400, 'locationId is required');

  const [agency, location] = await Promise.all([getAgencyConfig(env), getLocationConfig(env, locationId)]);
  const buttons = mergeButtons(agency, location);
  const settings = mergeSettings(agency, location);

  // Only pay for a contact lookup when some button actually filters on tags.
  let contactTags = null;
  if (contactId && buttons.some((b) => b.visibleIf?.hasTag?.length || b.visibleIf?.missingTag?.length)) {
    try {
      const { token } = await resolveLocationToken(env, locationId);
      const contact = await new Ghl(token).getContact(contactId);
      contactTags = contact?.contact?.tags || [];
    } catch {
      contactTags = null; // fall through and show the button rather than hide it
    }
  }

  return {
    settings,
    user: { id: session.userId || null, email: session.email || null },
    buttons: buttons
      .filter((b) => (contactTags === null ? true : matchesVisibility(b, contactTags)))
      .map((b) => ({
        id: b.id,
        label: b.label,
        icon: b.icon,
        color: b.color,
        textColor: b.textColor,
        style: b.style,
        tooltip: b.tooltip,
        confirm: b.confirm,
        // The browser only needs to know about open_url; everything else runs
        // server side, so the rest of the recipe never leaves the worker.
        actions: (b.actions || [])
          .filter((a) => a.type === 'open_url')
          .concat((b.actions || []).some((a) => a.type !== 'open_url') ? [{ type: 'server' }] : []),
      })),
  };
}

async function handleRun(request, env, ctx, body) {
  const session = await authenticate(env, body);
  const { locationId, contactId, buttonId } = body;
  if (!locationId || !contactId || !buttonId) {
    throw new HttpError(400, 'locationId, contactId and buttonId are required');
  }

  const [agency, location] = await Promise.all([getAgencyConfig(env), getLocationConfig(env, locationId)]);
  const button = mergeButtons(agency, location).find((b) => b.id === buttonId);
  if (!button) throw new HttpError(404, 'That button is not configured for this sub-account');

  const { token } = await resolveLocationToken(env, locationId);
  const result = await runButton({
    env,
    button,
    token,
    contactId,
    locationId,
    user: { userId: session.userId, email: session.email },
  });

  ctx.waitUntil(
    writeLog(env, locationId, {
      at: new Date().toISOString(),
      buttonId,
      buttonLabel: button.label,
      contactId,
      user: session.email || session.userId || 'unknown',
      ok: result.ok,
      message: result.message,
      steps: result.steps,
    }),
  );

  return result;
}

// --- /admin --------------------------------------------------------------

async function handleAdminApi(request, env, url) {
  const path = url.pathname.replace('/admin/api', '');

  if (path === '/login' && request.method === 'POST') {
    const { password } = await request.json();
    if (!env.ADMIN_PASSWORD) throw new HttpError(500, 'ADMIN_PASSWORD is not set on the worker');
    if (!safeEqual(String(password || ''), env.ADMIN_PASSWORD)) throw new HttpError(401, 'Wrong password');
    return json({ ok: true }, { headers: { 'Set-Cookie': await createSessionCookie(env.SESSION_SECRET) } });
  }

  if (path === '/logout' && request.method === 'POST') {
    return json({ ok: true }, { headers: { 'Set-Cookie': clearSessionCookie() } });
  }

  if (!(await isAuthenticated(request, env.SESSION_SECRET))) throw new HttpError(401, 'Not signed in');

  const locationId = url.searchParams.get('locationId') || '';

  if (path === '/state' && request.method === 'GET') {
    const [agency, location, locations, creds] = await Promise.all([
      getAgencyConfig(env),
      locationId ? getLocationConfig(env, locationId) : Promise.resolve({ buttons: [], disabledAgencyButtons: [], settings: {} }),
      listConfiguredLocations(env),
      locationId ? getLocationCredentials(env, locationId) : Promise.resolve(null),
    ]);
    return json({ agency, location, locations, creds: Boolean(creds?.pit) });
  }

  if (path === '/agency' && request.method === 'PUT') {
    await putAgencyConfig(env, await request.json());
    return json({ ok: true });
  }

  if (path === '/location' && request.method === 'PUT') {
    if (!locationId) throw new HttpError(400, 'locationId is required');
    await putLocationConfig(env, locationId, await request.json());
    return json({ ok: true });
  }

  if (path === '/credentials' && request.method === 'PUT') {
    if (!locationId) throw new HttpError(400, 'locationId is required');
    const { pit } = await request.json();
    if (!pit) throw new HttpError(400, 'pit is required');
    await putLocationCredentials(env, locationId, { pit, savedAt: new Date().toISOString() });
    return json({ ok: true });
  }

  if (path === '/test' && request.method === 'POST') {
    if (!locationId) throw new HttpError(400, 'locationId is required');
    const { token, source } = await resolveLocationToken(env, locationId);
    const response = await new Ghl(token).listWorkflows(locationId);
    const workflows = (response?.workflows || []).map((w) => ({ id: w.id, name: w.name }));
    return json({ ok: true, source, workflowCount: workflows.length, workflows });
  }

  if (path === '/workflows' && request.method === 'GET') {
    if (!locationId) throw new HttpError(400, 'locationId is required');
    const { token } = await resolveLocationToken(env, locationId);
    const response = await new Ghl(token).listWorkflows(locationId);
    return json({ workflows: (response?.workflows || []).map((w) => ({ id: w.id, name: w.name })) });
  }

  if (path === '/logs' && request.method === 'GET') {
    if (!locationId) throw new HttpError(400, 'locationId is required');
    return json({ logs: await listLogs(env, locationId) });
  }

  throw new HttpError(404, 'Unknown admin route');
}

// --- OAuth (optional agency install) -------------------------------------

async function handleOauthCallback(request, env, url) {
  const code = url.searchParams.get('code');
  if (!code) throw new HttpError(400, 'Missing code');
  if (!env.GHL_CLIENT_ID || !env.GHL_CLIENT_SECRET) throw new HttpError(500, 'OAuth client is not configured');

  const res = await fetch('https://services.leadconnectorhq.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
    body: new URLSearchParams({
      client_id: env.GHL_CLIENT_ID,
      client_secret: env.GHL_CLIENT_SECRET,
      grant_type: 'authorization_code',
      code,
      user_type: 'Company',
    }),
  });
  const text = await res.text();
  if (!res.ok) throw new HttpError(502, `Token exchange failed (${res.status}): ${text}`);

  const data = JSON.parse(text);
  await putAgencyInstall(env, {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    companyId: data.companyId,
    expiresAt: Date.now() + (data.expires_in || 86400) * 1000,
    installedAt: new Date().toISOString(),
  });

  return new Response('Agency install complete. You can close this tab.', {
    headers: { 'Content-Type': 'text/plain' },
  });
}

// --- router --------------------------------------------------------------

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(request, env) });
    }

    try {
      if (url.pathname === '/health') return json({ ok: true });

      if (url.pathname === '/injector.js') {
        const source = INJECTOR_SOURCE
          .replace('__API_BASE__', url.origin)
          .replace('__APP_ID__', env.GHL_APP_ID || '');
        return new Response(source, {
          headers: {
            'Content-Type': 'application/javascript; charset=utf-8',
            'Cache-Control': 'public, max-age=300',
            'Access-Control-Allow-Origin': '*',
          },
        });
      }

      if (url.pathname === '/api/buttons' && request.method === 'POST') {
        const data = await handleButtons(request, env, await request.json());
        return json(data, { headers: corsHeaders(request, env) });
      }

      if (url.pathname === '/api/run' && request.method === 'POST') {
        const result = await handleRun(request, env, ctx, await request.json());
        return json(result, { status: result.ok ? 200 : 207, headers: corsHeaders(request, env) });
      }

      if (url.pathname === '/oauth/callback') return await handleOauthCallback(request, env, url);

      if (url.pathname.startsWith('/admin/api')) return await handleAdminApi(request, env, url);

      if (url.pathname === '/admin' || url.pathname === '/admin/') {
        const frameAncestors = ['\'self\'', ...allowedOrigins(env)].join(' ');
        return new Response(ADMIN_HTML, {
          headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'Content-Security-Policy': `frame-ancestors ${frameAncestors}`,
          },
        });
      }

      return json({ error: 'Not found' }, { status: 404 });
    } catch (err) {
      const status = err instanceof HttpError ? err.status : 500;
      if (status >= 500) console.error(err);
      return json({ error: err.message }, { status, headers: corsHeaders(request, env) });
    }
  },
};
