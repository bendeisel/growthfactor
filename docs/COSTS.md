# What this costs, and when PropStream wins

Your ceiling is 200 dollars a month, above which PropStream is the better deal.
That number is now the hard cap in `config/budget.json`, enforced in code before
any billable call.

All prices below come from public sources, not from quotes issued to you. Verify
before committing. The one number that matters most, your real cost per skip trace,
goes in `config/skiptrace.json` and drives every budget check in the system.

## The short version

Run the free layer, add pay as you go skip tracing, and expect **20 to 75 dollars a
month**. The free data covers everything except phone numbers.

If you ever find yourself skip tracing more than about 2,000 records a month, buy
PropStream Pro for its included skip tracing and keep this for the filtering
PropStream cannot do. The break even math is below.

## What is free, and it is most of it

| What you need | Free source | Cost |
|---|---|---|
| Owner name and mailing address | TN statewide parcel layer | 0 |
| Equity, tenure, absentee status | derived from the same parcel data | 0 |
| Pre foreclosure and trustee sales | TN statewide foreclosure notice repository | 0 |
| Bank owned and REO | HUD FHA REO ArcGIS layer | 0 |
| Code violations and demolitions | city open data portals | 0 |
| Tax delinquency | county trustee delinquent lists | 0 |
| Probate signals | estate and heir language in owner names | 0 |
| Waterfront | computed from USGS NHD shoreline | 0 |

### The Tennessee foreclosure law change matters here

Tennessee foreclosures are non judicial, so there is no court docket to read. That
normally makes pre foreclosure the hardest free signal to obtain in this state, and
it is the single most valuable one.

Effective July 2025, Tennessee law requires every foreclosure notice published in
any Tennessee newspaper to also appear on a free statewide repository. The Tennessee
Press Association runs `foreclosurestn.com` for that purpose. Notices also appear at
`tnpublicnotice.com` and through third party posting companies under TCA 35-5-101.

That closes the last serious gap in the free layer, for all eight of your counties,
at zero cost. See `config/sources/tn-foreclosure.json`.

## The one thing worth paying for

Phone numbers. County records give you an owner name and a mailing address, which is
everything you need for direct mail and nothing you need for a call or a text. If
the plan is to work leads inside GHL by phone, that gap is the only real one.

Public pricing for pay as you go skip tracing runs roughly **7 to 18 cents per
record**, with some vendors quoting per match rather than per attempt, which is
cheaper because you do not pay for misses. Avoid anything with a four figure monthly
minimum: several vendors gate their best per record rates behind subscriptions
starting at 500 to 2,000 dollars a month, and one of those alone blows the budget.

### Why per record beats a bundle here

PropStream charges a flat monthly fee whether you use it or not. This system charges
nothing until you decide a specific lead is worth a phone number.

That matters because the free layer does the filtering first. You are not tracing a
county, you are tracing the leads that already scored well:

```bash
# price it before spending anything, this is the default
npm run gf -- trace --market old-hickory-waterfront --min-score 60 --limit 50

# selected 50 leads
# estimated cost $5.00. Nothing was spent.
# Add --confirm to actually run it.
```

At 10 cents a record, tracing 300 well scored leads a month is 30 dollars. Tracing
every lead you pull is what makes skip trace expensive, and it is also what makes it
useless, because most of those numbers were never going to be called.

## Budget enforcement

```bash
npm run gf -- spend
```

```
month starting 2026-08-01, day 24 of 31
cap        $200.00
spent      $0.00  (0 percent)
remaining  $200.00
projected  $0.00 by month end at the current rate

Nothing spent. Every enabled source is free public data.
```

Three guards, all in code rather than in documentation:

1. **A cache.** The same owner is never paid for twice inside 90 days. A repeat run
   over the same list costs nothing and says so.
2. **A per invocation cap**, 50 records by default, so a mistyped command cannot
   trace a whole county.
3. **The monthly cap.** Checked before the first billable call. At `hardStop: true`
   a run that would exceed 200 dollars is refused outright rather than trimmed, so
   you find out by being stopped, not by reading a bill.

Misses are billed and recorded like hits, because a vendor charges for the attempt.
Reporting only successes would understate what you actually spend.

Every cost flows through the same `ingest_runs` ledger, so `gf spend` sees all of
it. On the free sources it stays at zero permanently.

## The honest comparison

Public PropStream pricing, 2026:

| | This pipeline | PropStream Essentials | PropStream Pro |
|---|---|---|---|
| Base subscription | 0 | 99 per month | 199 per month |
| Skip tracing | pay per record, roughly 7 to 18 cents | 12 cents per contact | included |
| List automation | included, `pg_cron` nightly | List Automator, about 27 per month | included |
| Data coverage | 8 Tennessee counties you chose | national | national |
| Comps and ARV | assessor value times a multiplier, no comps | comps included | comps included |
| Waterfront filter | yes, computed from the shoreline | no | no |
| Area radius markets | yes | no, county and zip only | no |
| Automated push to GHL | yes, with an approval gate | manual export | manual export |
| Owns the data | yes, in your own database | no | no |

**Where PropStream genuinely wins:**

- **Heavy skip tracing.** Pro includes it. At 10 cents a record, Pro's 199 dollars
  is break even around 2,000 traces a month. Above that, Pro is cheaper on skip
  trace alone and it is not close.
- **Comps.** This has no comp data and cannot get any for free. ARV here is assessor
  value times a multiplier you calibrate, which is adequate for sorting a list and
  not adequate for underwriting. If you need real comps, you need an MLS feed or a
  paid AVM, and both cost more than the whole budget.
- **National coverage.** If you leave Middle Tennessee, every source has to be
  rewired. Eight counties is cheap; fifty states is not.
- **It works today with no setup.** This needs a parcel layer URL pasted in and a
  `gf discover` run per source.

**Where this wins:**

- Cost, at any tracing volume under roughly 2,000 records a month.
- The Old Hickory waterfront filter, which no subscription offers.
- Area markets as a radius rather than a city or zip boundary.
- Nightly automation into GHL with a human approval gate.
- The data is yours, in your own database, with full event history. A property that
  hits pre foreclosure in March and again in July is two events here and one flag
  in a subscription product.

## Recommended setup

1. Run the free layer. Cost: zero. This is most of the value.
2. Get a pay as you go skip trace account with no monthly minimum. Put your real per
   record cost in `config/skiptrace.json`.
3. Trace selectively, A and B grade leads only, always dry run first.
4. Watch `gf spend` weekly. Expect 20 to 75 dollars a month.
5. Revisit if your tracing volume passes 1,500 records a month, which is the point
   where PropStream Pro starts to look better on skip trace economics.

Nothing here needs a data subscription to work. If you decide to buy PropStream Pro
anyway for the comps and the included tracing, this pipeline still earns its place
for the waterfront filter, the market radius logic, and the automated GHL push, and
it costs nothing to keep running alongside.
