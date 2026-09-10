# Meta Marketing API, verified recipes

- **Base:** `https://graph.facebook.com/<version>`
- **Version is pinned** in `config.env` as `META_API_VERSION`.

## Verify the version before trusting it

Unlike the Google surfaces here, these endpoints could not be probed from
the build container: `graph.facebook.com` is blocked by the egress policy on
Claude Code's network. The shapes below come from Meta's documented API and
from trade reporting on the 2026 changes, not from a live call made here.

Trade sources disagreed on whether v26.0 shipped in July or September 2026,
so the version is a config value rather than a hardcoded string, and there
is a command to settle it from a machine that can reach Meta:

```bash
python3 meta.py versions
```

That probes each candidate version with a trivial call and reports which
ones answer. Pin the newest one that answers, then re-run a report to
confirm nothing changed shape.

## Ad account IDs

Every ad account endpoint takes `act_<digits>`. The Business Manager UI
shows the digits alone. The registry stores the `act_` form so nothing
downstream has to remember to add it.

## Account discovery

```
GET /<business-id>/owned_ad_accounts
GET /<business-id>/client_ad_accounts
```

Two separate edges. Accounts Growth Factor owns outright are in the first,
accounts a client shared are in the second. `meta.py accounts` reads both
and labels which is which, so a new client's `act_` ID is read off the API
rather than copied out of a browser tab.

## Token diagnosis first

```
GET /debug_token?input_token=<token>&access_token=<token>
```

`meta.py token` reads this. It reports the scopes actually on the token,
which is the answer to most 403s. A system user token shows no expiry.

## Insights

```
GET /act_<id>/insights
  ?fields=spend,impressions,clicks,ctr,cpc,reach,frequency,actions,action_values
  &level=campaign
  &time_range={"since":"2026-08-11","until":"2026-09-09"}
  &action_attribution_windows=7d_click,1d_view
```

`level` is one of `account`, `campaign`, `adset`, `ad`. Paging is cursor
based through `paging.next`, capped at 25 pages here so a reporting run
cannot turn into a rate limit.

### The attribution change that silently zeroes reports

On **2026-01-12** Meta removed the 7-day-view and 28-day-view attribution
windows. Requests for `7d_view` or `28d_view` now **return empty rather than
an error**, so any tool still asking for them reports zeros with no warning
anywhere. Advertisers saw reported conversions fall 15 to 40 percent
overnight with no change to their campaigns.

The default here is `7d_click,1d_view`, matching what Meta itself now
defaults to. Override with `--windows` only if you know why.

Data retention also tightened: 13 months for unique and hourly breakdowns,
6 months for frequency. Marketing mix modeling breakdowns moved to async
jobs only.

### Conversions are an array, not a number

There is no single `conversions` field. `actions` comes back as a list:

```json
"actions": [{"action_type": "landing_page_view", "value": "300"},
            {"action_type": "lead", "value": "14"}]
```

So "conversions" depends entirely on which action type you mean. Without
naming one, every campaign looks like it converted brilliantly on page
views. `meta.py` picks the first money-shaped action it finds (`purchase`,
then `lead`, then the pixel variants) and **prints which one it used** in
the `action` column. Name it explicitly with `--action-type lead` for
anything a client sees.

## Money is in minor units

`daily_budget: "5000"` is 50.00 in the account currency. Divide by 100.
`minor_to_major()` is the only place this happens. Reporting it raw turns a
50 dollar budget into 5000.

## Breakdowns

`&breakdowns=age` splits any insights call. Useful ones:
`age`, `gender`, `country`, `publisher_platform` (Facebook against
Instagram), `platform_position` (feed against stories against reels),
`device_platform`, `impression_device`.

`meta.py breakdown <client> --by publisher_platform` is usually the fastest
way to find spend going somewhere nobody chose.

## Writes

Updates are `POST /<object-id>` with form-encoded fields, not JSON.

```
POST /<campaign-id>   status=PAUSED
POST /<adset-id>      daily_budget=5000
```

Both write commands verify the object belongs to the ad account of the
client named on the command line, and refuse if it does not. An ID typed
one digit wrong otherwise reaches a stranger's campaign, and Meta will
happily pause it if the system user has access.

Ad set budgets on a lifetime schedule are refused outright rather than
half-changed: switching a lifetime budget needs a schedule too, so that one
belongs in the UI.
