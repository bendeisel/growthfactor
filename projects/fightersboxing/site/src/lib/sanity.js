// The one place that knows how to talk to Sanity.
//
// Both the schedule and the FAQs read from the project, and the browser
// re-checks the schedule, so the URL builder lives here rather than being
// written twice. Read only, no token, public CDN: see CMS.md.
const API_VERSION = 'v2024-01-01';

/**
 * Build a GROQ query URL, or return null when the site has no Sanity
 * project configured yet (in which case callers use their fallback data).
 */
export function queryUrl(env, groq) {
  const projectId = env.PUBLIC_SANITY_PROJECT_ID;
  const dataset = env.PUBLIC_SANITY_DATASET || 'production';
  if (!projectId) return null;
  const query = encodeURIComponent(groq.replace(/\s+/g, ' ').trim());
  // apicdn, not api: the CDN is cached, cheap, and plenty fresh for a class
  // schedule and a page of answers.
  return `https://${projectId}.apicdn.sanity.io/${API_VERSION}/data/query/${dataset}?query=${query}`;
}

/** Fetch a query, or fall back with a build log line saying why. */
export function fetchOrFallback({ url, label, parse, fallback }) {
  if (!url) {
    console.log(`[${label}] no PUBLIC_SANITY_PROJECT_ID, using the committed copy`);
    return Promise.resolve(fallback);
  }
  return fetch(url)
    .then((res) => {
      if (!res.ok) throw new Error(`Sanity responded ${res.status}`);
      return res.json();
    })
    .then((body) => {
      const parsed = parse(body.result);
      if (parsed.length === 0) throw new Error('Sanity returned nothing usable');
      console.log(`[${label}] ${parsed.length} from Sanity`);
      return parsed;
    })
    .catch((err) => {
      console.warn(`[${label}] ${err.message}; using the committed copy`);
      return fallback;
    });
}
