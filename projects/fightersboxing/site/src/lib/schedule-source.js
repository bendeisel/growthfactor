// WHERE THE SCHEDULE COMES FROM
//
// Sanity is the source of truth. The gym edits one document per class
// session in the Studio, and every surface on the site reads from it:
//
//   at build time    this module fetches the sessions and Astro renders
//                    them into the HTML, so the times are in the page for
//                    crawlers and for anyone with JavaScript off
//   in the browser   src/scripts/schedule-live.js fetches the same query
//                    and re-renders in place, so an edit in the Studio
//                    shows up on the live site without waiting for a
//                    rebuild
//
// Until the Sanity project exists, both paths fall back to the committed
// copy of the week in src/data/schedule.js. The site builds and looks
// right either way; wiring Sanity is two environment variables.
//
// Config, in site/.env (see .env.example) and in the host's build env:
//   PUBLIC_SANITY_PROJECT_ID   from sanity.io/manage
//   PUBLIC_SANITY_DATASET      usually "production"
// Both are PUBLIC because the browser needs them too. That is fine: the
// dataset holds a class schedule and is read through Sanity's public CDN,
// which is read-only. No token is involved, so nothing here can write.
import { fallbackSessions, dayKeys, audiences, programSlugs } from '../data/schedule.js';

const API_VERSION = 'v2024-01-01';

/** One document per session. Drafts are excluded, so nothing half-typed shows. */
export const SESSION_QUERY = `*[_type == "classSession" && !(_id in path("drafts.**"))]{
  name, day, start, end, audience, "programs": programs[]
}`;

/**
 * The URL the build and the browser both call. Returns null when the site
 * has no Sanity project configured yet.
 */
export function sessionQueryUrl(env) {
  const projectId = env.PUBLIC_SANITY_PROJECT_ID;
  const dataset = env.PUBLIC_SANITY_DATASET || 'production';
  if (!projectId) return null;
  const query = encodeURIComponent(SESSION_QUERY.replace(/\s+/g, ' ').trim());
  // apicdn, not api: the CDN is cached, cheap and plenty fresh for a
  // weekly class schedule.
  return `https://${projectId}.apicdn.sanity.io/${API_VERSION}/data/query/${dataset}?query=${query}`;
}

/**
 * Throw out anything the Studio could hand over in a broken state, so one
 * bad document can never take a page down.
 */
export function normalizeSessions(raw) {
  if (!Array.isArray(raw)) return [];
  const time = /^([01]\d|2[0-3]):[0-5]\d$/;
  return raw
    .filter(
      (s) =>
        s &&
        typeof s.name === 'string' &&
        s.name.trim() &&
        dayKeys.includes(s.day) &&
        typeof s.start === 'string' &&
        time.test(s.start) &&
        audiences.includes(s.audience)
    )
    .map((s) => ({
      name: s.name.trim(),
      day: s.day,
      start: s.start,
      ...(typeof s.end === 'string' && time.test(s.end) ? { end: s.end } : {}),
      audience: s.audience,
      programs: Array.isArray(s.programs) ? s.programs.filter((p) => programSlugs.includes(p)) : [],
    }));
}

let pending = null;

/**
 * The sessions for this build. Fetched once per build and memoized, so ten
 * components asking for the week is still one request. Falls back to the
 * committed copy on any failure, and says which source it used.
 */
export function getSessions(env = import.meta.env) {
  if (pending) return pending;

  const url = sessionQueryUrl(env);
  if (!url) {
    console.log('[schedule] no PUBLIC_SANITY_PROJECT_ID, using the committed copy of the week');
    pending = Promise.resolve(fallbackSessions);
    return pending;
  }

  pending = fetch(url)
    .then((res) => {
      if (!res.ok) throw new Error(`Sanity responded ${res.status}`);
      return res.json();
    })
    .then((body) => {
      const sessions = normalizeSessions(body.result);
      if (sessions.length === 0) throw new Error('Sanity returned no usable sessions');
      console.log(`[schedule] ${sessions.length} sessions from Sanity`);
      return sessions;
    })
    .catch((err) => {
      console.warn(`[schedule] ${err.message}; using the committed copy of the week`);
      return fallbackSessions;
    });

  return pending;
}
