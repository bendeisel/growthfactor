// Cloudflare Worker entry point.
//
//   GET  /injector.js      the script the HighLevel app loads in the browser
//   POST /api/context      resolve the contact in view + the buttons to show
//   POST /webhooks/ghl/<token>  marketplace app webhooks (e.g. OpportunityDelete)
//   POST /api/run          execute one button
//   GET  /admin            configuration UI (embeds in a custom menu link)
//   *    /admin/api/*      admin JSON API, cookie authenticated
//   GET  /oauth/callback   optional agency marketplace install

import INJECTOR_SOURCE from './generated/injector-source.js';
import ADMIN_HTML from './generated/admin-html.js';
import { decryptSession } from './lib/sso.js';
import { Ghl } from './lib/ghl.js';
import { runButton } from './lib/actions.js';
import { resolveContactId, loadContactSummary } from './lib/context.js';
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

function publicButton(b) {
  return {
    id: b.id,
    label: b.label,
    icon: b.icon,
    color: b.color,
    textColor: b.textColor,
    style: b.style,
    tooltip: b.tooltip,
    confirm: b.confirm,
    group: b.group || null,
    // The browser only needs to know about open_url; everything else runs
    // server side, so the rest of the recipe never leaves the worker.
    actions: (b.actions || [])
      .filter((a) => a.type === 'open_url')
      .concat((b.actions || []).some((a) => a.type !== 'open_url') ? [{ type: 'server' }] : []),
  };
}

async function handleContext(request, env, body) {
  const session = await authenticate(env, body);
  const { locationId, surface } = body;
  if (!locationId) throw new HttpError(400, 'locationId is required');

  const [agency, location] = await Promise.all([getAgencyConfig(env), getLocationConfig(env, locationId)]);
  const settings = mergeSettings(agency, location);
  const allButtons = mergeButtons(agency, location);

  const { token } = await resolveLocationToken(env, locationId);
  const ghl = new Ghl(token);

  const { contactId, via } = await resolveContactId({
    env,
    ghl,
    surface,
    contactId: body.contactId,
    conversationId: body.conversationId,
    opportunityId: body.opportunityId,
    contactIdHint: body.contactIdHint,
  });

  if (!contactId) {
    return { contactId: null, via, contact: null, settings, buttons: [], user: { id: session.userId || null } };
  }

  const contact = await loadContactSummary(ghl, contactId);
  return {
    contactId,
    via,
    contact: { id: contactId, name: contact.name, email: contact.email, phone: contact.phone },
    settings,
    user: { id: session.userId || null, email: session.email || null },
    buttons: allButtons.filter((b) => matchesVisibility(b, contact.tags)).map(publicButton),
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

// --- webhooks (marketplace app events) -----------------------------------

async function verifyWebhookSignature(env, rawBody, signature) {
  if (!env.GHL_WEBHOOK_PUBLIC_KEY) return true; // path token is the only check
  if (!signature) return false;
  const pem = env.GHL_WEBHOOK_PUBLIC_KEY.replace(/-----[A-Z ]+-----/g, '').replace(/\s+/g, '');
  const der = Uint8Array.from(atob(pem), (c) => c.charCodeAt(0));
  const key = await crypto.subtle.importKey('spki', der, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
  const sig = Uint8Array.from(atob(signature), (c) => c.charCodeAt(0));
  return crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, sig, new TextEncoder().encode(rawBody));
}

/**
 * Automations are buttons nobody clicks: an event from HighLevel (say,
 * OpportunityDelete) runs the same action list a button would, against the
 * contact in the payload. Tagging on delete gives workflows a trigger
 * HighLevel does not offer natively.
 */
async function handleWebhook(request, env, ctx, url) {
  const token = url.pathname.split('/').pop();
  if (!env.WEBHOOK_TOKEN || !safeEqual(token, env.WEBHOOK_TOKEN)) throw new HttpError(404, 'Not found');

  const raw = await request.text();
  if (!(await verifyWebhookSignature(env, raw, request.headers.get('x-wh-signature')))) {
    throw new HttpError(401, 'Bad webhook signature');
  }

  let event;
  try {
    event = JSON.parse(raw);
  } catch {
    throw new HttpError(400, 'Webhook body was not JSON');
  }

  const type = event.type || event.event;
  const locationId = event.locationId || event.location_id;
  const contactId = event.contactId || event.contact_id || event.contact?.id;
  if (!type || !locationId) return json({ ok: true, ignored: 'no type or location' });

  const [agency, location] = await Promise.all([getAgencyConfig(env), getLocationConfig(env, locationId)]);
  const disabled = new Set(location.disabledAgencyAutomations || []);
  const automations = [
    ...(agency.automations || []).filter((a) => !disabled.has(a.id)),
    ...(location.automations || []),
  ].filter((a) => a.active !== false && a.event === type);

  if (!automations.length) return json({ ok: true, ignored: 'no automation for ' + type });
  if (!contactId) return json({ ok: true, ignored: 'event carries no contact' });

  const { token: accessToken } = await resolveLocationToken(env, locationId);
  const results = [];
  for (const automation of automations) {
    const result = await runButton({
      env,
      token: accessToken,
      contactId,
      locationId,
      user: { userId: 'webhook', email: type },
      button: { id: automation.id, label: automation.label || type, actions: automation.actions || [] },
    });
    results.push({ id: automation.id, ...result });
    ctx.waitUntil(
      writeLog(env, locationId, {
        at: new Date().toISOString(),
        buttonId: automation.id,
        buttonLabel: (automation.label || type) + ' (automation)',
        contactId,
        user: type,
        ok: result.ok,
        message: result.message,
        steps: result.steps,
      }),
    );
  }
  return json({ ok: results.every((r) => r.ok), results });
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
            'Cache-Control': 'public, max-age=60, must-revalidate',
            'Access-Control-Allow-Origin': '*',
          },
        });
      }

      if (url.pathname === '/api/context' && request.method === 'POST') {
        const data = await handleContext(request, env, await request.json());
        return json(data, { headers: corsHeaders(request, env) });
      }

      if (url.pathname.startsWith('/webhooks/ghl/') && request.method === 'POST') {
        return await handleWebhook(request, env, ctx, url);
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
