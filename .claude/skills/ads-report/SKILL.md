---
name: ads-report
description: Pull a client's paid and organic numbers across Google Ads, Meta, GA4 and Search Console, and say what they mean. Use when someone wants performance: "how did their ads do last month", "send the client a report", "what are we spending on the gym", "is Meta or Google working better for them", "traffic is down, why", "what did we get for the budget". Assumes the client is already in the registry; if their accounts are not connected yet, that is ads-onboard. Reads only, so it never changes a budget or a campaign.
---

# Ads report: what the money did

Read `../ads-factory/SKILL.md` first, in particular the gotchas section.
Every one of those produces a number that looks plausible and is wrong, and
this routine is where a wrong number reaches a client.

Reads only. Nothing here changes a campaign, a budget or a tag.

## Step 0: is the client measurable

```bash
cd .claude/skills/ads-factory/scripts
python3 gtm.py audit <slug>
```

Do this before pulling a single performance number. If conversion tracking
is broken, the conversion columns in every report below are fiction, and
reporting them as fact is worse than reporting nothing. Say so at the top of
the report instead.

## Step 1: the whole picture

```bash
python3 ads.py client <slug>
```

Tag audit, GA4 key events, GA4 channels, Search Console against the previous
window, Google Ads campaigns, Meta campaigns. Start here, then go deeper
where something looks wrong.

## Step 2: per platform, as needed

```bash
python3 googleads.py report   <slug> --days 30
python3 googleads.py terms    <slug> --days 30      # where the money went
python3 googleads.py keywords <slug> --days 30
python3 meta.py     report    <slug> --days 30 --action-type lead
python3 meta.py     breakdown <slug> --by publisher_platform
python3 ga4.py      report    <slug> --days 28
python3 ga4.py      conversions <slug> --days 28
python3 gsc.py      compare   <slug> --days 28
python3 gsc.py      query     <slug> --days 28 --by query
```

Add `--json` to any of them to pipe the rows into something else. The flag
works on either side of the subcommand.

## Reading it honestly

**Name the conversion action.** On Meta, pass `--action-type lead` or
`--action-type purchase` for anything a client sees. Left to itself the
report picks the first money-shaped action it finds and prints which one in
the `action` column, which is fine internally and too loose for a client.

**Do not add conversions across platforms.** Google Ads, Meta and GA4 each
attribute differently, so summing them double counts the same lead. Report
them side by side, or report GA4 as the single source and the platforms as
what each one claims.

**Windows end yesterday.** Every command here already does that. If a number
has to match a client's own dashboard screenshot, check which window they
used before assuming anything is wrong.

**Search Console lags two to three days.** The last few days of any window
are soft. Say it before the client spots it.

**Position improves as it falls.** `gsc.py compare` inverts the sign on
average position so a positive change means the ranking got better, and it
says so under the table.

**Meta placement is where the surprise usually is.**
`breakdown --by publisher_platform` regularly shows spend going somewhere
nobody chose, and it is the fastest useful finding in this whole routine.

## Turning it into something a client reads

Numbers in a terminal are not a report. For anything client-facing, build
the report as an artifact and publish it, per the `dataviz` skill for chart
form and colour and `house-style` for the client's own identity. Use the
client's kernel from `projects/<slug>/kernel.json` when there is one, so a
report looks like their brand rather than a default palette.

Lead with what changed and what Growth Factor is doing about it, not with a
table. The table is evidence, not the message.

## What this routine will not do

Change anything. Every write in the factory lives behind `--confirm` on the
platform CLI, deliberately outside this routine. A report that concludes a
campaign should be paused ends with that recommendation, and a human runs
the command.
