# growthfactor leads

A distressed property lead pipeline that runs on free public data and hands you a
GHL ready CSV of scored, ranked seller finance targets.

Built to replace a PropStream subscription. Data cost at rest: zero dollars.

```
free public records  ->  one canonical database  ->  scoring  ->  GHL
county GIS, city open data,        dedupe by APN         seller finance fit    CSV import
HUD REO, court dockets            and by address        strategy per lead     or API push
```

## Why this beats paying for a lead subscription

A subscription mostly resells county records with a filter UI on top. Those records
are public, and the four columns that matter most are in every assessor roll:

| Column in the assessor roll | What it tells you, for free |
|---|---|
| owner mailing address | absentee owner, and where to actually send mail |
| last sale date | tenure, which drives equity |
| last sale amount | the original loan, which lets you model the payoff |
| owner name | estates, trusts and corporate landlords |

From those this pipeline derives absentee status, out of state ownership, tenure,
estimated equity, likely free and clear status, and an estate flag. That is the
filter set people pay monthly for. Layer county code enforcement, tax delinquency,
foreclosure filings and probate dockets on top and you have stacked leads.

The part a subscription will not do is tell you which play fits which lead. This
does, and it is opinionated about it.

## Quickstart

Needs Node 22.6 or newer. No build step, no runtime dependencies, no database to
set up. Nothing needs installing to run a pull.

```bash
git clone <this repo> && cd growthfactor
node --version            # must be v22.6 or later

# 1. See what is configured
npm run gf -- sources

# 2. Look at a source before trusting it. This prints the field mapping it
#    resolved at runtime, with a confidence score per field.
npm run gf -- discover hud-reo

# 3. Pull it
npm run gf -- pull hud-reo

# 4. Look at your leads
npm run gf -- leads --limit 20

# 5. Export for GHL
npm run gf -- export --min-score 50
```

That writes `out/ghl-leads-<date>.csv`. Import it in GHL under Contacts, Import.
No API key needed for any of the above.

## Finding data for your county

Every county publishes differently. Rather than hardcoding one county, sources are
config files and the field mapping is resolved at runtime.

```bash
# Search the two catalogs that index most county and city datasets
npm run gf -- find "davidson county parcels"
npm run gf -- find "code enforcement nashville" --kind socrata
```

Take a URL or a dataset id from the results, drop it into a file under
`config/sources/`, then run `gf discover <name>` to see what the mapper made of it.
See [docs/DATA_SOURCES.md](docs/DATA_SOURCES.md) for what to look for county by county.

## The two scores

Every lead gets two numbers, deliberately kept apart:

- **distressScore** how much pressure the owner is under right now
- **sellerFinanceScore** how well the deal fits a seller carried note

They disagree constantly, and that is the point. A house at auction in three weeks
scores high on distress and low on seller finance, because that seller needs cash.
A free and clear absentee owner with a code violation is the reverse, and is the
better call for terms. Each lead also gets a recommended `strategy`:

| strategy | when | what it means |
|---|---|---|
| `seller_finance` | high equity, long tenure, no deadline | ask them to carry paper |
| `subject_to` | thin equity plus a foreclosure filing | take over the existing loan |
| `cash_wholesale` | REO, auction, lender owned | price is the only lever |
| `novation` | mid equity, no urgency | list it with them, split the upside |

Bank owned inventory ranks low on the blended score on purpose, because it is a
cash play. To work that list, filter for it:

```bash
npm run gf -- leads --strategy cash_wholesale --sort distress
npm run gf -- leads --strategy seller_finance --min-score 60
npm run gf -- leads --event pre_foreclosure
```

## Commands

| command | does | costs money |
|---|---|---|
| `gf sources` | list configured sources | no |
| `gf find "<query>"` | search public data catalogs | no |
| `gf discover <source>` | probe a source, show the field mapping and its confidence | no |
| `gf pull <source>` | ingest one source | no, unless the source is a paid vendor |
| `gf pull-all` | ingest every enabled source | same |
| `gf score` | recompute all scores | no |
| `gf leads` | the working list | no |
| `gf show <id>` | one lead in full, with event history and offer math | no |
| `gf export` | GHL ready CSV | no |
| `gf stage <id>` | stage an offer at `awaiting_approval` | no |
| `gf push <id> --confirm` | create a GHL contact and opportunity | no |
| `gf runs` | ingest history, record counts and spend per run | no |
| `gf targets:push` | upload source configs to Supabase for scheduled runs | no |

## What will not happen

These are enforced in code, not just documented.

- **No offer is ever sent.** `gf stage` stops at `awaiting_approval`. The store
  throws if anything tries to write `offer_sent`, and the Postgres schema has a
  trigger that refuses it without an approval timestamp.
- **No outbound message is triggered.** The GHL push creates a contact and an
  opportunity. It never calls a workflow, conversation or messaging endpoint, so
  importing a lead cannot fire an SMS or an email. A test asserts this.
- **No skip trace during ingest.** Nothing in the ingest path can spend money per
  record. Phone and email columns in the export are deliberately left empty rather
  than filled with anything invented.
- **No silent duplicate.** A record with neither an address nor a parcel number is
  counted and dropped, not stored as noise.

## Storage

Two interchangeable backends behind one interface.

- **SQLite**, the default, using the SQLite bundled with Node. Nothing to provision.
- **Supabase**, over PostgREST, for scheduled nightly runs. See
  [docs/SUPABASE.md](docs/SUPABASE.md).

```bash
npm run gf -- leads --store supabase
```

Both use the same merge rules, which are tested. A sparse source such as a code
enforcement feed can never erase the owner name a parcel layer supplied.

## Dependencies

Zero at runtime. Everything uses what ships with Node 22: built in `fetch`, the
bundled SQLite, and the built in test runner. TypeScript runs through Node's type
stripping, so there is no compile step.

`typescript` and `@types/node` are dev only, needed for `npm run typecheck` and for
nothing else. The pipeline runs without ever calling `npm install`.

## Tests and typechecking

```bash
npm test            # no install needed
npm install         # only for typechecking, dev only
npm run check       # typecheck plus tests
```

43 tests. The connectors run against a local mock server that replicates the
documented response shapes of ArcGIS, Socrata and the GHL v2 API, covering
pagination, retry and backoff, cross source address merging, append only event
history, idempotency across consecutive runs, and the approval gate.

## Docs

- [docs/DATA_SOURCES.md](docs/DATA_SOURCES.md) every free source, what it gives you, how to find yours
- [docs/SELLER_FINANCE_PLAYBOOK.md](docs/SELLER_FINANCE_PLAYBOOK.md) how the scoring works and how to work the lists
- [docs/DEVIATIONS.md](docs/DEVIATIONS.md) where this differs from the original build spec, and what is unverified
- [docs/SUPABASE.md](docs/SUPABASE.md) the scheduled deployment path
- [docs/GHL.md](docs/GHL.md) GHL setup, CSV and API

## Read this before you quote a number

The offer math in `config/offer.json` is placeholder percentages, and the ARV comes
from published assessor value, not from comps. It is there so the pipeline has a
shape, not because the numbers are right. Replace them with your buy criteria and
pull real comps before any figure reaches a seller. Same for
`config/buybox.json`.
