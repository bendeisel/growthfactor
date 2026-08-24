# Supabase deployment

Optional. The local SQLite path does everything except run on a schedule. Set this
up when you want nightly pulls without your laptop being open.

Cost: a Supabase free tier project is enough to start.

## 1. Create the project and apply the schema

```bash
# Get the URL and the service role key from Project Settings, API
export SUPABASE_URL="https://<project-ref>.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="<service role key>"
```

Apply `supabase/migrations/0001_init.sql` through the SQL editor or the CLI. It
creates the tables, the `stacked_leads` view, the approval gate trigger, and two
functions that keep merge behaviour identical to the local store:

- `upsert_property(p jsonb, keys text[])` merges with `coalesce` so a sparse source
  never erases richer data, and resolves a property by any of its known identifiers.
- `record_distress_event(pid uuid, e jsonb)` bumps an open event of the same type
  and inserts a new one otherwise, so history is append only.

Row level security is enabled on every table with no anon policy. Nothing connects
client side. Edge functions use the service role key, which bypasses RLS.

## 2. Point the CLI at it

```bash
npm run gf -- status --store supabase
npm run gf -- pull hud-reo --store supabase
```

Same commands, same behaviour, remote storage. Useful for a first load before
scheduling anything.

## 3. Upload your source configs

A deployed function has no `config/` directory, so source configs live in the
`ingest_targets` table.

```bash
npm run gf -- targets:push
```

Re-run it whenever you change a source config.

## 4. Deploy the ingest function

```bash
node scripts/build-edge.mjs
supabase functions deploy ingest
supabase secrets set SUPABASE_URL="$SUPABASE_URL"
supabase secrets set SUPABASE_SERVICE_ROLE_KEY="$SUPABASE_SERVICE_ROLE_KEY"
```

`build-edge.mjs` copies `src/` into `supabase/functions/_shared` so the function
imports the same core the CLI uses. It excludes the CLI and the SQLite store, which
are Node only. No core module imports a Node builtin, which is what makes this work
on Deno unchanged.

Test it before scheduling:

```bash
curl -X POST "$SUPABASE_URL/functions/v1/ingest" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"source":"hud-reo","limit":25,"dryRun":true}'
```

A dry run reads and reports without writing. The response includes the record
counts, the api call count, the estimated cost, and any important fields the mapper
could not resolve.

The function refuses any request that does not present the service role key, so a
stray public call cannot start a county pull.

## 5. Schedule it

Store the key as a database setting rather than inlining it in every cron body:

```sql
alter database postgres set app.service_role_key = '<service role key>';
alter database postgres set app.functions_url = 'https://<project-ref>.supabase.co/functions/v1';
```

Reconnect, then run `supabase/schedule.sql`. It defines a `trigger_ingest(target)`
helper and schedules the sources a few minutes apart, with the large parcel pull
weekly rather than nightly.

```sql
select * from cron.job;
select * from ingest_runs order by started_at desc limit 20;
```

## 6. Query it conversationally

With the Supabase MCP connected, `stacked_leads` is the view to ask about. It
carries the property, the derived signals, the aggregated distress types, both
scores, the strategy and the pipeline stage in one row.

Per the spec, start here rather than building a custom MCP server. Shaped tools are
worth building only once you know which questions you actually ask every day.

## Cost control

Every run writes an `ingest_runs` row with the record count, the api call count and
an estimated cost in cents. Free sources report zero, honestly, rather than being
omitted.

```sql
select job_name, sum(estimated_cost_cents)/100.0 as dollars, sum(records_pulled)
from ingest_runs
where started_at > now() - interval '30 days'
group by job_name order by dollars desc;
```

If that query ever returns a number above zero, a paid connector is enabled. On the
free sources it stays at zero forever.
