// Works out which contact the user is looking at. The contact page says so in
// its URL; conversations and opportunities do not, so we ask HighLevel. Every
// resolution is cached briefly in KV because people flick between the same few
// records all day.

const RESOLUTION_TTL_SECONDS = 600;

function pick(...values) {
  return values.find((v) => typeof v === 'string' && v.length > 0) || null;
}

export function summarizeContact(raw) {
  const c = raw?.contact || raw || {};
  const name = pick(
    c.contactName,
    c.name,
    [c.firstName, c.lastName].filter(Boolean).join(' '),
    c.firstNameLowerCase && c.lastNameLowerCase ? `${c.firstNameLowerCase} ${c.lastNameLowerCase}` : null,
    c.email,
    c.phone,
  );
  return {
    id: c.id || null,
    name,
    email: c.email || null,
    phone: c.phone || null,
    tags: Array.isArray(c.tags) ? c.tags : [],
  };
}

async function cached(env, key, compute) {
  const hit = await env.BUTTONS.get(key, 'json');
  if (hit) return hit;
  const value = await compute();
  if (value) await env.BUTTONS.put(key, JSON.stringify(value), { expirationTtl: RESOLUTION_TTL_SECONDS });
  return value;
}

/**
 * @returns {Promise<{contactId: string|null, via: string}>}
 */
export async function resolveContactId({ env, ghl, surface, contactId, conversationId, opportunityId, contactIdHint }) {
  if (surface === 'contact' && contactId) return { contactId, via: 'url' };

  if (surface === 'conversation' && conversationId) {
    const id = await cached(env, `ctx:conv:${conversationId}`, async () => {
      const data = await ghl.getConversation(conversationId);
      return pick(data?.contactId, data?.conversation?.contactId, data?.contact?.id);
    });
    if (id) return { contactId: id, via: 'conversation' };
  }

  if (surface === 'opportunity' && opportunityId) {
    const id = await cached(env, `ctx:opp:${opportunityId}`, async () => {
      const data = await ghl.getOpportunity(opportunityId);
      const opp = data?.opportunity || data;
      return pick(opp?.contactId, opp?.contact?.id);
    });
    if (id) return { contactId: id, via: 'opportunity' };
  }

  // The browser may have spotted a contact link inside the open panel.
  if (contactIdHint) return { contactId: contactIdHint, via: 'dom' };

  return { contactId: null, via: 'none' };
}

export async function loadContactSummary(ghl, contactId) {
  try {
    return summarizeContact(await ghl.getContact(contactId));
  } catch {
    return { id: contactId, name: null, email: null, phone: null, tags: [] };
  }
}
