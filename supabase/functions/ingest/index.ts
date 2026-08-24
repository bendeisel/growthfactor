// Scheduled ingest, running on Supabase Edge Functions.
//
// One source per invocation, exactly as the build spec calls for. The source
// config comes from the ingest_targets table, or from the request body for a
// one off run. Nothing here spends money per record: skip trace is not reachable
// from this function.
//
// Deploy:
//   node scripts/build-edge.mjs
//   supabase functions deploy ingest
//
// Requires the SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY secrets.

import { runIngest } from '../_shared/core/ingest.ts';
import { SupabaseStore } from '../_shared/store/supabase.ts';
import { getEnv } from '../_shared/core/env.ts';
import type { SourceConfig } from '../_shared/core/types.ts';

interface Payload {
  /** Name of a row in ingest_targets. */
  source?: string;
  /** A full source config, for a one off run that is not stored as a target. */
  config?: SourceConfig;
  limit?: number;
  dryRun?: boolean;
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

async function loadTarget(name: string): Promise<SourceConfig> {
  const url = getEnv('SUPABASE_URL');
  const key = getEnv('SUPABASE_SERVICE_ROLE_KEY');
  const res = await fetch(
    `${url}/rest/v1/ingest_targets?select=config,enabled&name=eq.${encodeURIComponent(name)}&limit=1`,
    { headers: { apikey: key!, authorization: `Bearer ${key}` } },
  );
  if (!res.ok) throw new Error(`could not read ingest_targets: ${res.status} ${await res.text()}`);
  const rows = (await res.json()) as Array<{ config: SourceConfig; enabled: boolean }>;
  const row = rows[0];
  if (!row) throw new Error(`no ingest_targets row named "${name}"`);
  if (!row.enabled) throw new Error(`target "${name}" is disabled`);
  return row.config;
}

Deno.serve(async (req: Request): Promise<Response> => {
  // The function is invoked by pg_cron with the service role key. Reject anything
  // that does not present it, so a stray public call cannot start a county pull.
  const auth = req.headers.get('authorization') ?? '';
  const expected = getEnv('SUPABASE_SERVICE_ROLE_KEY');
  if (!expected || auth !== `Bearer ${expected}`) {
    return json({ error: 'unauthorized' }, 401);
  }

  let payload: Payload = {};
  try {
    payload = (await req.json()) as Payload;
  } catch {
    // An empty body is fine when the source is given in the query string.
  }
  const name = payload.source ?? new URL(req.url).searchParams.get('source') ?? undefined;

  try {
    const cfg = payload.config ?? (name ? await loadTarget(name) : undefined);
    if (!cfg) return json({ error: 'provide a "source" name or an inline "config"' }, 400);

    const store = new SupabaseStore();
    await store.init();
    const logs: string[] = [];
    const res = await runIngest(cfg, store, {
      limit: payload.limit,
      dryRun: payload.dryRun,
      onProgress: (m) => logs.push(m),
    });

    return json({
      source: cfg.name,
      status: res.status,
      recordsPulled: res.recordsPulled,
      recordsNew: res.recordsNew,
      recordsUpdated: res.recordsUpdated,
      eventsCreated: res.eventsCreated,
      recordsSkipped: res.recordsSkipped,
      apiCalls: res.apiCalls,
      estimatedCostCents: res.estimatedCostCents,
      unmappedImportantFields: res.mapping.missingImportant,
      error: res.error,
      logs,
    }, res.status === 'error' ? 500 : 200);
  } catch (err) {
    return json({ error: (err as Error).message }, 500);
  }
});
