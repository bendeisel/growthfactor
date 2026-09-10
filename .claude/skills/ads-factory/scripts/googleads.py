#!/usr/bin/env python3
"""Google Ads API v25, direct over REST.

    googleads.py accounts                        every account the MCC can see
    googleads.py tree                            the MCC hierarchy
    googleads.py report   <client> [--days 30]   campaign performance
    googleads.py terms    <client> [--days 30]   search terms that spent
    googleads.py keywords <client> [--days 30]   keyword performance
    googleads.py budgets  <client>               current budgets
    googleads.py gaql     <client> --query "..." any GAQL query, raw
    googleads.py pause-campaign  <client> --id N [--confirm]
    googleads.py set-budget      <client> --id N --daily 50 [--confirm]

Endpoints and paths read out of the v25 discovery document
(https://googleads.googleapis.com/$discovery/rest?version=v25, revision
20260831), not from memory. See ../references/google-ads-api.md.

<client> is a registry slug, so the customer ID never gets typed by hand.
Pass --customer-id to work on an account that is not a client yet.
"""

import argparse
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import accounts  # noqa: E402
import gfads  # noqa: E402


def api_version():
    return gfads.config().get("GOOGLE_ADS_API_VERSION") or "v25"


def base():
    return "https://googleads.googleapis.com/%s" % api_version()


def headers():
    """developer-token on every call; login-customer-id whenever the account
    is reached through the manager account, which for us is always."""
    h = {
        "developer-token": gfads.need(
            "GOOGLE_ADS_DEVELOPER_TOKEN",
            "every Google Ads call needs it. Apply in the MCC under "
            "Tools > API Center."),
    }
    mcc = gfads.config().get("GOOGLE_ADS_LOGIN_CUSTOMER_ID", "")
    if mcc:
        h["login-customer-id"] = mcc.replace("-", "")
    return gfads.google_headers(h)


def customer_id(args):
    if getattr(args, "customer_id", None):
        return args.customer_id.replace("-", "")
    if getattr(args, "client", None):
        return accounts.resolve(args.client, "google_ads")
    gfads.die("need a client slug or --customer-id")


def search(cid, query):
    """searchStream: one request, whole result set, no paging token.

    The response is a JSON array of chunks, each with its own results list,
    which is the shape people get wrong when they assume a single object.
    """
    url = "%s/customers/%s/googleAds:searchStream" % (base(), cid)
    got = gfads.request("POST", url, headers=headers(), body={"query": query})
    rows = []
    if isinstance(got, list):
        for chunk in got:
            rows.extend(chunk.get("results") or [])
    else:
        rows.extend(got.get("results") or [])
    return rows


# --------------------------------------------------------------------------
# Reads
# --------------------------------------------------------------------------

def cmd_accounts(args):
    """listAccessibleCustomers returns bare resource names, which are useless
    on their own, so each one gets its descriptive name looked up."""
    got = gfads.request("GET", "%s/customers:listAccessibleCustomers" % base(),
                        headers=headers())
    rows = []
    for name in got.get("resourceNames") or []:
        cid = name.split("/")[-1]
        try:
            detail = search(cid, """
                SELECT customer.id, customer.descriptive_name,
                       customer.currency_code, customer.time_zone,
                       customer.manager, customer.test_account
                FROM customer LIMIT 1""")
        except SystemExit:
            rows.append({"customer_id": cid, "name": "(no access)",
                         "currency": "", "manager": "", "test": ""})
            continue
        for r in detail:
            rows.append({
                "customer_id": cid,
                "name": gfads.dig(r, "customer.descriptive_name") or "",
                "currency": gfads.dig(r, "customer.currency_code") or "",
                "manager": gfads.dig(r, "customer.manager") or False,
                "test": gfads.dig(r, "customer.test_account") or False,
            })
    gfads.out(rows, ["customer_id", "name", "currency", "manager", "test"],
              as_json=args.json, empty="no accessible accounts")


def cmd_tree(args):
    mcc = (args.customer_id or gfads.need(
        "GOOGLE_ADS_LOGIN_CUSTOMER_ID",
        "needed to walk the manager hierarchy")).replace("-", "")
    rows = search(mcc, """
        SELECT customer_client.id, customer_client.descriptive_name,
               customer_client.level, customer_client.manager,
               customer_client.status, customer_client.currency_code
        FROM customer_client
        WHERE customer_client.status = 'ENABLED'
        ORDER BY customer_client.level""")
    view = [{
        "customer_id": gfads.dig(r, "customer_client.id"),
        "name": gfads.dig(r, "customer_client.descriptive_name") or "",
        "level": gfads.dig(r, "customer_client.level"),
        "manager": gfads.dig(r, "customer_client.manager") or False,
        "currency": gfads.dig(r, "customer_client.currency_code") or "",
    } for r in rows]
    gfads.out(view, ["customer_id", "name", "level", "manager", "currency"],
              as_json=args.json, empty="no client accounts under this manager")


def perf_columns():
    return ("metrics.impressions, metrics.clicks, metrics.cost_micros, "
            "metrics.conversions, metrics.conversions_value, "
            "metrics.ctr, metrics.average_cpc")


def perf_row(r, label_field, label_name):
    cost = gfads.money(gfads.dig(r, "metrics.cost_micros"))
    conv = float(gfads.dig(r, "metrics.conversions") or 0)
    value = float(gfads.dig(r, "metrics.conversions_value") or 0)
    clicks = int(gfads.dig(r, "metrics.clicks") or 0)
    return {
        label_name: gfads.dig(r, label_field) or "",
        "impr": int(gfads.dig(r, "metrics.impressions") or 0),
        "clicks": clicks,
        "ctr": "%.2f%%" % (float(gfads.dig(r, "metrics.ctr") or 0) * 100),
        "cost": cost,
        "cpc": round(cost / clicks, 2) if clicks else 0.0,
        "conv": round(conv, 1),
        "cost_per_conv": round(cost / conv, 2) if conv else "",
        "conv_value": round(value, 2),
        "roas": round(value / cost, 2) if cost else "",
    }


PERF_COLS = ["impr", "clicks", "ctr", "cost", "cpc", "conv", "cost_per_conv",
             "conv_value", "roas"]


def cmd_report(args):
    cid = customer_id(args)
    start, end = gfads.date_range(args.days)
    rows = search(cid, """
        SELECT campaign.id, campaign.name, campaign.status,
               campaign.advertising_channel_type, %s
        FROM campaign
        WHERE segments.date BETWEEN '%s' AND '%s'
        ORDER BY metrics.cost_micros DESC""" % (perf_columns(), start, end))
    view = []
    for r in rows:
        row = perf_row(r, "campaign.name", "campaign")
        row["status"] = gfads.dig(r, "campaign.status") or ""
        row["type"] = gfads.dig(r, "campaign.advertising_channel_type") or ""
        row["id"] = gfads.dig(r, "campaign.id")
        view.append(row)
    gfads.note("Google Ads %s to %s, customer %s" % (start, end, cid))
    gfads.out(view, ["id", "campaign", "status", "type"] + PERF_COLS,
              as_json=args.json, empty="no spend in this window")


def cmd_terms(args):
    cid = customer_id(args)
    start, end = gfads.date_range(args.days)
    rows = search(cid, """
        SELECT search_term_view.search_term, campaign.name,
               search_term_view.status, %s
        FROM search_term_view
        WHERE segments.date BETWEEN '%s' AND '%s'
        ORDER BY metrics.cost_micros DESC
        LIMIT %d""" % (perf_columns(), start, end, args.limit))
    view = []
    for r in rows:
        row = perf_row(r, "search_term_view.search_term", "search_term")
        row["campaign"] = gfads.dig(r, "campaign.name") or ""
        row["added_excluded"] = gfads.dig(r, "search_term_view.status") or ""
        view.append(row)
    gfads.note("Search terms %s to %s, customer %s" % (start, end, cid))
    gfads.out(view, ["search_term", "campaign", "added_excluded"] + PERF_COLS,
              as_json=args.json, empty="no search terms in this window")


def cmd_keywords(args):
    cid = customer_id(args)
    start, end = gfads.date_range(args.days)
    rows = search(cid, """
        SELECT ad_group_criterion.keyword.text,
               ad_group_criterion.keyword.match_type,
               ad_group_criterion.status, campaign.name, ad_group.name, %s
        FROM keyword_view
        WHERE segments.date BETWEEN '%s' AND '%s'
        ORDER BY metrics.cost_micros DESC
        LIMIT %d""" % (perf_columns(), start, end, args.limit))
    view = []
    for r in rows:
        row = perf_row(r, "ad_group_criterion.keyword.text", "keyword")
        row["match"] = gfads.dig(r, "ad_group_criterion.keyword.match_type") or ""
        row["campaign"] = gfads.dig(r, "campaign.name") or ""
        row["ad_group"] = gfads.dig(r, "ad_group.name") or ""
        view.append(row)
    gfads.note("Keywords %s to %s, customer %s" % (start, end, cid))
    gfads.out(view, ["keyword", "match", "campaign", "ad_group"] + PERF_COLS,
              as_json=args.json, empty="no keyword data in this window")


def cmd_budgets(args):
    cid = customer_id(args)
    rows = search(cid, """
        SELECT campaign_budget.id, campaign_budget.name,
               campaign_budget.amount_micros,
               campaign_budget.delivery_method,
               campaign_budget.explicitly_shared, campaign.name, campaign.status
        FROM campaign
        WHERE campaign.status != 'REMOVED'""")
    view = [{
        "budget_id": gfads.dig(r, "campaign_budget.id"),
        "budget_name": gfads.dig(r, "campaign_budget.name") or "",
        "daily": gfads.money(gfads.dig(r, "campaign_budget.amount_micros")),
        "delivery": gfads.dig(r, "campaign_budget.delivery_method") or "",
        "shared": gfads.dig(r, "campaign_budget.explicitly_shared") or False,
        "campaign": gfads.dig(r, "campaign.name") or "",
        "campaign_status": gfads.dig(r, "campaign.status") or "",
    } for r in rows]
    gfads.out(view, ["budget_id", "budget_name", "daily", "delivery", "shared",
                     "campaign", "campaign_status"],
              as_json=args.json, empty="no budgets found")


def cmd_gaql(args):
    """The escape hatch. Every report above is just a canned GAQL query, and
    the API has far more resources than anyone should wrap by hand."""
    rows = search(customer_id(args), args.query)
    gfads.out(rows, as_json=True) if args.json else gfads.out(
        [{"row": r} for r in rows], ["row"], empty="no rows")


# --------------------------------------------------------------------------
# Writes, gated
# --------------------------------------------------------------------------

def mutate(cid, resource, operations):
    url = "%s/customers/%s/%s:mutate" % (base(), cid, resource)
    return gfads.request("POST", url, headers=headers(),
                         body={"operations": operations})


def cmd_pause_campaign(args):
    cid = customer_id(args)
    rows = search(cid, """
        SELECT campaign.id, campaign.name, campaign.status
        FROM campaign WHERE campaign.id = %s""" % int(args.id))
    if not rows:
        gfads.die("no campaign %s in customer %s" % (args.id, cid), gfads.EXIT_API)
    name = gfads.dig(rows[0], "campaign.name")
    status = gfads.dig(rows[0], "campaign.status")
    if status == "PAUSED":
        gfads.note("%s is already paused. Nothing to do." % name)
        return
    ops = [{"updateMask": "status",
            "update": {"resourceName": "customers/%s/campaigns/%s" % (cid, args.id),
                       "status": "PAUSED"}}]
    gfads.gate(args.confirm,
               "pause campaign %s (%s), currently %s, in customer %s"
               % (args.id, name, status, cid), ops)
    mutate(cid, "campaigns", ops)
    print("paused %s (%s)" % (args.id, name))


def cmd_set_budget(args):
    cid = customer_id(args)
    rows = search(cid, """
        SELECT campaign_budget.id, campaign_budget.name,
               campaign_budget.amount_micros, campaign_budget.explicitly_shared
        FROM campaign_budget WHERE campaign_budget.id = %s""" % int(args.id))
    if not rows:
        gfads.die("no budget %s in customer %s" % (args.id, cid), gfads.EXIT_API)
    was = gfads.money(gfads.dig(rows[0], "campaign_budget.amount_micros"))
    name = gfads.dig(rows[0], "campaign_budget.name")
    shared = gfads.dig(rows[0], "campaign_budget.explicitly_shared")
    micros = int(round(float(args.daily) * 1_000_000))
    ops = [{"updateMask": "amount_micros",
            "update": {
                "resourceName": "customers/%s/campaignBudgets/%s" % (cid, args.id),
                "amountMicros": str(micros)}}]
    warn = " This budget is SHARED, so every campaign on it changes." if shared else ""
    gfads.gate(args.confirm,
               "change budget %s (%s) in customer %s from %s to %s per day.%s"
               % (args.id, name, cid, was, args.daily, warn), ops)
    mutate(cid, "campaignBudgets", ops)
    print("budget %s (%s): %s -> %s per day" % (args.id, name, was, args.daily))


def main():
    ap = argparse.ArgumentParser(description="Google Ads API v25, direct.")
    ap.add_argument("--json", action="store_true", help="raw JSON output")
    sub = ap.add_subparsers(dest="cmd", required=True)
    common = gfads.json_parent()

    def sp(cmd_name, **kw):
        return sub.add_parser(cmd_name, parents=[common], **kw)


    def client_arg(p, days=False, limit=False):
        p.add_argument("client", nargs="?", help="registry slug")
        p.add_argument("--customer-id", help="use a raw customer ID instead")
        if days:
            p.add_argument("--days", type=int, default=30,
                           help="window ending yesterday (default 30)")
        if limit:
            p.add_argument("--limit", type=int, default=50)
        return p

    sp("accounts", help="accounts this token can reach").set_defaults(
        func=cmd_accounts)

    p = sp("tree", help="manager account hierarchy")
    p.add_argument("--customer-id", help="manager to walk (default the MCC)")
    p.set_defaults(func=cmd_tree)

    client_arg(sp("report", help="campaign performance"),
               days=True).set_defaults(func=cmd_report)
    client_arg(sp("terms", help="search terms that spent"),
               days=True, limit=True).set_defaults(func=cmd_terms)
    client_arg(sp("keywords", help="keyword performance"),
               days=True, limit=True).set_defaults(func=cmd_keywords)
    client_arg(sp("budgets", help="current budgets")).set_defaults(
        func=cmd_budgets)

    p = client_arg(sp("gaql", help="run a raw GAQL query"))
    p.add_argument("--query", required=True)
    p.set_defaults(func=cmd_gaql)

    p = client_arg(sp("pause-campaign", help="pause one campaign"))
    p.add_argument("--id", required=True, help="campaign ID")
    p.add_argument("--confirm", action="store_true",
                   help="actually do it; without this the command refuses")
    p.set_defaults(func=cmd_pause_campaign)

    p = client_arg(sp("set-budget", help="change a daily budget"))
    p.add_argument("--id", required=True, help="campaign budget ID")
    p.add_argument("--daily", required=True, help="new daily amount, account currency")
    p.add_argument("--confirm", action="store_true",
                   help="actually do it; without this the command refuses")
    p.set_defaults(func=cmd_set_budget)

    args = ap.parse_args()
    args.func(args)


if __name__ == "__main__":
    main()
