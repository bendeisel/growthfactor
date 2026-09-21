#!/usr/bin/env python3
"""The video registry: one row per walkthrough, so "where did that one get to"
never needs someone to open a folder.

    registry.py add  --slug ghl-workflows --title "Building your first workflow" \
                     --module Automations --source "white-label library"
    registry.py set  ghl-workflows --status reviewed --reviewer ben
    registry.py list [--status rendered]
    registry.py get  ghl-workflows
    registry.py slugify "Building Your First Workflow"

Statuses move one way:

    intake -> transcribed -> written -> reviewed -> rendered -> built -> published

`set` refuses a backwards move without --force. A row that quietly reverts from
published to written is how a finished video gets redone for no reason.

Stdlib only. CSV so it stays diffable in git.
"""

import argparse
import csv
import os
import re
import sys
from datetime import date

HERE = os.path.dirname(os.path.abspath(__file__))
CSV_PATH = os.path.join(HERE, os.pardir, "data", "videos.csv")

FIELDS = [
    "slug", "title", "module", "source", "status", "reviewer",
    "source_minutes", "beats", "output_minutes", "created", "updated", "notes",
]

ORDER = ["intake", "transcribed", "written", "reviewed", "rendered", "built",
         "published"]


def slugify(name):
    s = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")
    return re.sub(r"-{2,}", "-", s)


def load():
    if not os.path.exists(CSV_PATH):
        return []
    with open(CSV_PATH, newline="", encoding="utf-8") as fh:
        return list(csv.DictReader(fh))


def save(rows):
    os.makedirs(os.path.dirname(CSV_PATH), exist_ok=True)
    with open(CSV_PATH, "w", newline="", encoding="utf-8") as fh:
        writer = csv.DictWriter(fh, fieldnames=FIELDS)
        writer.writeheader()
        for row in rows:
            writer.writerow({k: row.get(k, "") for k in FIELDS})


def find(rows, slug):
    for row in rows:
        if row["slug"] == slug:
            return row
    return None


def cmd_add(args):
    rows = load()
    if find(rows, args.slug):
        sys.exit("error: %s is already in the registry" % args.slug)
    today = date.today().isoformat()
    rows.append({
        "slug": args.slug, "title": args.title, "module": args.module or "",
        "source": args.source or "", "status": "intake", "reviewer": "",
        "source_minutes": "", "beats": "", "output_minutes": "",
        "created": today, "updated": today, "notes": args.notes or "",
    })
    save(rows)
    print("added %s" % args.slug)


def cmd_set(args):
    rows = load()
    row = find(rows, args.slug)
    if not row:
        sys.exit("error: %s is not in the registry" % args.slug)
    if args.status:
        if args.status not in ORDER:
            sys.exit("error: status must be one of: %s" % ", ".join(ORDER))
        now, new = row.get("status", "intake"), args.status
        if now in ORDER and ORDER.index(new) < ORDER.index(now) and not args.force:
            sys.exit("error: %s would move backwards from %s to %s. "
                     "Pass --force if that is deliberate." % (args.slug, now, new))
        row["status"] = new
    for key in ("reviewer", "notes", "title", "module", "source",
                "source_minutes", "beats", "output_minutes"):
        val = getattr(args, key, None)
        if val is not None:
            row[key] = str(val)
    row["updated"] = date.today().isoformat()
    save(rows)
    print("%s -> %s" % (args.slug, row["status"]))


def cmd_list(args):
    rows = load()
    if args.status:
        rows = [r for r in rows if r["status"] == args.status]
    if not rows:
        print("(nothing)")
        return
    print("%-26s %-13s %-8s %-7s %s" % ("slug", "status", "beats", "mins", "title"))
    for r in rows:
        print("%-26s %-13s %-8s %-7s %s"
              % (r["slug"], r["status"], r.get("beats", ""),
                 r.get("output_minutes", ""), r.get("title", "")))


def cmd_get(args):
    row = find(load(), args.slug)
    if not row:
        sys.exit("error: %s is not in the registry" % args.slug)
    for key in FIELDS:
        print("%-16s %s" % (key, row.get(key, "")))


def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="cmd", required=True)

    a = sub.add_parser("add")
    a.add_argument("--slug", required=True)
    a.add_argument("--title", required=True)
    a.add_argument("--module")
    a.add_argument("--source", help="where the footage came from")
    a.add_argument("--notes")
    a.set_defaults(func=cmd_add)

    s = sub.add_parser("set")
    s.add_argument("slug")
    s.add_argument("--status")
    s.add_argument("--reviewer")
    s.add_argument("--title")
    s.add_argument("--module")
    s.add_argument("--source")
    s.add_argument("--source-minutes", dest="source_minutes")
    s.add_argument("--beats")
    s.add_argument("--output-minutes", dest="output_minutes")
    s.add_argument("--notes")
    s.add_argument("--force", action="store_true")
    s.set_defaults(func=cmd_set)

    ls = sub.add_parser("list")
    ls.add_argument("--status")
    ls.set_defaults(func=cmd_list)

    g = sub.add_parser("get")
    g.add_argument("slug")
    g.set_defaults(func=cmd_get)

    sl = sub.add_parser("slugify")
    sl.add_argument("name")
    sl.set_defaults(func=lambda a: print(slugify(a.name)))

    args = ap.parse_args()
    args.func(args)


if __name__ == "__main__":
    main()
