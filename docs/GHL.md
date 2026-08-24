# GHL setup

Two ways in. Start with the CSV, because it needs no configuration at all.

## Option A: CSV import, no setup

```bash
npm run gf -- export --min-score 50
```

Writes `out/ghl-leads-<date>.csv`. In GHL: Contacts, Import, upload, map the columns.

What to know when mapping:

- `address1`, `city`, `state`, `postal_code` are the **owner mailing address**. Map
  these to the contact address. This is where mail has to go.
- `property_address` and friends are the subject property. Map them to custom fields
  if you want them, or ignore them.
- `tags` is comma separated and GHL will create the tags on import.
- `phone` and `email` are intentionally empty. Public records do not include them
  and nothing here invents them. GHL will still import contacts without them, but
  its duplicate detection relies on them, so re-importing the same list can create
  duplicates. Prefer filtering to new leads on each export.

Useful columns for a mail merge: `first_name`, `property_address`, `equity_percent`,
`years_owned`, `distress_types`, `sf_price`, `sf_monthly_payment`, `lead_reasons`.

## Option B: API push, one lead at a time

Needs a Private Integration token. In GHL: Settings, Private Integrations, create
one with the contacts and opportunities scopes.

```bash
# .env
GHL_API_KEY=<private integration token>
GHL_LOCATION_ID=<sub-account id>
GHL_PIPELINE_ID=<pipeline id>
GHL_PIPELINE_STAGE_ID=<stage id>
```

Create the custom fields you want populated in GHL first, then list their ids:

```bash
npm run gf -- ghl:fields
```

Put the ids into `config/ghl-fields.json`:

```json
{
  "property_address": "abc123",
  "equity_percent": "def456",
  "distress_types": "ghi789",
  "strategy": "jkl012",
  "overall_score": "mno345"
}
```

Ids are never guessed. An unmapped field is skipped and reported as a warning rather
than sent to the wrong place.

Then stage and push:

```bash
npm run gf -- stage <lead-id>
npm run gf -- push <lead-id> --confirm
```

`--confirm` is mandatory. Without it the push refuses and nothing is sent.

## What the push will not do

- It creates a contact and an opportunity. It never calls a workflow, conversation
  or messaging endpoint, so a pushed lead cannot trigger an SMS or an email. There
  is a test that asserts no messaging endpoint is touched.
- It refuses to touch a lead already at `offer_sent`.
- `gf stage` stops at `awaiting_approval`. The store throws if anything tries to
  write `offer_sent`, and the Postgres schema has a trigger that rejects it without
  an approval timestamp.

If you want automation after the contact lands, build it in GHL against the tags.
That keeps the decision to contact somebody inside the tool where you can see it,
rather than buried in a nightly cron job.

## Suggested pipeline

The scoring already sorts leads by strategy, so mirroring that in GHL keeps things
simple:

- Stage 1 New, everything lands here
- Stage 2 Researching, comps pulled
- Stage 3 Offer drafted
- Stage 4 Awaiting approval, which is where this pipeline stops
- Stage 5 Offer sent, which only you set
- Stage 6 Negotiating
- Stage 7 Under contract

Point `GHL_PIPELINE_STAGE_ID` at stage 1 or 4 depending on whether you want to
review before it appears in the working pipeline.
