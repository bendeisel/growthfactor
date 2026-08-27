# -*- coding: utf-8 -*-
"""Generate a design artboard for every program page.

Reads the client's own harvested page copy (content/*.md), lays it into the
approved program-detail design, and pulls class times from classes.json by
program tag. Copy is placed verbatim — nothing is rewritten, shortened or
retitled. Chrome (header/footer/popup/styles) is lifted from the approved
ProgramDetail artboard so every page stays identical to the signed-off one.

  python3 build_program_pages.py
"""
import json, os, re, html, shutil, subprocess

HERE     = os.path.dirname(os.path.abspath(__file__))
PROJ     = os.path.dirname(HERE)
CONTENT  = os.path.join(PROJ, "content")
IMAGES   = os.path.join(PROJ, "source", "images")
PAGES    = os.path.join(PROJ, "design-pages")
IMGOUT   = os.path.join(PAGES, "img")

GOLD, CARD, BEBAS = "#D7AD56", "#1E1E29", "'Bebas Neue','Oswald','Arial Narrow',sans-serif"

# "Desert Horizon" gradient (21st.dev recipe) remapped onto the NMMA gold kernel.
# cqmin -> px on purpose: container-type:size collapses a content-height band.
SAND_GRADIENT = ('<div aria-hidden="true" class="dg" data-ax="135" data-ay="40" data-per="19" '
                 'style="position: absolute; top: -18%; bottom: -18%; left: -13%; width: 126%; filter: blur(1.5px); '
                 'background-color: #8A6224; background-image: '
                 'radial-gradient(150% 46.8% at 42.7% 6%, rgba(243,225,178,0.92) 0%, rgba(243,225,178,0) 51%), '
                 'radial-gradient(150% 46.8% at 43.43% 33%, rgba(215,173,86,0.94) 0%, rgba(215,173,86,0) 51%), '
                 'radial-gradient(150% 46.8% at 51.03% 67%, rgba(197,149,67,0.92) 0%, rgba(197,149,67,0) 51%), '
                 'radial-gradient(150% 46.8% at 53.18% 94%, rgba(138,98,36,0.92) 0%, rgba(138,98,36,0) 51%)"></div>')
DAYS = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"]

CLASSES  = json.load(open(os.path.join(HERE, "classes.json"), encoding="utf-8"))["classes"]
PROGRAMS = json.load(open(os.path.join(HERE, "programs.json"), encoding="utf-8"))["programs"]

def esc(s): return html.escape(s, quote=False)


BTN_LINE = re.compile(r'(<a\b[^>]*class="btn-line"[^>]*>)(.*?)(</a>)', re.S)

def spark_buttons(html_str):
    """Travelling gold spark on the outlined buttons."""
    def rep(m):
        open_tag, inner, close = m.group(1), m.group(2), m.group(3)
        if "spark-ring" in inner:
            return m.group(0)
        if 'style="' in open_tag:
            open_tag = open_tag.replace('style="', 'style="position: relative; overflow: hidden; isolation: isolate; ', 1)
        else:
            open_tag = open_tag.replace('class="btn-line"',
                'class="btn-line" style="position: relative; overflow: hidden; isolation: isolate"', 1)
        return (open_tag + '<span aria-hidden="true" class="spark-ring"></span>'
                + '<span aria-hidden="true" class="spark-fill"></span>'
                + '<span style="position: relative; z-index: 2">' + inner + '</span>' + close)
    return BTN_LINE.sub(rep, html_str)

NBSP_NAME = "Nashville MMA Training Camp"

def no_break_name(html_str):
    """Keep the gym's name on one line without touching attribute values."""
    parts = re.split(r"(<[^>]*>)", html_str)
    for i in range(0, len(parts), 2):          # even indices are text, odd are tags
        if NBSP_NAME in parts[i]:
            parts[i] = parts[i].replace(
                NBSP_NAME, '<span style="white-space: nowrap">%s</span>' % NBSP_NAME)
    return "".join(parts)


# ── chrome lifted from the approved artboard ───────────────────────────────
TPL = open(os.path.join(PAGES, "ProgramDetail.dc.html"), encoding="utf-8").read()
def slice_between(a, b):
    i = TPL.index(a); j = TPL.index(b, i)
    return TPL[i:j]
HELMET = slice_between("<helmet>", "</helmet>") + "</helmet>"
HEADER = slice_between("<!-- header -->", "<!-- ═══ PAGE HERO")
FOOTER = slice_between("<!-- ═══════════════ FOOTER", "</x-dc>").replace("</div>\n</x-dc>", "</div>")
SCRIPT = TPL[TPL.index("<script data-dc-script"):]

# ── markdown -> blocks ─────────────────────────────────────────────────────
SKIP_HEADING = re.compile(r"request (more )?information|areas we serve", re.I)
NOISE_LINE   = re.compile(r"^\[Button:|^REQUEST MORE INFORMATION|^Just fill out|^Contact us today|^Text Us Here", re.I)

def parse(md):
    md = re.sub(r"^---.*?---\s*", "", md, flags=re.S)          # drop front matter
    blocks, skip_next_heading = [], False
    for raw in md.split("\n"):
        line = raw.rstrip()
        if not line.strip():
            continue
        m = re.match(r"^(#{1,4})\s+(.*)$", line)
        if m:
            lvl, txt = len(m.group(1)), m.group(2).strip()
            if skip_next_heading:                              # review author name
                skip_next_heading = False; continue
            if SKIP_HEADING.search(txt):
                blocks.append(("areas", txt) if re.search(r"areas we serve", txt, re.I) else ("skip", txt))
                continue
            blocks.append(("h%d" % lvl, txt)); continue
        im = re.match(r"^!\[([^\]]*)\]\(([^)]+)\)$", line)
        if im:
            if "testimonials-google" in im.group(2):
                skip_next_heading = True                       # its caption follows
            continue                                           # images come from the manifest
        if line.startswith("- "):
            blocks.append(("li", line[2:].strip())); continue
        if NOISE_LINE.search(line.strip()):
            continue
        blocks.append(("p", line.strip()))
    return blocks

# ── schedule cards from classes.json ───────────────────────────────────────
def schedule_cards(tag, audience, enabled=True):
    if not enabled or (tag is None and audience is None):
        return None, 0
    picked = [c for c in CLASSES
              if (tag is None or tag in c["programs"])
              and (audience is None or c["audience"] == audience)
              and (audience is not None or c["audience"] != "kids")]
    if not picked:
        return None, 0
    by = {}
    for c in picked:
        by.setdefault(c["day"], []).append(c)
    out = []
    for d in DAYS:
        if d not in by: continue
        lines = "".join(
            '<div style="display: flex; gap: 8px; align-items: baseline">'
            '<span class="micro" style="font-size: 11px; flex: 0 0 62px; letter-spacing: 0.08em">%s</span>'
            '<span class="body" style="font-size: 15px; line-height: 1.45">%s</span></div>'
            % (c["start"], esc(c["name"])) for c in sorted(by[d], key=lambda x: x["sort"]))
        out.append('      <div style="background: %s; border-left: 3px solid %s; border-radius: 0 8px 8px 0; padding: 18px">\n'
                   '        <div style="font-family: %s; font-size: 29px; margin-bottom: 12px">%s</div>\n'
                   '        <div style="display: flex; flex-direction: column; gap: 8px">%s</div>\n      </div>'
                   % (CARD, GOLD, BEBAS, d, lines))
    out.append('      <div style="background: linear-gradient(135deg, rgba(215,173,86,0.2), rgba(215,173,86,0.06)), %s; '
               'border-left: 3px solid %s; border-radius: 0 8px 8px 0; padding: 18px; display: flex; flex-direction: column; '
               'justify-content: center; align-items: flex-start; gap: 12px">\n'
               '        <div style="font-family: %s; font-size: 35px; line-height: 1">90+ Classes Per Week</div>\n'
               '        <div onClick="{{ openForm }}" class="btn" style="padding: 11px 20px; font-size: 11px">Request more information</div>\n'
               '      </div>' % (CARD, GOLD, BEBAS))
    return "\n".join(out), len(picked)

# ── render one page ────────────────────────────────────────────────────────
def render(p):
    blocks = parse(open(os.path.join(CONTENT, p["content"] + ".md"), encoding="utf-8").read())
    title = next(t for k, t in blocks if k == "h1")
    idx   = [i for i, (k, _) in enumerate(blocks) if k == "h1"][0]
    rest  = blocks[idx + 1:]

    # intro = first h2 and the paragraphs under it
    intro_head, intro_paras, i = "", [], 0
    while i < len(rest):
        k, t = rest[i]
        if k == "h2":
            intro_head = t; i += 1
            while i < len(rest) and rest[i][0] == "p":
                intro_paras.append(rest[i][1]); i += 1
            break
        i += 1
    body, areas = rest[i:], []

    sections, cur = [], None
    for k, t in body:
        if k == "areas":
            cur = "AREAS"; continue
        if cur == "AREAS":
            if k == "li": areas.append(t); continue
            if k in ("h2","h3","h4"): cur = None
        if k == "skip":  continue
        if k in ("h2", "h3", "h4"):
            cur = {"head": t, "paras": [], "items": []}; sections.append(cur); continue
        if cur and isinstance(cur, dict):
            (cur["paras"] if k == "p" else cur["items"]).append(t)

    hero_img = "prog-%s-hero.jpg" % p["slug"]
    body_img = "prog-%s-body.jpg" % p["slug"]

    out = []
    if p.get("hero_style") == "inset":
        # framed hero: the photo sits in a rounded panel with black around it,
        # title centred inside. 8px radius per the standing picture-corner rule.
        out.append('<div style="background: #000000; padding: 40px 48px 8px 48px">')
        out.append('  <div style="background: #141416; border-radius: 14px; padding: 10px; '
                   'box-shadow: inset 0 0 0 1px rgba(255,255,255,0.07)">')
        out.append('  <div style="position: relative; height: 470px; overflow: hidden; border-radius: 8px; isolation: isolate">')
        out.append('    <img src="%s" alt="%s" style="position: absolute; inset: 0; width: 100%%; height: 100%%; object-fit: cover; z-index: 1">' % (hero_img, esc(title)))
        out.append('    <div style="position: absolute; inset: 0; z-index: 2; background: '
                   'radial-gradient(120% 90% at 50% 45%, rgba(0,0,0,0.30) 0%, rgba(0,0,0,0.78) 100%)"></div>')
        out.append('    <div style="position: absolute; inset: 0; z-index: 3; display: flex; flex-direction: column; '
                   'align-items: center; justify-content: center; text-align: center; padding: 0 60px">')
        out.append('      <div class="micro" style="margin-bottom: 16px">Programs</div>')
        import re as _re
        m = _re.match(r"^(.*?)\s+in\s+(.*)$", title, _re.I)
        h1 = ('%s<br>In %s' % (esc(m.group(1)), esc(m.group(2)))) if m else esc(title)
        lead = m.group(1) if m else title
        out.append('      <h1 style="font-size: %dpx; line-height: 0.95; max-width: 1050px">%s</h1>'
                   % (104 if len(lead) < 30 else 80, h1))
        out.append('      <div style="width: 110px; height: 4px; background: %s; margin-top: 24px"></div>' % GOLD)
        out.append('    </div>\n  </div>\n  </div>\n</div>')
        return _finish(p, out, title, intro_head, intro_paras, sections, areas, body_img)

    out.append('<div style="position: relative; height: 440px; overflow: hidden; isolation: isolate">')
    out.append('  <img src="%s" alt="%s" style="position: absolute; inset: 0; width: 100%%; height: 100%%; object-fit: cover; z-index: 1">' % (hero_img, esc(title)))
    out.append('  <div style="position: absolute; inset: 0; background: linear-gradient(to bottom, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.3) 45%, rgba(0,0,0,0.9) 100%); z-index: 2"></div>')
    out.append('  <div style="position: absolute; left: 48px; bottom: 44px; z-index: 3; max-width: 1100px">')
    out.append('    <div class="micro" style="margin-bottom: 14px">Programs</div>')
    size = 104 if len(title) < 34 else 80
    out.append('    <h1 style="font-size: %dpx; line-height: 0.92">%s</h1>' % (size, esc(title)))
    out.append('    <div style="width: 110px; height: 4px; background: %s; margin-top: 20px"></div>' % GOLD)
    out.append('  </div>\n</div>')

    return _finish(p, out, title, intro_head, intro_paras, sections, areas, body_img)


def _finish(p, out, title, intro_head, intro_paras, sections, areas, body_img):
    # intro
    out.append('<div class="rv" style="background: radial-gradient(1000px 500px at 88% -10%, rgba(215,173,86,0.14), transparent 60%), #0A0A0A; padding: 74px 48px">')
    out.append('  <div style="display: grid; grid-template-columns: 1.2fr 1fr; gap: 52px; align-items: start">')
    out.append('    <div>')
    if intro_head:
        out.append('      <h2 style="font-size: %dpx; line-height: 1.04; margin-bottom: 24px">%s</h2>' % (64 if len(intro_head) < 60 else 50, esc(intro_head)))
    for para in intro_paras:
        out.append('      <p class="body" style="font-size: 19px; line-height: 1.72">%s</p>' % esc(para))
    out.append('      <div style="display: flex; gap: 14px; margin-top: 28px">')
    out.append('        <div class="btn" onClick="{{ openForm }}">Request more information</div>')
    out.append('        <a href="#" class="btn-line">Schedule</a>')
    out.append('      </div>\n    </div>')
    out.append('    <div style="position: relative; min-height: 380px; overflow: hidden; border-radius: 8px">')
    out.append('      <img src="%s" alt="%s" style="position: absolute; inset: 0; width: 100%%; height: 100%%; object-fit: cover">' % (body_img, esc(title)))
    out.append('    </div>\n  </div>\n</div>')

    # body sections
    for n, s in enumerate(sections):
        if not s["paras"] and not s["items"]: continue
        gold = (n % 2 == 0)
        if gold:
            out.append('<div class="rv" style="position: relative; overflow: hidden; background: #000000">')
            out.append('  <div aria-hidden="true" class="dg" data-ax="%d" data-ay="%d" data-per="%d" data-ph="%.2f" '
                       'style="position: absolute; top: -20%%; bottom: -20%%; left: -15%%; width: 130%%; background-image: '
                       'radial-gradient(1240px 580px at 50%% 4%%, rgba(215,173,86,0.21) 0%%, '
                       'rgba(215,173,86,0.11) 34%%, transparent 70%%)"></div>'
                       % (150 + (n % 3) * 18, 52 + (n % 3) * 8, 18 + (n % 4) * 3, n * 1.3))
            out.append('  <div style="position: relative; z-index: 2; padding: 70px 48px">')
        else:
            out.append('<div class="rv" style="background: #0A0A0A; padding: 70px 48px">')
        out.append('  <h2 style="font-size: 54px; line-height: 1.04; margin-bottom: 26px; max-width: 1060px">%s</h2>' % esc(s["head"]))
        if s["paras"]:
            cols = "1fr 1fr" if len(s["paras"]) > 1 else "1fr"
            out.append('  <div style="display: grid; grid-template-columns: %s; gap: 40px; max-width: 1180px">' % cols)
            half = (len(s["paras"]) + 1) // 2
            groups = [s["paras"][:half], s["paras"][half:]] if len(s["paras"]) > 1 else [s["paras"]]
            for g in groups:
                if not g: continue
                out.append('    <div>' + "".join('<p class="body" style="font-size: 18px; line-height: 1.72">%s</p>' % esc(x) for x in g) + '</div>')
            out.append('  </div>')
        if s["items"]:
            out.append('  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 26px">')
            for it in s["items"]:
                m = re.match(r"^([^:]{2,60}):\s*(.+)$", it)
                if m:
                    out.append('    <div style="background: %s; border-left: 3px solid %s; border-radius: 0 8px 8px 0; padding: 24px 26px">'
                               '<h3 style="font-size: 34px; margin-bottom: 10px; color: %s">%s</h3>'
                               '<p class="body" style="font-size: 17px; line-height: 1.7; margin: 0">%s</p></div>'
                               % (CARD, GOLD, GOLD, esc(m.group(1).strip()), esc(m.group(2).strip())))
                else:
                    out.append('    <div style="background: %s; border-left: 3px solid %s; border-radius: 0 8px 8px 0; padding: 24px 26px">'
                               '<p class="body" style="font-size: 17px; line-height: 1.7; margin: 0">%s</p></div>' % (CARD, GOLD, esc(it)))
            out.append('  </div>')
        out.append('</div>')

    # schedule
    cards, n_cls = schedule_cards(p.get("schedule_tag"), p.get("schedule_audience"),
                                  p.get("schedule", True))
    if cards:
        out.append('<div class="rv" style="background: #000000; padding: 70px 48px">')
        out.append('  <div style="display: flex; align-items: flex-end; justify-content: space-between; margin-bottom: 26px">')
        out.append('    <h2 style="font-size: 64px; line-height: 1">Schedule</h2>')
        out.append('    <a href="#" class="btn-line" style="padding: 13px 26px; font-size: 12px">View Full Schedule</a>')
        out.append('  </div>')
        out.append('  <div style="display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 14px">')
        out.append('  <!-- GENERATED:cards -->')
        out.append(cards)
        out.append('  <!-- /GENERATED:cards -->')
        out.append('  </div>\n</div>')

    # areas we serve
    if areas:
        out.append('<div class="rv" style="background: #0A0A0A; padding: 56px 48px">')
        out.append('  <div class="micro" style="margin-bottom: 16px">Areas We Serve</div>')
        out.append('  <div style="display: flex; flex-wrap: wrap; gap: 10px">')
        for a in areas:
            out.append('    <span style="box-shadow: inset 0 0 0 1px rgba(255,255,255,0.18); color: rgba(255,255,255,0.72); '
                       'border-radius: 8px; font-size: 14px; font-weight: 700; letter-spacing: 0.05em; padding: 11px 18px">%s</span>' % esc(a))
        out.append('  </div>\n</div>')

    # coach
    c = p.get("coach")
    if c:
        out.append('<div class="rv" style="background: linear-gradient(180deg, rgba(215,173,86,0.1) 0%, rgba(0,0,0,0) 40%), #0A0A0A; padding: 70px 48px">')
        out.append('  <div style="display: grid; grid-template-columns: 320px 1fr; gap: 44px; align-items: center">')
        out.append('    <div style="position: relative; height: 340px; overflow: hidden; border-radius: 8px; background: %s; display: flex; align-items: center; justify-content: center">' % CARD)
        out.append('      <span class="ph" style="font-size: 13px">[Coach photo]</span>')
        out.append('    </div>')
        out.append('    <div>')
        out.append('      <div class="micro" style="margin-bottom: 12px">%s</div>' % esc(c["role"]))
        out.append('      <h2 style="font-size: 58px; line-height: 1; margin-bottom: 18px">%s</h2>' % esc(c["name"]))
        out.append('      <p class="ph" style="font-size: 18px; line-height: 1.7">[%s\'s background goes here — the sport he played professionally, the level, and what he coaches now. Not written yet: he is not on the current site, so we have nothing on file to quote.]</p>' % esc(c["name"].split()[0]))
        out.append('      <a href="#" class="btn-line" style="padding: 13px 26px; font-size: 12px; display: inline-block; margin-top: 10px">Coaches &amp; Trainers</a>')
        out.append('    </div>\n  </div>\n</div>')

    # cta
    out.append('<div class="rv" style="position: relative; overflow: hidden; background: #8A6224">')
    out.append('  ' + SAND_GRADIENT)
    out.append('  <div style="position: relative; z-index: 2; padding: 66px 48px; text-align: center">')
    out.append('  <h2 style="font-size: 74px; line-height: 1; color: #131313; margin-bottom: 12px">Request Information Now</h2>')
    out.append('  <p style="color: rgba(19,19,19,0.82); font-size: 18px; margin-bottom: 28px">40,000 sqft Facility, World Class Coaches, and 90+ Classes per Week</p>')
    out.append('  <div onClick="{{ openForm }}" style="display: inline-block; background: #0A0A0A; color: #FFFFFF; border-radius: 8px; font-size: 13px; '
               'font-weight: 800; padding: 17px 42px; text-transform: uppercase; letter-spacing: 0.12em; cursor: pointer">Request Information</div>')
    out.append('  </div>')
    out.append('</div>')

    return title, "\n".join(out), n_cls

# ── image prep ─────────────────────────────────────────────────────────────
def find_image(name):
    direct = os.path.join(IMAGES, name)
    if os.path.exists(direct): return direct
    for f in os.listdir(IMAGES):
        if f.endswith(name): return os.path.join(IMAGES, f)
    return None

LIMIT = 52 * 1024   # base64 inflates ~1.34x, so this lands under the ~70 KB canvas guidance

def prep(src, dst, width):
    """Encode down until the file fits the canvas per-entry budget."""
    import imageio_ffmpeg
    ff = imageio_ffmpeg.get_ffmpeg_exe()
    for w, q in ((width, 5), (width, 7), (int(width * 0.85), 8), (int(width * 0.72), 9), (int(width * 0.6), 11)):
        subprocess.run([ff, "-y", "-i", src, "-vf", "scale=%d:-2" % w, "-q:v", str(q), dst],
                       check=True, capture_output=True)
        if os.path.getsize(dst) <= LIMIT:
            return
    print("  NOTE: %s still %d KB after max compression" % (os.path.basename(dst), os.path.getsize(dst) // 1024))

os.makedirs(IMGOUT, exist_ok=True)
made = []
for p in PROGRAMS:
    for kind, width in (("hero", 1200), ("body", 760)):
        src = find_image(p[kind])
        if not src:
            print("  MISSING image for %s/%s: %s" % (p["slug"], kind, p[kind])); continue
        prep(src, os.path.join(IMGOUT, "prog-%s-%s.jpg" % (p["slug"], kind)), width)

    title, body_html, n_cls = render(p)
    body_html = spark_buttons(no_break_name(body_html))
    page = ('<!doctype html>\n<html>\n<head>\n  <meta charset="utf-8">\n  <script src="./support.js"></script>\n</head>\n<body>\n'
            '<x-dc>\n' + HELMET + '\n\n<div style="width: 1440px; overflow: hidden; background: #000000; position: relative">\n\n'
            + HEADER + "\n\n" + body_html + "\n\n" + FOOTER + "\n</div>\n</x-dc>\n" + SCRIPT)
    name = "Program-%s.dc.html" % p["slug"]
    open(os.path.join(PAGES, name), "w", encoding="utf-8").write(page)
    made.append((name, title, n_cls))
    print("%-42s %-52s %2d classes" % (name, title[:50], n_cls))

json.dump([{"file": f, "title": t} for f, t, _ in made],
          open(os.path.join(HERE, "generated-pages.json"), "w", encoding="utf-8"), indent=2)
print("\n%d program pages generated" % len(made))
