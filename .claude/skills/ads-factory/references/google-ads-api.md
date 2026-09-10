# Google Ads API, verified recipes

Everything here was read out of the v25 discovery document
(`https://googleads.googleapis.com/$discovery/rest?version=v25`, revision
20260831, 174 methods), not from memory. When something behaves oddly,
re-pull that document and diff it before assuming the API changed:

```bash
curl -s 'https://googleads.googleapis.com/$discovery/rest?version=v25' > v25.json
```

- **Base:** `https://googleads.googleapis.com/v25`
- **Version is pinned** in `config.env` as `GOOGLE_ADS_API_VERSION`.

## Google Ads is not Google Ad Manager

Two different products with similar names. This wraps **Google Ads**, the
advertiser side: search, Performance Max, display, shopping. Google Ad
Manager is the publisher side, for sites that sell their own ad inventory,
and it has a completely separate SOAP API. If a client ever needs GAM, it is
a new wrapper, not a flag on this one.

## Versioning is aggressive, and each version is its own endpoint

v25 released 2026-07-22 and sunsets around August 2027. Google ships roughly
three versions a year and sunsets each about a year after release, with at
least 20 weeks of overlap. v20 died 2026-06-10, v21 on 2026-08-05.

A sunset version does not degrade, it stops. Bumping means changing one line
in `config.env` and re-running a report to see whether any field moved.

## The three headers

```
Authorization: Bearer <access token>
developer-token: <from the MCC API Center>
login-customer-id: <the MCC, digits only>
```

`login-customer-id` is required whenever the account is reached through a
manager account, which for Growth Factor is always. Omitting it fails with
`AuthorizationError.USER_PERMISSION_DENIED`, which reads like the client
revoked access when in fact the header is just missing.

Customer IDs are 10 digits with no dashes. The UI shows them as
`123-456-7890`. `accounts.py` strips the dashes on the way into the registry
so this can never be the bug.

## The two endpoints that matter

### Account discovery

```
GET /v25/customers:listAccessibleCustomers
```

Returns bare resource names and nothing else, so each one needs a follow-up
query for its descriptive name. `googleads.py accounts` does both.

For the manager hierarchy, query `customer_client` from the MCC instead. It
returns the whole tree in one call, which is what `googleads.py tree` uses.

### Everything else: GAQL

```
POST /v25/customers/{customerId}/googleAds:searchStream
{"query": "SELECT ... FROM ... WHERE ..."}
```

Two shapes exist. `:search` pages with a token. `:searchStream` returns
everything in one response and is what the reports here use.

**The response is a JSON array of chunks**, each with its own `results`
list, not a single object:

```json
[{"results": [...], "fieldMask": "...", "requestId": "..."}]
```

Assuming one object silently reads only the first chunk, which on a large
account means a report that quietly drops most of its rows.

## The snake_case / camelCase trap

GAQL is written in snake_case. The REST response comes back in camelCase.

```
query:     SELECT metrics.cost_micros FROM campaign
response:  {"metrics": {"costMicros": "4530000"}}
```

So the field you asked for is not the key you get. Reading
`row["metrics"]["cost_micros"]` returns nothing, and nothing formats as zero,
so half a report reads as no spend with no error anywhere. Every lookup in
these scripts goes through `gfads.dig(row, "metrics.cost_micros")`, which
tries the snake form then the camel form. Do not hand-write camelCase paths.

## Money is in micros

`cost_micros: "4530000"` is 4.53 in the account's currency. Divide by
1,000,000. `gfads.money()` is the only place this conversion happens.
Reporting micros raw is a six-orders-of-magnitude error that looks
plausible enough on a dashboard to survive review.

## Dates

`segments.date BETWEEN '2026-08-11' AND '2026-09-09'`, and the report is
segmented by whatever you select. Windows here end **yesterday**, never
today, because today is still being counted and including it makes every
report look like a decline.

## Useful resources

| Resource | Answers |
| --- | --- |
| `campaign` | spend, conversions, ROAS per campaign |
| `search_term_view` | the actual queries that spent money |
| `keyword_view` | keyword performance and match type |
| `campaign_budget` | current daily budgets, and whether shared |
| `customer_client` | the manager hierarchy |
| `ad_group_ad` | ad-level performance and approval status |
| `landing_page_view` | which landing pages the spend hit |

`googleads.py gaql <client> --query "..."` runs anything, which matters
because the API has far more resources than are worth wrapping by hand.

## Writes

Mutates are `POST /v25/customers/{cid}/{resource}:mutate` with an
`operations` array. An update needs an `updateMask` naming the fields it
touches, or the API rejects it.

```json
{"operations": [{"updateMask": "status",
                 "update": {"resourceName": "customers/123/campaigns/456",
                            "status": "PAUSED"}}]}
```

Both write commands here read the current state first, so the refusal
message can say what the value is now and what it would become. See
`write-safety.md`.

## Shared budgets

`campaign_budget.explicitly_shared` being true means the budget is attached
to more than one campaign, so changing it changes all of them. `set-budget`
says so in the refusal text rather than discovering it afterwards.

## Note on developer tokens

Google has been rolling out Cloud-managed access levels, a path that skips
the developer token for some projects. This wrapper uses the developer token
because that is the path the MCC API Center actually offers today. If a
project gets moved to Cloud-managed access, `GOOGLE_ADS_DEVELOPER_TOKEN`
becomes unnecessary rather than wrong.
