#!/usr/bin/env python3
"""Growth Factor house rule: no em dashes, anywhere.

Runs in two places:

  PostToolUse  (Write|Edit)  checks the file that was just written
  PreToolUse   (Bash)        checks a git commit message before it is made

Exit 2 sends the message on stderr back to Claude so it fixes the text
itself. Any other failure exits 0 so a broken hook never blocks work.
"""

import json
import os
import re
import sys

EM_DASH = "—"
EN_DASH = "–"

# Text we actually author. Everything else is left alone.
CHECKED_SUFFIXES = {
    ".md", ".markdown", ".html", ".htm", ".css", ".js", ".ts", ".jsx",
    ".tsx", ".astro", ".json", ".txt", ".yml", ".yaml", ".py", ".sh",
    ".xml", ".svg", ".csv",
}

# The hook's own source has to name the characters it hunts for.
SKIPPED_PARTS = (
    os.path.join(".claude", "hooks"),
    os.path.join("node_modules", ""),
    os.path.join(".git", ""),
)

REPLACEMENT_HINT = (
    "Rewrite each one with a comma, a period, a colon, or a pair of "
    "parentheses. Do not swap in an en dash or a hyphen-as-dash instead."
)


def offending_lines(text):
    """Return (line_number, line) for every line holding a dash we ban."""
    hits = []
    for number, line in enumerate(text.splitlines(), start=1):
        if EM_DASH in line:
            hits.append((number, line.strip()))
            continue
        # An en dash flanked by spaces is an em dash wearing a disguise.
        if re.search(r"\s%s\s" % EN_DASH, line):
            hits.append((number, line.strip()))
    return hits


def report(where, hits):
    lines = ["Em dash found in %s. The Growth Factor house rule forbids them." % where]
    for number, line in hits[:10]:
        snippet = line if len(line) <= 120 else line[:117] + "..."
        lines.append("  line %d: %s" % (number, snippet))
    if len(hits) > 10:
        lines.append("  ...and %d more." % (len(hits) - 10))
    lines.append(REPLACEMENT_HINT)
    sys.stderr.write("\n".join(lines) + "\n")
    sys.exit(2)


def check_written_file(tool_input):
    path = tool_input.get("file_path") or ""
    if not path:
        return
    normalized = os.path.normpath(path)
    if any(part in normalized for part in SKIPPED_PARTS):
        return
    if os.path.splitext(normalized)[1].lower() not in CHECKED_SUFFIXES:
        return
    try:
        with open(normalized, "r", encoding="utf-8", errors="ignore") as handle:
            text = handle.read()
    except OSError:
        return
    hits = offending_lines(text)
    if hits:
        report(normalized, hits)


def check_commit_message(tool_input):
    command = tool_input.get("command") or ""
    if "git commit" not in command:
        return
    hits = offending_lines(command)
    if hits:
        report("this commit message", hits)


def main():
    try:
        payload = json.load(sys.stdin)
    except (json.JSONDecodeError, ValueError):
        return
    tool_input = payload.get("tool_input") or {}
    if payload.get("hook_event_name") == "PreToolUse":
        check_commit_message(tool_input)
    else:
        check_written_file(tool_input)


if __name__ == "__main__":
    try:
        main()
    except SystemExit:
        raise
    except Exception:
        # A hook must never be the reason a session stalls.
        sys.exit(0)
