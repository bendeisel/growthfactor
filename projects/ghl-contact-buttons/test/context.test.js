import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';

import { resolveContactId, summarizeContact } from '../src/lib/context.js';

// --- browser route parsing, run in a sandbox with autostart off ------------

function loadParseRoute() {
  const source = readFileSync(new URL('../client/injector.js', import.meta.url), 'utf8');
  const sandbox = {
    window: { GF_BUTTONS_CONFIG: { disableAutostart: true }, addEventListener() {} },
    document: { addEventListener() {}, getElementById: () => null, querySelectorAll: () => [] },
    history: {},
    localStorage: { getItem: () => null, setItem() {} },
    setTimeout,
    clearTimeout,
    setInterval,
    URL,
    console,
  };
  sandbox.window.location = { href: 'https://app.gohighlevel.com/' };
  vm.createContext(sandbox);
  vm.runInContext(source, sandbox);
  return sandbox.window.__gfContactButtons.parseRoute;
}

const parseRoute = loadParseRoute();
const LOC = 'AbCdEfGhIjKlMnOpQrSt';
const ID = 'zYxWvUtSrQpOnMlKjIhG';

test('contact detail URLs resolve to the contact surface', () => {
  // Spread: the sandbox realm has its own Object.prototype, which trips strict deep-equal.
  assert.deepEqual({ ...parseRoute(`https://app.gohighlevel.com/v2/location/${LOC}/contacts/detail/${ID}`) }, {
    surface: 'contact',
    locationId: LOC,
    id: ID,
  });
  assert.equal(parseRoute(`https://x.com/location/${LOC}/contacts/detail/${ID}?tab=notes`).surface, 'contact');
});

test('conversation URLs resolve to the conversation surface', () => {
  const r = parseRoute(`https://app.gohighlevel.com/v2/location/${LOC}/conversations/conversations/${ID}`);
  assert.equal(r.surface, 'conversation');
  assert.equal(r.id, ID);
});

test('opportunity URLs resolve from a path segment or a query param', () => {
  assert.equal(parseRoute(`https://x.com/v2/location/${LOC}/opportunities/list/${ID}`).surface, 'opportunity');
  assert.equal(parseRoute(`https://x.com/v2/location/${LOC}/opportunities/list/${ID}`).id, ID);
  const q = parseRoute(`https://x.com/v2/location/${LOC}/opportunities/list?opportunityId=${ID}`);
  assert.equal(q.surface, 'opportunity');
  assert.equal(q.id, ID);
});

test('list pages inside a sub-account are "none", not a false opportunity', () => {
  assert.equal(parseRoute(`https://x.com/v2/location/${LOC}/opportunities/list`).surface, 'none');
  assert.equal(parseRoute(`https://x.com/v2/location/${LOC}/contacts/smart_list/All`).surface, 'none');
  assert.equal(parseRoute(`https://x.com/v2/location/${LOC}/dashboard`).locationId, LOC);
});

test('agency level pages resolve to nothing', () => {
  assert.equal(parseRoute('https://app.gohighlevel.com/agency_dashboard/'), null);
});

// --- server side contact resolution ----------------------------------------

function fakeKv() {
  const map = new Map();
  return {
    async get(k, t) { const v = map.get(k); return v === undefined ? null : t === 'json' ? JSON.parse(v) : v; },
    async put(k, v) { map.set(k, v); },
  };
}

test('conversation resolution asks HighLevel once, then hits the cache', async () => {
  let calls = 0;
  const ghl = { getConversation: async () => { calls++; return { id: 'conv1', contactId: 'c9' }; } };
  const env = { BUTTONS: fakeKv() };
  const a = await resolveContactId({ env, ghl, surface: 'conversation', conversationId: 'conv1' });
  const b = await resolveContactId({ env, ghl, surface: 'conversation', conversationId: 'conv1' });
  assert.deepEqual(a, { contactId: 'c9', via: 'conversation' });
  assert.deepEqual(b, a);
  assert.equal(calls, 1);
});

test('opportunity resolution handles both payload shapes', async () => {
  const env = { BUTTONS: fakeKv() };
  const nested = { getOpportunity: async () => ({ opportunity: { id: 'o1', contact: { id: 'c1' } } }) };
  const flat = { getOpportunity: async () => ({ id: 'o2', contactId: 'c2' }) };
  assert.equal((await resolveContactId({ env, ghl: nested, surface: 'opportunity', opportunityId: 'o1' })).contactId, 'c1');
  assert.equal((await resolveContactId({ env, ghl: flat, surface: 'opportunity', opportunityId: 'o2' })).contactId, 'c2');
});

test('a DOM hint is the fallback when the API cannot say', async () => {
  const env = { BUTTONS: fakeKv() };
  const ghl = { getOpportunity: async () => { throw new Error('nope'); } };
  await assert.rejects(() => resolveContactId({ env, ghl, surface: 'opportunity', opportunityId: 'o1' }));
  const r = await resolveContactId({ env, ghl: { getOpportunity: async () => ({}) }, surface: 'opportunity', opportunityId: 'o1', contactIdHint: 'c7' });
  assert.deepEqual(r, { contactId: 'c7', via: 'dom' });
});

test('summarizeContact builds a display name from whatever is there', () => {
  assert.equal(summarizeContact({ contact: { id: 'c', firstName: 'Ben', lastName: 'D' } }).name, 'Ben D');
  assert.equal(summarizeContact({ contact: { id: 'c', contactName: 'Full Name' } }).name, 'Full Name');
  assert.equal(summarizeContact({ id: 'c', email: 'x@y.z' }).name, 'x@y.z');
  assert.deepEqual(summarizeContact({ contact: { id: 'c', tags: ['a'] } }).tags, ['a']);
});
