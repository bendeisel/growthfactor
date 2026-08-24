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
cpSync('src', target, {
  recursive: true,
  filter: (src) => !src.endsWith('cli.ts') && !src.includes('store/sqlite.ts'),
});
console.log(`copied src to ${target}, excluding the CLI and the SQLite store`);
console.log('the SQLite store is Node only, the edge function uses the Supabase store');
