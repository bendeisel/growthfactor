#!/usr/bin/env python3
"""Google Search Console API, direct.

    gsc.py sites                              properties this token can read
    gsc.py query   <client> [--days 28] [--by query|page|country|device|date]
    gsc.py pages   <client> [--days 28]       top pages
    gsc.py compare <client> [--days 28]       this window against the one before
    gsc.py sitemaps <client>                  submitted sitemaps and their errors
    gsc.py inspect  <client> --url https://...  index status of one URL
    gsc.py submit-sitemap <client> --url https://.../sitemap.xml [--confirm]

Two base paths on one host, which is the trap in this API: search analytics
and sitemaps live under webmasters/v3, URL inspection lives under v1. Both
verified in the discovery document
(https://searchconsole.googleapis.com/$discovery/rest?version=v1).

Search Console data lags two to three days, so a window ending yesterday
will show a soft tail. That is the API, not a bug in the report.
"""

import argparse
import os
import sys
import urllib.parse

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import accounts  # noqa: E402
import gfads  # noqa: E402

HOST = "https://searchconsole.googleapis.com"
V3 = HOST + "/webmasters/v3"
V1 = HOST + "/v1"


def site(args):
    if getattr(args, "site", None):
        return accounts.normalize_gsc(args.site)
    if getattr(args, "client", None):
        return accounts.resolve(args.client, "gsc")
    gfads.die("need a client slug or --site")


def enc(site_url):
    """The property string goes in the path and must be fully encoded, slashes
    and colons included, or the API reads it as more path segments."""
    return urllib.parse.quote(site_url, safe="")


def query_api(site_url, body):
    return gfads.request("POST", "%s/sites/%s/searchAnalytics/query"
                         % (V3, enc(site_url)),
                         headers=gfads.google_headers(), body=body)


def cmd_sites(args):
    got = gfads.request("GET", "%s/sites" % V3, headers=gfads.google_headers())
    rows = [{"property": s.get("siteUrl"), "permission": s.get("permissionLevel", "")}
            for s in (got.get("siteEntry") or [])]
    rows.sort(key=lambda r: r["property"] or "")
    gfads.out(rows, ["property", "permission"], as_json=args.json,
              empty="no Search Console properties. The Google user needs to be "
                    "added to the property first.")


def totals(site_url, start, end):
    rows = query_api(site_url, {"startDate": start, "endDate": end,
                                "dataState": "FINAL"}).get("rows") or []
    if not rows:
        return {"clicks": 0, "impressions": 0, "ctr": 0.0, "position": 0.0}
    r = rows[0]
    return {"clicks": r.get("clicks", 0), "impressions": r.get("impressions", 0),
            "ctr": r.get("ctr", 0.0), "position": r.get("position", 0.0)}


def dim_rows(site_url, start, end, dimension, limit):
    body = {"startDate": start, "endDate": end, "dimensions": [dimension],
            "rowLimit": limit, "dataState": "FINAL"}
    got = query_api(site_url, body)
    out = []
    for r in got.get("rows") or []:
        out.append({
            dimension: (r.get("keys") or [""])[0],
            "clicks": r.get("clicks", 0),
            "impr": r.get("impressions", 0),
            "ctr": "%.2f%%" % (r.get("ctr", 0.0) * 100),
            "position": round(r.get("position", 0.0), 1),
        })
    return out


def cmd_query(args):
    site_url = site(args)
    start, end = gfads.date_range(args.days)
    gfads.note("Search Console %s, %s to %s, by %s"
               % (site_url, start, end, args.by))
    rows = dim_rows(site_url, start, end, args.by, args.limit)
    gfads.out(rows, [args.by, "clicks", "impr", "ctr", "position"],
              as_json=args.json,
              empty="no rows. Data lags 2-3 days, so a very recent window can "
                    "be empty.")


def cmd_pages(args):
    args.by = "page"
    cmd_query(args)


def cmd_compare(args):
    """Window against the window before it, which is the only version of
    this number a client actually reacts to."""
    import datetime
    site_url = site(args)
    start, end = gfads.date_range(args.days)
    prev_end = (datetime.date.fromisoformat(start) - datetime.timedelta(days=1))
    prev_start = prev_end - datetime.timedelta(days=args.days - 1)
    now = totals(site_url, start, end)
    was = totals(site_url, prev_start.isoformat(), prev_end.isoformat())

    def delta(a, b):
        if not b:
            return "n/a" if not a else "new"
        return "%+.1f%%" % ((a - b) / b * 100)

    rows = [
        {"metric": "clicks", "current": now["clicks"], "previous": was["clicks"],
         "change": delta(now["clicks"], was["clicks"])},
        {"metric": "impressions", "current": now["impressions"],
         "previous": was["impressions"],
         "change": delta(now["impressions"], was["impressions"])},
        {"metric": "ctr", "current": "%.2f%%" % (now["ctr"] * 100),
         "previous": "%.2f%%" % (was["ctr"] * 100),
         "change": delta(now["ctr"], was["ctr"])},
        # Position improves as it falls, so the sign is inverted deliberately.
        {"metric": "avg position", "current": round(now["position"], 1),
         "previous": round(was["position"], 1),
         "change": delta(was["position"], now["position"])},
    ]
    gfads.note("%s: %s..%s against %s..%s"
               % (site_url, start, end, prev_start, prev_end))
    gfads.out(rows, ["metric", "current", "previous", "change"], as_json=args.json)
    gfads.note("On avg position, a positive change means the ranking improved.")


def cmd_sitemaps(args):
    site_url = site(args)
    got = gfads.request("GET", "%s/sites/%s/sitemaps" % (V3, enc(site_url)),
                        headers=gfads.google_headers())
    rows = []
    for s in got.get("sitemap") or []:
        counts = {c.get("type"): c.get("submitted") for c in (s.get("contents") or [])}
        rows.append({
            "sitemap": s.get("path", ""),
            "last_downloaded": s.get("lastDownloaded", "never"),
            "submitted": ",".join("%s=%s" % (k, v) for k, v in counts.items()) or "-",
            "errors": s.get("errors", 0),
            "warnings": s.get("warnings", 0),
            "pending": s.get("isPending", False),
        })
    gfads.out(rows, ["sitemap", "last_downloaded", "submitted", "errors",
                     "warnings", "pending"],
              as_json=args.json, empty="no sitemap submitted for this property")


def cmd_inspect(args):
    """URL Inspection: the one endpoint that answers 'is this page actually
    in Google', which no amount of ranking data tells you."""
    site_url = site(args)
    got = gfads.request("POST", "%s/urlInspection/index:inspect" % V1,
                        headers=gfads.google_headers(),
                        body={"inspectionUrl": args.url, "siteUrl": site_url,
                              "languageCode": args.language})
    res = (got.get("inspectionResult") or {})
    idx = res.get("indexStatusResult") or {}
    rows = [{
        "verdict": idx.get("verdict", ""),
        "coverage": idx.get("coverageState", ""),
        "robots": idx.get("robotsTxtState", ""),
        "indexing_allowed": idx.get("indexingState", ""),
        "canonical_google": idx.get("googleCanonical", ""),
        "canonical_declared": idx.get("userCanonical", ""),
        "last_crawl": idx.get("lastCrawlTime", "never"),
    }]
    gfads.out(rows, list(rows[0].keys()), as_json=args.json)
    mobile = (res.get("mobileUsabilityResult") or {}).get("verdict")
    if mobile:
        gfads.note("mobile usability: %s" % mobile)
    if res.get("inspectionResultLink"):
        gfads.note("in the UI: %s" % res["inspectionResultLink"])


def cmd_submit_sitemap(args):
    site_url = site(args)
    gfads.gate(args.confirm,
               "submit %s as a sitemap for %s in Search Console"
               % (args.url, site_url),
               {"siteUrl": site_url, "feedpath": args.url})
    gfads.request("PUT", "%s/sites/%s/sitemaps/%s"
                  % (V3, enc(site_url), enc(args.url)),
                  headers=gfads.google_headers())
    print("submitted %s" % args.url)


def main():
    ap = argparse.ArgumentParser(description="Google Search Console, direct.")
    ap.add_argument("--json", action="store_true")
    sub = ap.add_subparsers(dest="cmd", required=True)
    common = gfads.json_parent()

    def sp(cmd_name, **kw):
        return sub.add_parser(cmd_name, parents=[common], **kw)


    def client_arg(p, days=False):
        p.add_argument("client", nargs="?", help="registry slug")
        p.add_argument("--site", help="property string instead of a slug")
        if days:
            p.add_argument("--days", type=int, default=28,
                           help="window ending yesterday (default 28)")
            p.add_argument("--limit", type=int, default=25)
        return p

    sp("sites", help="properties this token can read").set_defaults(
        func=cmd_sites)

    p = client_arg(sp("query", help="search performance"), days=True)
    p.add_argument("--by", default="query",
                   choices=["query", "page", "country", "device", "date",
                            "searchAppearance"])
    p.set_defaults(func=cmd_query)

    client_arg(sp("pages", help="top pages"), days=True).set_defaults(
        func=cmd_pages)
    client_arg(sp("compare", help="window over previous window"),
               days=True).set_defaults(func=cmd_compare)
    client_arg(sp("sitemaps")).set_defaults(func=cmd_sitemaps)

    p = client_arg(sp("inspect", help="index status of one URL"))
    p.add_argument("--url", required=True)
    p.add_argument("--language", default="en-US")
    p.set_defaults(func=cmd_inspect)

    p = client_arg(sp("submit-sitemap"))
    p.add_argument("--url", required=True, help="full sitemap URL")
    p.add_argument("--confirm", action="store_true")
    p.set_defaults(func=cmd_submit_sitemap)

    args = ap.parse_args()
    args.func(args)


if __name__ == "__main__":
    main()
