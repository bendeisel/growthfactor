// All persistence lives in one KV namespace.
//
//   cfg:agency            agency-wide button set, inherited by every sub-account
//   cfg:loc:<locationId>  per sub-account additions, overrides and hidden ids
//   cred:loc:<locationId> that sub-account's Private Integration Token
//   oauth:agency          agency OAuth install (marketplace app), if used
//   tok:loc:<locationId>  short lived location token minted from the install
//   log:<locationId>:<ts> action log entry, expires on its own

const AGENCY_CONFIG_KEY = 'cfg:agency';
const LOG_TTL_SECONDS = 60 * 60 * 24 * 30;

export const EMPTY_AGENCY_CONFIG = { buttons: [], settings: {} };
export const EMPTY_LOCATION_CONFIG = { buttons: [], disabledAgencyButtons: [], settings: {} };

const locationConfigKey = (locationId) => `cfg:loc:${locationId}`;
const locationCredKey = (locationId) => `cred:loc:${locationId}`;
const locationTokenKey = (locationId) => `tok:loc:${locationId}`;

export async function getAgencyConfig(env) {
  return (await env.BUTTONS.get(AGENCY_CONFIG_KEY, 'json')) || { ...EMPTY_AGENCY_CONFIG };
}

export async function putAgencyConfig(env, config) {
  await env.BUTTONS.put(AGENCY_CONFIG_KEY, JSON.stringify(config));
}

export async function getLocationConfig(env, locationId) {
  return (await env.BUTTONS.get(locationConfigKey(locationId), 'json')) || { ...EMPTY_LOCATION_CONFIG };
}

export async function putLocationConfig(env, locationId, config) {
  await env.BUTTONS.put(locationConfigKey(locationId), JSON.stringify(config));
}

/**
 * The button set a sub-account actually sees: agency buttons first (minus the
 * ones that sub-account switched off), then its own, sorted by `order`.
 * Location buttons carrying an agency button's id override it in place, which
 * is how a single sub-account gets a different label or workflow id without
 * forking the whole set.
 */
export function mergeButtons(agencyConfig, locationConfig) {
  const disabled = new Set(locationConfig.disabledAgencyButtons || []);
  const locationButtons = locationConfig.buttons || [];
  const overrides = new Map(locationButtons.map((b) => [b.id, b]));

  const inherited = (agencyConfig.buttons || [])
    .filter((b) => !disabled.has(b.id))
    .map((b) => (overrides.has(b.id) ? { ...b, ...overrides.get(b.id), scope: 'agency', overridden: true } : { ...b, scope: 'agency' }));

  const inheritedIds = new Set(inherited.map((b) => b.id));
  const own = locationButtons.filter((b) => !inheritedIds.has(b.id)).map((b) => ({ ...b, scope: 'location' }));

  return [...inherited, ...own]
    .filter((b) => b.active !== false)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || String(a.label).localeCompare(String(b.label)));
}

export function mergeSettings(agencyConfig, locationConfig) {
  return {
    placement: 'auto',
    theme: 'auto',
    showOnConversations: true,
    confirmDestructive: true,
    ...(agencyConfig.settings || {}),
    ...(locationConfig.settings || {}),
  };
}

// --- credentials ---------------------------------------------------------

export async function getLocationCredentials(env, locationId) {
  return (await env.BUTTONS.get(locationCredKey(locationId), 'json')) || null;
}

export async function putLocationCredentials(env, locationId, creds) {
  await env.BUTTONS.put(locationCredKey(locationId), JSON.stringify(creds));
}

export async function deleteLocationCredentials(env, locationId) {
  await env.BUTTONS.delete(locationCredKey(locationId));
}

export async function getAgencyInstall(env) {
  return (await env.BUTTONS.get('oauth:agency', 'json')) || null;
}

export async function putAgencyInstall(env, install) {
  await env.BUTTONS.put('oauth:agency', JSON.stringify(install));
}

/**
 * Picks the bearer token to use for a sub-account. A Private Integration Token
 * stored against that location always wins, because it is the setup that needs
 * no marketplace OAuth at all. Otherwise we mint a location token from the
 * agency install and cache it until just before it expires.
 */
export async function resolveLocationToken(env, locationId, { fetchImpl = fetch } = {}) {
  const creds = await getLocationCredentials(env, locationId);
  if (creds?.pit) return { token: creds.pit, source: 'pit' };

  const cached = await env.BUTTONS.get(locationTokenKey(locationId), 'json');
  if (cached?.token && cached.expiresAt > Date.now() + 60_000) {
    return { token: cached.token, source: 'oauth-cached' };
  }

  const install = await getAgencyInstall(env);
  if (!install?.accessToken || !install?.companyId) {
    throw new Error(
      `No credentials for location ${locationId}. Add a Private Integration Token in the admin, or connect the agency app.`,
    );
  }

  const body = new URLSearchParams({ companyId: install.companyId, locationId });
  const res = await fetchImpl('https://services.leadconnectorhq.com/oauth/locationToken', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${install.accessToken}`,
      Version: '2021-07-28',
      Accept: 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Could not mint a location token for ${locationId} (${res.status}): ${text}`);

  const data = JSON.parse(text);
  const expiresAt = Date.now() + (data.expires_in ? data.expires_in * 1000 : 86_400_000);
  await env.BUTTONS.put(
    locationTokenKey(locationId),
    JSON.stringify({ token: data.access_token, expiresAt }),
    { expirationTtl: Math.max(120, Math.floor((expiresAt - Date.now()) / 1000)) },
  );
  return { token: data.access_token, source: 'oauth' };
}

// --- action log ----------------------------------------------------------

export async function writeLog(env, locationId, entry) {
  const key = `log:${locationId}:${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
  await env.BUTTONS.put(key, JSON.stringify(entry), { expirationTtl: LOG_TTL_SECONDS });
}

export async function listLogs(env, locationId, limit = 50) {
  const { keys } = await env.BUTTONS.list({ prefix: `log:${locationId}:`, limit });
  const entries = await Promise.all(keys.map((k) => env.BUTTONS.get(k.name, 'json')));
  return entries.filter(Boolean).reverse();
}

export async function listConfiguredLocations(env) {
  const { keys } = await env.BUTTONS.list({ prefix: 'cfg:loc:', limit: 1000 });
  return keys.map((k) => k.name.replace('cfg:loc:', ''));
}
