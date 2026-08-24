-- Nightly scheduling with pg_cron.
--
-- Run this after applying 0001_init.sql and after pushing your source configs
-- with "gf targets:push".
--
-- Store the service role key in a database setting rather than inlining it in
-- every cron body:
--
--   alter database postgres set app.service_role_key = '<service role key>';
--   alter database postgres set app.functions_url = 'https://<project-ref>.supabase.co/functions/v1';
--
-- Then reconnect so the settings take effect.

-- Helper so each schedule stays a one liner and the key is never duplicated.
create or replace function trigger_ingest(target text)
returns bigint
language plpgsql
as $$
declare
  request_id bigint;
begin
  select net.http_post(
    url := current_setting('app.functions_url') || '/ingest',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.service_role_key')
    ),
    body := jsonb_build_object('source', target)
  ) into request_id;
  return request_id;
end;
$$;

-- Stagger the sources by a few minutes each. County servers are not load
-- balanced and a polite crawler keeps working.
select cron.schedule('ingest-hud-reo',      '0 7 * * *',  $$ select trigger_ingest('hud-reo'); $$);
select cron.schedule('ingest-codes',        '5 7 * * *',  $$ select trigger_ingest('davidson-codes-violations'); $$);

-- The full parcel layer changes slowly and is the largest pull, so it runs
-- weekly rather than nightly. Sunday at 2am Central.
select cron.schedule('ingest-parcels-weekly', '0 7 * * 0', $$ select trigger_ingest('davidson-parcels'); $$);

-- Useful checks:
--   select * from cron.job;
--   select * from cron.job_run_details order by start_time desc limit 20;
--   select * from ingest_runs order by started_at desc limit 20;
--
-- To remove one:
--   select cron.unschedule('ingest-hud-reo');
