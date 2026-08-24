# Deviations from the build spec, and what is unverified

The original spec is `distressedpropertypipelinebuildspec.md`. This documents every
place the build departs from it, and why. It also states plainly what could not be
verified during the build, because that is the difference between a claim and a
guess.

## What could not be verified, and how the design compensates

The environment this was built in blocked outbound network access to every external
host: the county and federal endpoints, the vendor documentation, and the GHL API.
The spec itself says, correctly, "Do not trust the field names in this document.
Fetch the live spec before writing the client." That was not possible.

Rather than guess field names and ship something that looks finished and silently
produces wrong data, the design was changed so that **no upstream field name is
hardcoded anywhere**:

1. Every connector asks its endpoint what fields exist before reading records.
2. A field mapping resolver matches those columns onto canonical fields using an
   alias dictionary plus abbreviation expansion, so `OWNNAME`, `owner_name`,
   `TAXPAYER` and `OwnerNme` all resolve without per county configuration.
3. Every mapping carries a confidence score, and `gf discover <source>` prints the
   whole table plus anything important it could not map. Low confidence guesses are
   called out for a human to check.
4. Anything the resolver gets wrong is fixable in config with a `fieldMap`
   override, with no code change.

So the pipeline logic is genuinely tested end to end against replicas of the
documented response shapes. What remains unverified is whether the live payloads
match those shapes. Concretely:

| Thing | Status |
|---|---|
| Pipeline logic: paging, retry, dedupe, merge, append only history, scoring, export, approval gate | Tested, 43 tests against a local mock server |
| Equity model and amortization math | Tested against a known loan schedule |
| ArcGIS, Socrata, GHL v2 request and response shapes | Modelled from published documentation, not observed live |
| HUD REO layer URL and its field names | URL and field list came from search results, not a live fetch |
| Nashville parcel and violation endpoints in the example config | Identified from public documentation, not fetched |
| Tennessee statewide parcel layer URL | Confirmed to exist, exact REST endpoint not resolved, left as a placeholder that fails loudly |
| USGS NHD layer ids for the Old Hickory Lake shoreline | Not verified, which is why the fetch probes candidates and reports what it finds |
| Approximate town centres and county bounding boxes in the configs | Derived from general knowledge, marked approximate, easily adjusted |
| RealEstateAPI request and response schema | Not verified at all, which is why that connector is schema agnostic and disabled |

**First thing to do on your machine:** run `gf discover <source>` on each source
before `gf pull`. That one command turns every unverified assumption above into
something you can see.

## Deviations

### 1. Free public sources are primary. RealEstateAPI is optional and off.

The spec makes RealEstateAPI the primary source. You said you do not want to pay
much or anything, and RealEstateAPI is quoted pricing with a volume commitment.

County parcel data plus city code enforcement plus HUD REO covers pre foreclosure
adjacent, REO, tax delinquency, violations, vacancy and estate ownership for zero
dollars. The vendor connector is still here, still works, and is one config flag
away if you ever decide national coverage is worth paying for.

### 2. `properties` has a `dedupe_key`, and a `property_keys` alias table exists.

The spec says the dedupe key is `(fips, apn)` and not address, for good reasons:
addresses are inconsistent across counties and vendors.

That rule breaks against free sources. Most of them publish no APN at all. HUD REO
publishes a case number and a street address. Code enforcement feeds publish an
address. Court dockets publish an address. If parcels were keyed only on APN, an
address only source could never find them and every distress signal would land on a
duplicate row, which defeats the entire stacked lead idea. A test caught exactly
this.

What is built instead:

- `(fips, apn)` is still the preferred key, first in precedence.
- A normalized address plus zip is the fallback, then address plus city and state.
- `property_keys` maps every identifier a property is known by to its row, so a
  parcel stored under its APN is still findable by its address later.
- Alias registration is first writer wins, so two units that normalize to the same
  street address never quietly merge into one record.
- Address normalization is aggressive and tested: `123 N. Main Street, Apt. 4` and
  `123 North Main St #4` produce the same key, while `Main St` and `Main Ave`, and
  `Apt 1` and `Apt 2`, stay apart.

### 3. Three distress types were added to the enum.

Added `code_violation`, `eviction` and `demolition`. All three are published free by
many city open data portals and all three are real distress. Code enforcement in
particular is the most consistently available and most frequently refreshed free
signal there is.

### 4. Scoring is stored in a `lead_scores` table, and there are two scores.

The spec has a `stacked_leads` view that counts signals. That ranks by how much
distress exists, which is the wrong sort order for your stated goal.

Seller financing needs a seller who can carry paper, which means high equity and no
deadline. Distress and seller finance fit are computed separately, and each lead
carries a recommended strategy. Bank owned inventory therefore ranks low on the
blended score, correctly, because there is no seller to negotiate terms with. Filter
with `--strategy cash_wholesale` to work that list.

A later correction added `lease_option` as a fifth strategy and fixed the rule that
routed thin equity foreclosures to cash. Curing arrears on an existing loan costs a
fraction of a cash purchase, so those leads are assumption plays until the calendar
runs out, and a leveraged owner with no deadline is a lease option rather than a dead
lead. See the strategy table in the README.

### 5. An equity model was added, with the basis always reported.

The spec's schema has `estimated_equity` and `equity_percent` but assumes a vendor
supplies them. Free county data almost never publishes a loan balance.

So equity is modelled: the original purchase loan is amortized forward from the sale
date using an approximate historical rate for the year of purchase. Every equity
number carries an `equity_basis` of `measured`, `estimated_from_tenure` or
`unknown`, and `unknown` is never rendered as zero. Long tenure, and transfers
recorded with no price, are treated as free and clear.

This is a model, not a fact. It is good enough to sort a list. It is not good enough
to quote.

### 6. Storage is SQLite first, Supabase second.

The spec assumes Supabase from day one. You had no Supabase project, and requiring
one before seeing a single lead is friction with no payoff.

The local path uses the SQLite bundled with Node, so `git clone` to a scored lead
list needs no provisioning. The Supabase path is fully implemented for scheduled
nightly runs and uses identical merge semantics, enforced by putting the merge logic
in Postgres functions that mirror the local SQL.

### 7. Zero dependencies, and TypeScript runs without a build step.

The spec calls for TypeScript on Deno. This is TypeScript, run under Node's type
stripping, with no `npm install` and no compile step. The same source runs unchanged
in a Supabase Edge Function on Deno, which is why no core module imports a Node
builtin.

Nothing to audit, nothing to update, nothing to break.

### 8. Markets and a computed waterfront filter were added.

Not in the spec at all, because the spec assumed a market is a county. Two of the
stated targets are not counties: "anything on the water on Old Hickory Lake" spans
five counties and depends only on the shoreline, and "the Pegram area" is mostly
unincorporated county that a city name match would discard.

So a market is a county list, plus optional city names, plus an optional radius,
plus an optional waterfront rule. City and radius are ORed with each other so an
area behaves like an area. Waterfront distance is computed from the parcel
coordinate and a cached USGS NHD shoreline, which means it costs nothing and can be
re-run at will. The threshold is distance based rather than strict deeded frontage
because the Corps of Engineers owns a shoreline strip around most of Old Hickory
Lake.

### 9. Skip trace is not implemented, only reserved.

The spec's Phase 3 is an `enrich-owner` function calling a paid skip trace endpoint.
That is the one part of the spec deliberately left unbuilt, because it is the only
part that spends money per record and because there is a free substitute for the
main use case.

The `owners` table exists, the schema is ready, and `has_contact_info` is wired
through. But for direct mail, the assessor's owner mailing address is already the
answer, and it is free. Add skip trace when you need phone numbers for cold calling,
and add it as its own on demand command so it can never run in bulk by accident.

## Open items from the spec that still need your input

The spec's section 12 asked for five decisions. Three of them are still open, and
the code ships with clearly marked placeholders rather than invented answers.

1. ~~**Target counties.**~~ Answered: Davidson, Williamson, Cheatham, Maury,
   Sumner, Wilson, Trousdale and Smith, expressed as seven markets in
   `config/markets.json`. See [MARKETS.md](MARKETS.md). One item remains: the
   Tennessee statewide parcel layer URL is a placeholder, because it was not
   verifiable here. Run `gf find "tennessee property boundaries"` and paste it in.
2. **Buy box.** `config/buybox.json` has placeholder ranges. Applied only with
   `--buybox`, and only at read time, so changing it never means re-pulling.
3. **Offer formula.** `config/offer.json` has placeholder percentages. ARV comes
   from published assessor value with a configurable multiplier, not from comps.
4. **GHL pipeline and custom field ids.** Needs creating in GHL first. Run
   `gf ghl:fields` to list ids, then fill `config/ghl-fields.json`. The CSV path
   needs none of this.
5. **RealEstateAPI plan tier.** Not needed unless you enable the paid connector.
