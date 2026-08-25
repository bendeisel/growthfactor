// Copy src/ into supabase/functions/_shared so the edge function can import the
// same core the CLI uses. The Supabase CLI bundles only what lives under the
// functions directory, and there is no compile step to hook into, so a copy is
// the whole build.
//
// Run this before "supabase functions deploy ingest".

import { cpSync, rmSync, mkdirSync } from 'node:fs';

const target = 'supabase/functions/_shared';
rmSync(target, { recursive: true, force: true });
mkdirSync(target, { recursive: true });
// Node only modules are excluded. A headless browser cannot run inside an edge
// function anyway, so browser sourced portals stay on the local or cron path.
const NODE_ONLY = ['cli.ts', 'store/sqlite.ts', 'core/browser.ts', 'connectors/browser.ts'];
cpSync('src', target, {
  recursive: true,
  filter: (src) => !NODE_ONLY.some((n) => src.endsWith(n)),
});
console.log(`copied src to ${target}, excluding: ${NODE_ONLY.join(', ')}`);
console.log('those need Node builtins or a local browser, which an edge function has neither of');
