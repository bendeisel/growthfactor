#!/usr/bin/env python3
"""Growth Factor house rule: no tired marketing language in client copy.

Runs on PostToolUse after a Write or Edit. Only looks at files that hold
copy a client would read. Exit 2 hands the line numbers back to Claude so
the wording gets fixed on the spot.

The word list lives beside this file in banned-words.txt and is the whole
configuration. A file carrying the marker "banned-words: off" is skipped,
which is how a page legitimately naming a business called Elite Something
gets through.
"""

import json
import os
import re
import sys

WORDLIST = os.path.join(os.path.dirname(os.path.abspath(__file__)), "banned-words.txt")

# Files a client actually reads. Scripts and config are left alone.
COPY_SUFFIXES = {".html", ".htm", ".md", ".markdown", ".txt", ".astro"}

SKIPPED_PARTS = (
    os.path.join(".claude", "hooks"),
    os.path.join("node_modules", ""),
    os.path.join(".git", ""),
    # Vendored spec-kit. Not our words to rewrite.
    os.path.join(".claude", "skills", "speckit-"),
    os.path.join(".specify", ""),
    # The harvest. projects/<slug>/source and /content hold the client's own
    # words, and the 99% copy lock says they stay as they are. Flagging them
    # would be arguing with a decision that has already been made.
    os.path.join("projects", ""),
)

# Inside projects/, only the directories where we write our own words.
OUR_WORDS = ("site", "design", "design-pages", "cms")

OPT_OUT = "banned-words: off"


def load_terms():
    try:
        with open(WORDLIST, "r", encoding="utf-8") as handle:
            lines = handle.read().splitlines()
    except OSError:
        return []
    terms = []
    for line in lines:
        term = line.strip()
        if term and not term.startswith("#"):
            terms.append(term)
    return terms


def build_pattern(terms):
    if not terms:
        return None
    # Longest first so "unlock the power" wins over a shorter overlapping entry.
    ordered = sorted(terms, key=len, reverse=True)
    # Apostrophes vary between straight and curly in real copy, so match either.
    parts = []
    for term in ordered:
        escaped = re.escape(term).replace("'", "['’]")
        parts.append(escaped.replace(r"\ ", r"\s+"))
    return re.compile(r"\b(?:%s)\b" % "|".join(parts), re.IGNORECASE)


def strip_markup(line):
    """Drop tag internals so class names and URLs do not trip the check."""
    without_tags = re.sub(r"<[^>]*>", " ", line)
    return re.sub(r"https?://\S+", " ", without_tags)


def main():
    try:
        payload = json.load(sys.stdin)
    except (json.JSONDecodeError, ValueError):
        return

    path = (payload.get("tool_input") or {}).get("file_path") or ""
    if not path:
        return
    normalized = os.path.normpath(path)
    if any(part in normalized for part in SKIPPED_PARTS):
        # projects/ is skipped wholesale except the build directories, which
        # carry our wording rather than the client's.
        segments = normalized.replace(os.sep, "/").split("/")
        if "projects" not in segments:
            return
        after_slug = segments[segments.index("projects") + 2:]
        if not after_slug or after_slug[0] not in OUR_WORDS:
            return
    if os.path.splitext(normalized)[1].lower() not in COPY_SUFFIXES:
        return

    try:
        with open(normalized, "r", encoding="utf-8", errors="ignore") as handle:
            text = handle.read()
    except OSError:
        return
    if OPT_OUT in text:
        return

    pattern = build_pattern(load_terms())
    if pattern is None:
        return

    hits = []
    for number, line in enumerate(text.splitlines(), start=1):
        found = pattern.findall(strip_markup(line))
        if found:
            hits.append((number, sorted(set(w.lower() for w in found))))
    if not hits:
        return

    out = ["Tired marketing language in %s." % normalized]
    for number, words in hits[:12]:
        out.append("  line %d: %s" % (number, ", ".join(words)))
    if len(hits) > 12:
        out.append("  ...and %d more lines." % (len(hits) - 12))
    out.append(
        "If these words are ours, rewrite them. Say what the business actually "
        "does and who it is for, in short concrete words, and do not swap in a "
        "synonym of the same idea."
    )
    out.append(
        "If they came across from the client's harvest under the 99%% copy lock, "
        "or the word is part of their real business name, leave them alone and "
        "add the marker '%s' to the file. The list itself is editable at "
        ".claude/hooks/banned-words.txt." % OPT_OUT
    )
    sys.stderr.write("\n".join(out) + "\n")
    sys.exit(2)


if __name__ == "__main__":
    try:
        main()
    except SystemExit:
        raise
    except Exception:
        sys.exit(0)
