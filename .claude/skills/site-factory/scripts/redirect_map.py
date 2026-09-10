#!/usr/bin/env python3
"""Turn an old site's URL list into a redirect map, so a cutover keeps its links.

A link pointing at a page you deleted is only lost if the URL 404s. A 301 to a
genuinely relevant page keeps the equity, and it costs one rule. So the job at
cutover is never "which pages do we rebuild", it is "does every old URL still
resolve". This produces that answer as files:

    <out>/htaccess           Apache rules, pattern rules first, carve-outs after
    <out>/redirects.json     the same map for Hostinger's redirects endpoint
    <out>/decisions.csv      one row per old URL, for a human to argue with

Rules are ordered and first match wins, so a wildcard at the bottom catches
whatever the specific rules did not. That is the point: you do not need a
decision per URL to protect a hundred links, you need one wildcard and a short
carve-out list.

    python3 redirect_map.py --urls old-urls.txt --rules rules.json \
        --built projects/<slug>/site --out projects/<slug>/migration

Optional exports upgrade a guess into a decision. Without them every URL is
redirected, which is the safe default:

    --linked   Search Console > Links > Top linked pages   (URL, links)
    --traffic  GA4 > Landing pages, 16 months              (path, sessions)

A URL that clears --keep-links or --keep-sessions is marked KEEP, meaning it
earned a rebuild at its new path rather than a redirect into something else.

Stdlib only, and it never writes to the live site. Deploying the output is a
separate, deliberate step.
"""

import argparse
import csv
import json
import os
import re
import sys
from urllib.parse import urlsplit, unquote


def path_of(url):
    """Bare path for a URL or a path, with the noise the old CMS left on it.

    97Display emitted URLs with trailing whitespace and inconsistent case, both
    of which are indexed and both of which anyone linking to the site will get
    slightly wrong. Normalising here means one rule matches every variant.
    """
    raw = url.strip().strip('"')
    if not raw:
        return ""
    parts = urlsplit(raw if "//" in raw else "//x" + ("" if raw.startswith("/") else "/") + raw)
    path = unquote(parts.path).strip()
    path = re.sub(r"\s+", " ", path).strip()
    if not path.startswith("/"):
        path = "/" + path
    return path.rstrip("/") or "/"


def load_urls(path):
    """One URL per line, or the first column of a CSV. Comments and blanks out."""
    urls, seen = [], set()
    with open(path, encoding="utf-8-sig") as fh:
        for line in fh:
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            first = next(csv.reader([line]))[0] if "," in line else line
            p = path_of(first)
            if not p or p.lower() in seen:
                continue
            if p.lower() in ("/url", "/page", "/address", "/top linked pages"):
                continue  # export header
            seen.add(p.lower())
            urls.append(p)
    return urls


def load_metric(path, label):
    """{normalised path: number} from a two-column export, header tolerated."""
    if not path:
        return {}
    out = {}
    with open(path, encoding="utf-8-sig") as fh:
        for row in csv.reader(fh):
            if len(row) < 2:
                continue
            key = path_of(row[0])
            raw = row[1].replace(",", "").replace('"', "").strip()
            try:
                value = float(raw)
            except ValueError:
                continue  # header or a blank
            if key:
                out[key.lower()] = max(out.get(key.lower(), 0), value)
    print("loaded %-9s %d rows from %s" % (label, len(out), path))
    return out


def load_rules(path):
    rules = json.load(open(path, encoding="utf-8"))
    if not isinstance(rules, list):
        sys.exit("rules file must be a JSON list, ordered, first match wins")
    for i, rule in enumerate(rules):
        if "match" not in rule or "target" not in rule:
            sys.exit("rule %d needs 'match' and 'target'" % i)
        try:
            rule["_re"] = re.compile(rule["match"], re.I)
        except re.error as exc:
            sys.exit("rule %d has a bad regex: %s" % (i, exc))
    return rules


def apply_rule(rule, path):
    """Target for this path, with \\1 style backreferences filled in."""
    match = rule["_re"].search(path)
    if not match:
        return None
    try:
        return match.expand(rule["target"])
    except re.error:
        return rule["target"]


def target_exists(target, built):
    """Does the new build actually serve this path? A 301 to a 404 is a 404."""
    if not built:
        return None
    clean = target.split("#")[0].split("?")[0].strip("/")
    if not clean:
        clean = "index.html"
    for candidate in (clean, clean + ".html", os.path.join(clean, "index.html")):
        if os.path.isfile(os.path.join(built, candidate)):
            return True
    return False


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--urls", required=True, help="old URLs, one per line or CSV")
    ap.add_argument("--rules", required=True, help="ordered JSON rules")
    ap.add_argument("--out", required=True, help="directory for the outputs")
    ap.add_argument("--built", help="new built site, to check every target resolves")
    ap.add_argument("--linked", help="Search Console top linked pages CSV")
    ap.add_argument("--traffic", help="GA4 landing pages CSV")
    ap.add_argument("--keep-links", type=float, default=1,
                    help="links at or above this mark a URL KEEP (default 1)")
    ap.add_argument("--keep-sessions", type=float, default=10,
                    help="sessions at or above this mark a URL KEEP (default 10)")
    args = ap.parse_args()

    urls = load_urls(args.urls)
    rules = load_rules(args.rules)
    linked = load_metric(args.linked, "links")
    traffic = load_metric(args.traffic, "sessions")
    have_data = bool(linked or traffic)
    print("old URLs      %d" % len(urls))
    print("rules         %d, first match wins" % len(rules))

    rows, unmatched, broken = [], [], []
    rule_hits = [0] * len(rules)

    for path in urls:
        links = linked.get(path.lower(), 0)
        sessions = traffic.get(path.lower(), 0)
        target, index = None, None
        for i, rule in enumerate(rules):
            hit = apply_rule(rule, path)
            if hit is not None:
                target, index = hit, i
                rule_hits[i] += 1
                break

        if target is None:
            decision = "NEEDS TARGET"
            unmatched.append(path)
        elif target.rstrip("/") == path.rstrip("/"):
            decision = "UNCHANGED"
        elif have_data and (links >= args.keep_links
                            or sessions >= args.keep_sessions):
            decision = "KEEP"
        else:
            decision = "REDIRECT"

        resolves = target_exists(target, args.built) if target else None
        if decision in ("REDIRECT", "KEEP", "UNCHANGED") and resolves is False:
            broken.append((path, target))

        rows.append({
            "old_path": path, "decision": decision, "target": target or "",
            "links": int(links) or "", "sessions": int(sessions) or "",
            "rule": rules[index].get("note", rules[index]["match"]) if index is not None else "",
            "target_resolves": "" if resolves is None else ("yes" if resolves else "NO"),
        })

    os.makedirs(args.out, exist_ok=True)

    with open(os.path.join(args.out, "decisions.csv"), "w", newline="",
              encoding="utf-8") as fh:
        writer = csv.DictWriter(fh, fieldnames=list(rows[0].keys()))
        writer.writeheader()
        writer.writerows(rows)

    # Pattern rules cover the bulk in one line each. Explicit rules are only
    # for the URLs a pattern would send somewhere worse.
    lines = ["# Generated by redirect_map.py. Ordered: first match wins.",
             "# Pattern rules carry the bulk; explicit rules below are carve-outs.",
             "RewriteEngine On", ""]
    for i, rule in enumerate(rules):
        # A pattern rule is emitted whether or not the URL list happened to
        # contain a match. That is the whole reason it is a pattern: the list
        # is what someone managed to enumerate, and the wildcard covers what
        # they did not. An explicit rule with no hits has nothing to write.
        if rule.get("explicit") and not rule_hits[i]:
            continue
        note = rule.get("note")
        if note:
            lines.append("# %s (%s)" % (note, "%d in the URL list" % rule_hits[i]
                                        if rule_hits[i] else
                                        "no match in the URL list, pattern kept"))
        if rule.get("explicit"):
            for row in rows:
                if row["rule"] == (note or rule["match"]) and row["decision"] == "REDIRECT":
                    lines.append("Redirect 301 %s %s" % (row["old_path"], row["target"]))
        else:
            lines.append("RedirectMatch 301 %s %s"
                         % (rule["match"], rule["target"].replace("\\", "$")))
        lines.append("")
    with open(os.path.join(args.out, "htaccess"), "w", encoding="utf-8") as fh:
        fh.write("\n".join(lines))

    api = [{"from": r["old_path"], "to": r["target"], "type": 301}
           for r in rows if r["decision"] == "REDIRECT" and r["target"]]
    with open(os.path.join(args.out, "redirects.json"), "w", encoding="utf-8") as fh:
        json.dump(api, fh, indent=2)

    counts = {}
    for row in rows:
        counts[row["decision"]] = counts.get(row["decision"], 0) + 1
    print()
    for decision in ("KEEP", "REDIRECT", "UNCHANGED", "NEEDS TARGET"):
        if counts.get(decision):
            print("  %-13s %d" % (decision, counts[decision]))
    if not have_data:
        print("\nNo exports given, so nothing is marked KEEP and everything with a")
        print("rule is redirected. That is the safe default: it protects every link")
        print("without needing to know which URLs hold them. Add --linked and")
        print("--traffic to find the handful worth rebuilding instead.")
    if unmatched:
        print("\nNO RULE MATCHED %d URLs. These 404 on cutover unless a rule is"
              " added:" % len(unmatched))
        for path in unmatched[:25]:
            print("   %s" % path)
        if len(unmatched) > 25:
            print("   ... and %d more, all in decisions.csv" % (len(unmatched) - 25))
    if broken:
        print("\nTARGET DOES NOT EXIST in the new build for %d URLs. A 301 into a"
              " 404 loses the link:" % len(broken))
        for path, target in broken[:25]:
            print("   %s -> %s" % (path, target))
    print("\nwrote %s/{htaccess,redirects.json,decisions.csv}" % args.out)
    if unmatched or broken:
        sys.exit(1)


if __name__ == "__main__":
    main()
