# The write gate

Reads are open. Every write refuses unless `--confirm` is on that specific
command line.

## Why it works this way

These credentials can spend money and can change what runs on a client's
live website. The risk is not that Ben types the wrong command once. It is
that this repo is driven by Claude, and an agent that reasons its way into
"the CPA looks bad, I should pause that campaign" would otherwise be able to
do it.

An environment variable would not fix that, because an agent can set an
environment variable. `--confirm` has to appear in the command a human
approved, on the command that does the thing.

## What a refusal looks like

```
$ python3 googleads.py pause-campaign spidersboxing --id 22334455
REFUSED: pause campaign 22334455 (Search - Brand), currently ENABLED, in customer 1234567890
Would send:
[
  {
    "updateMask": "status",
    "update": {
      "resourceName": "customers/1234567890/campaigns/22334455",
      "status": "PAUSED"
    }
  }
]

Nothing was changed. Re-run the same command with --confirm to do it.
```

Three properties worth keeping:

1. **The current state is in the message.** Every write reads before it
   refuses, so the refusal says what the value is now, not just what it
   would become. `currently ENABLED` is how you catch a wrong ID.
2. **The exact payload is printed.** Not a paraphrase of it.
3. **Exit code 3**, distinct from 1 for a config problem and 2 for an API
   failure. A script can tell a refusal from a breakage.

## The gated writes

| Command | Blast radius |
| --- | --- |
| `googleads.py pause-campaign` | one campaign stops serving |
| `googleads.py set-budget` | daily spend changes; **all** campaigns on it if the budget is shared |
| `meta.py pause-campaign` | one campaign stops serving |
| `meta.py set-budget` | one ad set's daily spend changes |
| `gtm.py add-ga4-config` | draft only, nothing live until published |
| `gtm.py add-ga4-event` | draft only, nothing live until published |
| `gtm.py publish` | **changes what runs in every visitor's browser, immediately** |
| `gsc.py submit-sitemap` | tells Google to crawl a URL |

`gtm.py publish` is the one to be slowest about. It is the only command here
that changes the client's live site rather than their advertising.

## Guards beyond the gate

Refusing early beats refusing safely:

- **Ownership check.** Both Meta writes verify the object belongs to the ad
  account of the client named on the command line. A campaign ID typed one
  digit wrong otherwise reaches a stranger's campaign, and Meta will pause
  it if the system user has access.
- **Already-done check.** Pausing a paused campaign reports "already
  paused" and makes no call.
- **Shared budget warning.** Named in the refusal text, not discovered
  afterwards.
- **Lifetime budget refusal.** Changing a lifetime budget needs a schedule
  too, so it is refused outright rather than half-applied.
- **Missing prerequisite.** A GA4 event tag with no GA4 configuration tag
  in the workspace has nothing to send through, so it refuses instead of
  creating a tag that cannot work.

## Adding a write

Read the current state, then call `gfads.gate(args.confirm, description,
payload)` before the mutating call. Put the current value in the
description. Never gate on anything other than an explicit flag.
