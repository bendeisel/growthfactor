---
name: ads-factory
description: The shared spine behind Growth Factor's paid media and measurement work: the client account registry, the agency-owned credential model, the write gate, and the verified API recipes for Google Ads, Meta, Tag Manager, Search Console and GA4. Read this whenever the work touches a client's ad accounts or their measurement setup: pulling performance, auditing tags, checking whether conversions are tracked, connecting a new client's accounts, or changing a budget. Also the reference for which of ads-onboard or ads-report a job is, and for why every write refuses without --confirm.
---

# Ads factory: the spine under the ad and measurement routines

Five platforms, one credential per vendor, one registry, one CLI. Direct
API calls over HTTPS from scripts in this skill. No MCP server, no
third-party connector, no data middleman between Growth Factor and the
client's account.

## Why direct rather than a connector

Windsor.ai, AdKit and similar tools wrap these same APIs and are quicker to
start with. They also mean client ad data flows through somebody else's
infrastructure, the available fields are whatever that vendor exposed, and a
pricing change is a business problem. These are the client's numbers and
Growth Factor's client relationships, so the integration is ours.

The cost is the one-time setup in `references/auth-setup.md`. After that a
new client is a registry row.

## Which routine

| The job | Routine |
| --- | --- |
| A new client, none of their accounts connected yet | `ads-onboard` |
| A client whose numbers someone wants to see | `ads-report` |
| A one-off question about one platform | the CLI directly, no routine |

If both look plausible, the tiebreaker is **whether the accounts are
connected**. Onboarding ends with five verified connections and a registry
row. Reporting assumes that row already exists.

## The five surfaces

| Platform | What it answers | CLI |
| --- | --- | --- |
| Google Ads (v25) | search and PMax spend, search terms, keywords, budgets | `googleads.py` |
| Meta Marketing | Facebook and Instagram spend, breakdowns by placement | `meta.py` |
| Tag Manager (v2) | which tags exist, which are published, what is missing | `gtm.py` |
| Search Console | organic clicks, impressions, position, index status | `gsc.py` |
| GA4 | sessions by channel, key events, landing pages | `ga4.py` |

`ads.py` is the front door over all of them. `ads.py google report acme` and
`googleads.py report acme` are the same command.

Google Ads is the **advertiser** product. Google Ad Manager is the publisher
ad-serving product with a separate SOAP API, and is not wrapped here. See
`references/google-ads-api.md`.

## The credential model

Two credentials total:

- **One Google refresh token** on ben@growth-factor.ai, carrying all eight
  scopes: Ads, Tag Manager, Search Console and Analytics.
- **One Meta system user token** from Growth Factor's Business Manager.

Clients grant access the normal way in each platform: the MCC link request
in Google Ads, a GTM user with Publish, a Search Console Full user, a GA4
Editor, and the ad account shared to the Business Manager with the system
user assigned to it.

Nothing about the credentials changes when a client is added. Setup is once,
in `references/auth-setup.md`.

## Non-negotiables

These are the four things that cost real money or real trust when they go
wrong.

1. **Every write refuses without `--confirm` on that command line.** Not an
   environment variable, because an agent can set an environment variable.
   `references/write-safety.md`.
2. **The version is pinned, never inferred.** Google Ads sunsets a version
   about a year after release and each version is a separate endpoint;
   Meta's is pinned for the same reason. Bumping is a deliberate one-line
   change plus a report re-run, never a silent default.
3. **Every report window ends yesterday, never today.** All five platforms
   are still counting today, so including it makes every report look like a
   decline and makes Growth Factor look like the cause.
4. **`gtm.py publish` changes the client's live website**, not their
   advertising. It is the slowest command here for a reason.

## The gotchas that silently produce wrong numbers

Worth knowing before reading any report out loud to a client. Each one is
handled in code; each one is also the kind of thing that survives review
because the output looks plausible.

- **Google Ads returns camelCase for the snake_case you asked for.**
  `metrics.cost_micros` comes back as `metrics.costMicros`, so a
  hand-written lookup reads nothing and nothing formats as zero. Use
  `gfads.dig()`.
- **Money is in micros on Google, minor units on Meta.** Six zeros and two
  zeros. Converted in exactly one place per platform.
- **Meta has no conversions field.** `actions` is an array, so
  "conversions" depends entirely on which action type you mean. The reports
  print which one they used.
- **Meta's 7-day-view and 28-day-view attribution windows were removed in
  January 2026 and now return empty rather than an error.** Anything still
  asking for them reports zeros with no warning.
- **A GTM tag in a workspace is a draft and measures nothing.** Publishing
  is a separate step, and unpublished tags are the most common tagging
  failure there is.
- **Search Console data lags two to three days**, so a recent window has a
  soft tail that is not a traffic drop.
- **GA4 rates are fractions**, and its property ID is not the `G-`
  measurement ID.

## Setup

```bash
cp config.example.env config.env      # git-ignored: these can spend money
python3 scripts/google_oauth_setup.py # once, prints the three Google lines
python3 scripts/ads.py doctor         # seven surfaces, named remedy per failure
```

`doctor` is reads only and is the right first move whenever something stops
working. It checks each surface separately, so it names the broken
credential instead of leaving eleven config values to guess between.

## Files

- `references/auth-setup.md`: the one-time setup, both vendors, Windows.
- `references/google-ads-api.md`: v25 recipes, GAQL, the camelCase trap.
- `references/meta-marketing-api.md`: Graph recipes, the attribution change.
- `references/google-measurement.md`: GTM, Search Console and GA4.
- `references/write-safety.md`: the gate, the guards, how to add a write.
- `scripts/ads.py`: front door, `doctor`, and `client <slug>`.
- `scripts/googleads.py` `meta.py` `gtm.py` `gsc.py` `ga4.py`: the platforms.
- `scripts/accounts.py`: the client registry, and the ID normalizers.
- `scripts/gfads.py`: config, tokens, HTTP, the gate, output.
- `scripts/google_oauth_setup.py`: mint the refresh token, once.
- `data/accounts.csv`: the registry itself.

Python rather than bash, unlike `site-factory`: the payloads here are real
JSON documents rather than flat responses, so the same reasoning that made
curl right there makes stdlib Python right here. Still no install step.
