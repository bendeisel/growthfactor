// One button fires an ordered list of actions. Each action is small and
// composable on purpose: "tag the contact, drop them into a workflow, ping
// n8n" is three entries on one button, not three buttons.

import { Ghl, mapLimit } from './ghl.js';

export const ACTION_TYPES = [
  'add_tag',
  'remove_tag',
  'remove_all_tags',
  'add_to_workflow',
  'remove_from_workflow',
  'remove_from_all_workflows',
  'add_to_campaign',
  'remove_from_campaign',
  'remove_from_all_campaigns',
  'set_field',
  'set_dnd',
  'add_note',
  'add_task',
  'move_opportunity',
  'webhook',
  'open_url',
];

// Handled entirely in the browser; the server ignores them.
export const CLIENT_ONLY_ACTIONS = new Set(['open_url']);

const WORKFLOW_CACHE_TTL_SECONDS = 300;

/** Replaces {{contact.firstName}} style tokens from the execution context. */
export function renderTemplate(input, context) {
  if (typeof input !== 'string') return input;
  return input.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (whole, path) => {
    const value = path.split('.').reduce((acc, key) => (acc == null ? acc : acc[key]), context);
    if (value === undefined || value === null) return '';
    return typeof value === 'object' ? JSON.stringify(value) : String(value);
  });
}

function renderDeep(value, context) {
  if (Array.isArray(value)) return value.map((v) => renderDeep(v, context));
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, renderDeep(v, context)]));
  }
  return renderTemplate(value, context);
}

function assertSafeWebhookUrl(raw) {
  let url;
  try {
    url = new URL(raw);
  } catch {
    throw new Error(`Webhook URL is not a URL: ${raw}`);
  }
  if (url.protocol !== 'https:') throw new Error('Webhook URLs must be https');
  const host = url.hostname.toLowerCase();
  const blocked =
    host === 'localhost' ||
    host.endsWith('.localhost') ||
    host === '0.0.0.0' ||
    host === '[::1]' ||
    /^127\./.test(host) ||
    /^10\./.test(host) ||
    /^192\.168\./.test(host) ||
    /^169\.254\./.test(host) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(host);
  if (blocked) throw new Error('Webhook URLs may not point at private addresses');
  return url;
}

/** Workflow ids for a location, cached briefly so "remove from all" is cheap. */
async function locationWorkflowIds(env, ghl, locationId) {
  const cacheKey = `wf:${locationId}`;
  const cached = await env.BUTTONS.get(cacheKey, 'json');
  if (cached) return cached;

  const response = await ghl.listWorkflows(locationId);
  const ids = (response?.workflows || [])
    .filter((w) => w?.id)
    .map((w) => w.id);
  await env.BUTTONS.put(cacheKey, JSON.stringify(ids), { expirationTtl: WORKFLOW_CACHE_TTL_SECONDS });
  return ids;
}

async function runOne(action, { env, ghl, context }) {
  const params = renderDeep(action, context);
  const { contactId, locationId } = context;

  switch (action.type) {
    case 'add_tag': {
      const tags = (params.tags || []).filter(Boolean);
      if (!tags.length) throw new Error('add_tag needs at least one tag');
      await ghl.addTags(contactId, tags);
      return `Added ${tags.join(', ')}`;
    }

    case 'remove_tag': {
      const tags = (params.tags || []).filter(Boolean);
      if (!tags.length) throw new Error('remove_tag needs at least one tag');
      await ghl.removeTags(contactId, tags);
      return `Removed ${tags.join(', ')}`;
    }

    case 'remove_all_tags': {
      const contact = await ghl.getContact(contactId);
      const tags = contact?.contact?.tags || [];
      if (!tags.length) return 'No tags to remove';
      await ghl.removeTags(contactId, tags);
      return `Removed ${tags.length} tag${tags.length === 1 ? '' : 's'}`;
    }

    case 'add_to_workflow': {
      if (!params.workflowId) throw new Error('add_to_workflow needs a workflowId');
      await ghl.addToWorkflow(contactId, params.workflowId, params.eventStartTime);
      return `Added to workflow ${params.workflowId}`;
    }

    case 'remove_from_workflow': {
      if (!params.workflowId) throw new Error('remove_from_workflow needs a workflowId');
      await ghl.removeFromWorkflow(contactId, params.workflowId);
      return `Removed from workflow ${params.workflowId}`;
    }

    case 'remove_from_all_workflows': {
      // HighLevel has no "which workflows is this contact in" endpoint and no
      // bulk removal, so we issue one delete per workflow in the sub-account.
      // Deletes for workflows the contact was never in are harmless.
      const ids = await locationWorkflowIds(env, ghl, locationId);
      if (!ids.length) return 'No workflows in this sub-account';
      const results = await mapLimit(ids, 5, (id) => ghl.removeFromWorkflow(contactId, id));
      const failed = results.filter((r) => !r.ok && ![404, 400, 422].includes(r.error?.status));
      if (failed.length) throw new Error(`${failed.length} of ${ids.length} removals failed: ${failed[0].error.message}`);
      return `Cleared ${ids.length} workflow${ids.length === 1 ? '' : 's'}`;
    }

    case 'add_to_campaign': {
      if (!params.campaignId) throw new Error('add_to_campaign needs a campaignId');
      await ghl.addToCampaign(contactId, params.campaignId);
      return `Added to campaign ${params.campaignId}`;
    }

    case 'remove_from_campaign': {
      if (!params.campaignId) throw new Error('remove_from_campaign needs a campaignId');
      await ghl.removeFromCampaign(contactId, params.campaignId);
      return `Removed from campaign ${params.campaignId}`;
    }

    case 'remove_from_all_campaigns': {
      await ghl.removeFromAllCampaigns(contactId);
      return 'Removed from every campaign';
    }

    case 'set_field': {
      const fields = params.fields || {};
      const entries = Object.entries(fields);
      if (!entries.length) throw new Error('set_field needs at least one field');
      await ghl.updateContact(contactId, {
        customFields: entries.map(([id, field_value]) => ({ id, field_value })),
      });
      return `Set ${entries.length} field${entries.length === 1 ? '' : 's'}`;
    }

    case 'set_dnd': {
      await ghl.updateContact(contactId, { dnd: params.dnd !== false });
      return params.dnd === false ? 'DND off' : 'DND on';
    }

    case 'add_note': {
      if (!params.body) throw new Error('add_note needs a body');
      await ghl.addNote(contactId, params.body, context.user?.userId);
      return 'Note added';
    }

    case 'add_task': {
      if (!params.title) throw new Error('add_task needs a title');
      const dueInDays = Number(params.dueInDays ?? 1);
      await ghl.addTask(contactId, {
        title: params.title,
        body: params.body || '',
        dueDate: new Date(Date.now() + dueInDays * 86_400_000).toISOString(),
        completed: false,
        assignedTo: params.assignedTo || context.user?.userId,
      });
      return 'Task created';
    }

    case 'move_opportunity': {
      if (!params.stageId) throw new Error('move_opportunity needs a stageId');
      const found = await ghl.searchOpportunities(locationId, contactId);
      const opportunities = found?.opportunities || [];
      const target = params.pipelineId
        ? opportunities.find((o) => o.pipelineId === params.pipelineId)
        : opportunities[0];
      if (!target) return 'No opportunity on this contact, nothing moved';
      const patch = { pipelineStageId: params.stageId };
      if (params.status) patch.status = params.status;
      await ghl.updateOpportunity(target.id, patch);
      return `Moved opportunity to ${params.stageId}`;
    }

    case 'webhook': {
      const url = assertSafeWebhookUrl(params.url);
      const payload = {
        buttonId: context.button?.id,
        buttonLabel: context.button?.label,
        locationId,
        contactId,
        contact: params.includeContact === false ? undefined : context.contact,
        user: context.user,
        firedAt: new Date().toISOString(),
        ...(params.body && typeof params.body === 'object' ? params.body : {}),
      };
      const res = await fetch(url.toString(), {
        method: params.method || 'POST',
        headers: { 'Content-Type': 'application/json', ...(params.headers || {}) },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`Webhook returned ${res.status}`);
      return `Webhook ${res.status}`;
    }

    default:
      throw new Error(`Unknown action type: ${action.type}`);
  }
}

/**
 * Runs a button's actions in order. Stops at the first failure unless the
 * action is marked `continueOnError`, so a broken webhook never silently eats
 * the tagging that was supposed to happen after it.
 */
export async function runButton({ env, button, token, contactId, locationId, user, client }) {
  const ghl = client || new Ghl(token);

  // Fetched once so every action and every template can see the contact.
  let contact = null;
  const needsContact = (button.actions || []).some(
    (a) => a.type === 'remove_all_tags' || (a.type === 'webhook' && a.includeContact !== false) || JSON.stringify(a).includes('{{contact.'),
  );
  if (needsContact) {
    try {
      contact = (await ghl.getContact(contactId))?.contact || null;
    } catch {
      contact = null;
    }
  }

  const context = {
    contactId,
    locationId,
    user,
    button: { id: button.id, label: button.label },
    contact: contact || { id: contactId },
    location: { id: locationId },
    now: new Date().toISOString(),
  };

  const steps = [];
  for (const action of button.actions || []) {
    if (CLIENT_ONLY_ACTIONS.has(action.type)) continue;
    try {
      const detail = await runOne(action, { env, ghl, context });
      steps.push({ type: action.type, ok: true, detail });
    } catch (err) {
      steps.push({ type: action.type, ok: false, detail: err.message });
      if (!action.continueOnError) break;
    }
  }

  const failed = steps.filter((s) => !s.ok);
  return {
    ok: failed.length === 0,
    steps,
    message: failed.length
      ? failed[0].detail
      : button.successMessage || steps.map((s) => s.detail).filter(Boolean).join(' · ') || 'Done',
  };
}
