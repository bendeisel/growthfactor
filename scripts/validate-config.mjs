#!/usr/bin/env node
/**
 * Validates the library's own consistency. Run before any build, and in CI.
 *
 * Catches the failure mode that quietly destroys this kind of system: a layout
 * drifting to reference a component or variant that doesn't exist in the core,
 * which is how "one engine, ten layouts" degrades into ten codebases.
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

/* ---------- parse the component inventory out of components.md ---------- */

function parseComponents() {
  const md = readFileSync(join(ROOT, 'design-system/components.md'), 'utf8');
  const components = new Map();

  for (const line of md.split('\n')) {
    // | `name` | `variant-a`, `variant-b` | slots |
    const m = line.match(/^\|\s*`([a-z0-9-]+)`\s*\|([^|]*)\|/);
    if (!m) continue;
    const variants = [...m[2].matchAll(/`([a-z0-9-]+)`/g)].map((v) => v[1]);
    components.set(m[1], new Set(variants));
  }
  return components;
}

/* ---------- tokens ---------- */

function validateTokens() {
  const tokens = readJson(join(ROOT, 'design-system/tokens.json'));
  if (!tokens) return null;

  for (const group of ['color', 'type', 'space', 'radius', 'shadow', 'motion', 'depth']) {
    if (!tokens[group]) fail(`tokens.json: missing required group "${group}"`);
  }
  return tokens;
}

/* ---------- skins ---------- */

function validateSkins(tokens) {
  const skins = new Map();

  for (const file of readdirSync(join(ROOT, 'skins')).filter((f) => f.endsWith('.json'))) {
    const path = join(ROOT, 'skins', file);
    const skin = readJson(path);
    if (!skin) continue;

    const id = basename(file, '.json');
    if (skin.id !== id) fail(`skins/${file}: id "${skin.id}" does not match filename`);

    // Overrides must target token keys that actually exist, or they silently do nothing.
    for (const [group, values] of Object.entries(skin.overrides ?? {})) {
      if (!tokens?.[group]) {
        fail(`skins/${file}: overrides unknown token group "${group}"`);
        continue;
      }
      for (const key of Object.keys(values)) {
        if (!(key in tokens[group])) {
          fail(`skins/${file}: overrides unknown token "${group}.${key}"`);
        }
      }
    }

    if (!skin.conversionRules?.primaryCta) {
      warn(`skins/${file}: no primaryCta defined`);
    }
    skins.set(id, skin);
  }
  return skins;
}

/* ---------- layouts ---------- */

function validateLayouts(components, skins) {
  const files = readdirSync(join(ROOT, 'layouts')).filter((f) => f.endsWith('.json'));

  for (const file of files) {
    const layout = readJson(join(ROOT, 'layouts', file));
    if (!layout) continue;

    const id = basename(file, '.json');
    if (layout.id !== id) fail(`layouts/${file}: id "${layout.id}" does not match filename`);
    if (!skins.has(layout.skin)) fail(`layouts/${file}: unknown skin "${layout.skin}"`);

    for (const [pageName, sections] of Object.entries(layout.pages ?? {})) {
      sections.forEach((section, i) => {
        // Sections are either objects or "component:variant" shorthand strings.
        const name = typeof section === 'string' ? section.split(':')[0] : section.component;
        const variant = typeof section === 'string' ? section.split(':')[1] : section.variant;
        const where = `layouts/${file} → ${pageName}[${i}]`;

        if (!components.has(name)) {
          fail(`${where}: unknown component "${name}" — add it to design-system/components.md first`);
          return;
        }
        if (variant && !components.get(name).has(variant)) {
          fail(`${where}: component "${name}" has no variant "${variant}"`);
        }
        if (typeof section === 'object' && section.depth !== undefined) {
          if (!Number.isInteger(section.depth) || section.depth < 0 || section.depth > 3) {
            fail(`${where}: depth must be an integer 0-3, got ${section.depth}`);
          }
          // The one rule the whole conversion model rests on.
          if (name === 'contact-block' && section.depth > 0) {
            fail(`${where}: contact-block must stay at depth 0 — the conversion surface stays fast`);
          }
        }
      });
    }

    if (!layout.pages?.home) fail(`layouts/${file}: no home page defined`);
  }

  return files.length;
}

/* ---------- run ---------- */

const components = parseComponents();
const tokens = validateTokens();
const skins = validateSkins(tokens);
const layoutCount = validateLayouts(components, skins);

console.log(
  `Parsed ${components.size} components, ${skins.size} skins, ${layoutCount} layouts.\n`
);

for (const w of warnings) console.log(`  warn  ${w}`);
for (const e of errors) console.log(`  FAIL  ${e}`);

if (errors.length) {
  console.log(`\n${errors.length} error(s).`);
  process.exit(1);
}
console.log(warnings.length ? `\nOK with ${warnings.length} warning(s).` : '\nAll checks passed.');
