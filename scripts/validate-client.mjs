#!/usr/bin/env node
/**
 * Validates a client.json before provisioning. Dependency-free.
 *
 *   node scripts/validate-client.mjs clients/acme-restoration.json
 *
 * Exit 1 means DO NOT PROVISION. Incomplete intake is the single most common
 * cause of a one-hour build becoming a two-day build.
 *
 * Two passes:
 *   1. the JSON Schema in schemas/client.schema.json (subset interpreter below)
 *   2. cross-field rules a schema cannot express — skin/layout coherence,
 *      medical consent, brand-colour contrast, niche-specific completeness
 */

import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const file = process.argv[2];
if (!file) {
  console.error('usage: node scripts/validate-client.mjs <client.json>');
  process.exit(2);
}

const errors = [];
const warnings = [];
const fail = (m) => errors.push(m);
const warn = (m) => warnings.push(m);

const data = JSON.parse(readFileSync(file, 'utf8'));
const schema = JSON.parse(readFileSync(join(ROOT, 'schemas/client.schema.json'), 'utf8'));

/* ------------------------------------------------------------------ *
 * Pass 1 — JSON Schema (the subset this contract actually uses)
 * ------------------------------------------------------------------ */

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function typeOf(v) {
  if (Array.isArray(v)) return 'array';
  if (v === null) return 'null';
  if (Number.isInteger(v)) return 'integer';
  return typeof v;
}

function check(value, sch, path) {
  if (!sch || typeof sch !== 'object') return;

  if (sch.type) {
    const actual = typeOf(value);
    const ok = sch.type === 'number' ? ['number', 'integer'].includes(actual) : actual === sch.type;
    if (!ok) return fail(`${path}: expected ${sch.type}, got ${actual}`);
  }
  if (sch.enum && !sch.enum.includes(value)) {
    return fail(`${path}: "${value}" not one of ${sch.enum.join(', ')}`);
  }

  if (typeof value === 'string') {
    if (sch.pattern && !new RegExp(sch.pattern).test(value))
      fail(`${path}: "${value}" does not match ${sch.pattern}`);
    if (sch.maxLength && value.length > sch.maxLength)
      fail(`${path}: ${value.length} chars, max ${sch.maxLength}`);
    if (sch.format === 'email' && !EMAIL.test(value)) fail(`${path}: "${value}" is not a valid email`);
    if (sch.format === 'uri') {
      try { new URL(value); } catch { fail(`${path}: "${value}" is not a valid URL`); }
    }
  }

  if (typeof value === 'number') {
    if (sch.minimum !== undefined && value < sch.minimum) fail(`${path}: ${value} < minimum ${sch.minimum}`);
    if (sch.maximum !== undefined && value > sch.maximum) fail(`${path}: ${value} > maximum ${sch.maximum}`);
  }

  if (Array.isArray(value)) {
    if (sch.minItems && value.length < sch.minItems)
      fail(`${path}: ${value.length} item(s), need at least ${sch.minItems}`);
    if (sch.items) value.forEach((v, i) => check(v, sch.items, `${path}[${i}]`));
  }

  if (value && typeof value === 'object' && !Array.isArray(value)) {
    for (const key of sch.required ?? []) {
      if (value[key] === undefined) fail(`${path}: missing required "${key}"`);
    }
    for (const [key, v] of Object.entries(value)) {
      if (sch.properties?.[key]) check(v, sch.properties[key], `${path}.${key}`);
      else if (sch.additionalProperties && typeof sch.additionalProperties === 'object')
        check(v, sch.additionalProperties, `${path}.${key}`);
    }
  }
}

check(data, schema, '$');

/* ------------------------------------------------------------------ *
 * Pass 2 — cross-field rules
 * ------------------------------------------------------------------ */

const niche = data.meta?.niche;
const skinIds = readdirSync(join(ROOT, 'skins')).filter((f) => f.endsWith('.json')).map((f) => f.slice(0, -5));
const layoutFiles = readdirSync(join(ROOT, 'layouts')).filter((f) => f.endsWith('.json'));

/* skin + layout coherence */
if (data.meta?.skin && !skinIds.includes(data.meta.skin)) {
  fail(`meta.skin: "${data.meta.skin}" is not a skin (have: ${skinIds.join(', ')})`);
}

let layout = null;
if (data.meta?.layout) {
  const lf = `${data.meta.layout}.json`;
  if (!layoutFiles.includes(lf)) {
    fail(`meta.layout: "${data.meta.layout}" is not a layout (have: ${layoutFiles.map((f) => f.slice(0, -5)).join(', ')})`);
  } else {
    layout = JSON.parse(readFileSync(join(ROOT, 'layouts', lf), 'utf8'));
    if (data.meta.skin && layout.skin !== data.meta.skin) {
      fail(`meta: layout "${data.meta.layout}" expects skin "${layout.skin}", but skin is "${data.meta.skin}"`);
    }
  }
} else {
  warn('meta.layout not set — the agency picks this at step 3 of the pipeline');
}

/* service slugs become URLs, so they must be unique */
const slugs = (data.services ?? []).map((s) => s.slug);
const dupes = [...new Set(slugs.filter((s, i) => slugs.indexOf(s) !== i))];
if (dupes.length) fail(`services: duplicate slug(s) ${dupes.join(', ')} — these become URLs`);

/* every layout section a client must feed with data */
const sectionsUsed = new Set();
for (const page of Object.values(layout?.pages ?? {})) {
  for (const s of page) sectionsUsed.add(typeof s === 'string' ? s.split(':')[0] : s.component);
}
const needs = (component, field, msg) => {
  if (sectionsUsed.has(component) && !(data[field] ?? []).length) warn(msg);
};
needs('schedule-table', 'schedule', `layout "${data.meta?.layout}" has a schedule section but client.json has no schedule[] — the page will render empty`);
needs('pricing-tiers', 'pricing', `layout "${data.meta?.layout}" has a pricing section but client.json has no pricing[]`);
needs('team-grid', 'team', `layout "${data.meta?.layout}" has a team section but client.json has no team[]`);

/* medical compliance */
if (niche === 'medical') {
  const unconsented = (data.testimonials ?? []).filter((t) => t.consentOnFile !== true);
  if (unconsented.length) {
    fail(`${unconsented.length} testimonial(s) without consentOnFile:true — cannot publish patient testimonials without documented consent`);
  }
  if (!data.compliance?.hipaaIntakeRequired && !data.integrations?.bookingUrl) {
    warn('medical build with neither hipaaIntakeRequired nor a bookingUrl — confirm how patient enquiries are handled before wiring any form');
  }
}

/* combat specifics */
if (niche === 'combat') {
  if (!(data.pricing ?? []).length) {
    warn('no pricing[] — hiding prices loses more gym leads than it protects; push back before accepting this');
  }
  if (!(data.schedule ?? []).length) {
    warn('no schedule[] — the class timetable is one of the most-visited pages on a gym site');
  }
}

/* restoration specifics */
if (niche === 'restoration') {
  if (!data.contact?.emergencyPhone && !/24\s*\/?\s*7/i.test(data.contact?.hours ?? '')) {
    warn('no emergencyPhone and no 24/7 signal in hours — confirm whether they actually take after-hours calls');
  }
  if (!(data.business?.certifications ?? []).length) {
    warn('no certifications listed — IICRC and similar are primary trust signals in this niche');
  }
}

/* service-area pages */
const areas = data.contact?.serviceAreas ?? [];
if (!areas.length) warn('no serviceAreas — you lose the programmatic local landing pages, the cheapest SEO win in the system');
else if (areas.length < 5) warn(`only ${areas.length} serviceArea(s) — 10 to 30 is the useful range`);
else if (areas.length > 40) warn(`${areas.length} serviceAreas × ${slugs.length} services = ${areas.length * slugs.length} generated pages; consider trimming to avoid thin content`);

/* photography */
if (!(data.brand?.photos ?? []).length) {
  warn('no brand.photos — first draft will use stock; collecting real photography is the top priority for the review week');
}

/* brand colour contrast, checked at AA before it reaches the site */
function luminance(hex) {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  let h = m[1];
  if (h.length === 3) h = [...h].map((c) => c + c).join('');
  const [r, g, b] = [0, 2, 4].map((i) => {
    const c = parseInt(h.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
const ratio = (a, b) => {
  const [l1, l2] = [luminance(a), luminance(b)];
  if (l1 === null || l2 === null) return null;
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
};

for (const [key, hex] of Object.entries(data.brand?.colors ?? {})) {
  if (luminance(hex) === null) {
    fail(`brand.colors.${key}: "${hex}" is not a valid hex colour`);
    continue;
  }
  // Accent colours carry white button text; 4.5:1 is the AA floor for that.
  const onWhite = ratio(hex, '#ffffff');
  const onBlack = ratio(hex, '#000000');
  if (onWhite < 4.5 && onBlack < 4.5) {
    fail(`brand.colors.${key} (${hex}): ${onWhite.toFixed(2)}:1 on white, ${onBlack.toFixed(2)}:1 on black — fails AA against both, cannot be used for text or buttons as-is`);
  } else if (onWhite < 4.5) {
    warn(`brand.colors.${key} (${hex}): only ${onWhite.toFixed(2)}:1 on white — usable on dark surfaces only, or needs darkening for buttons`);
  }
}

/* the field the copy depends on most */
const diff = data.business?.differentiator ?? '';
if (diff && diff.trim().split(/\s+/).length < 8) {
  warn(`business.differentiator is only ${diff.trim().split(/\s+/).length} words — this drives most of the generated copy; get a real answer on the phone before building`);
}

/* ------------------------------------------------------------------ */

console.log(`${file}\n`);
for (const w of warnings) console.log(`  warn  ${w}`);
for (const e of errors) console.log(`  FAIL  ${e}`);

if (errors.length) {
  console.log(`\n${errors.length} error(s), ${warnings.length} warning(s). DO NOT PROVISION.`);
  process.exit(1);
}
console.log(
  warnings.length
    ? `\nValid. ${warnings.length} warning(s) — safe to build, address during the review week.`
    : '\nValid. Ready to provision.'
);
