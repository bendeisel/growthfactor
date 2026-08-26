# -*- coding: utf-8 -*-
"""Render every schedule view from data/classes.json.

Nothing about a class is typed into an artboard. Edit classes.json (or the CMS
that writes it), re-run this, and the master grid and every program page move
together. This is the mechanism the client asked for, proven in the mockups.

  python3 render_schedule.py <design-pages-dir>
"""
import json, os, re, sys, html
from collections import defaultdict

HERE = os.path.dirname(os.path.abspath(__file__))
OUT  = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, "..", "design-pages")
DATA = json.load(open(os.path.join(HERE, "classes.json"), encoding="utf-8"))
CLASSES = DATA["classes"]
DAYS = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"]

GOLD, CARD = "#D7AD56", "#1E1E29"
BEBAS = "'Bebas Neue','Oswald','Arial Narrow',sans-serif"

def esc(s): return html.escape(s, quote=False)

# ── master grid ────────────────────────────────────────────────────────────
def grid_rows(classes):
    slots = sorted({c["sort"] for c in classes})
    label = {c["sort"]: c["start"] for c in classes}
    by = defaultdict(list)
    for c in classes:
        by[(c["sort"], c["day"])].append(c)
    rows = []
    for s in slots:
        cells = []
        for d in DAYS:
            chips = "".join(
                '<div class="cls" data-aud="%s" data-prog="%s" style="background: %s; border-left: 3px solid %s; '
                'border-radius: 0 6px 6px 0; padding: 7px 10px">'
                '<span style="font-size: 12px; font-weight: 700; line-height: 1.3; display: block; color: #FFFFFF">%s</span>'
                '<span class="micro" style="font-size: 9px; letter-spacing: 0.14em; color: rgba(215,173,86,0.85)">%s &ndash; %s</span>'
                '</div>' % (c["audience"], " ".join(c["programs"]), CARD, GOLD,
                            esc(c["name"]), c["start"], c["end"])
                for c in by[(s, d)])
            cells.append('<div style="border-left: 1px solid rgba(255,255,255,0.08); padding: 8px 8px; '
                         'display: flex; flex-direction: column; gap: 6px; min-height: 56px">%s</div>' % chips)
        rows.append(
            '    <div style="display: grid; grid-template-columns: 110px repeat(7, minmax(0, 1fr)); '
            'border-top: 1px solid rgba(255,255,255,0.08)">'
            '<div class="micro" style="color: rgba(255,255,255,0.55); padding-top: 10px; text-align: right; '
            'padding-right: 14px">%s</div>%s</div>' % (label[s], "".join(cells)))
    return "\n".join(rows)

# ── per-program day cards ──────────────────────────────────────────────────
def program_cards(slug, audience=None):
    """Adult program pages exclude kids classes; kids pages get their own page."""
    picked = [c for c in CLASSES if slug in c["programs"]
              and (c["audience"] == audience if audience else c["audience"] != "kids")]
    by = defaultdict(list)
    for c in picked:
        by[c["day"]].append(c)
    cards = []
    for d in DAYS:
        if not by[d]:
            continue
        lines = "".join(
            '<div style="display: flex; gap: 8px; align-items: baseline">'
            '<span class="micro" style="font-size: 9px; flex: 0 0 52px; letter-spacing: 0.1em">%s</span>'
            '<span class="body" style="font-size: 12.5px; line-height: 1.4">%s</span></div>'
            % (c["start"], esc(c["name"])) for c in sorted(by[d], key=lambda x: x["sort"]))
        cards.append(
            '      <div style="background: %s; border-left: 3px solid %s; border-radius: 0 8px 8px 0; padding: 18px 18px">\n'
            '        <div style="font-family: %s; font-size: 24px; margin-bottom: 10px">%s</div>\n'
            '        <div style="display: flex; flex-direction: column; gap: 8px">%s</div>\n'
            '      </div>' % (CARD, GOLD, BEBAS, d, lines))
    cards.append(
        '      <div style="background: linear-gradient(135deg, rgba(215,173,86,0.2), rgba(215,173,86,0.06)), %s; '
        'border-left: 3px solid %s; border-radius: 0 8px 8px 0; padding: 18px 18px; display: flex; '
        'flex-direction: column; justify-content: center; align-items: flex-start; gap: 12px">\n'
        '        <div style="font-family: %s; font-size: 30px; line-height: 1">90+ Classes Per Week</div>\n'
        '        <div onClick="{{ openForm }}" class="btn" style="padding: 11px 20px; font-size: 11px">Request more information</div>\n'
        '      </div>' % (CARD, GOLD, BEBAS))
    return "\n".join(cards), len(picked)

# ── splice into artboards between generated-block markers ──────────────────
def splice(path, block, start_mark, end_mark):
    src = open(path, encoding="utf-8").read()
    s, e = src.index(start_mark), src.index(end_mark)
    src = src[:s + len(start_mark)] + "\n" + block + "\n    " + src[e:]
    open(path, "w", encoding="utf-8").write(src)

sched = os.path.join(OUT, "Schedule.dc.html")
splice(sched, grid_rows(CLASSES),
       "<!-- GENERATED:grid -->", "<!-- /GENERATED:grid -->")

prog = os.path.join(OUT, "ProgramDetail.dc.html")
cards, n = program_cards("jiu-jitsu")
splice(prog, cards, "<!-- GENERATED:cards -->", "<!-- /GENERATED:cards -->")

print("master grid: %d classes" % len(CLASSES))
print("jiu-jitsu page: %d classes" % n)
