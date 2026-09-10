#!/usr/bin/env python3
"""Regenerate ui-verify.md from the "Verify on screen" section of every lesson.

Run from the course/ directory after a Scribe pass. Lessons whose section has
been deleted (because the labels were confirmed on a live screen) drop out.
"""
import re, glob

rows = []
for f in sorted(glob.glob('modules/*/[0-9]*.md')):
    txt = open(f).read()
    m = re.search(r'^# (.+)$', txt, re.M)
    title = m.group(1) if m else f
    sec = re.search(r'^## Verify on screen\s*\n(.*?)(?=\n## |\Z)', txt, re.M | re.S)
    if not sec:
        continue
    items = [l.strip()[2:].strip() for l in sec.group(1).splitlines()
             if l.strip().startswith('- ')]
    items = [i for i in items if i and not i.lower().startswith('nothing')]
    if items:
        rows.append((title, f, items))

total = sum(len(r[2]) for r in rows)
out = ["# UI verification index", "",
       "Every label, path and behaviour in the course that was written from",
       "documentation and search summaries rather than from a live screen.",
       "",
       "**Why this file exists.** HighLevel's help portal was blocked by the network",
       "egress policy of the environment this course was written in, so step-level",
       "detail came from secondary sources. That is fine for structure and for",
       "judgement. It is not good enough for \"click this exact button\".",
       "",
       "**How to clear it.** The Scribe pass walks these screens anyway. Whoever runs",
       "it confirms each line below in the same sitting, corrects the lesson, and",
       "deletes the `## Verify on screen` section from that lesson file. When a",
       "lesson's section is gone, its rows disappear from this index the next time it",
       "is regenerated.",
       "",
       "**Regenerate this file** with `scripts/build-ui-verify.py` after any pass.",
       "",
       f"**{total} items outstanding across {len(rows)} lessons.**", "",
       "---", ""]
cur = None
for title, f, items in rows:
    mod = f.split('/')[1]
    if mod != cur:
        cur = mod
        out.append(f"## {mod}\n")
    out.append(f"### {title}")
    out.append(f"`{f}`\n")
    out += [f"- [ ] {i}" for i in items]
    out.append("")
open('ui-verify.md', 'w').write("\n".join(out) + "\n")
print(f"{total} items across {len(rows)} lessons")
