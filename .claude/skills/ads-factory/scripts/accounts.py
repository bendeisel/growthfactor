#!/usr/bin/env python3
"""The client account registry: one row per client, five platform IDs on it.

    accounts.py add spidersboxing --client "Spiders Boxing" \
        --google-ads 1234567890 --meta act_123456 \
        --ga4 987654321 --gsc https://spidersboxing.com/ \
        --gtm-container GTM-ABC1234
    accounts.py set spidersboxing --ga4 987654321
    accounts.py get spidersboxing
    accounts.py list [--missing]
    accounts.py resolve spidersboxing --platform google_ads

This is what lets every other command take a client name instead of five
opaque IDs. `resolve` is the single lookup the other CLIs call, so a client
whose row is incomplete fails with "Spiders Boxing has no GA4 property on
file" rather than with a 403 from Google.

Stdlib only. CSV so it stays diffable in git, same as the site registry.
"""

import argparse
import csv
import os
import re
import sys
from datetime import date

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import gfads  # noqa: E402

HERE = os.path.dirname(os.path.abspath(__file__))
CSV_PATH = os.path.join(HERE, os.pardir, "data", "accounts.csv")

FIELDS = [
    "slug", "client", "status",
    "google_ads_customer_id", "meta_ad_account_id",
    "ga4_property_id", "gsc_site_url",
    "gtm_account_id", "gtm_container_id", "gtm_container_public_id",
    "added", "updated", "notes",
]

# The platforms a client row can carry, and which column answers for each.
PLATFORMS = {
    "google_ads": "google_ads_customer_id",
    "meta": "meta_ad_account_id",
    "ga4": "ga4_property_id",
    "gsc": "gsc_site_url",
    "gtm": "gtm_container_id",
}

# The flag that sets each platform's column. resolve() quotes these back at
# you when a row is incomplete, so they have to match add_id_args exactly.
PLATFORM_FLAGS = {
    "google_ads": "--google-ads",
    "meta": "--meta",
    "ga4": "--ga4",
    "gsc": "--gsc",
    "gtm": "--gtm-container",
}

STATUSES = ["prospect", "connecting", "live", "paused", "offboarded"]


def slugify(name):
    s = name.lower().replace("&", " and ")
    s = re.sub(r"['’]", "", s)
    s = re.sub(r"[^a-z0-9]+", "-", s)
    return s.strip("-")


def load():
    if not os.path.exists(CSV_PATH):
        return []
    with open(CSV_PATH, newline="", encoding="utf-8") as fh:
        return [dict(r) for r in csv.DictReader(fh)]


def save(rows):
    os.makedirs(os.path.dirname(CSV_PATH), exist_ok=True)
    with open(CSV_PATH, "w", newline="", encoding="utf-8") as fh:
        w = csv.DictWriter(fh, fieldnames=FIELDS)
        w.writeheader()
        for row in rows:
            w.writerow({k: row.get(k, "") for k in FIELDS})


def find(slug):
    for row in load():
        if row.get("slug") == slug:
            return row
    return None


def normalize_google_ads(value):
    """Google Ads customer IDs are shown with dashes in the UI and rejected
    with dashes by the API."""
    if not value:
        return ""
    digits = re.sub(r"[^0-9]", "", value)
    if len(digits) != 10:
        gfads.die("a Google Ads customer ID is 10 digits, got %r" % value)
    return digits


def normalize_meta(value):
    """Meta ad account IDs are used as act_<digits> on every endpoint. Stored
    with the prefix so nothing downstream has to remember to add it."""
    if not value:
        return ""
    digits = re.sub(r"[^0-9]", "", value)
    if not digits:
        gfads.die("a Meta ad account ID needs digits, got %r" % value)
    return "act_%s" % digits


def normalize_ga4(value):
    """GA4 property IDs are numeric. The API path wants properties/<id>, and
    people paste the G- measurement ID instead about half the time."""
    if not value:
        return ""
    if value.upper().startswith("G-"):
        gfads.die("%s is a measurement ID, not a property ID. The property ID "
                  "is the number in Admin > Property details." % value)
    digits = re.sub(r"[^0-9]", "", value)
    if not digits:
        gfads.die("a GA4 property ID is numeric, got %r" % value)
    return digits


def normalize_gsc(value):
    """Search Console is exact about the property string: a URL-prefix
    property keeps its trailing slash, a domain property is sc-domain:<host>.
    Getting this wrong is a 403 that looks like a permission problem."""
    if not value:
        return ""
    if value.startswith("sc-domain:"):
        return value
    if not value.startswith("http"):
        gfads.die("a Search Console property is either https://example.com/ "
                  "(URL prefix, trailing slash included) or sc-domain:example.com "
                  "(domain property). Got %r" % value)
    return value if value.endswith("/") else value + "/"


NORMALIZERS = {
    "google_ads_customer_id": normalize_google_ads,
    "meta_ad_account_id": normalize_meta,
    "ga4_property_id": normalize_ga4,
    "gsc_site_url": normalize_gsc,
}

ARG_TO_FIELD = {
    "google_ads": "google_ads_customer_id",
    "meta": "meta_ad_account_id",
    "ga4": "ga4_property_id",
    "gsc": "gsc_site_url",
    "gtm_account": "gtm_account_id",
    "gtm_container": "gtm_container_id",
    "gtm_public_id": "gtm_container_public_id",
    "status": "status",
    "client": "client",
    "notes": "notes",
}


def apply_args(row, args):
    changed = []
    for arg, field in ARG_TO_FIELD.items():
        value = getattr(args, arg, None)
        if value is None:
            continue
        norm = NORMALIZERS.get(field, lambda v: v)(value)
        if row.get(field, "") != norm:
            row[field] = norm
            changed.append(field)
    return changed


def add_id_args(p):
    p.add_argument("--client", help="display name")
    p.add_argument("--google-ads", dest="google_ads", help="10-digit customer ID")
    p.add_argument("--meta", help="ad account ID, with or without act_")
    p.add_argument("--ga4", help="numeric property ID, not the G- measurement ID")
    p.add_argument("--gsc", help="https://example.com/ or sc-domain:example.com")
    p.add_argument("--gtm-account", dest="gtm_account", help="GTM account ID")
    p.add_argument("--gtm-container", dest="gtm_container", help="GTM container ID (numeric)")
    p.add_argument("--gtm-public-id", dest="gtm_public_id", help="GTM-XXXXXXX")
    p.add_argument("--status", choices=STATUSES)
    p.add_argument("--notes")


def cmd_add(args):
    slug = slugify(args.slug)
    if find(slug):
        gfads.die("%s is already in the registry. Use `accounts.py set %s ...`"
                  % (slug, slug))
    row = {k: "" for k in FIELDS}
    row["slug"] = slug
    row["client"] = args.client or args.slug
    row["status"] = args.status or "connecting"
    row["added"] = row["updated"] = date.today().isoformat()
    apply_args(row, args)
    rows = load()
    rows.append(row)
    save(rows)
    print("added %s" % slug)
    show(row)


def cmd_set(args):
    rows = load()
    for row in rows:
        if row.get("slug") == args.slug:
            changed = apply_args(row, args)
            if not changed:
                print("no change")
                return
            row["updated"] = date.today().isoformat()
            save(rows)
            print("updated %s: %s" % (args.slug, ", ".join(changed)))
            show(row)
            return
    gfads.die("no client %r in the registry. `accounts.py list` to see them all."
              % args.slug)


def show(row):
    pairs = [{"field": k, "value": row.get(k, "")} for k in FIELDS
             if row.get(k, "")]
    gfads.out(pairs, ["field", "value"])


def cmd_get(args):
    row = find(args.slug)
    if not row:
        gfads.die("no client %r in the registry" % args.slug)
    if args.json:
        gfads.out(row, as_json=True)
    else:
        show(row)


def cmd_list(args):
    rows = load()
    if args.missing:
        rows = [r for r in rows
                if any(not r.get(c) for c in PLATFORMS.values())]
    view = []
    for r in rows:
        connected = [name for name, col in PLATFORMS.items() if r.get(col)]
        missing = [name for name, col in PLATFORMS.items() if not r.get(col)]
        view.append({
            "slug": r.get("slug"),
            "client": r.get("client"),
            "status": r.get("status"),
            "connected": ",".join(connected) or "-",
            "missing": ",".join(missing) or "-",
        })
    gfads.out(view, ["slug", "client", "status", "connected", "missing"],
              as_json=args.json, empty="registry is empty")


def resolve(slug, platform):
    """The lookup every other CLI uses. Refuses with a sentence a human can
    act on rather than letting the platform return a confusing 403."""
    if platform not in PLATFORMS:
        gfads.die("unknown platform %r, expected one of %s"
                  % (platform, ", ".join(sorted(PLATFORMS))))
    row = find(slug)
    if not row:
        gfads.die("no client %r in the registry. Add them with "
                  "`accounts.py add %s --client \"...\"`." % (slug, slug))
    value = row.get(PLATFORMS[platform], "")
    if not value:
        gfads.die("%s has no %s account on file. Add it with "
                  "`accounts.py set %s %s <id>`."
                  % (row.get("client") or slug, platform, slug,
                     PLATFORM_FLAGS[platform]))
    return value


def cmd_resolve(args):
    print(resolve(args.slug, args.platform))


def main():
    ap = argparse.ArgumentParser(
        description="Client account registry for the ads factory.")
    ap.add_argument("--json", action="store_true", help="raw JSON output")
    sub = ap.add_subparsers(dest="cmd", required=True)
    common = gfads.json_parent()

    def sp(cmd_name, **kw):
        return sub.add_parser(cmd_name, parents=[common], **kw)


    p = sp("add", help="add a client row")
    p.add_argument("slug")
    add_id_args(p)
    p.set_defaults(func=cmd_add)

    p = sp("set", help="update a client row")
    p.add_argument("slug")
    add_id_args(p)
    p.set_defaults(func=cmd_set)

    p = sp("get", help="show one client")
    p.add_argument("slug")
    p.set_defaults(func=cmd_get)

    p = sp("list", help="list clients and what is connected")
    p.add_argument("--missing", action="store_true",
                   help="only clients with an unconnected platform")
    p.set_defaults(func=cmd_list)

    p = sp("resolve", help="print one platform ID for one client")
    p.add_argument("slug")
    p.add_argument("--platform", required=True, choices=sorted(PLATFORMS))
    p.set_defaults(func=cmd_resolve)

    p = sp("slugify", help="turn a client name into a slug")
    p.add_argument("name")
    p.set_defaults(func=lambda a: print(slugify(a.name)))

    args = ap.parse_args()
    args.func(args)


if __name__ == "__main__":
    main()
