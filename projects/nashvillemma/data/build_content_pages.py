# -*- coding: utf-8 -*-
"""Generate a design artboard for every non-program page.

Same job as build_program_pages.py, for the rest of the site: about, contact,
FAQ, coaches (index plus one page each), reviews, facilities, recovery and
events. Copy comes from the client's own harvested pages in content/ and is
placed verbatim. Chrome is lifted from the approved ProgramDetail artboard so
these pages are identical to the signed-off ones.

The vendor's information architecture is not copied. 97Display gave every FAQ
answer its own thin page, fifteen of them, each one question long. Here the
FAQ is one page. Where a page's shape is ours rather than theirs, the reason
is in a comment.

  python3 build_content_pages.py
"""
import json, os, re, html, glob

HERE    = os.path.dirname(os.path.abspath(__file__))
PROJ    = os.path.dirname(HERE)
CONTENT = os.path.join(PROJ, "content")
IMAGES  = os.path.join(PROJ, "source", "images")
PAGES   = os.path.join(PROJ, "design-pages")
IMGOUT  = os.path.join(PAGES, "img")

GOLD, CARD = "#D7AD56", "#1E1E29"
BEBAS = "'Bebas Neue','Oswald','Arial Narrow',sans-serif"

SQUARE = ("background: rgba(255,255,255,0.028); "
          "box-shadow: inset 0 0 0 1px rgba(215,173,86,0.30)")
PANEL  = ("background: rgba(255,255,255,0.028); box-shadow: inset 0 0 0 1px rgba(215,173,86,0.30); "
          "border-radius: 10px")
SAND_GRADIENT = ('<div aria-hidden="true" class="dg" data-ax="135" data-ay="40" data-per="19" '
                 'style="position: absolute; top: -18%; bottom: -18%; left: -13%; width: 126%; filter: blur(1.5px); '
                 'background-color: #8A6224; background-image: '
                 'radial-gradient(150% 46.8% at 42.7% 6%, rgba(243,225,178,0.92) 0%, rgba(243,225,178,0) 51%), '
                 'radial-gradient(150% 46.8% at 43.43% 33%, rgba(215,173,86,0.94) 0%, rgba(215,173,86,0) 51%), '
                 'radial-gradient(150% 46.8% at 51.03% 67%, rgba(197,149,67,0.92) 0%, rgba(197,149,67,0) 51%), '
                 'radial-gradient(150% 46.8% at 53.18% 94%, rgba(138,98,36,0.92) 0%, rgba(138,98,36,0) 51%)"></div>')


def esc(s):
    return html.escape(s, quote=False)


# ── chrome lifted from the approved artboard ───────────────────────────────
TPL = open(os.path.join(PAGES, "ProgramDetail.dc.html"), encoding="utf-8").read()

def slice_between(a, b):
    i = TPL.index(a); j = TPL.index(b, i)
    return TPL[i:j]

HELMET = slice_between("<helmet>", "</helmet>") + "</helmet>"
HEADER = slice_between("<!-- header -->", "<!-- ═══ PAGE HERO")
FOOTER = slice_between("<!-- ═══════════════ FOOTER", "</x-dc>").replace("</div>\n</x-dc>", "</div>")
SCRIPT = TPL[TPL.index("<script data-dc-script"):]

BTN_LINE = re.compile(r'(<a\b[^>]*class="btn-line"[^>]*>)(.*?)(</a>)', re.S)

def spark_buttons(s):
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
    return BTN_LINE.sub(rep, s)

NBSP_NAME = "Nashville MMA Training Camp"

def no_break_name(s):
    parts = re.split(r"(<[^>]*>)", s)
    for i in range(0, len(parts), 2):
        if NBSP_NAME in parts[i]:
            parts[i] = parts[i].replace(
                NBSP_NAME, '<span style="white-space: nowrap">%s</span>' % NBSP_NAME)
    return "".join(parts)


# ── markdown helpers ───────────────────────────────────────────────────────
NOISE = re.compile(r"^\[Button:|^\[Link:|^REQUEST MORE INFORMATION|^Request more information$"
                   r"|^Just fill out|^Contact us today|^Text Us Here", re.I)

def strip_fm(md):
    return re.sub(r"^---.*?---\s*", "", md, flags=re.S)

def front_matter(md):
    m = re.match(r"^---(.*?)---", md, re.S)
    if not m:
        return {}
    out = {}
    for k in ("title", "meta_description"):
        v = re.search(r'%s:\s*"(.*?)"\s*$' % k, m.group(1), re.M)
        if v:
            out[k] = v.group(1).replace('\\"', '"')
    return out

def read(name):
    return open(os.path.join(CONTENT, name), encoding="utf-8").read()

def clean_lines(md):
    """Content lines with the vendor's furniture dropped.

    Review thumbnails, their caption headings and the repeated Request
    Information calls sat on every harvested page. They are chrome, not copy.
    """
    out, skip_heading = [], False
    for raw in strip_fm(md).split("\n"):
        line = raw.strip()
        if not line:
            continue
        im = re.match(r"^!\[([^\]]*)\]\(([^)]+)\)$", line)
        if im:
            if "testimonials-google" in im.group(2) or "testimonials-facebook" in im.group(2):
                skip_heading = True
            continue
        h = re.match(r"^(#{1,6})\s+(.*)$", line)
        if h:
            if skip_heading:
                skip_heading = False
                continue
            if re.search(r"request (more )?information", h.group(2), re.I):
                continue
            out.append(("h%d" % len(h.group(1)), h.group(2).strip()))
            continue
        if NOISE.search(line):
            continue
        if line.startswith("- "):
            out.append(("li", line[2:].strip()))
            continue
        if line.startswith("|"):
            out.append(("row", [c.strip() for c in line.strip("|").split("|") if c.strip()]))
            continue
        out.append(("p", line))
    return out


# ── shared page furniture ──────────────────────────────────────────────────
MASK = ("linear-gradient(to bottom, #000 0%, #000 54%, rgba(0,0,0,0.35) 82%, "
        "rgba(0,0,0,0) 100%)")

def bleed_hero(head, img, alt, kicker=None, pos="50% 30%", minh=560):
    """The approved full-bleed hero: photo edge to edge, dissolving downward.

    Identical to the program-page hero, including the reason the fade is a
    mask rather than an overlay: the page background is a moving gold wash, so
    a fade to a flat colour would band against it.
    """
    o = ['<div class="bleedhero" style="position: relative; overflow: hidden; overflow: clip; '
         'min-height: %dpx; isolation: isolate; background: #050505">' % minh,
         '  <div aria-hidden="true" style="position: absolute; inset: 0; z-index: 1; '
         '-webkit-mask-image: %s; mask-image: %s">' % (MASK, MASK),
         '    <img src="%s" alt="%s" style="position: absolute; inset: 0; width: 100%%; '
         'height: 100%%; object-fit: cover; object-position: %s">' % (img, esc(alt), pos),
         '    <div style="position: absolute; inset: 0; background: rgba(5,5,5,0.30)"></div>',
         '    <div class="bleedveil" style="position: absolute; inset: 0; background: linear-gradient('
         'to right, rgba(5,5,5,0.97) 0%, rgba(5,5,5,0.95) 32%, rgba(5,5,5,0.70) 55%, '
         'rgba(5,5,5,0.26) 76%, rgba(5,5,5,0.04) 100%)"></div>',
         '  </div>',
         '  <div style="position: relative; z-index: 2; max-width: 980px; '
         'padding: 118px 48px 132px 48px">']
    if kicker:
        o.append('    <div class="micro" style="margin-bottom: 18px; color: %s">%s</div>' % (GOLD, esc(kicker)))
    o.append('    <h1 style="font-size: %dpx; line-height: 0.96; max-width: 820px">%s</h1>'
             % (88 if len(head) < 30 else 66, esc(head)))
    o.append('    <div style="width: 110px; height: 4px; background: %s; margin-top: 28px"></div>' % GOLD)
    o.append('  </div>\n</div>')
    return o

def band(gold=False, pad="72px 48px", n=0):
    """One content band. The gold ones carry a drifting wash behind them."""
    if not gold:
        return ['<div class="rv" style="background: #0A0A0A; padding: %s">' % pad], ['</div>']
    open_ = ['<div class="rv" style="position: relative; overflow: hidden; background: #000000">',
             '  <div aria-hidden="true" class="dg" data-ax="%d" data-ay="%d" data-per="%d" data-ph="%.2f" '
             'style="position: absolute; top: -20%%; bottom: -20%%; left: -15%%; width: 130%%; background-image: '
             'radial-gradient(1240px 580px at 50%% 4%%, rgba(215,173,86,0.21) 0%%, '
             'rgba(215,173,86,0.11) 34%%, transparent 70%%)"></div>' % (150 + (n % 3) * 18, 52 + (n % 3) * 8,
                                                                        18 + (n % 4) * 3, n * 1.3),
             '  <div style="position: relative; z-index: 2; padding: %s">' % pad]
    return open_, ['  </div>', '</div>']

def h2(text, size=54):
    return ('  <h2 style="font-size: %dpx; line-height: 1.04; margin-bottom: 26px; '
            'max-width: 1060px">%s</h2>' % (size, esc(text)))

def para(text, size=18):
    return ('  <p class="body" style="font-size: %dpx; line-height: 1.72; max-width: 76ch">%s</p>'
            % (size, esc(text)))

def cta():
    return ['<div class="rv" style="position: relative; overflow: hidden; background: #8A6224">',
            '  ' + SAND_GRADIENT,
            '  <div style="position: relative; z-index: 2; padding: 66px 48px; text-align: center">',
            '  <h2 style="font-size: 74px; line-height: 1; color: #131313; margin-bottom: 12px">Request Information Now</h2>',
            '  <p style="color: rgba(19,19,19,0.82); font-size: 18px; margin-bottom: 28px">40,000 sqft Facility, World Class Coaches, and 90+ Classes per Week</p>',
            '  <div onClick="{{ openForm }}" style="display: inline-block; background: #0A0A0A; color: #FFFFFF; border-radius: 8px; font-size: 13px; '
            'font-weight: 800; padding: 17px 42px; text-transform: uppercase; letter-spacing: 0.12em; cursor: pointer">Request Information</div>',
            '  </div>', '</div>']


# ── image prep ─────────────────────────────────────────────────────────────
LIMIT = 52 * 1024      # base64 inflates ~1.34x, so this lands under the canvas budget

def find_image(name):
    direct = os.path.join(IMAGES, name)
    if os.path.exists(direct):
        return direct
    for f in sorted(os.listdir(IMAGES)):
        if f.endswith(name):
            return os.path.join(IMAGES, f)
    return None

def prep(src_name, dst_name, width, flatten=None):
    """Resize and compress into design-pages/img, skipping work already done.

    `flatten` is the colour to composite transparency onto, for logos that sit
    on a light panel. Without it an RGBA logo would go black on black.
    """
    dst = os.path.join(IMGOUT, dst_name)
    if os.path.exists(dst) and os.path.getsize(dst) <= LIMIT:
        return dst_name
    src = find_image(src_name)
    if not src:
        print("  MISSING image: %s" % src_name)
        return None
    from PIL import Image
    im = Image.open(src)
    if im.mode in ("RGBA", "LA", "P"):
        im = im.convert("RGBA")
        bg = Image.new("RGBA", im.size, flatten or (5, 5, 5, 255))
        im = Image.alpha_composite(bg, im)
    im = im.convert("RGB")
    if im.width > width:
        im = im.resize((width, max(1, round(im.height * width / im.width))), Image.LANCZOS)
    for q in (82, 74, 66, 58, 50, 42):
        im.save(dst, "JPEG", quality=q, optimize=True, progressive=True)
        if os.path.getsize(dst) <= LIMIT:
            return dst_name
    w = int(width * 0.75)
    im.resize((w, max(1, round(im.height * w / im.width))), Image.LANCZOS).save(
        dst, "JPEG", quality=62, optimize=True, progressive=True)
    return dst_name


# ── coaches ────────────────────────────────────────────────────────────────
def coach_roster():
    """Name, role and photo for each coach, from the client's own roster page.

    Roles come from instructors.md, bios from the per-coach files. Nothing is
    inferred: a coach with no role listed gets no role, not a guess.
    """
    roster = re.findall(r"^- (.+?)\n\n!\[[^\]]*\]\(([^)]+)\)", strip_fm(read("instructors.md")), re.M)
    out = []
    for path in sorted(glob.glob(os.path.join(CONTENT, "instructors-*.md"))):
        md = strip_fm(open(path, encoding="utf-8").read())
        slug = os.path.basename(path)[len("instructors-"):-len(".md")]
        name = re.search(r"^## (.+)$", md, re.M)
        name = name.group(1).strip() if name else slug.replace("-", " ").title()
        role, photo = "", None
        for label, url in roster:
            if label.lower().startswith(name.lower()):
                role = label[len(name):].strip(" -")
                photo = os.path.basename(url)
                break
        bio = [t for k, t in clean_lines(open(path, encoding="utf-8").read())
               if k == "p"]
        out.append({"slug": slug, "name": name, "role": role, "photo": photo,
                    "bio": bio, "meta": front_matter(open(path, encoding="utf-8").read())})
    # roster order, not alphabetical: the head coaches lead it on the client's
    # own page and that ordering is a decision, not an accident
    order = {}
    for i, (label, _) in enumerate(roster):
        order[label.split()[0].lower() + " " + label.split()[1].lower()] = i
    out.sort(key=lambda c: order.get(" ".join(c["name"].lower().split()[:2]), 99))
    return out


def page_coaches(coaches):
    md = read("instructors.md")
    head = re.search(r"^# (.+)$", strip_fm(md), re.M).group(1).strip()
    o = bleed_hero(head, "gym-7.jpg", "Coaching at Nashville MMA Training Camp",
                   pos="50% 45%", minh=520)
    op, cl = band(pad="78px 48px")
    o += op
    o.append('  <div class="roster" style="display: grid; '
             'grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 18px">')
    for c in coaches:
        o.append('    <a href="coaches/%s.html" class="idxcard" style="display: block; '
                 'text-decoration: none; background: #0E0E10; '
                 'box-shadow: inset 0 0 0 1px rgba(215,173,86,0.30)">' % c["slug"])
        o.append('      <div style="position: relative; height: 300px; overflow: hidden">')
        o.append('        <img src="coach-%s.jpg" alt="%s" style="position: absolute; inset: 0; '
                 'width: 100%%; height: 100%%; object-fit: cover; object-position: 50%% 18%%">'
                 % (c["slug"], esc(c["name"])))
        o.append('        <div style="position: absolute; inset: 0; background: linear-gradient('
                 'to top, rgba(5,5,5,0.92) 0%, rgba(5,5,5,0.15) 58%, rgba(5,5,5,0) 100%)"></div>')
        o.append('      </div>')
        o.append('      <div style="padding: 22px 24px 26px 24px">')
        o.append('        <div aria-hidden="true" style="width: 34px; height: 4px; background: %s"></div>' % GOLD)
        o.append('        <h2 style="font-size: 26px; line-height: 1.06; margin: 16px 0 8px; '
                 'color: #FFFFFF">%s</h2>' % esc(c["name"]))
        if c["role"]:
            o.append('        <p class="body" style="font-size: 15px; line-height: 1.55; margin: 0">%s</p>'
                     % esc(c["role"]))
        o.append('      </div>\n    </a>')
    o.append('  </div>')
    o += cl + cta()
    return head, o


def page_coach(c):
    o = ['<div class="rv" style="background: #050505; padding: 96px 48px 78px 48px">',
         '  <div style="display: grid; grid-template-columns: 1fr 460px; gap: 56px; align-items: center">',
         '    <div>']
    if c["role"]:
        o.append('      <div class="micro" style="margin-bottom: 16px; color: %s">%s</div>' % (GOLD, esc(c["role"])))
    o.append('      <h1 style="font-size: %dpx; line-height: 0.96">%s</h1>'
             % (82 if len(c["name"]) < 17 else 64, esc(c["name"])))
    o.append('      <div style="width: 110px; height: 4px; background: %s; margin-top: 26px"></div>' % GOLD)
    o.append('    </div>')
    o.append('    <div style="position: relative; height: 560px; overflow: hidden; background: %s">' % CARD)
    o.append('      <img src="coach-%s.jpg" alt="%s" style="position: absolute; inset: 0; '
             'width: 100%%; height: 100%%; object-fit: cover; object-position: 50%% 16%%">'
             % (c["slug"], esc(c["name"])))
    o.append('    </div>\n  </div>\n</div>')

    op, cl = band(gold=True, pad="70px 48px", n=0)
    o += op
    for p in c["bio"]:
        o.append(para(p, 19))
    o.append('  <div style="display: flex; gap: 14px; margin-top: 30px">')
    o.append('    <div class="btn" onClick="{{ openForm }}">Request more information</div>')
    o.append('    <a href="../coaches.html" class="btn-line">All coaches</a>')
    o.append('  </div>')
    o += cl + cta()
    return o


# ── FAQ ────────────────────────────────────────────────────────────────────
def page_faq():
    """One page, not fifteen.

    97Display gave every answer its own URL, each one question long, and then
    repeated all fifteen on a listing page as well. That is thin duplicate
    content twice over. The questions are what people search, so they stay,
    each one an id you can link straight to.
    """
    items = []
    for path in sorted(glob.glob(os.path.join(CONTENT, "faq-*.md"))):
        raw = open(path, encoding="utf-8").read()
        q = front_matter(raw).get("title", "").strip()
        parts = [(k, t) for k, t in clean_lines(raw) if k in ("p", "li")]
        if not q or not parts:
            continue
        slug = re.sub(r"[^a-z0-9]+", "-", q.lower()).strip("-")[:60]
        items.append((q, slug, parts))

    o = bleed_hero("Frequently Asked Questions", "about-bg.jpg",
                   "Training at Nashville MMA Training Camp", pos="55% 35%", minh=520)
    op, cl = band(pad="70px 48px")
    o += op
    # a jump list, so the page answers in one click on a phone as well
    o.append('  <div style="display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 46px">')
    for q, slug, _ in items:
        o.append('    <a href="#%s" style="text-decoration: none; color: rgba(255,255,255,0.78); '
                 'font-size: 14px; line-height: 1.4; padding: 10px 16px; '
                 'box-shadow: inset 0 0 0 1px rgba(215,173,86,0.30)">%s</a>' % (slug, esc(q)))
    o.append('  </div>')
    for q, slug, parts in items:
        o.append('  <div id="%s" style="%s; padding: 34px 36px; margin-bottom: 16px">' % (slug, SQUARE))
        o.append('    <div aria-hidden="true" style="width: 40px; height: 4px; background: %s"></div>' % GOLD)
        o.append('    <h2 style="font-size: 32px; line-height: 1.1; margin: 18px 0 14px; '
                 'color: #FFFFFF">%s</h2>' % esc(q))
        bullets = [t for k, t in parts if k == "li"]
        for k, t in parts:
            if k == "p":
                o.append('    <p class="body" style="font-size: 17px; line-height: 1.72; '
                         'max-width: 84ch">%s</p>' % esc(t))
        if bullets:
            o.append('    <ul style="margin: 14px 0 0; padding-left: 20px">')
            for b in bullets:
                o.append('      <li class="body" style="font-size: 17px; line-height: 1.68; '
                         'margin-bottom: 8px">%s</li>' % esc(b))
            o.append('    </ul>')
        o.append('  </div>')
    o += cl + cta()
    return o


# ── contact ────────────────────────────────────────────────────────────────
DAY_RE = re.compile(r"(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday):\s*"
                    r"([0-9apm:\s-]+?)(?=(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday):|$)")

def page_contact():
    raw = read("contact.md")
    blocks, cur = [], None
    for k, t in clean_lines(raw):
        if k in ("h3", "h4"):
            cur = {"head": t, "paras": []}
            blocks.append(cur)
        elif k == "p" and cur is not None:
            cur["paras"].append(t)
    by = {b["head"].rstrip(":").lower(): b for b in blocks}

    def find(key):
        for h, b in by.items():
            if key in h:
                return b
        return None

    loc   = find("nashville mma training camp")
    hours = find("hours of operation")
    mem   = find("membership adjustments")
    events= find("private events")
    train = find("stuck by the")

    address = phone = email = ""
    if loc:
        for p in loc["paras"]:
            if p.lower().startswith("address:"):
                address = p.split(":", 1)[1].strip()
            m = re.search(r"Phone:\s*([0-9\-]+)", p)
            if m:
                phone = m.group(1)
            m = re.search(r"Email:\s*(\S+@\S+)", p)
            if m:
                email = m.group(1)

    o = bleed_hero("Contact Us Today!", "gym-1.jpg", "Nashville MMA Training Camp",
                   pos="55% 42%", minh=520)
    op, cl = band(pad="72px 48px")
    o += op
    o.append('  <div style="display: grid; grid-template-columns: 1.15fr 1fr; gap: 22px; align-items: stretch">')
    # where and how to reach the gym
    o.append('    <div style="%s; padding: 40px 42px">' % SQUARE)
    o.append('      <div aria-hidden="true" style="width: 52px; height: 4px; background: %s"></div>' % GOLD)
    o.append('      <h2 style="font-size: 40px; line-height: 1.04; margin: 22px 0 22px; color: #FFFFFF">'
             'Nashville MMA Training Camp</h2>')
    if address:
        o.append('      <p class="body" style="font-size: 20px; line-height: 1.6; margin-bottom: 18px">%s</p>' % esc(address))
    rows = []
    if phone:
        rows.append(('Phone', '<a href="tel:%s" style="color: %s; text-decoration: none">%s</a>'
                     % (re.sub(r"[^0-9]", "", phone), GOLD, esc(phone))))
    if email:
        rows.append(('Email', '<a href="mailto:%s" style="color: %s; text-decoration: none">%s</a>'
                     % (email, GOLD, esc(email))))
    for label, val in rows:
        o.append('      <div style="display: flex; gap: 16px; align-items: baseline; margin-bottom: 10px">'
                 '<span class="micro" style="flex: 0 0 74px; font-size: 11px">%s</span>'
                 '<span style="font-size: 19px; font-weight: 700">%s</span></div>' % (label, val))
    o.append('      <div style="display: flex; gap: 14px; margin-top: 28px; flex-wrap: wrap">')
    o.append('        <div class="btn" onClick="{{ openForm }}">Request more information</div>')
    o.append('        <a href="https://www.google.com/maps/place/1504+Elm+Hill+Pike,+Nashville,+Tennessee+37210/'
             '@36.1444800141489,-86.7203192883347" class="btn-line">Map</a>')
    o.append('      </div>\n    </div>')
    # hours. Days of the week are ordered and counted, so they read as a table
    o.append('    <div style="%s; padding: 40px 42px">' % SQUARE)
    o.append('      <div aria-hidden="true" style="width: 52px; height: 4px; background: %s"></div>' % GOLD)
    o.append('      <h2 style="font-size: 40px; line-height: 1.04; margin: 22px 0 22px; color: #FFFFFF">Hours</h2>')
    if hours:
        for day, span in DAY_RE.findall(" ".join(hours["paras"])):
            o.append('      <div style="display: flex; justify-content: space-between; align-items: baseline; '
                     'gap: 18px; padding: 11px 0; box-shadow: inset 0 -1px 0 rgba(255,255,255,0.08)">'
                     '<span style="font-family: %s; font-size: 24px; letter-spacing: 0.02em">%s</span>'
                     '<span class="body" style="font-size: 17px">%s</span></div>'
                     % (BEBAS, day, esc(span.strip())))
    o.append('    </div>')
    o.append('  </div>')
    o += cl

    # the standing notes: memberships, events, and the train
    notes = [b for b in (mem, events, train) if b]
    if notes:
        op, cl = band(gold=True, pad="70px 48px", n=1)
        o += op
        o.append('  <div style="display: grid; grid-template-columns: repeat(%d, minmax(0, 1fr)); gap: 18px">'
                 % len(notes))
        for b in notes:
            o.append('    <div style="%s; padding: 32px 34px">' % SQUARE)
            o.append('      <h3 style="font-size: 23px; line-height: 1.2; margin: 0 0 14px; '
                     'color: #FFFFFF">%s</h3>' % esc(b["head"].rstrip(":")))
            for p in b["paras"]:
                p_html = re.sub(r"(https?://\S+)",
                                lambda m: '<a href="%s" style="color: %s">%s</a>'
                                % (m.group(1).rstrip("."), GOLD, m.group(1).rstrip(".")), esc(p))
                p_html = re.sub(r"([\w.]+@[\w.]+)",
                                lambda m: '<a href="mailto:%s" style="color: %s">%s</a>'
                                % (m.group(1), GOLD, m.group(1)), p_html)
                o.append('      <p class="body" style="font-size: 16px; line-height: 1.68; margin: 0 0 10px">%s</p>'
                         % p_html)
            o.append('    </div>')
        o.append('  </div>')
        o += cl
    o += cta()
    return o


# ── about ──────────────────────────────────────────────────────────────────
def page_about():
    """The gym in its own words.

    There is no About page in the harvest. These three sections are the
    client's own copy from their homepage, which is where they describe
    themselves, so nothing here is written for them.
    """
    blocks, cur = [], None
    for k, t in clean_lines(read("index.md")):
        if k == "h3" and t.lower().startswith("our "):
            cur = {"head": t, "paras": []}
            blocks.append(cur)
        elif k == "p" and cur is not None and len(cur["paras"]) < 1:
            cur["paras"].append(t)
        elif k in ("h2", "h3"):
            cur = None
    blocks = [b for b in blocks if b["paras"]]

    o = bleed_hero("Nashville MMA Training Camp", "about-bg.jpg",
                   "Inside Nashville MMA Training Camp", pos="55% 38%", minh=600)
    for i, b in enumerate(blocks):
        op, cl = band(gold=(i % 2 == 0), pad="70px 48px", n=i)
        o += op
        o.append(h2(b["head"], 58))
        for p in b["paras"]:
            o.append(para(p, 19))
        o.append('  <div style="display: flex; gap: 14px; margin-top: 26px">')
        dest = {"our coaches": ("coaches.html", "Meet the coaches"),
                "our programs": ("programs/index.html", "See the classes"),
                "our facility": ("facilities.html", "Take the tour")}.get(b["head"].lower())
        if dest:
            o.append('    <a href="%s" class="btn-line">%s</a>' % dest)
        o.append('  </div>')
        o += cl
    o += cta()
    return o


# ── reviews ────────────────────────────────────────────────────────────────
def page_reviews():
    """Members' own words, placed as written.

    Nothing here is authored. The vendor rendered every review as one shared
    image, so only the names carried through for 24 of the 62. Those 24 are
    left off rather than given words they never said.
    """
    md = strip_fm(read("reviews.md"))
    head = re.search(r"^# (.+)$", md, re.M).group(1).strip()
    revs, cur = [], None
    for line in md.split("\n"):
        m = re.match(r"^!\[.*?five star review\s*-\s*(.+?)\]\(", line.strip())
        if m:
            cur = {"name": m.group(1).strip(), "text": []}
            revs.append(cur)
            continue
        t = line.strip()
        if not t or t.startswith("#") or t.startswith("[") or t.startswith("!["):
            continue
        if cur:
            cur["text"].append(t)
    written = [r for r in revs if r["text"]]

    o = bleed_hero(head, "gym-3.jpg", "Members training at Nashville MMA Training Camp",
                   pos="50% 40%", minh=520)
    op, cl = band(pad="74px 48px")
    o += op
    o.append('  <div style="column-count: 3; column-gap: 18px">')
    for r in written:
        o.append('    <div style="%s; padding: 30px 32px; margin: 0 0 18px; break-inside: avoid">' % SQUARE)
        o.append('      <div aria-hidden="true" style="width: 34px; height: 4px; background: %s"></div>' % GOLD)
        for t in r["text"]:
            o.append('      <p class="body" style="font-size: 16px; line-height: 1.7; margin: 16px 0 0">%s</p>' % esc(t))
        o.append('      <div class="micro" style="margin-top: 18px; color: rgba(255,255,255,0.62)">%s</div>'
                 % esc(r["name"]))
        o.append('    </div>')
    o.append('  </div>')
    o += cl + cta()
    return head, o, len(revs), len(written)


# ── facilities ─────────────────────────────────────────────────────────────
GYM_PHOTOS = ["DSC05515-Enhanced-NR-292249.jpg", "DSC09116-292251.jpg", "DSC09141-292252.jpg",
              "DSC09152-292253.jpg", "DSC09235-292255.jpg", "DSC09273-292256.jpg",
              "DSC09305-292257.jpg", "DSC09321-292258.jpg", "DSC09331-292259.jpg"]

def facility_paras():
    return [t for k, t in clean_lines(read("classes-facilities.md")) if k == "p"]

def page_facilities():
    paras = facility_paras()
    o = bleed_hero("Nashville MMA Training Camp Facilities", "gym-1.jpg",
                   "Inside the gym at Nashville MMA Training Camp", pos="50% 45%", minh=600)
    op, cl = band(gold=True, pad="72px 48px", n=0)
    o += op
    o.append(h2("Take a Look Inside Our Gym!", 58))
    o.append('  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px; max-width: 1240px">')
    half = (len(paras) + 1) // 2
    for group in (paras[:half], paras[half:]):
        o.append('    <div>' + "".join(
            '<p class="body" style="font-size: 18px; line-height: 1.72">%s</p>' % esc(p) for p in group) + '</div>')
    o.append('  </div>')
    o += cl

    op, cl = band(pad="64px 48px")
    o += op
    o.append('  <div style="display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 14px">')
    # the gallery is not a uniform grid: the wide ones carry the room, the rest
    # fill in around them
    spans = [(3, 300), (3, 300), (2, 230), (2, 230), (2, 230), (4, 300), (2, 300), (3, 240), (3, 240)]
    for i, name in enumerate(GYM_PHOTOS):
        span, h = spans[i % len(spans)]
        o.append('    <div style="grid-column: span %d; position: relative; height: %dpx; '
                 'overflow: hidden; background: %s">' % (span, h, CARD))
        o.append('      <img src="gym-%d.jpg" alt="Inside Nashville MMA Training Camp" '
                 'style="position: absolute; inset: 0; width: 100%%; height: 100%%; object-fit: cover">' % (i + 1))
        o.append('    </div>')
    o.append('  </div>')
    o += cl + cta()
    return o


# ── recovery ───────────────────────────────────────────────────────────────
# The recovery room is described in the client's own facilities copy, in one
# paragraph that names every piece of equipment in it. That paragraph is the
# page. The amenity cards below repeat the client's own words for each item,
# split out of that sentence and not rewritten.
RECOVERY_ITEMS = [
    ("Dry heat sauna", "to detoxify and relax muscles"),
    ("Cold tub", "to reduce inflammation and accelerate recovery"),
    ("Normatec compression boots", "for dynamic compression"),
    ("Mobility area", "with tools and space for stretching and pre-hab exercises"),
]

def page_recovery():
    lead = next((p for p in facility_paras() if "Recovery Room" in p), None)

    o = bleed_hero("Recovery Room", "gym-5.jpg", "Inside Nashville MMA Training Camp",
                   kicker="Included with all adult memberships", pos="50% 45%", minh=560)
    op, cl = band(gold=True, pad="72px 48px", n=0)
    o += op
    if lead:
        o.append(para(lead, 20))
    o.append('  <div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); '
             'gap: 18px; margin-top: 38px">')
    for name, what in RECOVERY_ITEMS:
        o.append('    <div style="%s; padding: 34px 36px">' % SQUARE)
        o.append('      <div aria-hidden="true" style="width: 40px; height: 4px; background: %s"></div>' % GOLD)
        o.append('      <h3 style="font-size: 30px; line-height: 1.06; margin: 18px 0 10px; '
                 'color: #FFFFFF">%s</h3>' % esc(name))
        o.append('      <p class="body" style="font-size: 17px; line-height: 1.68; margin: 0">%s</p>'
                 % esc(what[0].upper() + what[1:]))
        o.append('    </div>')
    o.append('  </div>')
    o += cl + cta()
    return o


# ── events and sponsorships ────────────────────────────────────────────────
EVENT_IMG = {"nashville mma training camp\u2019s women\u2019s self-defense course":
                 ("8943-selfdefense-261427.jpg", "event-self-defense.jpg",
                  "Self-defense training at Nashville MMA Training Camp"),
             "nashville mma wrestling club":
                 ("0-1-1-297211.png", "event-wrestling-club.jpg", None),
             "shop local market":
                 ("7294505f-d804-4944-8110-a89266be7fc2-297248.png", "event-shop-local.jpg", None)}
PAST_IMG = [("Galentine’s February 2025", "Galentines-2025-296699.png", "past-galentines.jpg"),
            ("Bob Perez Seminar July 2025", "BOB-PEREZ-296698.png", "past-bob-perez.jpg"),
            ("Underground October 2025", "Underground-Oct-18th-296700.png", "past-underground.jpg")]
SPONSOR_IMG = [("Black Dog Holdings", "Black-Dog-Holding-263781.png", "sponsor-black-dog.jpg"),
               ("Fuel Nutrition", "Fuel-Nutrition-263783.jpg", "sponsor-fuel-nutrition.jpg"),
               ("Compass Human Performance", "Compass-Human-Performance-263780.jpg", "sponsor-compass.jpg")]

def page_events():
    secs, cur = [], None
    for k, t in clean_lines(read("classes-sponsors.md")):
        if k in ("h2", "h3"):
            cur = {"head": t, "paras": [], "items": [], "rows": [], "flow": []}
            secs.append(cur)
        elif cur is None:
            continue
        elif k in ("p", "h4"):
            cur["paras"].append(t)
            cur["flow"].append(("p", t))
        elif k == "li":
            cur["items"].append(t)
            cur["flow"].append(("li", t))
        elif k == "row":
            cur["rows"].append(t)

    def get(key):
        return next((s for s in secs if key in s["head"].lower()), None)

    sponsors = get("sponsors")
    upcoming = [s for s in secs if s["head"].lower() in
                ("nashville mma training camp’s women’s self-defense course",
                 "nashville mma wrestling club", "shop local market")]
    past = get("past events")

    o = bleed_hero("Events & Sponsorships", "gym-2.jpg",
                   "Nashville MMA Training Camp", pos="50% 40%", minh=560)

    # what is coming up
    if upcoming:
        op, cl = band(gold=True, pad="72px 48px", n=0)
        o += op
        o.append(h2("Upcoming Events", 58))
        evt = get("upcoming events")
        if evt:
            for p in evt["paras"]:
                o.append(para(p, 19))
        o.append('  <div style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); '
                 'gap: 18px; margin-top: 34px; align-items: stretch">')
        for s in upcoming:
            img = EVENT_IMG.get(s["head"].lower())
            o.append('    <div style="%s; display: flex; flex-direction: column">' % SQUARE)
            if img:
                o.append('      <div style="position: relative; height: 340px; overflow: hidden; background: %s">' % CARD)
                o.append('        <img src="%s" alt="%s" style="position: absolute; inset: 0; width: 100%%; '
                         'height: 100%%; object-fit: cover; object-position: 50%% 12%%">'
                         % (img[1], esc(img[2] or s["head"])))
                o.append('      </div>')
            o.append('      <div style="padding: 30px 32px 34px 32px">')
            o.append('        <div aria-hidden="true" style="width: 40px; height: 4px; background: %s"></div>' % GOLD)
            o.append('        <h3 style="font-size: 27px; line-height: 1.08; margin: 18px 0 14px; '
                     'color: #FFFFFF">%s</h3>' % esc(s["head"]))
            run = []
            for kind, t in s["flow"] + [("end", "")]:
                if kind == "li":
                    run.append(t)
                    continue
                if run:
                    o.append('        <ul style="margin: 4px 0 14px; padding-left: 20px">')
                    for it in run:
                        o.append('          <li class="body" style="font-size: 16px; line-height: 1.62; '
                                 'margin-bottom: 7px">%s</li>' % esc(it))
                    o.append('        </ul>')
                    run = []
                if kind == "p":
                    o.append('        <p class="body" style="font-size: 16px; line-height: 1.68; '
                             'margin: 0 0 10px">%s</p>' % esc(t))
            o.append('      </div>\n    </div>')
        o.append('  </div>')
        o += cl

    # who backs the gym
    if sponsors:
        op, cl = band(pad="72px 48px")
        o += op
        o.append(h2(sponsors["head"], 52))
        for p in sponsors["paras"]:
            if p.lower().startswith("how to become") or p.lower() == "current sponsors":
                continue
            o.append(para(p, 18))
        o.append('  <div class="logos" style="display: grid; '
                 'grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 18px; margin-top: 34px">')
        for name, _, dst in SPONSOR_IMG:
            o.append('    <div style="%s; padding: 26px; text-align: center">' % SQUARE)
            # the logos are artwork made for a light ground, so they sit on one
            o.append('      <div style="background: #FFFFFF; height: 170px; display: flex; '
                     'align-items: center; justify-content: center; padding: 22px">')
            o.append('        <img src="%s" alt="%s" style="max-width: 100%%; max-height: 100%%; '
                     'object-fit: contain">' % (dst, esc(name)))
            o.append('      </div>')
            o.append('      <div class="micro" style="margin-top: 18px">%s</div>' % esc(name))
            o.append('    </div>')
        o.append('  </div>')
        o.append('  <div style="margin-top: 30px">')
        o.append('    <div class="btn" onClick="{{ openForm }}">How to become a sponsor</div>')
        o.append('  </div>')
        o += cl

    # what has already happened
    if past:
        op, cl = band(gold=True, pad="72px 48px", n=2)
        o += op
        o.append(h2("Past Events", 52))
        o.append('  <div style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 18px">')
        for label, _, dst in PAST_IMG:
            o.append('    <div style="%s">' % SQUARE)
            o.append('      <div style="position: relative; height: 420px; overflow: hidden; background: %s">' % CARD)
            o.append('        <img src="%s" alt="%s" style="position: absolute; inset: 0; width: 100%%; '
                     'height: 100%%; object-fit: cover">' % (dst, esc(label)))
            o.append('      </div>')
            o.append('      <div style="padding: 24px 26px 28px 26px">')
            o.append('        <div aria-hidden="true" style="width: 34px; height: 4px; background: %s"></div>' % GOLD)
            o.append('        <h3 style="font-size: 23px; line-height: 1.1; margin: 16px 0 0; '
                     'color: #FFFFFF">%s</h3>' % esc(label))
            o.append('      </div>\n    </div>')
        o.append('  </div>')
        o += cl
    o += cta()
    return o


# ── write the artboards ────────────────────────────────────────────────────
def write_page(name, body_lines):
    body = spark_buttons(no_break_name("\n".join(body_lines)))
    page = ('<!doctype html>\n<html>\n<head>\n  <meta charset="utf-8">\n'
            '  <script src="./support.js"></script>\n</head>\n<body>\n'
            '<x-dc>\n' + HELMET + '\n\n<div style="width: 1440px; overflow: hidden; '
            'background: #000000; position: relative">\n\n'
            + HEADER + "\n\n" + body + "\n\n" + FOOTER + "\n</x-dc>\n" + SCRIPT)
    open(os.path.join(PAGES, name), "w", encoding="utf-8").write(page)


os.makedirs(IMGOUT, exist_ok=True)

for i, src in enumerate(GYM_PHOTOS):
    prep(src, "gym-%d.jpg" % (i + 1), 1100)
for _, src, dst in PAST_IMG:
    prep(src, dst, 760)
for src, dst, _alt in EVENT_IMG.values():
    prep(src, dst, 760)
for _, src, dst in SPONSOR_IMG:
    prep(src, dst, 520, flatten=(255, 255, 255, 255))

COACHES = coach_roster()
for c in COACHES:
    if c["photo"]:
        prep(c["photo"], "coach-%s.jpg" % c["slug"], 620)

manifest = []

def emit(name, url, title, body, desc=""):
    write_page(name, body)
    manifest.append({"file": name, "url": url, "title": title, "description": desc})
    print("%-34s -> %-30s %s" % (name, url, title[:44]))

emit("About.dc.html", "about.html", "About", page_about(),
     front_matter(read("index.md")).get("meta_description", ""))
emit("Contact.dc.html", "contact.html", "Contact", page_contact(),
     front_matter(read("contact.md")).get("meta_description", ""))
emit("Faq.dc.html", "faq.html", "Frequently Asked Questions", page_faq(),
     front_matter(read("faq.md")).get("meta_description", ""))

coach_head, coach_body = page_coaches(COACHES)
emit("Coaches.dc.html", "coaches.html", "Coaches and Trainers", coach_body,
     front_matter(read("instructors.md")).get("meta_description", ""))
for c in COACHES:
    emit("Coach-%s.dc.html" % c["slug"], "coaches/%s.html" % c["slug"], c["name"],
         page_coach(c), c["meta"].get("meta_description", ""))

rev_head, rev_body, n_rev, n_written = page_reviews()
emit("Reviews.dc.html", "reviews.html", "Reviews", rev_body,
     front_matter(read("reviews.md")).get("meta_description", ""))

emit("Facilities.dc.html", "facilities.html", "Facilities", page_facilities(),
     front_matter(read("classes-facilities.md")).get("meta_description", ""))
emit("Recovery.dc.html", "recovery.html", "Recovery Room", page_recovery(),
     "The recovery room at Nashville MMA Training Camp: dry heat sauna, cold tub, "
     "Normatec compression boots and a mobility area, included with all adult memberships.")
emit("Events.dc.html", "events.html", "Events and Sponsorships", page_events(),
     front_matter(read("classes-sponsors.md")).get("meta_description", ""))

json.dump(manifest, open(os.path.join(HERE, "generated-content-pages.json"), "w",
                         encoding="utf-8"), indent=2)
print("\n%d pages generated. Reviews placed: %d of %d named (the rest are a name "
      "only, because the vendor rendered reviews as images)." % (len(manifest), n_written, n_rev))
