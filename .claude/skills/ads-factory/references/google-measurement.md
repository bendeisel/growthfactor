# Tag Manager, Search Console and GA4: verified recipes

All three read out of their own discovery documents rather than from
memory. Re-pull and diff before assuming an API changed:

```bash
curl -s 'https://tagmanager.googleapis.com/$discovery/rest?version=v2'
curl -s 'https://searchconsole.googleapis.com/$discovery/rest?version=v1'
curl -s 'https://analyticsdata.googleapis.com/$discovery/rest?version=v1beta'
curl -s 'https://analyticsadmin.googleapis.com/$discovery/rest?version=v1beta'
```

All four use the same Google refresh token. No extra credential.

---

## Tag Manager API v2

- **Base:** `https://tagmanager.googleapis.com/tagmanager/v2`

### Paths are hierarchical, and the container ID is a number

```
accounts/{account}/containers/{container}/workspaces/{workspace}
```

The numeric container ID is **not** the `GTM-XXXXXXX` public ID. The API
addresses containers by number; the public ID is only for the snippet on the
page. The registry stores both, because you need the number to call the API
and the public ID to check the right container is on the site.

### Edits happen in a workspace, and a workspace is not live

This is the single most important fact about this API, and the most common
tagging failure in the wild. Creating a tag puts it in a **workspace**,
which is a draft. It does nothing until published. A container full of
correct tags that was never published measures exactly nothing.

Publishing is two calls:

```
POST accounts/{a}/containers/{c}/workspaces/{w}:create_version
POST accounts/{a}/containers/{c}/versions/{v}:publish
```

`gtm.py publish` does both and says plainly, before asking for `--confirm`,
that this changes what runs in every visitor's browser immediately.

To see what is actually running:

```
GET accounts/{a}/containers/{c}/versions:live
```

`gtm.py audit` compares the workspace against the live version and reports
tags that exist but are not published, which is the gap nobody notices.

### Tag types worth knowing

| API type | What it is |
| --- | --- |
| `googtag` | the Google tag, GA4 configuration |
| `gaawe` | GA4 event |
| `awct` | Google Ads conversion |
| `sp` | Google Ads remarketing |
| `html` | custom HTML |

`gtm.py audit` checks for the first four. Missing any of them means a
channel is spending money it cannot measure.

### Built-in trigger IDs

`2147479553` is All Pages. Built-in triggers use these fixed high-numbered
IDs rather than appearing in the trigger list, which is why
`add-ga4-config` can fire on all pages without creating a trigger first.

---

## Search Console API

- **Host:** `https://searchconsole.googleapis.com`
- **Two base paths on one host**, which is the trap here:
  - search analytics and sitemaps: `/webmasters/v3`
  - URL inspection: `/v1`

Both confirmed in the same discovery document. Guessing one path for both
gives a 404 that looks like the property is wrong.

### The property string is exact

Either a URL prefix with its trailing slash (`https://example.com/`) or a
domain property (`sc-domain:example.com`). They are different properties
with different data. The wrong form gives a 403 that reads like a
permissions problem. The registry normalizes on the way in and refuses
anything that is neither.

The property also goes in the URL path and must be fully percent-encoded,
slashes and colons included, or the API reads it as more path segments.

### Search analytics

```
POST /webmasters/v3/sites/{encoded-property}/searchAnalytics/query
{"startDate": "2026-08-13", "endDate": "2026-09-09",
 "dimensions": ["query"], "rowLimit": 25, "dataState": "FINAL"}
```

Dimensions: `query`, `page`, `country`, `device`, `date`,
`searchAppearance`. `dataState: FINAL` excludes incomplete recent data;
`ALL` includes it and is what makes two runs of the same report disagree.

**Data lags two to three days.** A window ending yesterday shows a soft
tail. That is the API, not the site losing traffic, and it is worth saying
out loud to a client before they see it.

### URL inspection

```
POST /v1/urlInspection/index:inspect
{"inspectionUrl": "https://example.com/page", "siteUrl": "https://example.com/",
 "languageCode": "en-US"}
```

The only endpoint that answers "is this page actually in Google", which no
amount of ranking data tells you. Quota is limited, so it is per-URL and not
worth looping over a sitemap.

---

## GA4: two APIs

Structure comes from the Admin API, numbers from the Data API. Both v1beta,
and v1beta has been the stable production surface for years, so the label
is not a warning.

- **Admin:** `https://analyticsadmin.googleapis.com/v1beta`
- **Data:** `https://analyticsdata.googleapis.com/v1beta`

### Property ID, not measurement ID

The API wants the numeric property ID from Admin > Property details.
`G-XXXXXXX` is the measurement ID and belongs in the GTM tag, not here.
People paste the wrong one about half the time, so the registry rejects the
`G-` form with a message saying where to find the right number.

### Discovery in one call

```
GET /v1beta/accountSummaries
```

Every property across every account the token can see. This is what makes
onboarding quick: `ga4.py properties` and the client's property ID is on
screen.

### Reports

```
POST /v1beta/properties/{id}:runReport
{"dateRanges": [{"startDate": "...", "endDate": "..."}],
 "dimensions": [{"name": "sessionDefaultChannelGroup"}],
 "metrics": [{"name": "sessions"}, {"name": "keyEvents"}]}
```

**Every value comes back as a string**, including numbers, and rates come
back as fractions (`0.0734`, not `7.34`). Rounding those to two places
turns 7.34 percent into 7 percent, so sub-1 values keep four places here.

GA4 renames things, and an invalid metric name returns a 400 that does not
suggest the right one. `ga4.py dims <client> --find lead` lists what this
property actually accepts.

### Key events replaced conversions

`keyEvents` and `userKeyEventRate` are the current names. `conversions` is
the old vocabulary. `ga4.py events` lists which events the property counts
as key events, and an empty list means Google Ads has nothing to import,
which is worth checking before blaming the campaigns.

### Data retention

`GET /v1beta/properties/{id}/dataRetentionSettings`. The default is two
months, 14 is free, and nobody notices until they want a year-over-year
number that no longer exists. `ga4.py settings` flags it when it is still
on the default.
