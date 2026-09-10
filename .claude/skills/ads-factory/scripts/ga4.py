#!/usr/bin/env python3
"""Google Analytics 4, direct. Admin API for structure, Data API for numbers.

    ga4.py properties                        every GA4 property this token sees
    ga4.py streams   <client>                data streams and measurement IDs
    ga4.py events    <client>                which events count as conversions
    ga4.py settings  <client>                property basics and data retention
    ga4.py report    <client> [--days 28] [--by sessionDefaultChannelGroup]
    ga4.py landing   <client> [--days 28]    landing pages by session
    ga4.py conversions <client> [--days 28]  key events by channel
    ga4.py realtime  <client>                active users right now
    ga4.py dims      <client> [--find lead]  valid dimensions and metrics

Admin API v1beta on analyticsadmin.googleapis.com, Data API v1beta on
analyticsdata.googleapis.com. Both read out of their discovery documents.

A GA4 property ID is the number in Admin > Property details, not the
G-XXXXXXX measurement ID. The registry refuses the G- form on the way in.
"""

import argparse
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import accounts  # noqa: E402
import gfads  # noqa: E402

ADMIN = "https://analyticsadmin.googleapis.com/v1beta"
DATA = "https://analyticsdata.googleapis.com/v1beta"


def prop(args):
    if getattr(args, "property_id", None):
        return accounts.normalize_ga4(args.property_id)
    if getattr(args, "client", None):
        return accounts.resolve(args.client, "ga4")
    gfads.die("need a client slug or --property-id")


def admin_get(path):
    return gfads.request("GET", "%s/%s" % (ADMIN, path.lstrip("/")),
                         headers=gfads.google_headers())


def run_report(pid, body):
    return gfads.request("POST", "%s/properties/%s:runReport" % (DATA, pid),
                         headers=gfads.google_headers(), body=body)


def cmd_properties(args):
    """accountSummaries is the one call that lists every property across
    every account in one response, which is what makes onboarding quick."""
    got = admin_get("accountSummaries?pageSize=200")
    rows = []
    for acct in got.get("accountSummaries") or []:
        for p in acct.get("propertySummaries") or []:
            rows.append({
                "property_id": (p.get("property") or "").split("/")[-1],
                "property": p.get("displayName", ""),
                "account": acct.get("displayName", ""),
                "type": p.get("propertyType", "").replace("PROPERTY_TYPE_", ""),
            })
    rows.sort(key=lambda r: (r["account"], r["property"]))
    gfads.out(rows, ["property_id", "property", "account", "type"],
              as_json=args.json,
              empty="no GA4 properties. The Google user needs access in GA4 first.")


def cmd_streams(args):
    pid = prop(args)
    got = admin_get("properties/%s/dataStreams?pageSize=200" % pid)
    rows = []
    for s in got.get("dataStreams") or []:
        web = s.get("webStreamData") or {}
        rows.append({
            "stream_id": (s.get("name") or "").split("/")[-1],
            "name": s.get("displayName", ""),
            "type": s.get("type", "").replace("_DATA_STREAM", ""),
            "measurement_id": web.get("measurementId", ""),
            "url": web.get("defaultUri", ""),
        })
    gfads.out(rows, ["stream_id", "name", "type", "measurement_id", "url"],
              as_json=args.json, empty="this property has no data stream")
    gfads.note("The measurement_id is what goes into the GTM Google tag.")


def cmd_events(args):
    pid = prop(args)
    got = admin_get("properties/%s/conversionEvents?pageSize=200" % pid)
    rows = [{
        "event": e.get("eventName", ""),
        "counting": e.get("countingMethod", "").replace("_", " ").lower(),
        "deletable": e.get("deletable", ""),
        "custom": e.get("custom", ""),
    } for e in (got.get("conversionEvents") or [])]
    gfads.out(rows, ["event", "counting", "deletable", "custom"],
              as_json=args.json,
              empty="no key events marked. Nothing in this property counts as a "
                    "conversion, so Ads has nothing to import.")


def cmd_settings(args):
    pid = prop(args)
    p = admin_get("properties/%s" % pid)
    try:
        retention = admin_get("properties/%s/dataRetentionSettings" % pid)
    except SystemExit:
        retention = {}
    rows = [{
        "property": p.get("displayName", ""),
        "id": pid,
        "currency": p.get("currencyCode", ""),
        "timezone": p.get("timeZone", ""),
        "industry": p.get("industryCategory", ""),
        "created": p.get("createTime", ""),
        "retention": retention.get("eventDataRetention", "unknown"),
    }]
    gfads.out(rows, list(rows[0].keys()), as_json=args.json)
    if retention.get("eventDataRetention") == "TWO_MONTHS":
        gfads.note("note: event retention is 2 months, the GA4 default. "
                   "14 months is free and worth switching on.")


def report_rows(got, dim_names, metric_names):
    rows = []
    for r in got.get("rows") or []:
        row = {}
        for name, value in zip(dim_names, r.get("dimensionValues") or []):
            row[name] = value.get("value", "")
        for name, value in zip(metric_names, r.get("metricValues") or []):
            raw = value.get("value", "0")
            try:
                num = float(raw)
                if "." not in raw:
                    row[name] = int(num)
                else:
                    # Rates come back as fractions like 0.0734. Rounding those
                    # to 2 places turns 7.34% into 7%, so sub-1 values keep
                    # four places.
                    row[name] = round(num, 4) if abs(num) < 1 else round(num, 2)
            except ValueError:
                row[name] = raw
        rows.append(row)
    return rows


DEFAULT_METRICS = ["sessions", "totalUsers", "keyEvents", "userKeyEventRate",
                   "averageSessionDuration"]


def cmd_report(args):
    pid = prop(args)
    start, end = gfads.date_range(args.days)
    dims = [args.by]
    metrics = args.metrics or DEFAULT_METRICS
    got = run_report(pid, {
        "dateRanges": [{"startDate": start, "endDate": end}],
        "dimensions": [{"name": d} for d in dims],
        "metrics": [{"name": m} for m in metrics],
        "limit": args.limit,
        "orderBys": [{"desc": True, "metric": {"metricName": metrics[0]}}],
    })
    gfads.note("GA4 property %s, %s to %s, by %s" % (pid, start, end, args.by))
    rows = report_rows(got, dims, metrics)
    gfads.out(rows, dims + metrics, as_json=args.json, empty="no data in this window")


def cmd_landing(args):
    args.by = "landingPagePlusQueryString"
    args.metrics = ["sessions", "keyEvents", "bounceRate"]
    cmd_report(args)


def cmd_conversions(args):
    """Key events split by channel, which is the number that says whether the
    ad spend is producing anything."""
    pid = prop(args)
    start, end = gfads.date_range(args.days)
    dims = ["sessionDefaultChannelGroup", "eventName"]
    metrics = ["eventCount", "sessions"]
    got = run_report(pid, {
        "dateRanges": [{"startDate": start, "endDate": end}],
        "dimensions": [{"name": d} for d in dims],
        "metrics": [{"name": m} for m in metrics],
        "dimensionFilter": {"filter": {
            "fieldName": "isKeyEvent",
            "stringFilter": {"value": "true"}}},
        "limit": args.limit,
        "orderBys": [{"desc": True, "metric": {"metricName": "eventCount"}}],
    })
    gfads.note("GA4 key events, property %s, %s to %s" % (pid, start, end))
    gfads.out(report_rows(got, dims, metrics), dims + metrics,
              as_json=args.json,
              empty="no key events recorded. Either nothing is marked as a key "
                    "event, or the tag is not firing.")


def cmd_realtime(args):
    pid = prop(args)
    got = gfads.request("POST", "%s/properties/%s:runRealtimeReport" % (DATA, pid),
                        headers=gfads.google_headers(),
                        body={"dimensions": [{"name": "unifiedScreenName"}],
                              "metrics": [{"name": "activeUsers"}],
                              "limit": 20})
    gfads.out(report_rows(got, ["unifiedScreenName"], ["activeUsers"]),
              ["unifiedScreenName", "activeUsers"], as_json=args.json,
              empty="nobody on the site right now")


def cmd_dims(args):
    """The metadata endpoint, because GA4 renames things and an invalid
    metric name is a 400 that does not suggest the right one."""
    pid = prop(args)
    got = gfads.request("GET", "%s/properties/%s/metadata" % (DATA, pid),
                        headers=gfads.google_headers())
    rows = []
    for kind, key in [("dimension", "dimensions"), ("metric", "metrics")]:
        for item in got.get(key) or []:
            name = item.get("apiName", "")
            label = item.get("uiName", "")
            if args.find and args.find.lower() not in (name + label).lower():
                continue
            rows.append({"kind": kind, "api_name": name, "ui_name": label})
    gfads.out(rows, ["kind", "api_name", "ui_name"], as_json=args.json,
              empty="nothing matched")


def main():
    ap = argparse.ArgumentParser(description="Google Analytics 4, direct.")
    ap.add_argument("--json", action="store_true")
    sub = ap.add_subparsers(dest="cmd", required=True)
    common = gfads.json_parent()

    def sp(cmd_name, **kw):
        return sub.add_parser(cmd_name, parents=[common], **kw)


    def client_arg(p, days=False):
        p.add_argument("client", nargs="?", help="registry slug")
        p.add_argument("--property-id", dest="property_id",
                       help="numeric property ID instead of a slug")
        if days:
            p.add_argument("--days", type=int, default=28,
                           help="window ending yesterday (default 28)")
            p.add_argument("--limit", type=int, default=25)
        return p

    sp("properties", help="all GA4 properties").set_defaults(
        func=cmd_properties)
    client_arg(sp("streams", help="data streams")).set_defaults(
        func=cmd_streams)
    client_arg(sp("events", help="key events")).set_defaults(
        func=cmd_events)
    client_arg(sp("settings")).set_defaults(func=cmd_settings)

    p = client_arg(sp("report", help="a GA4 report"), days=True)
    p.add_argument("--by", default="sessionDefaultChannelGroup",
                   help="dimension (default sessionDefaultChannelGroup)")
    p.add_argument("--metrics", nargs="+", help="override the default metrics")
    p.set_defaults(func=cmd_report)

    p = client_arg(sp("landing", help="landing pages"), days=True)
    p.set_defaults(func=cmd_landing, by=None, metrics=None)

    client_arg(sp("conversions", help="key events by channel"),
               days=True).set_defaults(func=cmd_conversions)
    client_arg(sp("realtime")).set_defaults(func=cmd_realtime)

    p = client_arg(sp("dims", help="valid dimensions and metrics"))
    p.add_argument("--find", help="filter by substring")
    p.set_defaults(func=cmd_dims)

    args = ap.parse_args()
    args.func(args)


if __name__ == "__main__":
    main()
