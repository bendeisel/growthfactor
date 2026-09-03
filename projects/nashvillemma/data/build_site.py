# -*- coding: utf-8 -*-
"""Assemble the design artboards into a real, navigable site.

The artboards are Claude Design documents (x-dc / helmet / sc-if / {{ }} bindings)
that only run inside the canvas. This strips that layer and emits plain HTML with
a shared stylesheet and a small script, which is the shape the Hostinger build
wants anyway.

Outputs:
  site/            one .html per page, shared assets, real nav links
  site/_links.json every internal link and whether its target exists
"""
import json, os, re, shutil, base64

HERE  = os.path.dirname(os.path.abspath(__file__))
PROJ  = os.path.dirname(HERE)
PAGES = os.path.join(PROJ, "design-pages")
DESIGN= os.path.join(PROJ, "design")
OUT   = os.path.join(PROJ, "site")
ASSET = os.path.join(OUT, "assets")

# ── which artboard becomes which URL ───────────────────────────────────────
ROUTES = [("Homepage.dc.html", "index.html", "Nashville MMA Training Camp", DESIGN),
          ("Schedule.dc.html", "schedule.html", "Class Schedule", PAGES)]
for f in sorted(os.listdir(PAGES)):
    if f.startswith("Program-") and f.endswith(".dc.html"):
        slug = f[len("Program-"):-len(".dc.html")]
        ROUTES.append((f, "programs/%s.html" % slug, slug.replace("-", " ").title(), PAGES))

# nav label -> destination. Pages we have not designed yet still get their real
# URL so the gap shows up as a broken link instead of silently vanishing.
NAV = [("About", "about.html"), ("Fitness", "programs/sports-performance.html"),
       ("Programs", "programs/index.html"), ("Kids Programs", "programs/kids-martial-arts.html"),
       ("Schedule", "schedule.html"), ("Recovery", "recovery.html"),
       ("Events &amp; Sponsorships", "events.html")]

def depth_prefix(url):
    return "../" * url.count("/")

# ── strip the canvas layer ─────────────────────────────────────────────────
def extract(path):
    s = open(path, encoding="utf-8").read()
    css = re.search(r"<style>(.*?)</style>", s, re.S).group(1)
    body = s[s.index("<x-dc>"):s.index("</x-dc>")]
    body = body[body.index("</helmet>") + len("</helmet>"):]
    script = ""
    m = re.search(r"<script data-dc-script[^>]*>(.*?)</script>", s, re.S)
    if m:
        script = m.group(1).strip()
    return css, body.strip(), script

def to_plain(body, url):
    p = depth_prefix(url)
    # popup form: sc-if becomes a hidden element the script toggles
    body = re.sub(r'<sc-if[^>]*>', '<div id="leadModal" hidden>', body)
    body = body.replace("</sc-if>", "</div>")
    # event bindings
    body = body.replace('onClick="{{ openForm }}"', 'onclick="openForm()"')
    body = body.replace('onClick="{{ closeForm }}"', 'onclick="closeForm()"')
    body = re.sub(r'onClick="\{\{[^}]*\}\}"', '', body)
    # asset paths
    body = re.sub(r'(src=")(?:\./)?([^":/][^"]*\.(?:jpg|jpeg|png|webm|mp4))"',
                  lambda m: m.group(1) + p + "assets/" + os.path.basename(m.group(2)) + '"', body)
    return body

def wire_nav(body, url, active):
    """Point the header/footer nav at real URLs instead of '#'."""
    p = depth_prefix(url)
    for label, dest in NAV:
        href = p + dest
        cur = ' style="color: #D7AD56"' if dest == active else ''
        body = body.replace('<a href="#" class="nav">%s</a>' % label,
                            '<a href="%s" class="nav"%s>%s</a>' % (href, cur, label))
        body = body.replace('<li><a href="#" class="nav">%s</a></li>' % label,
                            '<li><a href="%s" class="nav">%s</a></li>' % (href, label))
    # logo goes home
    body = body.replace('<img src="%sassets/logo.png"' % p,
                        '</a><a href="%sindex.html"><img src="%sassets/logo.png"' % (p, p), 1)
    body = body.replace("</a><a href", "<a href", 1)
    # in-page buttons that name a destination
    body = body.replace('<a href="#" class="btn-line"', '<a href="%sschedule.html" class="btn-line"' % p)
    body = re.sub(r'<a href="#" class="btn" style="padding: 15px 30px">View Our Location</a>',
                  '<a href="%scontact.html" class="btn" style="padding: 15px 30px">View Our Location</a>' % p, body)
    return body

SHELL = """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>%(title)s | Nashville MMA Training Camp</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Montserrat:ital,wght@0,400;0,700;0,900;1,400&display=swap">
<link rel="stylesheet" href="%(prefix)sassets/site.css">
</head>
<body>
%(body)s
<script src="%(prefix)sassets/site.js"></script>
<script>%(init)s
try { var __page = new Component({}); if (__page.componentDidMount) __page.componentDidMount(); }
catch (e) { console.error('page init', e); }</script>
</body>
</html>
"""

SITE_JS = """
/* Minimal stand-in for the canvas runtime so the artboard component class runs
   as-is on a plain page. State changes drive the modal directly. */
class DCLogic {
  constructor(props){ this.props = props || {}; this.state = {}; }
  setState(patch){
    Object.assign(this.state, patch);
    if ('formOpen' in patch) { patch.formOpen ? openForm() : closeForm(); }
  }
}
function openForm(){var m=document.getElementById('leadModal'); if(m){m.hidden=false;}}
function closeForm(){var m=document.getElementById('leadModal'); if(m){m.hidden=true;}}
document.addEventListener('keydown',function(e){if(e.key==='Escape'){closeForm();}});
"""

os.makedirs(ASSET, exist_ok=True)
# assets
for src_dir in (os.path.join(PAGES, "img"), os.path.join(DESIGN, "img")):
    if os.path.isdir(src_dir):
        for f in os.listdir(src_dir):
            shutil.copy2(os.path.join(src_dir, f), os.path.join(ASSET, f))
for v in ("hero-854.mp4", "hero-854.webm"):
    vp = os.path.join(PROJ, "assets", v)
    if os.path.exists(vp):
        shutil.copy2(vp, os.path.join(ASSET, v))

css_written, built, links = False, [], []
for src, url, title, base in ROUTES:
    path = os.path.join(base, src)
    if not os.path.exists(path):
        continue
    css, body, init = extract(path)
    if not css_written:
        open(os.path.join(ASSET, "site.css"), "w", encoding="utf-8").write(
            "/* shared across every page — lifted from the approved artboards */\n" + css)
        open(os.path.join(ASSET, "site.js"), "w", encoding="utf-8").write(SITE_JS)
        css_written = True
    body = wire_nav(to_plain(body, url), url, url)
    dest = os.path.join(OUT, url)
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    open(dest, "w", encoding="utf-8").write(SHELL % {
        "title": title, "body": body, "prefix": depth_prefix(url), "init": init})
    built.append(url)
    for href in re.findall(r'href="([^"#][^"]*\.html)"', body):
        links.append((url, os.path.normpath(os.path.join(os.path.dirname(url), href))))

have = set(built)
missing = sorted({t for _, t in links if t not in have})
json.dump({"built": built, "missing_targets": missing},
          open(os.path.join(OUT, "_links.json"), "w"), indent=2)
print("pages built : %d" % len(built))
for b in built: print("   ", b)
print("\nlinked but not built (%d):" % len(missing))
for m in missing: print("   ", m)
