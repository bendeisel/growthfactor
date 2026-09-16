#!/usr/bin/env python3
"""Build reviews.json — the single source of truth for every review on the site.

Reviews come out of the harvested vendor pages, where they were rendered inside
`popup_testimonials-item` blocks.  That is the only place the untruncated text
survives; the markdown harvest clipped most of them with an ellipsis.

Topic tags are derived by RULE from the review text, never typed per review, so
a review that mentions Muay Thai shows up on the Muay Thai page automatically.

To add reviews pulled from Google Business Profile, drop them into
extra_reviews.json (same shape, minus "tags") and re-run.  Tagging is applied to
those the same way.
"""
import html as H
import json
import pathlib
import re
import sys

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parent
SOURCE = ROOT / "source" / "pages"
OUT = HERE / "reviews.json"
EXTRA = HERE / "extra_reviews.json"

# The full review list lives in `review_grid--item`; every page also carries a
# 3-item `popup_testimonials` carousel.  Both are read, longest text wins.
ITEM_SPLITS = ('<div class="review_grid--item uReviews--item">',
               '<div class="popup_testimonials-item">')
NAME = re.compile(r"<header[^>]*>\s*(.*?)\s*<(?:span|div|/header)", re.S)
TEXT = re.compile(r'<(?:cite class="review_grid--item-citation"|div class="popup_testimonials-text")[^>]*>(.*?)</(?:cite|div)>', re.S)

# Topic tags, in the order they should be tried.  A review can carry several.
RULES = [
    ("jiu-jitsu", r"jiu[\s-]?jitsu|\bbjj\b|\bju[\s-]?jitsu\b|grappl|no[\s-]?gi|rolling|open mat|black belt|professor"),
    ("muay-thai", r"muay[\s-]?thai|kickbox|thai pad|clinch"),
    ("boxing",    r"\bbox(ing|er|ers)?\b|mitt(s|work)?\b"),
    ("kids",      r"\bkid|\bchild|\bson\b|\bdaughter\b|\bteen|youth|\b\d{1,2}[\s-]?(?:yr|year)"),
    ("wrestling", r"wrestl|takedown|\bjudo\b"),
    ("mma",       r"\bmma\b|mixed martial|fight (?:camp|team)|\bcage\b"),
    ("self-defense", r"self[\s-]?defen[cs]e|galentine"),
    ("fitness",   r"weight|conditioning|lost \d+|\bshape\b|cardio|fitness|workout"),
    ("coaches",   r"coach|instructor|professor|trainer"),
    ("beginners", r"beginner|first (?:time|class|day)|never (?:trained|done)|new to|intimidat|walk[\s-]?in|trial"),
]

# Names that are page headings the harvest mistook for reviewers.
NOT_A_PERSON = re.compile(r"\b(our|your|classes|nashville mma|give your|become a|with our)\b", re.I)


def clean(s):
    s = re.sub(r"<[^>]+>", "", s)
    return re.sub(r"\s+", " ", H.unescape(s)).strip()


def tags_for(text):
    return [name for name, rx in RULES if re.search(rx, text, re.I)]


def harvest():
    found = {}
    if not SOURCE.is_dir():
        sys.exit("missing harvest directory: %s" % SOURCE)
    for f in sorted(SOURCE.glob("*.html")):
        page = f.read_text(encoding="utf-8", errors="ignore")
        blocks = []
        for marker in ITEM_SPLITS:
            blocks += page.split(marker)[1:]
        for block in blocks:
            n = NAME.search(block)
            t = TEXT.search(block)
            if not n:
                continue
            name = clean(n.group(1))
            text = clean(t.group(1)) if t else ""
            if not name or not text or NOT_A_PERSON.search(name):
                continue
            # keep the longest version of a review we have seen anywhere
            if len(text) > len(found.get(name, "")):
                found[name] = text
    return found


def main():
    found = harvest()
    source_of = {n: "harvest" for n in found}

    if EXTRA.exists():
        for row in json.loads(EXTRA.read_text(encoding="utf-8")):
            name, text = row["name"].strip(), row["text"].strip()
            if not name or not text:
                continue
            found[name] = text
            source_of[name] = row.get("source", "google-business-profile")

    reviews = []
    for name in sorted(found, key=lambda n: -len(found[n])):
        text = found[name]
        reviews.append({
            "name": name,
            "text": text,
            "tags": tags_for(text),
            "source": source_of[name],
            "words": len(text.split()),
        })

    OUT.write_text(json.dumps(reviews, indent=1, ensure_ascii=False) + "\n", encoding="utf-8")

    counts = {}
    for r in reviews:
        for t in r["tags"]:
            counts[t] = counts.get(t, 0) + 1
    untagged = [r["name"] for r in reviews if not r["tags"]]

    print("reviews written : %d  ->  %s" % (len(reviews), OUT.relative_to(ROOT)))
    print("from harvest    : %d" % sum(1 for r in reviews if r["source"] == "harvest"))
    print("from GBP extra  : %d" % sum(1 for r in reviews if r["source"] != "harvest"))
    print("untagged        : %d %s" % (len(untagged), untagged if untagged else ""))
    print()
    for name, _ in RULES:
        print("   %-13s %3d" % (name, counts.get(name, 0)))


if __name__ == "__main__":
    main()
