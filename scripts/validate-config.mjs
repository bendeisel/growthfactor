#!/usr/bin/env node
/**
 * Validates the library's own consistency. Run before any build, and in CI.
 *
 * Catches the failure modes that quietly destroy this kind of system:
 *   - a layout referencing a component or variant that doesn't exist in the core
 *     (this is how "one engine, ten layouts" degrades into ten codebases)
 *   - a spec hard-coding a colour instead of referencing a token
 *     (this is how "make it less blue" stops being one edit)
 *   - a skin overriding a token that isn't there, so the override silently no-ops
 *
 *   node scripts/validate-config.mjs
 */

import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const errors = [];
const warnings = [];
const fail = (m) => errors.push(m);
const warn = (m) => warnings.push(m);

function readJson(path) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch (err) {
    fail(`${path}: invalid JSON — ${err.message}`);
    return null;
  }
}

/* ---------- tokens ---------- */

function loadTokens() {
  const tokens = readJson(join(ROOT, 'design-system/tokens.json'));
  if (!tokens) return { groups: {}, flat: new Set() };

  for (const group of ['color', 'type', 'space', 'radius', 'shadow', 'motion', 'depth']) {
    if (!tokens[group]) fail(`tokens.json: missing required group "${group}"`);
  }

  // Flat names are how specs reference tokens: --gf-<group>-<key> / "<group>-<key>"
  const flat = new Set();
  for (const [group, values] of Object.entries(tokens)) {
    if (group.startsWith('$') || typeof values !== 'object') continue;
    for (const key of Object.keys(values)) {
      if (!key.startsWith('$')) flat.add(`${group}-${key}`);
    }
  }
  return { groups: tokens, flat };
}

/* ---------- component specs (source of truth) ---------- */

const HEX = /#[0-9a-fA-F]{3,8}\b/;
// Neutral scrims over client-supplied media are intentionally not tokenised —
// they exist to guarantee contrast regardless of skin.
const ALLOWED_LITERAL = /^rgb\(0 0 0 \/ [\d.]+\)$/;

function loadComponents(tokens) {
  const dir = join(ROOT, 'design-system/components');
  const components = new Map();

  for (const file of readdirSync(dir).filter((f) => f.endsWith('.json'))) {
    const spec = readJson(join(dir, file));
    if (!spec) continue;

    for (const [name, def] of Object.entries(spec)) {
      if (name.startsWith('$')) continue;
      const where = `components/${file} → ${name}`;

      if (components.has(name)) fail(`${where}: duplicate component "${name}"`);
      if (!def.description) fail(`${where}: missing description`);
      if (!def.root) fail(`${where}: missing root element`);
      if (!def.variants || !Object.keys(def.variants).length) fail(`${where}: no variants defined`);

      for (const [vName, v] of Object.entries(def.variants ?? {})) {
        if (!v.description) fail(`${where}.${vName}: missing description`);
        if (!v.structure?.length) fail(`${where}.${vName}: missing structure tree`);
      }

      for (const [sName, s] of Object.entries(def.slots ?? {})) {
        const valid = ['intake', 'generated', 'asset', 'static'];
        if (!s.source) fail(`${where}: slot "${sName}" has no source`);
        else if (!valid.includes(s.source))
          fail(`${where}: slot "${sName}" source "${s.source}" not one of ${valid.join('/')}`);
      }

      // Declared token list must resolve.
      for (const t of def.tokens ?? []) {
        if (!tokens.flat.has(t)) fail(`${where}: declares unknown token "${t}"`);
      }

      // Walk the whole spec for var(--gf-…) references and raw colour literals.
      walk(def, where, tokens);

      components.set(name, new Set(Object.keys(def.variants ?? {})));
    }
  }
  return components;
}

function walk(node, where, tokens) {
  if (typeof node === 'string') {
    for (const [, ref] of node.matchAll(/var\(--gf-([a-z0-9-]+)\)/g)) {
      if (!tokens.flat.has(ref)) fail(`${where}: references unknown token --gf-${ref}`);
    }
    if (HEX.test(node) && !ALLOWED_LITERAL.test(node)) {
      fail(`${where}: hard-coded colour in "${node.slice(0, 70)}" — use a token`);
    }
    return;
  }
  if (Array.isArray(node)) return node.forEach((n) => walk(n, where, tokens));
  if (node && typeof node === 'object') {
    for (const [k, v] of Object.entries(node)) {
      if (k === 'notes' || k === 'description' || k === '$comment') continue; // prose
      walk(v, where, tokens);
    }
  }
}

/* ---------- skins ---------- */

function loadSkins(tokens) {
  const skins = new Map();

  for (const file of readdirSync(join(ROOT, 'skins')).filter((f) => f.endsWith('.json'))) {
    const skin = readJson(join(ROOT, 'skins', file));
    if (!skin) continue;

    const id = basename(file, '.json');
    if (skin.id !== id) fail(`skins/${file}: id "${skin.id}" does not match filename`);

    // An override targeting a nonexistent token silently does nothing — the worst
    // kind of bug, because the skin looks correct and isn't.
    for (const [group, values] of Object.entries(skin.overrides ?? {})) {
      if (!tokens.groups?.[group]) {
        fail(`skins/${file}: overrides unknown token group "${group}"`);
        continue;
      }
      for (const key of Object.keys(values)) {
        if (!(key in tokens.groups[group])) fail(`skins/${file}: overrides unknown token "${group}.${key}"`);
      }
    }

    if (!skin.conversionRules?.primaryCta) warn(`skins/${file}: no primaryCta defined`);
    skins.set(id, skin);
  }
  return skins;
}

/* ---------- skin default variants must exist ---------- */

function checkSkinDefaults(skins, components) {
  for (const [id, skin] of skins) {
    for (const [component, variant] of Object.entries(skin.defaults ?? {})) {
      if (!components.has(component)) {
        fail(`skins/${id}.json: defaults reference unknown component "${component}"`);
      } else if (!components.get(component).has(variant)) {
        fail(`skins/${id}.json: defaults set "${component}" to unknown variant "${variant}"`);
      }
    }
  }
}

/* ---------- layouts ---------- */

function checkLayouts(components, skins) {
  const files = readdirSync(join(ROOT, 'layouts')).filter((f) => f.endsWith('.json'));

  for (const file of files) {
    const layout = readJson(join(ROOT, 'layouts', file));
    if (!layout) continue;

    const id = basename(file, '.json');
    if (layout.id !== id) fail(`layouts/${file}: id "${layout.id}" does not match filename`);
    if (!skins.has(layout.skin)) fail(`layouts/${file}: unknown skin "${layout.skin}"`);
    if (!layout.pages?.home) fail(`layouts/${file}: no home page defined`);

    for (const [pageName, sections] of Object.entries(layout.pages ?? {})) {
      sections.forEach((section, i) => {
        // Sections are either objects or "component:variant" shorthand strings.
        const name = typeof section === 'string' ? section.split(':')[0] : section.component;
        const variant = typeof section === 'string' ? section.split(':')[1] : section.variant;
        const where = `layouts/${file} → ${pageName}[${i}]`;

        if (!components.has(name)) {
          fail(`${where}: unknown component "${name}" — add it to design-system/components/ first`);
          return;
        }
        if (variant && !components.get(name).has(variant)) {
          fail(`${where}: component "${name}" has no variant "${variant}"`);
        }
        if (typeof section === 'object' && section.depth !== undefined) {
          if (!Number.isInteger(section.depth) || section.depth < 0 || section.depth > 3) {
            fail(`${where}: depth must be an integer 0-3, got ${section.depth}`);
          }
          // The rules the conversion model and the CWV budget rest on.
          if (name === 'contact-block' && section.depth > 0) {
            fail(`${where}: contact-block must stay at depth 0 — the conversion surface stays fast`);
          }
          if (name === 'before-after' && section.depth > 0) {
            fail(`${where}: before-after must stay at depth 0 — the photographs are the effect`);
          }
        }
      });
    }
  }
  return files.length;
}

/* ---------- run ---------- */

const tokens = loadTokens();
const components = loadComponents(tokens);
const skins = loadSkins(tokens);
checkSkinDefaults(skins, components);
const layoutCount = checkLayouts(components, skins);

const variantCount = [...components.values()].reduce((n, s) => n + s.size, 0);
console.log(
  `Parsed ${tokens.flat.size} tokens, ${components.size} components ` +
    `(${variantCount} variants), ${skins.size} skins, ${layoutCount} layouts.\n`
);

for (const w of warnings) console.log(`  warn  ${w}`);
for (const e of errors) console.log(`  FAIL  ${e}`);

if (errors.length) {
  console.log(`\n${errors.length} error(s).`);
  process.exit(1);
}
console.log(warnings.length ? `\nOK with ${warnings.length} warning(s).` : '\nAll checks passed.');
