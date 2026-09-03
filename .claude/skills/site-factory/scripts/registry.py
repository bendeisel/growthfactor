#!/usr/bin/env python3
"""The site registry: one row per build, so 'which site is this?' never needs
a browser.

    registry.py add    --client "Spiders Boxing" --slug spidersboxing \
                       --vertical "boxing gym" --city Nashville --state TN \
                       --artifact https://claude.ai/code/artifact/UUID
    registry.py set    spidersboxing --status preview --preview https://...
    registry.py list   [--status preview] [--vertical "boxing gym"]
    registry.py get    spidersboxing
    registry.py slugify "Spider's Boxing & Fitness"

Statuses move in one direction:

    building -> preview -> approved -> live

`set` refuses a backwards move without --force, because a row silently
reverting from live to preview is how a shipped site ends up looking
unshipped in the registry everyone trusts.

Stdlib only. The file is CSV so it stays diffable in git and readable by
anything.
"""

import argparse
import csv
import os
import re
import sys
from datetime import date

HERE = os.path.dirname(os.path.abspath(__file__))
CSV_PATH = os.path.join(HERE, os.pardir, "data", "sites.csv")

FIELDS = [
    "slug", "client", "vertical", "city", "state", "status",
    "artifact_url", "preview_url", "production_domain",
    "created", "updated", "notes",
]

ORDER = ["building", "preview", "approved", "live"]


def slugify(name):
    s = name.lower()
    s = s.replace("&", " and ")
    s = re.sub(r"['’]", "", s)          # possessives close up: spider's -> spiders
    s = re.sub(r"[^a-z0-9]+", "-", s)
    return s.strip("-")


def valid_slug(s):
    return bool(re.fullmatch(r"[a-z0-9]+(-[a-z0-9]+)*", s or ""))


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
        for r in sorted(rows, key=lambda x: x.get("slug", "")):
            w.writerow({k: r.get(k, "") for k in FIELDS})


def find(rows, slug):
    return next((r for r in rows if r.get("slug") == slug), None)


def cmd_add(a):
    rows = load()
    slug = a.slug or slugify(a.client)
    if not valid_slug(slug):
        sys.exit("error: %r is not a valid slug (lowercase, a-z0-9 and dashes)" % slug)
    if find(rows, slug):
        sys.exit(
            "error: slug %r already registered to %r.\n"
            "Pick another (append the city: %s-%s) — overwriting a row would "
            "point one client's preview at another's build."
            % (slug, find(rows, slug)["client"], slug, (a.city or "x").lower())
        )
    today = date.today().isoformat()
    rows.append({
        "slug": slug, "client": a.client, "vertical": a.vertical or "",
        "city": a.city or "", "state": a.state or "",
        "status": a.status, "artifact_url": a.artifact or "",
        "preview_url": a.preview or "", "production_domain": a.production or "",
        "created": today, "updated": today, "notes": a.notes or "",
    })
    save(rows)
    print("added %s (%s) status=%s" % (slug, a.client, a.status))


def cmd_set(a):
    rows = load()
    r = find(rows, a.slug)
    if not r:
        sys.exit("error: no row for slug %r. Run `registry.py list` to see what exists." % a.slug)
    if a.status:
        cur, new = r.get("status", ""), a.status
        if cur in ORDER and new in ORDER and ORDER.index(new) < ORDER.index(cur) and not a.force:
            sys.exit("error: %s -> %s moves backwards; pass --force if that is deliberate"
                     % (cur, new))
        r["status"] = new
    for k, v in (("artifact_url", a.artifact), ("preview_url", a.preview),
                 ("production_domain", a.production), ("notes", a.notes),
                 ("vertical", a.vertical), ("city", a.city), ("state", a.state)):
        if v is not None:
            r[k] = v
    r["updated"] = date.today().isoformat()
    save(rows)
    print("updated %s: status=%s preview=%s prod=%s"
          % (r["slug"], r.get("status", ""), r.get("preview_url", "") or "-",
             r.get("production_domain", "") or "-"))


def cmd_list(a):
    rows = load()
    if a.status:
        rows = [r for r in rows if r.get("status") == a.status]
    if a.vertical:
        rows = [r for r in rows if a.vertical.lower() in (r.get("vertical") or "").lower()]
    if not rows:
        print("no matching rows")
        return
    if a.slugs_only:
        for r in rows:
            print(r["slug"])
        return
    w = max(len(r["slug"]) for r in rows)
    wc = max(len(r.get("client") or "") for r in rows)
    print("%-*s  %-*s  %-9s  %s" % (w, "SLUG", wc, "CLIENT", "STATUS", "WHERE"))
    for r in rows:
        where = r.get("preview_url") or r.get("artifact_url") or "-"
        if r.get("status") == "live" and r.get("production_domain"):
            where = r["production_domain"] + "  (preview: %s)" % (r.get("preview_url") or "-")
        print("%-*s  %-*s  %-9s  %s"
              % (w, r["slug"], wc, r.get("client", ""), r.get("status", ""), where))


def cmd_get(a):
    r = find(load(), a.slug)
    if not r:
        sys.exit("error: no row for slug %r" % a.slug)
    for k in FIELDS:
        print("%-18s %s" % (k, r.get(k, "") or "-"))


def cmd_slugify(a):
    print(slugify(a.name))


def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="cmd", required=True)

    p = sub.add_parser("add", help="register a new build")
    p.add_argument("--client", required=True)
    p.add_argument("--slug")
    p.add_argument("--vertical")
    p.add_argument("--city")
    p.add_argument("--state")
    p.add_argument("--artifact")
    p.add_argument("--preview")
    p.add_argument("--production")
    p.add_argument("--status", default="building", choices=ORDER)
    p.add_argument("--notes")
    p.set_defaults(fn=cmd_add)

    p = sub.add_parser("set", help="update an existing row")
    p.add_argument("slug")
    p.add_argument("--status", choices=ORDER)
    p.add_argument("--artifact")
    p.add_argument("--preview")
    p.add_argument("--production")
    p.add_argument("--vertical")
    p.add_argument("--city")
    p.add_argument("--state")
    p.add_argument("--notes")
    p.add_argument("--force", action="store_true")
    p.set_defaults(fn=cmd_set)

    p = sub.add_parser("list", help="list rows")
    p.add_argument("--status", choices=ORDER)
    p.add_argument("--vertical")
    p.add_argument("--slugs-only", action="store_true",
                   help="bare slugs, for shell completion or a picker")
    p.set_defaults(fn=cmd_list)

    p = sub.add_parser("get", help="show one row in full")
    p.add_argument("slug")
    p.set_defaults(fn=cmd_get)

    p = sub.add_parser("slugify", help="turn a business name into a slug")
    p.add_argument("name")
    p.set_defaults(fn=cmd_slugify)

    a = ap.parse_args()
    a.fn(a)


if __name__ == "__main__":
    main()
