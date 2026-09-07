# -*- coding: utf-8 -*-
"""Build every remaining page and attach it to the site.

Same approach as the programme pages: the client's own harvested copy laid into
the approved chrome, so nothing here is invented. Emits .dc.html artboards so
the canvas and the static site both pick them up from one source.

Covers: about, programmes index, coaches index + 16 coach pages, schedule-
adjacent pages (FAQ, reviews, contact, recovery), events (GoHighLevel embed),
sponsors, blog, and the two legal pages.
"""
import json, os, re, html, subprocess

HERE   = os.path.dirname(os.path.abspath(__file__))
PROJ   = os.path.dirname(HERE)
CONTENT= os.path.join(PROJ, "content")
IMAGES = os.path.join(PROJ, "source", "images")
PAGES  = os.path.join(PROJ, "design-pages")
IMGOUT = os.path.join(PAGES, "img")
LIMIT  = 52 * 1024

GOLD, CARD, BEBAS = "#D7AD56", "#1E1E29", "'Bebas Neue','Oswald','Arial Narrow',sans-serif"
PANEL = ("background: rgba(255,255,255,0.028); box-shadow: inset 0 0 0 1px rgba(215,173,86,0.30); "
         "border-radius: 10px")
SAND = ('<div aria-hidden="true" class="dg" data-ax="135" data-ay="40" data-per="19" '
        'style="position: absolute; top: -18%; bottom: -18%; left: -13%; width: 126%; filter: blur(1.5px); '
        'background-color: #8A6224; background-image: '
        'radial-gradient(150% 46.8% at 42.7% 6%, rgba(243,225,178,0.92) 0%, rgba(243,225,178,0) 51%), '
        'radial-gradient(150% 46.8% at 43.43% 33%, rgba(215,173,86,0.94) 0%, rgba(215,173,86,0) 51%), '
        'radial-gradient(150% 46.8% at 51.03% 67%, rgba(197,149,67,0.92) 0%, rgba(197,149,67,0) 51%), '
        'radial-gradient(150% 46.8% at 53.18% 94%, rgba(138,98,36,0.92) 0%, rgba(138,98,36,0) 51%)"></div>')

def esc(s): return html.escape(s, quote=False)

NAME = "Nashville MMA Training Camp"
def nobreak(h):
    parts = re.split(r"(<[^>]*>)", h)
    for i in range(0, len(parts), 2):
        if NAME in parts[i]:
            parts[i] = parts[i].replace(NAME, '<span style="white-space: nowrap">%s</span>' % NAME)
    return "".join(parts)

BTN_LINE = re.compile(r'(<a\b[^>]*class="btn-line"[^>]*>)(.*?)(</a>)', re.S)
def spark(h):
    def rep(m):
        o, inner, c = m.groups()
        if "spark-ring" in inner: return m.group(0)
        o = o.replace('style="', 'style="position: relative; overflow: hidden; isolation: isolate; ', 1) \
            if 'style="' in o else o.replace('class="btn-line"',
              'class="btn-line" style="position: relative; overflow: hidden; isolation: isolate"', 1)
        return (o + '<span aria-hidden="true" class="spark-ring"></span>'
                  + '<span aria-hidden="true" class="spark-fill"></span>'
                  + '<span style="position: relative; z-index: 2">' + inner + '</span>' + c)
    return BTN_LINE.sub(rep, h)

# ── chrome ─────────────────────────────────────────────────────────────────
TPL = open(os.path.join(PAGES, "ProgramDetail.dc.html"), encoding="utf-8").read()
def sl(a, b):
    i = TPL.index(a); return TPL[i:TPL.index(b, i)]
HELMET = sl("<helmet>", "</helmet>") + "</helmet>"
HEADER = sl("<!-- header -->", "<!-- ═══ PAGE HERO")
FOOTER = sl("<!-- ═══════════════ FOOTER", "</x-dc>")
SCRIPT = TPL[TPL.index("<script data-dc-script"):]

# ── markdown ───────────────────────────────────────────────────────────────
SKIP = re.compile(r"request (more )?information|areas we serve|request information now", re.I)
NOISE = re.compile(r"^\[Button:|^REQUEST MORE INFORMATION|^Just fill out|^Text Us Here", re.I)

def parse(fn):
    md = re.sub(r"^---.*?---\s*", "",
                open(os.path.join(CONTENT, fn + ".md"), encoding="utf-8").read(), flags=re.S)
    out, skip_next = [], False
    for raw in md.split("\n"):
        l = raw.rstrip()
        if not l.strip(): continue
        m = re.match(r"^(#{1,4})\s+(.*)$", l)
        if m:
            lvl, t = len(m.group(1)), m.group(2).strip()
            if skip_next: skip_next = False; continue
            if SKIP.search(t): continue
            out.append(("h%d" % lvl, t)); continue
        im = re.match(r"^!\[([^\]]*)\]\(([^)]+)\)$", l)
        if im:
            if "testimonials-google" in im.group(2): skip_next = True
            continue
        if l.startswith("- "): out.append(("li", l[2:].strip())); continue
        if NOISE.search(l.strip()): continue
        out.append(("p", l.strip()))
    return out

def blocks_to_sections(blocks):
    """First h1 is the title; everything after groups under its heading."""
    title = next((t for k, t in blocks if k == "h1"), "")
    secs, cur = [], None
    for k, t in blocks:
        if k == "h1": continue
        if k in ("h2", "h3", "h4"):
            cur = {"head": t, "paras": [], "items": []}; secs.append(cur); continue
        if cur is None:
            cur = {"head": "", "paras": [], "items": []}; secs.append(cur)
        (cur["paras"] if k == "p" else cur["items"]).append(t)
    return title, secs

# ── render helpers ─────────────────────────────────────────────────────────
def hero(title, img=None, eyebrow="Nashville MMA"):
    o = ['<div style="background: #000000; padding: 40px 48px 8px 48px">',
         '  <div style="background: #141416; border-radius: 14px; padding: 10px; box-shadow: inset 0 0 0 1px rgba(255,255,255,0.07)">',
         '  <div style="position: relative; height: %dpx; overflow: hidden; border-radius: 8px; isolation: isolate; background: #0E0E10">' % (470 if img else 300)]
    if img:
        o.append('    <img src="%s" alt="%s" style="position: absolute; inset: 0; width: 100%%; height: 100%%; object-fit: cover; z-index: 1">' % (img, esc(title)))
    o.append('    <div style="position: absolute; inset: 0; z-index: 2; background: radial-gradient(120% 90% at 50% 45%, rgba(0,0,0,0.34) 0%, rgba(0,0,0,0.80) 100%)"></div>')
    o.append('    <div style="position: absolute; inset: 0; z-index: 3; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 0 60px">')
    o.append('      <div class="micro" style="margin-bottom: 16px">%s</div>' % esc(eyebrow))
    m = re.match(r"^(.*?)\s+in\s+(.*)$", title, re.I)
    h1 = ('%s<br>In %s' % (esc(m.group(1)), esc(m.group(2)))) if m else esc(title)
    lead = m.group(1) if m else title
    o.append('      <h1 style="font-size: %dpx; line-height: 0.95; max-width: 1050px">%s</h1>' % (104 if len(lead) < 30 else 78, h1))
    o.append('      <div style="width: 110px; height: 4px; background: %s; margin-top: 24px"></div>' % GOLD)
    o.append('    </div>\n  </div>\n  </div>\n</div>')
    return "\n".join(o)

def section(head, paras, items=None, gold=False, n=0):
    o = []
    if gold:
        o.append('<div class="rv" style="position: relative; overflow: hidden; background: #000000">')
        o.append('  <div aria-hidden="true" class="dg" data-ax="%d" data-ay="%d" data-per="%d" data-ph="%.2f" '
                 'style="position: absolute; top: -20%%; bottom: -20%%; left: -15%%; width: 130%%; background-image: '
                 'radial-gradient(1240px 580px at 50%% 4%%, rgba(215,173,86,0.21) 0%%, rgba(215,173,86,0.11) 34%%, transparent 70%%)"></div>'
                 % (150 + (n % 3) * 18, 52 + (n % 3) * 8, 18 + (n % 4) * 3, n * 1.3))
        o.append('  <div style="position: relative; z-index: 2; padding: 70px 48px">')
    else:
        o.append('<div class="rv" style="background: #0A0A0A; padding: 70px 48px">')
    if head:
        o.append('  <h2 style="font-size: 54px; line-height: 1.04; margin-bottom: 26px; max-width: 1060px">%s</h2>' % esc(head))
    if paras:
        cols = "1fr 1fr" if len(paras) > 1 else "1fr"
        half = (len(paras) + 1) // 2
        groups = [paras[:half], paras[half:]] if len(paras) > 1 else [paras]
        o.append('  <div style="display: grid; grid-template-columns: %s; gap: 40px; max-width: 1180px">' % cols)
        for g in groups:
            if g: o.append('    <div>' + "".join('<p class="body" style="font-size: 18px; line-height: 1.72">%s</p>' % esc(x) for x in g) + '</div>')
        o.append('  </div>')
    if items:
        o.append('  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 26px">')
        for it in items:
            m = re.match(r"^([^:]{2,60}):\s*(.+)$", it)
            if m:
                o.append('    <div style="%s; padding: 28px 30px"><div style="width: 26px; height: 3px; background: %s; margin-bottom: 16px"></div>'
                         '<h3 style="font-size: 32px; margin-bottom: 10px; color: #FFFFFF">%s</h3>'
                         '<p class="body" style="font-size: 17px; line-height: 1.7; margin: 0">%s</p></div>'
                         % (PANEL, GOLD, esc(m.group(1).strip()), esc(m.group(2).strip())))
            else:
                o.append('    <div style="%s; padding: 28px 30px"><div style="width: 26px; height: 3px; background: %s; margin-bottom: 14px"></div>'
                         '<p class="body" style="font-size: 17px; line-height: 1.7; margin: 0">%s</p></div>' % (PANEL, GOLD, esc(it)))
        o.append('  </div>')
    if gold: o.append('  </div>')
    o.append('</div>')
    return "\n".join(o)

def cta():
    return ('<div class="rv" style="position: relative; overflow: hidden; background: #8A6224">\n  ' + SAND +
            '\n  <div style="position: relative; z-index: 2; padding: 66px 48px; text-align: center">'
            '\n  <h2 style="font-size: 74px; line-height: 1; color: #131313; margin-bottom: 12px">Request Information Now</h2>'
            '\n  <p style="color: rgba(19,19,19,0.82); font-size: 18px; margin-bottom: 28px">40,000 sqft Facility, World Class Coaches, and 90+ Classes per Week</p>'
            '\n  <div onClick="{{ openForm }}" style="display: inline-block; background: #0A0A0A; color: #FFFFFF; border-radius: 8px; font-size: 13px; '
            'font-weight: 800; padding: 17px 42px; text-transform: uppercase; letter-spacing: 0.12em; cursor: pointer">Request Information</div>'
            '\n  </div>\n</div>')

def write(slug, title, body, height):
    page = ('<!doctype html>\n<html>\n<head>\n  <meta charset="utf-8">\n  <script src="./support.js"></script>\n</head>\n<body>\n'
            '<x-dc>\n' + HELMET + '\n\n<div style="width: 1440px; overflow: hidden; background: #000000; position: relative">\n\n'
            + HEADER + "\n\n" + spark(nobreak(body)) + "\n\n" + FOOTER + "</x-dc>\n"
            + SCRIPT.replace('"height":3450', '"height":%d' % height).replace('"height":4720', '"height":%d' % height))
    open(os.path.join(PAGES, "Page-%s.dc.html" % slug), "w", encoding="utf-8").write(page)
    return slug

def prep(src, dst, width=760):
    import imageio_ffmpeg
    ff = imageio_ffmpeg.get_ffmpeg_exe()
    for w, q in ((width, 5), (width, 7), (int(width*.8), 9), (int(width*.65), 11)):
        subprocess.run([ff, "-y", "-i", src, "-vf", "scale=%d:-2" % w, "-q:v", str(q), dst],
                       check=True, capture_output=True)
        if os.path.getsize(dst) <= LIMIT: return
def find_img(pat):
    for f in sorted(os.listdir(IMAGES)):
        if re.search(pat, f, re.I): return os.path.join(IMAGES, f)
    return None

os.makedirs(IMGOUT, exist_ok=True)
built = []

# ══ ABOUT ══════════════════════════════════════════════════════════════════
t, secs = blocks_to_sections(parse("classes-facilities"))
img = find_img(r"DSC05515|DSC09116")
if img: prep(img, os.path.join(IMGOUT, "page-about-hero.jpg"), 1200)
body = [hero("About Nashville MMA Training Camp", "page-about-hero.jpg" if img else None, "Our Gym")]
for i, s in enumerate(secs):
    if s["paras"] or s["items"]:
        body.append(section(s["head"], s["paras"], s["items"], gold=(i % 2 == 0), n=i))
body.append(cta())
built.append(write("about", "About", "\n\n".join(body), 3200))

# ══ PROGRAMS INDEX ═════════════════════════════════════════════════════════
PROGS = json.load(open(os.path.join(HERE, "programs.json"), encoding="utf-8"))["programs"]
LABEL = {"jiu-jitsu":"Brazilian Jiu Jitsu","boxing":"Boxing","muay-thai":"Muay Thai",
  "mixed-martial-arts":"Mixed Martial Arts","wrestling":"Wrestling","self-defense":"Self-Defense",
  "mma-fight-team":"MMA Fight Team","womens-classes":"Women's Classes",
  "kids-martial-arts":"Kids Martial Arts","kids-brazilian-jiu-jitsu":"Kids BJJ",
  "kids-fitness":"Kids Fitness","sports-performance":"Sports Performance",
  "personal-training":"Personal Training","open-gym":"Open Gym"}
GRP = [("Adults Martial Arts", ["jiu-jitsu","boxing","muay-thai","mixed-martial-arts","wrestling","self-defense","mma-fight-team","womens-classes"]),
       ("Kids Programs", ["kids-martial-arts","kids-brazilian-jiu-jitsu","kids-fitness"]),
       ("Fitness & Facility", ["sports-performance","personal-training","open-gym"])]
t2, secs2 = blocks_to_sections(parse("services"))
body = [hero("Martial Arts and Fitness Programs Available In Nashville", "prog-jiu-jitsu-hero.jpg", "Programs")]
if secs2 and secs2[0]["paras"]:
    body.append(section("", secs2[0]["paras"][:2], gold=True, n=0))
for gi, (gname, slugs) in enumerate(GRP):
    cards = []
    for s in slugs:
        cards.append(
          '    <a href="programs/%s.html" style="%s; padding: 0; overflow: hidden; display: block">'
          '<div style="position: relative; height: 190px; overflow: hidden">'
          '<img src="prog-%s-hero.jpg" alt="%s" style="position: absolute; inset: 0; width: 100%%; height: 100%%; object-fit: cover">'
          '<div style="position: absolute; inset: 0; background: linear-gradient(to top, rgba(0,0,0,0.9), rgba(0,0,0,0.15))"></div>'
          '<h3 style="position: absolute; left: 20px; bottom: 14px; font-size: 30px; color: #FFFFFF; margin: 0">%s</h3>'
          '</div></a>' % (s, PANEL, s, esc(LABEL[s]), esc(LABEL[s])))
    body.append('<div class="rv" style="background: %s; padding: 62px 48px">'
      '\n  <div class="micro" style="margin-bottom: 18px">%s</div>'
      '\n  <div style="display: grid; grid-template-columns: repeat(4, minmax(0,1fr)); gap: 16px">\n%s\n  </div>\n</div>'
      % ("#000000" if gi % 2 == 0 else "#0A0A0A", esc(gname), "\n".join(cards)))
body.append(cta())
built.append(write("programs", "Programs", "\n\n".join(body), 2900))

# ══ COACHES ════════════════════════════════════════════════════════════════
ALIAS = {"dedrek-sanders": r"Dedri?c?k[-_ ]*Sanders"}
coaches = []
for f in sorted(os.listdir(CONTENT)):
    if not f.startswith("instructors-"): continue
    slug = f[len("instructors-"):-3]
    blocks = parse(f[:-3])
    name = next((t for k, t in blocks if k == "h2"), slug.replace("-", " ").title())
    paras = [t for k, t in blocks if k == "p"]
    pat = ALIAS.get(slug, slug.replace("-", r"[-_ ]*"))
    src = find_img(pat)
    photo = None
    if src:
        photo = "coach-%s.jpg" % slug
        prep(src, os.path.join(IMGOUT, photo), 620)
    coaches.append({"slug": slug, "name": name, "paras": paras, "photo": photo})

cards = []
for c in coaches:
    media = ('<img src="%s" alt="%s" style="position: absolute; inset: 0; width: 100%%; height: 100%%; object-fit: cover; object-position: top">' % (c["photo"], esc(c["name"]))
             if c["photo"] else '<span class="ph" style="font-size: 12px">[Photo to come]</span>')
    cards.append('    <a href="coaches/%s.html" style="%s; padding: 0; overflow: hidden; display: block">'
      '<div style="position: relative; height: 300px; overflow: hidden; background: %s; display: flex; align-items: center; justify-content: center">%s</div>'
      '<div style="padding: 18px 20px"><h3 style="font-size: 28px; color: #FFFFFF; margin: 0">%s</h3>'
      '<span class="micro" style="font-size: 10px">Coach</span></div></a>'
      % (c["slug"], PANEL, CARD, media, esc(c["name"])))
body = [hero("Coaches & Trainers", "coach-bryan-tidwell.jpg" if any(c["slug"]=="bryan-tidwell" and c["photo"] for c in coaches) else None, "Our Team"),
        '<div class="rv" style="background: #000000; padding: 66px 48px">'
        '\n  <div style="display: grid; grid-template-columns: repeat(4, minmax(0,1fr)); gap: 16px">\n%s\n  </div>\n</div>' % "\n".join(cards),
        cta()]
built.append(write("coaches", "Coaches", "\n\n".join(body), 2400))

for c in coaches:
    b = [hero(c["name"], c["photo"], "Coaches & Trainers")]
    if c["paras"]:
        b.append(section("", c["paras"], gold=True, n=0))
    b.append('<div class="rv" style="background: #0A0A0A; padding: 50px 48px; text-align: center">'
             '<a href="coaches.html" class="btn-line">All Coaches &amp; Trainers</a></div>')
    b.append(cta())
    page = write("coach-" + c["slug"], c["name"], "\n\n".join(b), 2300)
    built.append(page)

# ══ FAQ ════════════════════════════════════════════════════════════════════
qas = []
for f in sorted(os.listdir(CONTENT)):
    if not re.match(r"faq-\d+", f): continue
    blocks = parse(f[:-3])
    q = next((t for k, t in blocks if k == "h1"), "")
    a = [t for k, t in blocks if k == "p"]
    li = [t for k, t in blocks if k == "li"]
    if q and (a or li): qas.append((q, a, li))
rows = []
for i, (q, a, li) in enumerate(qas):
    ans = "".join('<p class="body" style="font-size: 17px; line-height: 1.72">%s</p>' % esc(x) for x in a)
    ans += "".join('<p class="body" style="font-size: 17px; margin: 0 0 8px 0">&middot; %s</p>' % esc(x) for x in li)
    rows.append(
      '    <div class="faq" style="%s; padding: 0; overflow: hidden">'
      '<div class="faq-q" style="padding: 24px 28px; cursor: pointer; display: flex; align-items: center; gap: 18px">'
      '<span style="font-family: %s; font-size: 26px; color: %s; flex: 0 0 42px">%02d</span>'
      '<span style="font-family: %s; font-size: 28px; color: #FFFFFF; flex: 1">%s</span>'
      '<span class="faq-plus" style="color: %s; font-size: 26px; line-height: 1">+</span></div>'
      '<div class="faq-a" hidden style="padding: 0 28px 26px 88px">%s</div></div>'
      % (PANEL, BEBAS, GOLD, i + 1, BEBAS, esc(q), GOLD, ans))
body = [hero("Frequently Asked Questions", None, "Answers"),
        '<div class="rv" style="background: #000000; padding: 66px 48px">'
        '\n  <div style="display: grid; gap: 12px; max-width: 1180px">\n%s\n  </div>\n</div>' % "\n".join(rows),
        cta()]
built.append(write("faq", "FAQ", "\n\n".join(body), 2600))

# ══ REVIEWS / CONTACT / RECOVERY / SPONSORS / BLOG ══════════════════════════
def simple(slug, source, title, eyebrow, hero_img=None, height=2200):
    t, secs = blocks_to_sections(parse(source))
    b = [hero(title, hero_img, eyebrow)]
    for i, s in enumerate(secs):
        if s["paras"] or s["items"]:
            b.append(section(s["head"], s["paras"], s["items"], gold=(i % 2 == 0), n=i))
    b.append(cta())
    return write(slug, title, "\n\n".join(b), height)

built.append(simple("reviews", "reviews", "Reviews", "What Members Say"))
built.append(simple("contact", "contact", "Contact Us Today!", "Get In Touch"))
built.append(simple("sponsors", "classes-sponsors", "Sponsorships", "Partners"))
built.append(simple("blog", "blog", "Blog", "News & Notes"))

# recovery: the Recovery Room paragraph from the facilities copy
rec = [p for k, p in parse("classes-facilities") if k == "p" and "Recovery Room" in p]
img = find_img(r"DSC09321|DSC09331")
if img: prep(img, os.path.join(IMGOUT, "page-recovery-hero.jpg"), 1200)
b = [hero("Recovery Room", "page-recovery-hero.jpg" if img else None, "Included With Adult Memberships")]
if rec: b.append(section("Recover Like a Pro", rec, gold=True, n=0))
b.append(cta())
built.append(write("recovery", "Recovery Room", "\n\n".join(b), 1900))

# ══ EVENTS — GoHighLevel embed ═════════════════════════════════════════════
ev = [p for k, p in parse("classes-sponsors") if k == "p"][:2]
b = [hero("Upcoming Events", None, "Events")]
EMBED_FRAME = (
  '<div class="rv" style="position: relative; overflow: hidden; background: #000000">'
  '\n  <div aria-hidden="true" class="dg" data-ax="150" data-ay="52" data-per="18" data-ph="0.00"'
  ' style="position: absolute; top: -20%; bottom: -20%; left: -15%; width: 130%; background-image:'
  ' radial-gradient(1240px 580px at 50% 4%, rgba(215,173,86,0.21) 0%, rgba(215,173,86,0.11) 34%, transparent 70%)"></div>'
  '\n  <div style="position: relative; z-index: 2; padding: 70px 48px">'
  '\n    <h2 style="font-size: 54px; line-height: 1.04; margin-bottom: 18px">Book an Event</h2>'
  '\n    <p class="body" style="font-size: 18px; max-width: 74ch">Seminars, sparring days and women&rsquo;s'
  ' self-defense courses are booked and paid for through our events portal. It updates here automatically'
  ' whenever an event is added or changed.</p>'
  '\n    <div id="ghlEvents" style="' + PANEL + '; padding: 0; overflow: hidden; margin-top: 26px;'
  ' min-height: 620px; display: flex; align-items: center; justify-content: center">'
  '\n      <div style="text-align: center; padding: 60px 40px">'
  '\n        <div class="micro" style="margin-bottom: 14px">GoHighLevel Portal</div>'
  '\n        <div style="font-family: ' + BEBAS + '; font-size: 42px; color: #FFFFFF; margin-bottom: 10px">'
  'Events Calendar Embeds Here</div>'
  '\n        <p class="ph" style="font-size: 16px; max-width: 52ch; margin: 0 auto">[Paste the GoHighLevel'
  ' event-calendar iframe snippet in place of this panel. The frame, padding and dark surround are already'
  ' sized for it, so the embed drops straight in.]</p>'
  '\n      </div>\n    </div>\n  </div>\n</div>')
b.append(EMBED_FRAME)
if ev: b.append(section("", ev, gold=False, n=1))
b.append('<div class="rv" style="background: #0A0A0A; padding: 50px 48px; text-align: center">'
         '<a href="sponsors.html" class="btn-line">Our Sponsors</a></div>')
b.append(cta())
built.append(write("events", "Events", "\n\n".join(b), 2400))

# ══ LEGAL — structure only; real text has to come from the client ══════════
for slug, title in (("privacy", "Privacy Policy"), ("terms", "Terms of Service")):
    b = [hero(title, None, "Legal"),
      '<div class="rv" style="background: #000000; padding: 76px 48px">'
      '\n  <div style="max-width: 78ch">'
      '\n    <h2 style="font-size: 44px; margin-bottom: 20px">%s</h2>'
      '\n    <p class="ph" style="font-size: 18px; line-height: 1.75">[This page needs the gym&rsquo;s real'
      ' %s. It is a legal document describing how member data is collected, stored and shared, so it has to'
      ' come from the client or their counsel &mdash; writing plausible-sounding text here would put false'
      ' statements about their data handling on a live site. The page, chrome and typography are built and'
      ' waiting for the copy.]</p>'
      '\n    <p class="body" style="font-size: 16px; margin-top: 26px">Needed before launch: how enquiry-form'
      ' data is used, SMS and email marketing consent (the request form already collects it), payment'
      ' processing, cookies and analytics, and how to request deletion.</p>'
      '\n  </div>\n</div>' % (esc(title), esc(title.lower())),
      cta()]
    built.append(write(slug, title, "\n\n".join(b), 1500))

json.dump(built, open(os.path.join(HERE, "extra-pages.json"), "w"), indent=2)
print("pages built: %d" % len(built))
for b in built: print("   Page-%s.dc.html" % b)
