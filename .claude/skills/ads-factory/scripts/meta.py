#!/usr/bin/env python3
"""Meta Marketing API, direct over the Graph endpoint.

    meta.py token                            what the system user token can do
    meta.py accounts                         ad accounts in the Business Manager
    meta.py campaigns <client>               campaigns with status and budget
    meta.py report    <client> [--days 30] [--level campaign]
    meta.py breakdown <client> --by age      insights split by a breakdown
    meta.py versions                         which API versions still answer
    meta.py pause-campaign <client> --id N [--confirm]
    meta.py set-budget     <client> --adset-id N --daily 50 [--confirm]

Attribution note, and it matters: Meta removed the 7-day-view and
28-day-view windows on 2026-01-12 and they now return empty rather than an
error, so anything still asking for them silently reports zero. The default
here is 7d_click plus 1d_view, which is what Meta itself now defaults to.
See ../references/meta-marketing-api.md.
"""

import argparse
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import accounts  # noqa: E402
import gfads  # noqa: E402

# The windows that still return data in 2026. 7d_view and 28d_view are gone.
DEFAULT_WINDOWS = ["7d_click", "1d_view"]

INSIGHT_FIELDS = [
    "spend", "impressions", "clicks", "ctr", "cpc", "cpm", "reach",
    "frequency", "actions", "action_values",
]


def account_id(args):
    if getattr(args, "act", None):
        # Same normalizer the registry uses, so act_123, 123 and 123-456 all
        # land on one form rather than three near-misses.
        return accounts.normalize_meta(args.act)
    if getattr(args, "client", None):
        return accounts.resolve(args.client, "meta")
    gfads.die("need a client slug or --act")


def cmd_token(args):
    """debug_token is the fastest way to answer 'why is this 403'. It shows
    the scopes actually on the token, which is usually the answer."""
    token = gfads.need("META_SYSTEM_USER_TOKEN", "nothing works without it")
    got = gfads.meta_get("debug_token", {"input_token": token})
    d = got.get("data") or {}
    rows = [{
        "app_id": d.get("app_id", ""),
        "type": d.get("type", ""),
        "valid": d.get("is_valid", ""),
        "expires": d.get("expires_at", 0) or "never (system user)",
        "scopes": ",".join(d.get("scopes") or []) or "(none reported)",
    }]
    gfads.out(rows, ["app_id", "type", "valid", "expires", "scopes"],
              as_json=args.json)
    for needed in ["ads_read", "ads_management", "business_management"]:
        if needed not in (d.get("scopes") or []):
            gfads.note("note: token has no %s scope" % needed)


def cmd_accounts(args):
    """Owned and client ad accounts, so a new client's act_ ID is read off
    the Business Manager instead of copied out of a browser tab."""
    biz = gfads.need("META_BUSINESS_ID",
                     "needed to list the Business Manager's ad accounts")
    fields = "id,account_id,name,account_status,currency,timezone_name,amount_spent"
    rows = []
    for edge, kind in [("owned_ad_accounts", "owned"),
                       ("client_ad_accounts", "client")]:
        for a in gfads.meta_paged("%s/%s" % (biz, edge),
                                  {"fields": fields, "limit": 100}):
            rows.append({
                "act_id": "act_%s" % a.get("account_id", ""),
                "name": a.get("name", ""),
                "relationship": kind,
                "status": a.get("account_status", ""),
                "currency": a.get("currency", ""),
                "timezone": a.get("timezone_name", ""),
            })
    gfads.out(rows, ["act_id", "name", "relationship", "status", "currency",
                     "timezone"],
              as_json=args.json, empty="no ad accounts on this Business Manager")


def cmd_campaigns(args):
    act = account_id(args)
    rows = gfads.meta_paged("%s/campaigns" % act, {
        "fields": ("id,name,status,effective_status,objective,daily_budget,"
                   "lifetime_budget,bid_strategy,start_time,stop_time"),
        "limit": 100,
    })
    view = [{
        "id": c.get("id"),
        "name": c.get("name", ""),
        "status": c.get("effective_status") or c.get("status", ""),
        "objective": c.get("objective", ""),
        # Meta returns budgets as a string of minor units: 5000 is 50.00.
        "daily": minor_to_major(c.get("daily_budget")),
        "lifetime": minor_to_major(c.get("lifetime_budget")),
        "bid_strategy": c.get("bid_strategy", ""),
    } for c in rows]
    gfads.out(view, ["id", "name", "status", "objective", "daily", "lifetime",
                     "bid_strategy"],
              as_json=args.json, empty="no campaigns on this account")


def minor_to_major(value):
    """Meta sends money as a string of minor units. Reporting it raw is how a
    50.00 budget gets read as 5000."""
    if value in (None, ""):
        return ""
    try:
        return round(int(value) / 100, 2)
    except (TypeError, ValueError):
        return value


def pick_actions(row, wanted=None):
    """Flatten the actions array into a count and a value.

    Meta returns conversions as a list of {action_type, value}, so there is
    no single 'conversions' number. Without naming the action type you care
    about, every campaign looks like it converted on page views.
    """
    actions = {a.get("action_type"): a.get("value") for a in (row.get("actions") or [])}
    values = {a.get("action_type"): a.get("value")
              for a in (row.get("action_values") or [])}
    if wanted:
        return (float(actions.get(wanted) or 0), float(values.get(wanted) or 0),
                wanted)
    # No action type named: prefer the ones that mean money, in order.
    for key in ["purchase", "lead", "offsite_conversion.fb_pixel_purchase",
                "offsite_conversion.fb_pixel_lead", "onsite_conversion.lead_grouped",
                "link_click"]:
        if key in actions:
            return float(actions[key] or 0), float(values.get(key) or 0), key
    return 0.0, 0.0, "(none)"


def insights(act, args, extra=None):
    start, end = gfads.date_range(args.days)
    params = {
        "fields": ",".join(INSIGHT_FIELDS),
        "level": getattr(args, "level", "campaign"),
        "time_range": json.dumps({"since": start, "until": end}),
        "action_attribution_windows": ",".join(
            getattr(args, "windows", None) or DEFAULT_WINDOWS),
        "limit": 200,
    }
    if getattr(args, "level", "campaign") != "account":
        params["fields"] = "campaign_name,adset_name,ad_name," + params["fields"]
    params.update(extra or {})
    gfads.note("Meta %s to %s, %s, attribution %s"
               % (start, end, act, params["action_attribution_windows"]))
    return gfads.meta_paged("%s/insights" % act, params)


def insight_row(r, label, wanted):
    spend = float(r.get("spend") or 0)
    clicks = int(float(r.get("clicks") or 0))
    conv, value, used = pick_actions(r, wanted)
    return {
        "name": r.get(label) or r.get("campaign_name") or "(account)",
        "impr": int(float(r.get("impressions") or 0)),
        "clicks": clicks,
        "ctr": "%.2f%%" % float(r.get("ctr") or 0),
        "spend": round(spend, 2),
        "cpc": round(spend / clicks, 2) if clicks else 0.0,
        "action": used,
        "conv": round(conv, 1),
        "cost_per": round(spend / conv, 2) if conv else "",
        "value": round(value, 2),
        "roas": round(value / spend, 2) if spend else "",
    }


ROW_COLS = ["name", "impr", "clicks", "ctr", "spend", "cpc", "action", "conv",
            "cost_per", "value", "roas"]

LEVEL_LABEL = {"campaign": "campaign_name", "adset": "adset_name",
               "ad": "ad_name", "account": "campaign_name"}


def cmd_report(args):
    act = account_id(args)
    rows = insights(act, args)
    label = LEVEL_LABEL.get(args.level, "campaign_name")
    view = [insight_row(r, label, args.action_type) for r in rows]
    view.sort(key=lambda r: r["spend"], reverse=True)
    gfads.out(view, ROW_COLS, as_json=args.json, empty="no spend in this window")


def cmd_breakdown(args):
    act = account_id(args)
    rows = insights(act, args, {"breakdowns": args.by})
    view = []
    for r in rows:
        row = insight_row(r, LEVEL_LABEL.get(args.level, "campaign_name"),
                          args.action_type)
        row["segment"] = r.get(args.by, "")
        view.append(row)
    view.sort(key=lambda r: r["spend"], reverse=True)
    gfads.out(view, ["segment"] + ROW_COLS, as_json=args.json,
              empty="no data for this breakdown")


def cmd_versions(args):
    """Probe which Graph versions still answer, so the pin in config.env is
    a checked fact rather than something copied off a blog post."""
    import urllib.parse
    token = gfads.need("META_SYSTEM_USER_TOKEN", "needed to probe versions")
    configured = gfads.meta_version()
    candidates = args.candidates or [
        "v27.0", "v26.0", "v25.0", "v24.0", "v23.0", "v22.0",
    ]
    rows = []
    for v in candidates:
        url = "https://graph.facebook.com/%s/me?%s" % (
            v, urllib.parse.urlencode({"fields": "id", "access_token": token}))
        try:
            gfads.request("GET", url)
            state = "answers"
        except SystemExit:
            state = "rejected or unsupported"
        rows.append({"version": v, "result": state,
                     "in_config": "<- META_API_VERSION" if v == configured else ""})
    gfads.out(rows, ["version", "result", "in_config"], as_json=args.json)
    gfads.note("Pin the newest version that answers in config.env, then "
               "re-run a report to confirm nothing changed shape.")


# --------------------------------------------------------------------------
# Writes, gated
# --------------------------------------------------------------------------

def cmd_pause_campaign(args):
    act = account_id(args)
    current = gfads.meta_get(str(args.id),
                             {"fields": "name,status,effective_status,account_id"})
    if "act_%s" % current.get("account_id", "") != act:
        gfads.die("campaign %s belongs to act_%s, not %s. Refusing to touch a "
                  "campaign outside the client you named."
                  % (args.id, current.get("account_id"), act), gfads.EXIT_API)
    if current.get("status") == "PAUSED":
        gfads.note("%s is already paused. Nothing to do." % current.get("name"))
        return
    gfads.gate(args.confirm,
               "pause Meta campaign %s (%s) on %s, currently %s"
               % (args.id, current.get("name"), act, current.get("status")),
               {"status": "PAUSED"})
    gfads.meta_post(str(args.id), {"status": "PAUSED"})
    print("paused %s (%s)" % (args.id, current.get("name")))


def cmd_set_budget(args):
    act = account_id(args)
    current = gfads.meta_get(str(args.adset_id),
                             {"fields": "name,daily_budget,lifetime_budget,account_id"})
    if "act_%s" % current.get("account_id", "") != act:
        gfads.die("ad set %s belongs to act_%s, not %s. Refusing."
                  % (args.adset_id, current.get("account_id"), act), gfads.EXIT_API)
    if current.get("lifetime_budget"):
        gfads.die("ad set %s runs on a lifetime budget, not a daily one. "
                  "Changing it needs a schedule too, so do that one in the UI."
                  % args.adset_id, gfads.EXIT_API)
    was = minor_to_major(current.get("daily_budget"))
    minor = int(round(float(args.daily) * 100))
    gfads.gate(args.confirm,
               "change Meta ad set %s (%s) daily budget on %s from %s to %s"
               % (args.adset_id, current.get("name"), act, was, args.daily),
               {"daily_budget": minor})
    gfads.meta_post(str(args.adset_id), {"daily_budget": minor})
    print("ad set %s (%s): %s -> %s per day"
          % (args.adset_id, current.get("name"), was, args.daily))


def main():
    ap = argparse.ArgumentParser(description="Meta Marketing API, direct.")
    ap.add_argument("--json", action="store_true")
    sub = ap.add_subparsers(dest="cmd", required=True)
    common = gfads.json_parent()

    def sp(cmd_name, **kw):
        return sub.add_parser(cmd_name, parents=[common], **kw)


    def client_arg(p):
        p.add_argument("client", nargs="?", help="registry slug")
        p.add_argument("--act", help="use a raw ad account ID instead")
        return p

    def report_args(p):
        client_arg(p)
        p.add_argument("--days", type=int, default=30,
                       help="window ending yesterday (default 30)")
        p.add_argument("--level", default="campaign",
                       choices=["account", "campaign", "adset", "ad"])
        p.add_argument("--action-type", dest="action_type",
                       help="the conversion action to report, e.g. lead, purchase")
        p.add_argument("--windows", nargs="+",
                       help="attribution windows (default 7d_click 1d_view; "
                            "7d_view and 28d_view were removed in Jan 2026 and "
                            "silently return nothing)")
        return p

    sp("token", help="what the token can do").set_defaults(func=cmd_token)
    sp("accounts", help="ad accounts in the Business Manager").set_defaults(
        func=cmd_accounts)
    client_arg(sp("campaigns", help="campaigns with budgets")).set_defaults(
        func=cmd_campaigns)
    report_args(sp("report", help="performance")).set_defaults(
        func=cmd_report)

    p = report_args(sp("breakdown", help="insights by breakdown"))
    p.add_argument("--by", required=True,
                   help="e.g. age, gender, publisher_platform, country, "
                        "platform_position, device_platform")
    p.set_defaults(func=cmd_breakdown)

    p = sp("versions", help="probe which Graph versions answer")
    p.add_argument("--candidates", nargs="+")
    p.set_defaults(func=cmd_versions)

    p = client_arg(sp("pause-campaign", help="pause one campaign"))
    p.add_argument("--id", required=True)
    p.add_argument("--confirm", action="store_true",
                   help="actually do it; without this the command refuses")
    p.set_defaults(func=cmd_pause_campaign)

    p = client_arg(sp("set-budget", help="change an ad set daily budget"))
    p.add_argument("--adset-id", dest="adset_id", required=True)
    p.add_argument("--daily", required=True, help="new daily amount, major units")
    p.add_argument("--confirm", action="store_true",
                   help="actually do it; without this the command refuses")
    p.set_defaults(func=cmd_set_budget)

    args = ap.parse_args()
    args.func(args)


if __name__ == "__main__":
    main()
