#!/usr/bin/env python3
"""Build the whole site, in order, from the data files.

Run this rather than the individual scripts.  render_schedule.py used to be
left out of the routine, so the master schedule page stayed frozen at whatever
it was the day it was first generated while the program pages moved with
classes.json — the two could disagree and nothing would say so.
"""
import subprocess
import sys
import pathlib

HERE = pathlib.Path(__file__).resolve().parent
PAGES = HERE.parent / "design-pages"

# classes.json is the hand-editable source of truth for the schedule: change a
# class time there and it moves on the master grid and every program page.
# build_classes.py REGENERATES it from the original harvest, so it only runs on
# --reharvest; otherwise it would silently throw away any edit made since.
STEPS = [
    ("reviews.json",    ["build_reviews.py"]),
    ("schedule page",   ["render_schedule.py", str(PAGES)]),
    ("program pages",   ["build_program_pages.py"]),
    ("everything else", ["build_extra_pages.py"]),
    ("static site",     ["build_site.py"]),
    ("preview bundle",  ["bundle_site.py"]),
]

if "--reharvest" in sys.argv:
    STEPS.insert(0, ("classes.json (re-harvested)", ["build_classes.py"]))

failed = 0
for label, cmd in STEPS:
    r = subprocess.run([sys.executable] + cmd, cwd=HERE, capture_output=True, text=True)
    tail = [l for l in (r.stdout or "").strip().split("\n") if l.strip()][-1:] or [""]
    status = "ok " if r.returncode == 0 else "FAIL"
    print("  %-4s %-16s %s" % (status, label, tail[0][:88]))
    if r.returncode != 0:
        failed += 1
        print((r.stderr or "").strip()[-700:])
sys.exit(1 if failed else 0)
