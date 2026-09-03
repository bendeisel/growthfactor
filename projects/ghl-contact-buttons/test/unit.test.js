import test from 'node:test';
import assert from 'node:assert/strict';

import { md5 } from '../src/lib/md5.js';
import { decryptSession, evpBytesToKey } from '../src/lib/sso.js';
import { mergeButtons, mergeSettings } from '../src/lib/store.js';
import { renderTemplate, runButton } from '../src/lib/actions.js';
import { safeEqual } from '../src/lib/session.js';

const hex = (bytes) => [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
const utf8 = (s) => new TextEncoder().encode(s);

test('md5 matches the RFC 1321 vectors', () => {
  assert.equal(hex(md5(utf8(''))), 'd41d8cd98f00b204e9800998ecf8427e');
  assert.equal(hex(md5(utf8('abc'))), '900150983cd24fb0d6963f7d28e17f72');
  assert.equal(hex(md5(utf8('message digest'))), 'f96b697d7cb7938d525a2f31aaf161d0');
  assert.equal(hex(md5(utf8('abcdefghijklmnopqrstuvwxyz'))), 'c3fcd3d76192e4007dfb496cca67e13b');
  assert.equal(hex(md5(utf8('1234567890'.repeat(8)))), '57edf4a22be3c955ac49da2e2107b67a');
});

test('evpBytesToKey derives 48 bytes for AES-256-CBC', () => {
  const { key, iv } = evpBytesToKey(utf8('pw'), utf8('12345678'));
  assert.equal(key.length, 32);
  assert.equal(iv.length, 16);
});

// Produced with:
//   printf '%s' '<json>' | openssl enc -aes-256-cbc -k 'sso-shared-secret-abc123' -md md5 -base64 -A
const SSO_FIXTURE =
  'U2FsdGVkX1+6zlWC29sYREY7yQcCGVTJrO8IZK593gqvp3/Z55MsaPNJ/NFx1KKeDURgoveCSAkOK5sw46Pt7RrJaP0LjHYcbxBtHiId2gDkQaglObDLUjJfxuCtd8INE6wDBVPcBogdy1cBqIX1Jaj2xs51jzqHYkALQoeb5ggjoMraEKVG/iNzpog76dAWwS5p+QaSVS9i7d+07NXKYg==';

test('decryptSession opens a CryptoJS/OpenSSL envelope', async () => {
  const session = await decryptSession(SSO_FIXTURE, 'sso-shared-secret-abc123');
  assert.equal(session.userId, 'usr_123');
  assert.equal(session.activeLocation, 'loc_789');
  assert.equal(session.email, 'ben@growth-factor.ai');
});

test('decryptSession rejects the wrong shared secret', async () => {
  await assert.rejects(() => decryptSession(SSO_FIXTURE, 'not-the-secret'), /did not decrypt/);
});

test('decryptSession rejects a non-CryptoJS payload', async () => {
  await assert.rejects(() => decryptSession(btoa('hello there friend padding'), 'x'), /Unexpected SSO envelope/);
});

test('safeEqual compares without short-circuiting on content', () => {
  assert.equal(safeEqual('abc', 'abc'), true);
  assert.equal(safeEqual('abc', 'abd'), false);
  assert.equal(safeEqual('abc', 'abcd'), false);
  assert.equal(safeEqual('abc', undefined), false);
});

// --- config merge --------------------------------------------------------

const agency = {
  buttons: [
    { id: 'a1', label: 'Became a Member', order: 10, color: '#f00', actions: [] },
    { id: 'a2', label: 'Remove All Tags', order: 20, color: '#0f0', actions: [] },
    { id: 'a3', label: 'Retired', order: 30, active: false, actions: [] },
  ],
  settings: { placement: 'auto', confirmDestructive: true },
};

test('sub-accounts inherit agency buttons in order', () => {
  const merged = mergeButtons(agency, { buttons: [], disabledAgencyButtons: [] });
  assert.deepEqual(merged.map((b) => b.id), ['a1', 'a2']); // a3 is inactive
  assert.equal(merged[0].scope, 'agency');
});

test('a sub-account can switch an inherited button off', () => {
  const merged = mergeButtons(agency, { buttons: [], disabledAgencyButtons: ['a1'] });
  assert.deepEqual(merged.map((b) => b.id), ['a2']);
});

test('a sub-account can override an inherited button in place', () => {
  const merged = mergeButtons(agency, {
    buttons: [{ id: 'a1', label: 'Joined the gym', color: '#123456' }],
    disabledAgencyButtons: [],
  });
  const overridden = merged.find((b) => b.id === 'a1');
  assert.equal(overridden.label, 'Joined the gym');
  assert.equal(overridden.color, '#123456');
  assert.equal(overridden.overridden, true);
  assert.equal(merged.length, 2, 'overriding must not duplicate the button');
});

test('sub-account only buttons sort in with the inherited ones', () => {
  const merged = mergeButtons(agency, {
    buttons: [{ id: 'l1', label: 'Book Trial', order: 15, actions: [] }],
    disabledAgencyButtons: [],
  });
  assert.deepEqual(merged.map((b) => b.id), ['a1', 'l1', 'a2']);
  assert.equal(merged[1].scope, 'location');
});

test('location settings win over agency settings', () => {
  const settings = mergeSettings(agency, { settings: { placement: 'pinned' } });
  assert.equal(settings.placement, 'pinned');
  assert.equal(settings.confirmDestructive, true);
});

// --- templates -----------------------------------------------------------

test('renderTemplate substitutes nested paths and drops unknowns', () => {
  const ctx = { contact: { firstName: 'Ben', id: 'c1' }, location: { id: 'loc1' } };
  assert.equal(renderTemplate('Hi {{contact.firstName}} ({{contact.id}})', ctx), 'Hi Ben (c1)');
  assert.equal(renderTemplate('{{ location.id }}', ctx), 'loc1');
  assert.equal(renderTemplate('{{contact.nope}}!', ctx), '!');
});

// --- button execution ----------------------------------------------------

function fakeKv() {
  const map = new Map();
  return {
    async get(key, type) {
      const raw = map.get(key);
      if (raw === undefined) return null;
      return type === 'json' ? JSON.parse(raw) : raw;
    },
    async put(key, value) {
      map.set(key, value);
    },
  };
}

function fakeGhl(overrides = {}) {
  const calls = [];
  const record = (name) => (...args) => {
    calls.push([name, ...args]);
    return Promise.resolve(overrides[name] ? overrides[name](...args) : {});
  };
  return {
    calls,
    getContact: (...a) => {
      calls.push(['getContact', ...a]);
      return Promise.resolve(overrides.getContact ? overrides.getContact(...a) : { contact: { id: a[0], tags: [] } });
    },
    addTags: record('addTags'),
    removeTags: record('removeTags'),
    addToWorkflow: record('addToWorkflow'),
    removeFromWorkflow: record('removeFromWorkflow'),
    listWorkflows: (...a) => {
      calls.push(['listWorkflows', ...a]);
      return Promise.resolve(overrides.listWorkflows ? overrides.listWorkflows(...a) : { workflows: [] });
    },
    updateContact: record('updateContact'),
    addNote: record('addNote'),
  };
}

test('a button runs its actions in order', async () => {
  const client = fakeGhl();
  const result = await runButton({
    env: { BUTTONS: fakeKv() },
    button: {
      id: 'b1',
      label: 'Became a Member',
      successMessage: 'Member added',
      actions: [
        { type: 'add_tag', tags: ['member'] },
        { type: 'add_to_workflow', workflowId: 'wf_1' },
      ],
    },
    client,
    contactId: 'c1',
    locationId: 'loc1',
    user: { userId: 'u1' },
  });

  assert.equal(result.ok, true);
  assert.equal(result.message, 'Member added');
  assert.deepEqual(result.steps.map((s) => s.type), ['add_tag', 'add_to_workflow']);
  assert.deepEqual(client.calls[0], ['addTags', 'c1', ['member']]);
  assert.deepEqual(client.calls[1], ['addToWorkflow', 'c1', 'wf_1', undefined]);
});

test('a failing step stops the rest unless it says otherwise', async () => {
  const client = fakeGhl();
  client.addTags = () => Promise.reject(new Error('boom'));
  const result = await runButton({
    env: { BUTTONS: fakeKv() },
    button: { id: 'b1', label: 'x', actions: [{ type: 'add_tag', tags: ['a'] }, { type: 'add_note', body: 'hi' }] },
    client,
    contactId: 'c1',
    locationId: 'loc1',
  });
  assert.equal(result.ok, false);
  assert.equal(result.steps.length, 1);
  assert.equal(result.message, 'boom');
});

test('continueOnError lets later steps still run', async () => {
  const client = fakeGhl();
  client.addTags = () => Promise.reject(new Error('boom'));
  const result = await runButton({
    env: { BUTTONS: fakeKv() },
    button: {
      id: 'b1',
      label: 'x',
      actions: [{ type: 'add_tag', tags: ['a'], continueOnError: true }, { type: 'add_note', body: 'hi' }],
    },
    client,
    contactId: 'c1',
    locationId: 'loc1',
  });
  assert.equal(result.ok, false);
  assert.equal(result.steps.length, 2);
  assert.equal(result.steps[1].ok, true);
});

test('remove_all_tags reads the contact and deletes exactly what is there', async () => {
  const client = fakeGhl({ getContact: () => ({ contact: { id: 'c1', tags: ['lead', 'trial'] } }) });
  const result = await runButton({
    env: { BUTTONS: fakeKv() },
    button: { id: 'b1', label: 'x', actions: [{ type: 'remove_all_tags' }] },
    client,
    contactId: 'c1',
    locationId: 'loc1',
  });
  assert.equal(result.ok, true);
  assert.deepEqual(client.calls.find((c) => c[0] === 'removeTags'), ['removeTags', 'c1', ['lead', 'trial']]);
});

test('remove_from_all_workflows fans out over the sub-account workflows', async () => {
  const client = fakeGhl({ listWorkflows: () => ({ workflows: [{ id: 'w1' }, { id: 'w2' }, { id: 'w3' }] }) });
  const result = await runButton({
    env: { BUTTONS: fakeKv() },
    button: { id: 'b1', label: 'x', actions: [{ type: 'remove_from_all_workflows' }] },
    client,
    contactId: 'c1',
    locationId: 'loc1',
  });
  assert.equal(result.ok, true);
  const removals = client.calls.filter((c) => c[0] === 'removeFromWorkflow').map((c) => c[2]);
  assert.deepEqual(removals.sort(), ['w1', 'w2', 'w3']);
  assert.equal(result.steps[0].detail, 'Cleared 3 workflows');
});

test('remove_from_all_workflows tolerates 404s from workflows the contact was never in', async () => {
  const client = fakeGhl({ listWorkflows: () => ({ workflows: [{ id: 'w1' }, { id: 'w2' }] }) });
  client.removeFromWorkflow = (contactId, workflowId) => {
    if (workflowId === 'w2') {
      const err = new Error('not found');
      err.status = 404;
      return Promise.reject(err);
    }
    return Promise.resolve({});
  };
  const result = await runButton({
    env: { BUTTONS: fakeKv() },
    button: { id: 'b1', label: 'x', actions: [{ type: 'remove_from_all_workflows' }] },
    client,
    contactId: 'c1',
    locationId: 'loc1',
  });
  assert.equal(result.ok, true);
});

test('webhook actions refuse anything but public https', async () => {
  const client = fakeGhl();
  for (const url of ['http://example.com/hook', 'https://127.0.0.1/hook', 'https://192.168.1.10/hook']) {
    const result = await runButton({
      env: { BUTTONS: fakeKv() },
      button: { id: 'b1', label: 'x', actions: [{ type: 'webhook', url }] },
      client,
      contactId: 'c1',
      locationId: 'loc1',
    });
    assert.equal(result.ok, false, `${url} should have been rejected`);
  }
});

test('open_url never reaches the server side', async () => {
  const client = fakeGhl();
  const result = await runButton({
    env: { BUTTONS: fakeKv() },
    button: { id: 'b1', label: 'x', actions: [{ type: 'open_url', url: 'https://example.com' }] },
    client,
    contactId: 'c1',
    locationId: 'loc1',
  });
  assert.equal(result.steps.length, 0);
  assert.equal(client.calls.length, 0);
});

test('templates resolve against the contact before the action runs', async () => {
  const client = fakeGhl({ getContact: () => ({ contact: { id: 'c1', firstName: 'Ben', tags: [] } }) });
  await runButton({
    env: { BUTTONS: fakeKv() },
    button: { id: 'b1', label: 'x', actions: [{ type: 'add_note', body: 'Called {{contact.firstName}}' }] },
    client,
    contactId: 'c1',
    locationId: 'loc1',
    user: { userId: 'u1' },
  });
  const note = client.calls.find((c) => c[0] === 'addNote');
  assert.equal(note[2], 'Called Ben');
});
