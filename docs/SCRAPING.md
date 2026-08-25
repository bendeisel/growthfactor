# Scraping government sites, and whether you need Apify

Short answer: the people you found are right about the data and probably wrong about
needing a platform. Government sources beat aggregators, and this pipeline already
reads them. What was genuinely missing was the ability to render JavaScript, and that
is now built in and costs nothing.

## Why government sources are better

An aggregator buys county records, normalizes them, and resells them on a refresh
cycle. Every one of those steps adds lag and loss. When PropStream says a property is
in pre foreclosure, it is repeating something a county published, possibly weeks ago,
possibly mangled in the normalizing.

Reading the county directly removes the middleman, the lag, and the subscription.
That is the whole thesis of this project, so no argument here.

## What was already covered before any scraping

Most public records are not behind a page that needs a browser. They are behind an
API, and nobody advertises it because the audience is small.

| Source type | How it is read | Needs a browser |
|---|---|---|
| County parcels, assessor roll | ArcGIS REST, returns JSON | no |
| Code enforcement, demolitions | Socrata REST, returns JSON | no |
| HUD REO inventory | ArcGIS REST | no |
| Foreclosure notices | HTML table | no |
| Delinquent tax rolls | HTML table or CSV | no |
| Court dockets, modern portals | rendered results | **yes** |

So the browser is for one category: court portals built as single page apps, where
plain HTTP returns an empty shell. That is where probate lives, which is exactly the
source you asked about.

## What was added

A `browser` connector. It drives a Chromium already installed on the machine over the
DevTools protocol, using the WebSocket built into Node. No Playwright, no Puppeteer,
no Apify, no monthly fee, and no new dependency in this project.

```json
{
  "name": "probate-davidson",
  "kind": "browser",
  "url": "https://example.gov/search",
  "steps": [
    { "type": "type", "selector": "#caseType", "text": "PROBATE" },
    { "type": "select", "selector": "#county", "text": "DAVIDSON" },
    { "type": "click", "selector": "#search" }
  ],
  "waitForSelector": "#results",
  "requireHeaders": ["case number"],
  "nextSelector": "#next",
  "maxPages": 5,
  "minIntervalMs": 2000,
  "impliesEvents": ["probate"]
}
```

It fills the search form, waits for results, reads the table, clicks through pages,
and hands rows to the same field mapper every other source uses. Downstream, a
probate case is indistinguishable from a parcel record.

It finds Chrome automatically on Linux, macOS and Windows, or you point
`GF_BROWSER_PATH` at it.

## So do you need Apify

Apify is a real product and it is good at what it does. It is just not what this job
needs first.

| | This browser connector | Apify |
|---|---|---|
| Cost | 0 | Free tier is 5 dollars of monthly credit, Starter 29, Scale 199 |
| Renders JavaScript | yes | yes |
| Fills forms, pages through results | yes | yes |
| Proxy rotation, residential IPs | no | yes |
| Defeats Cloudflare and similar | no | often |
| Ready made scrapers to rent | no | thousands |
| Runs on a schedule | yes, `pg_cron` or local cron | yes, hosted |
| Maintained by | you | partly them |

**Apify earns its fee when:** a portal is behind serious bot protection, or your IP
gets blocked from repeated hits and you need rotation, or you would rather rent a
maintained scraper than fix a selector after a redesign.

**It does not earn its fee for:** county GIS servers, Socrata portals, and most court
sites, which have no bot protection worth mentioning and which you are hitting a few
dozen times a night, politely.

There is an official Apify MCP server that works with Claude Code, so wiring it up
later is easy if you hit a wall. Note their SSE transport is retired as of April 2026
and it uses streamable HTTP now. My advice is to hit the wall first. Adding a paid
dependency to solve a problem you do not have yet is how a zero dollar pipeline
becomes a forty dollar one.

## On Claude Code versus ChatGPT for this

This is the wrong axis to choose on, and it is worth being blunt about why.

Neither assistant should be the scraper. A scraper is code that runs unattended at
2am and writes to a database. ChatGPT's agent mode and similar tools drive a browser
interactively for a one off task, which is genuinely useful for exploring a site, but
you cannot put a chat session behind `pg_cron` and have it feed Postgres every night.

The division of labour that actually works:

1. Use an assistant to explore the portal and work out the selectors. Either one is
   fine for that. So is opening dev tools yourself.
2. Have it write a connector config.
3. The connector runs on a schedule, forever, with no model in the loop.

That last point matters for cost as much as reliability. A model in the nightly path
is a per run charge and a per run chance of a different answer. A selector in a config
file is neither.

## Court records, specifically

This is where care pays off, and where the fastest path is often not scraping at all.

**Ask for bulk data first.** Tennessee probate clerks will frequently provide filings
on a schedule for a fee or a public records request. Davidson County's Probate Court
Clerk accepts a records request form. That gets you cleaner data than any scraper,
survives every site redesign, needs no maintenance, and removes the terms question
entirely. It is unglamorous and it is usually the right answer.

**Do not scrape a subscriber portal.** Davidson County's CaseLink covers Circuit,
Probate and General Sessions Civil, and it is a subscription tool you log into. Public
data on an open page is one thing. A portal you agreed to terms to enter is a
contract, and that is a different category of risk. `config/sources/tn-courts.json`
deliberately does not configure CaseLink. If you subscribe, export from inside it.

**The general legal picture**, which is more favourable than people assume: courts
have consistently held that public data is scrapeable, and the Supreme Court has said
violating a site's terms is not by itself a computer fraud violation. One federal
court found that a blanket ban on scraping a public court index likely violates the
First Amendment. Terms of service bind logged in use. `robots.txt` is a voluntary
protocol rather than a law, though respecting it is treated as evidence of good faith,
so this project respects rate limits and identifies itself honestly in its user agent.

None of that is legal advice, and none of it makes a CAPTCHA fair game. If a site
puts up a challenge, it is telling you to use the front door. The connector will not
solve one and should not be modified to.

**Practical habits that keep access open:** leave `minIntervalMs` at 2000 or higher
for court sites, run nightly rather than hourly, pull only the counties you work, and
prefer a date filtered search over downloading the whole docket.

## Probate works today, divorce does not

Worth being straight about this, because you named both.

**Probate works.** A probate docket usually publishes a property address, and the
pipeline now splits a one line address like `120 Oak Ave, Nashville, TN 37201` into
street, city, state and zip. That is what lets a docket row land on the same database
row as its parcel, inheriting the owner name, the value and the equity estimate. There
is a test that proves three docket rows merge onto three existing parcels and create
zero duplicates.

**Divorce does not, yet.** A divorce docket publishes party names and a case number.
It does not publish a property address, because the property is described inside the
complaint or the decree, not in the docket listing. Everything here joins on address
or parcel number, so a names only record has nothing to attach to and would land as an
orphan row.

The fix is owner name matching: normalize the docket parties and look them up against
`owner_name` on the parcel roll, the same way `property_keys` already lets an address
find a parcel. It is a real feature and not a big one. It does not exist yet, and
`config/sources/tn-courts.json` says so rather than shipping a config that produces
junk.

Two caveats on divorce as a signal even once that works: case contents are frequently
sealed even where the docket entry is public, and a filing by itself does not mean a
sale is coming. It is a weaker signal than probate or a foreclosure notice, and it
should be weighted that way.

## Getting a new portal working

```bash
# 1. Open the portal in a normal browser, run the search you want, and copy the
#    results url. Right click the form fields you filled in and copy their selectors.

# 2. Write a source config with kind "browser" and paste them in.

# 3. Ask the connector what it found. It reports the table it used, the fields it
#    mapped, and its confidence in each guess.
npm run gf -- discover probate-davidson

# 4. Pull a few records before pulling the lot.
npm run gf -- pull probate-davidson --limit 20

# 5. Check they merged rather than duplicated.
npm run gf -- leads --event probate --limit 20
```

If step 3 reports "no tables at all", the page renders after some interaction the
config has not performed yet, so add a `waitForSelector` or another step. If it lists
tables but none match, it prints every table it saw with its headers, so fixing
`requireHeaders` is a copy and paste.
