# Data sources

Everything here is free. The paid option is listed last and is disabled by default.

## The mental model

Distress leads come from two different kinds of record, and you need both.

**The parcel layer** is the backbone. One row per property, with owner name, owner
mailing address, assessed or market value, last sale date, last sale amount, beds,
baths, square footage and year built. This is where absentee status, tenure and
estimated equity come from. Pull it once, refresh it monthly or weekly.

**Event feeds** are the trigger. Code violations, tax delinquency, foreclosure
filings, probate cases, condemnations. One row per filing, usually with an address
and a date and not much else. These are what make a property interesting this month
rather than in general.

The pipeline joins them by address when the event feed publishes no parcel number,
which is most of the time. That join is why a violation notice turns into a lead
with a full financial picture attached.

## Source types the connectors handle

### ArcGIS (`kind: "arcgis"`)

The most common county format by a wide margin. Look for a URL ending in
`/MapServer/0` or `/FeatureServer/0`. No key required, generous limits, and the
layer publishes its own schema, which is how the field mapper works out the columns.

Typically holds: parcels, zoning, vacant property surveys, demolition tracking,
sometimes code enforcement.

```json
{
  "name": "my-county-parcels",
  "kind": "arcgis",
  "url": "https://gis.example.gov/arcgis/rest/services/Parcels/MapServer/0",
  "where": "1=1",
  "pageSize": 1000,
  "minIntervalMs": 400,
  "defaults": { "county": "Example", "state": "TN", "fips": "47037" }
}
```

Handles both pagination styles automatically, and derives latitude and longitude
from the polygon geometry when the layer publishes no coordinate columns.

Be polite. `minIntervalMs` defaults to 250 and county servers are not load
balanced. A full county parcel pull is a few hundred requests, so run it weekly,
not nightly.

### Socrata (`kind: "socrata"`)

City and county open data portals: `data.nashville.gov`, `data.cityofchicago.org`,
and hundreds more. Dataset ids look like `479w-kw2x`.

Typically holds: code enforcement cases, property standards violations,
condemnations, demolition orders, vacant property registries, tax delinquency,
sometimes eviction filings.

```json
{
  "name": "my-city-violations",
  "kind": "socrata",
  "domain": "data.example.gov",
  "datasetId": "abcd-1234",
  "impliesEvents": ["code_violation"],
  "eventTypeFrom": {
    "field": "case_type",
    "map": { "DEMOLITION": "demolition", "VACANT": "vacant" },
    "default": "code_violation"
  }
}
```

`eventTypeFrom` reads a status or type column and splits one feed into several
distress types, so a demolition notice is recorded as both a demolition and a
violation. `SOCRATA_APP_TOKEN` is optional and only raises the rate limit. It is
free to obtain.

### CSV over HTTP (`kind: "csv"`)

Many county trustees and sheriffs publish the delinquent tax roll or the monthly
foreclosure sale list as a single downloadable file. Often the highest signal list
in the county, and usually the least competed, because it takes effort to get.

```json
{
  "name": "county-delinquent-tax",
  "kind": "csv",
  "url": "https://trustee.example.gov/exports/delinquent.csv",
  "impliesEvents": ["tax_delinquent"],
  "defaults": { "county": "Example", "state": "TN" }
}
```

### HTML tables (`kind: "html"`)

For public data published as a page with no API behind it. Trustee sale notices,
sheriff sale lists, delinquent tax rolls, condemnation lists. Free, and often the
least competed data in a county precisely because pulling it takes effort.

```json
{
  "name": "tn-foreclosure-statewide",
  "kind": "html",
  "url": "https://example.gov/notices?county=Davidson",
  "requireHeaders": ["address"],
  "minIntervalMs": 1000,
  "impliesEvents": ["foreclosure"]
}
```

Prefer `requireHeaders` over `tableIndex`. A site redesign moves table indexes
around but rarely renames columns. If the table is not found, the error lists every
table on the page with its headers, so fixing the config is a copy and paste. If it
reports no tables at all, the page is rendered by JavaScript and you need the site's
own export or a search url instead.

### RealEstateAPI (`kind: "reapi"`) PAID, and not recommended

Public pricing starts around 599 dollars a month, which is triple the entire budget.
Left in place as an interface, disabled, and there is no reason to enable it. See
[COSTS.md](COSTS.md).

## National sources, free, no key

| Source | What it is | How to reach it |
|---|---|---|
| HUD FHA REO | Homes HUD took back after paying an FHA insurance claim. Genuinely bank owned. | ArcGIS layer, shipped as `config/sources/hud-reo.json` |
| HUD Home Store | The consumer facing listing site for the same inventory | hudhomestore.gov, no documented API |
| Fannie Mae HomePath | Fannie Mae REO inventory | homepath.com, listing site, no documented API |
| Freddie Mac HomeSteps | Freddie Mac REO inventory | homesteps.com, listing site, no documented API |
| USDA Rural Development | USDA foreclosed inventory, rural and small town | resales.usda.gov |
| data.gov | Catalog across federal and many local agencies | data.gov |

Only the HUD ArcGIS layer is wired up, because it is the only one of these with a
documented machine readable endpoint. The others are listing sites. Scraping them
is possible but it is a maintenance burden and it sits in a greyer area on terms of
use, so it was left out rather than shipped as something that quietly breaks.

## Finding sources for your county

```bash
npm run gf -- find "<county> parcels"
npm run gf -- find "<city> code enforcement" --kind socrata
```

That queries the ArcGIS Hub catalog and the Socrata discovery catalog, which
between them index most of what local government publishes.

If neither finds it, in rough order of yield:

1. Search `<county> GIS open data` and look for an ArcGIS Hub site.
2. Search `<county> arcgis rest services` for the raw REST directory listing.
3. Look for the assessor or property assessor site and check for a bulk data or
   download page.
4. Check the county trustee or tax collector for a delinquent tax export.
5. Check the clerk of court for foreclosure and probate case search. These are
   often the least machine friendly and the most valuable.
6. Check the city for code enforcement, which is frequently on a separate portal
   from the county.

## Distress signals and where they come from

| Signal | Usual free source | Notes |
|---|---|---|
| `pre_foreclosure` | **Tennessee: the free statewide notice repository, see below** | the classic list, also the most competed |
| `foreclosure`, `auction` | trustee or sheriff sale notices, often a weekly PDF or HTML list | hard deadline, and proof a loan exists to assume |
| `reo` | HUD ArcGIS layer, lender inventory | already bank owned |
| `tax_delinquent` | county trustee delinquent roll | often annual, often a CSV |
| `probate`, `pre_probate` | probate court case search | see below |
| `code_violation` | city code enforcement open data | underrated, and refreshed constantly |
| `demolition` | condemnation and demolition orders | strong signal, small volume |
| `vacant` | vacant property registry, utility shutoff lists, code cases | availability varies a lot |
| `eviction` | general sessions or housing court filings | signals a tired landlord |
| `lien` | register of deeds lien filings | weak on its own, useful stacked |

### Tennessee foreclosure notices, free and statewide

Tennessee forecloses non judicially, so there is no court docket to scrape. That
normally makes pre foreclosure the hardest free signal in the state.

A law change effective July 2025 requires every foreclosure notice published in a
Tennessee newspaper to also appear on a free statewide repository. The Tennessee
Press Association runs `foreclosurestn.com` for that. Notices also appear at
`tnpublicnotice.com`, `foreclosuretennessee.com` and `tnforeclosurenotices.com`,
posted under TCA 35-5-101.

Use the `html` connector against whichever of those lists your counties cleanly.
See `config/sources/tn-foreclosure.json`.

### The free probate shortcut

Probate court records are county by county and rarely machine friendly. There is a
free proxy that needs no court data at all: the assessor roll itself. Owner names
containing `ESTATE OF`, `HEIRS OF`, `DECEASED` or a life estate are flagged
automatically by the owner classifier, and those parcels surface as `estate` owner
type with the estate indicator set.

It will not catch a death that has not reached the deed yet, which is what
pre probate vendors sell. It costs nothing and it catches the ones already on the
roll.

```bash
npm run gf -- leads --json | grep -i '"ownerType": "estate"'
```

## Terms of use

These are public records and the endpoints above are published for public use, but
a few habits keep it that way:

- Leave `minIntervalMs` alone or raise it. Do not hammer a county server.
- The default user agent identifies the tool honestly. Leave it that way.
- Prefer the documented API or bulk export over scraping a page.
- Check the portal's terms if you plan to redistribute the data rather than use it
  for your own outreach. Using it to contact owners is ordinary business use.
  Reselling a compiled database is a different question.
- Skip trace output is regulated differently from public records. It is opt in here
  for that reason as well as the cost.
