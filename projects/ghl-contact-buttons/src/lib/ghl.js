// Minimal HighLevel API v2 client.
//
// Every call is authenticated with a bearer token that belongs to one
// sub-account: either a Private Integration Token stored per location, or a
// location access token minted from the agency OAuth install.

const API = 'https://services.leadconnectorhq.com';
const VERSION = '2021-07-28';

export class GhlError extends Error {
  constructor(status, body, endpoint) {
    super(`HighLevel ${endpoint} failed (${status}): ${typeof body === 'string' ? body : JSON.stringify(body)}`);
    this.name = 'GhlError';
    this.status = status;
    this.body = body;
    this.endpoint = endpoint;
  }
}

export class Ghl {
  constructor(token, { fetchImpl = fetch } = {}) {
    if (!token) throw new Error('Ghl requires an access token');
    this.token = token;
    this.fetch = fetchImpl;
  }

  async request(method, path, { body, query } = {}) {
    const url = new URL(API + path);
    for (const [k, v] of Object.entries(query || {})) {
      if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v));
    }
    const init = {
      method,
      headers: {
        Authorization: `Bearer ${this.token}`,
        Version: VERSION,
        Accept: 'application/json',
      },
    };
    if (body !== undefined) {
      init.headers['Content-Type'] = 'application/json';
      init.body = JSON.stringify(body);
    }
    const res = await this.fetch(url.toString(), init);
    const text = await res.text();
    let parsed = text;
    try {
      parsed = text ? JSON.parse(text) : null;
    } catch {
      /* leave as text */
    }
    if (!res.ok) throw new GhlError(res.status, parsed, `${method} ${path}`);
    return parsed;
  }

  // --- contacts -----------------------------------------------------------
  getContact(contactId) {
    return this.request('GET', `/contacts/${contactId}`);
  }

  updateContact(contactId, patch) {
    return this.request('PUT', `/contacts/${contactId}`, { body: patch });
  }

  addTags(contactId, tags) {
    return this.request('POST', `/contacts/${contactId}/tags`, { body: { tags } });
  }

  removeTags(contactId, tags) {
    return this.request('DELETE', `/contacts/${contactId}/tags`, { body: { tags } });
  }

  addNote(contactId, body, userId) {
    return this.request('POST', `/contacts/${contactId}/notes`, { body: { body, userId } });
  }

  addTask(contactId, task) {
    return this.request('POST', `/contacts/${contactId}/tasks`, { body: task });
  }

  // --- workflows ----------------------------------------------------------
  listWorkflows(locationId) {
    return this.request('GET', '/workflows/', { query: { locationId } });
  }

  addToWorkflow(contactId, workflowId, eventStartTime) {
    const body = eventStartTime ? { eventStartTime } : {};
    return this.request('POST', `/contacts/${contactId}/workflow/${workflowId}`, { body });
  }

  removeFromWorkflow(contactId, workflowId) {
    return this.request('DELETE', `/contacts/${contactId}/workflow/${workflowId}`);
  }

  // --- campaigns ----------------------------------------------------------
  addToCampaign(contactId, campaignId) {
    return this.request('POST', `/contacts/${contactId}/campaigns/${campaignId}`, { body: {} });
  }

  removeFromCampaign(contactId, campaignId) {
    return this.request('DELETE', `/contacts/${contactId}/campaigns/${campaignId}`);
  }

  removeFromAllCampaigns(contactId) {
    return this.request('DELETE', `/contacts/${contactId}/campaigns/removeAll`);
  }

  // --- opportunities ------------------------------------------------------
  searchOpportunities(locationId, contactId) {
    return this.request('GET', '/opportunities/search', {
      query: { location_id: locationId, contact_id: contactId, limit: 20 },
    });
  }

  updateOpportunity(opportunityId, patch) {
    return this.request('PUT', `/opportunities/${opportunityId}`, { body: patch });
  }

  listPipelines(locationId) {
    return this.request('GET', '/opportunities/pipelines', { query: { locationId } });
  }

  // --- location metadata (used by the admin pickers) ----------------------
  listTags(locationId) {
    return this.request('GET', `/locations/${locationId}/tags`);
  }

  listCustomFields(locationId) {
    return this.request('GET', `/locations/${locationId}/customFields`);
  }

  listUsers(locationId) {
    return this.request('GET', '/users/', { query: { locationId } });
  }
}

// Runs `worker` over `items` with a bounded number of in-flight requests, and
// never rejects: each entry comes back as {ok, value|error}. Used by the
// "remove from every workflow" action, which fans out one DELETE per workflow.
export async function mapLimit(items, limit, worker) {
  const results = new Array(items.length);
  let cursor = 0;
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor++;
      try {
        results[index] = { ok: true, value: await worker(items[index], index) };
      } catch (err) {
        results[index] = { ok: false, error: err };
      }
    }
  });
  await Promise.all(runners);
  return results;
}
