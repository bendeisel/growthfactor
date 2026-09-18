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

# Pages built with one continuous background instead of stacked colour blocks.
# Trial on Muay Thai first; widen this set once the look is approved.
SEAMLESS = {"programs/muay-thai.html"}

# The page ground. Sections painting these are what produced the visible seams
# between sections. Panel colours (#0F0F10, #141416, #1F1F23, #17171A) are
# components, not grounds, so they stay.
GROUND = ("#000000", "#0A0A0A", "#0B0B0C")

def make_seamless(body):
    """Drop the per-section grounds so one page-wide background shows through.

    Skipped for the header (z-index: 6), form inputs and inline-block buttons:
    those need their own fill to stay legible over the moving background.
    """
    import re as _re
    def fix(tag):
        t = tag.group(0)
        if t.startswith("<input") or "z-index: 6" in t or "display: inline-block" in t:
            return t
        for g in GROUND:
            # the ground on its own ...
            t = t.replace("background: %s" % g, "background: transparent")
            # ... and as the fallback layer under a gradient, e.g.
            # "background: radial-gradient(...), #0A0A0A". The accent gradient
            # stays; only the opaque layer beneath it goes.
            t = t.replace(", %s;" % g, ", transparent;")
            t = t.replace(', %s"' % g, ', transparent"')
        # The gold slab keeps its gold fill and loses only its hard top and
        # bottom edge, via the .bloom mask. The fill has to stay: the headline
        # inside it is near-black, and with the fill stripped the drifting
        # gradient leaves parts of the band dark enough to swallow the text
        # (measured at 1.09:1 against rgb(19,19,19)).
        if "#8A6224" in t:
            t = t.replace('class="rv"', 'class="rv bloom"')
        return t
    return _re.sub(r"<(?:div|input)[^>]*>", fix, body)

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
    # same for inline-style url(...) refs. Without this the hero fallback
    # background pointed at ./hero-bg.jpg, which is not where assets land.
    # The ':' exclusion keeps data: and https: URIs out of the rewrite.
    body = re.sub(r'url\((["\']?)(?:\./)?([^"\'():/][^"\'():]*\.(?:jpg|jpeg|png|webp|svg|webm|mp4))\1\)',
                  lambda m: "url(" + m.group(1) + p + "assets/" +
                            os.path.basename(m.group(2)) + m.group(1) + ")", body)
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
    # logo goes home. Wrap the whole img tag: the previous version inserted an
    # opening anchor and then stripped the closing one, so every page shipped
    # with an unclosed <a> around the header.
    body = re.sub(r'(<img src="%sassets/logo\.png"[^>]*>)' % re.escape(p),
                  lambda m: '<a href="%sindex.html">%s</a>' % (p, m.group(1)), body, count=1)
    # in-page buttons that name a destination
    body = body.replace('<a href="#" class="btn-line"', '<a href="%sschedule.html" class="btn-line"' % p)
    body = re.sub(r'<a href="#" class="btn" style="padding: 15px 30px">View Our Location</a>',
                  '<a href="%scontact.html" class="btn" style="padding: 15px 30px">View Our Location</a>' % p, body)
    return body

def add_mobile_nav(body):
    """Tag the main nav and put a toggle in front of it.

    The artboards have no mobile nav at all: seven links laid out in a row.
    Below the breakpoint the row becomes a panel the toggle opens.
    """
    i = body.find('class="nav"')
    if i == -1:
        return body
    a = body.rfind("<div", 0, i)
    if a == -1:
        return body
    end = body.find(">", a)
    tag = body[a:end + 1]
    if "mainnav" in tag:
        return body
    tag = tag.replace("<div ", '<div class="mainnav" ', 1)
    btn = ('<button type="button" class="navtoggle" aria-label="Menu" aria-expanded="false" '
           'onclick="toggleNav(this)"><span></span><span></span><span></span></button>')
    return body[:a] + btn + tag + body[end + 1:]

# ── the footer, one source for every page ──────────────────────────────────
# Modelled on the Fighters Boxing footer Ben pointed at: brand and contact,
# a links column, social, and a real map, over a legal bar. Built here rather
# than in the artboards because all three artboards carried an identical copy.
#
# The map is a live Google embed. The old footer drew a fake map in CSS with
# `animation: ping` on the pin, which is a CSS animation and therefore frozen
# in low-power mode, the failure this project keeps hitting.
#
# Social accounts are the real ones, taken from the vendor harvest in
# source/pages, not invented.
FOOT_ADDRESS = "1504 Elm Hill Pike, Nashville, Tennessee 37210"
FOOT_PHONE   = "615-297-4430"
FOOT_EMAIL   = "frontdesk@nashvillemma.com"
FOOT_MAPS    = "https://www.google.com/maps/search/?api=1&query=1504+Elm+Hill+Pike,+Nashville,+TN+37210"
FOOT_EMBED   = "https://maps.google.com/maps?q=1504+Elm+Hill+Pike,+Nashville,+TN+37210&z=15&output=embed"
FOOT_SOCIAL  = [
    ("Facebook",  "https://www.facebook.com/nashvillemma/",
     '<path d="M14 8.5V6.8c0-.8.5-1.3 1.4-1.3H17V2.4h-2.4C11.9 2.4 10.4 4 10.4 6.5V8.5H8v3.2h2.4v9.9H14v-9.9h2.6l.4-3.2H14Z" fill="currentColor"/>'),
    ("Instagram", "https://www.instagram.com/nashvillemma/",
     '<rect x="2" y="2" width="20" height="20" rx="6" fill="none" stroke="currentColor" stroke-width="1.8"/>'
     '<circle cx="12" cy="12" r="4.6" fill="none" stroke="currentColor" stroke-width="1.8"/>'
     '<circle cx="17.4" cy="6.6" r="1.3" fill="currentColor"/>'),
    ("YouTube",   "https://www.youtube.com/@nashvillemmatrainingcamp1",
     '<path d="M22 12s0-3.3-.42-4.88a2.54 2.54 0 0 0-1.79-1.8C18.2 4.9 12 4.9 12 4.9s-6.2 0-7.79.42a2.54 2.54 0 0 0-1.79 1.8C2 8.7 2 12 2 12s0 3.3.42 4.88a2.54 2.54 0 0 0 1.79 1.8C5.8 19.1 12 19.1 12 19.1s6.2 0 7.79-.42a2.54 2.54 0 0 0 1.79-1.8C22 15.3 22 12 22 12Z" fill="none" stroke="currentColor" stroke-width="1.8"/>'
     '<path d="M10.1 9.3v5.4l4.7-2.7-4.7-2.7Z" fill="currentColor"/>'),
]

def build_footer(url):
    p = depth_prefix(url)
    lab = ('font-size: 12px; text-transform: uppercase; letter-spacing: 0.14em; '
           'font-weight: 800; color: rgba(255,255,255,0.42); margin-bottom: 16px')
    lnk = "color: rgba(255,255,255,0.78); font-size: 15px"
    o = ['  <div class="site-footer" style="background: #000000">',
         '    <div style="display: grid; grid-template-columns: 1.5fr 0.9fr 0.8fr 1.4fr; '
         'gap: 48px; padding: 72px 48px 56px 48px; align-items: start">']

    # brand and contact
    o.append('      <div>')
    o.append('        <a href="%sindex.html"><img src="%sassets/logo.png" alt="Nashville MMA Training Camp" '
             'style="display: block; height: 86px; width: auto; margin-bottom: 26px"></a>' % (p, p))
    o.append('        <address style="font-style: normal; display: grid; gap: 12px">')
    o.append('          <a href="%s" target="_blank" rel="noopener" style="%s">%s</a>'
             % (FOOT_MAPS, lnk, FOOT_ADDRESS))
    o.append('          <a href="mailto:%s" style="%s">%s</a>' % (FOOT_EMAIL, lnk, FOOT_EMAIL))
    o.append('          <a href="tel:%s" style="font-family: \'Bebas Neue\',\'Oswald\',\'Arial Narrow\',sans-serif; '
             'font-size: 30px; color: #FFFFFF; letter-spacing: 0.02em">%s</a>'
             % (FOOT_PHONE.replace("-", ""), FOOT_PHONE))
    o.append('        </address>')
    o.append('        <a href="%scontact.html" class="btn" style="padding: 14px 28px; margin-top: 28px; '
             'display: inline-block; white-space: nowrap">View Our Location</a>' % p)
    o.append('      </div>')

    # links
    o.append('      <nav aria-label="Footer">')
    o.append('        <p style="%s">Links</p>' % lab)
    o.append('        <ul style="list-style: none; margin: 0; padding: 0; display: grid; gap: 11px">')
    for label, dest in NAV:
        o.append('          <li><a href="%s%s" style="%s">%s</a></li>' % (p, dest, lnk, label))
    o.append('        </ul>\n      </nav>')

    # social
    o.append('      <div>')
    o.append('        <p style="%s">Get in touch</p>' % lab)
    o.append('        <div style="display: flex; gap: 14px">')
    for name, href, svg in FOOT_SOCIAL:
        o.append('          <a href="%s" target="_blank" rel="noopener" aria-label="%s" '
                 'style="display: inline-flex; padding: 9px; color: rgba(255,255,255,0.78); '
                 'box-shadow: inset 0 0 0 1px rgba(255,255,255,0.16)">'
                 '<svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">%s</svg></a>'
                 % (href, name, svg))
    o.append('        </div>')
    o.append('      </div>')

    # real map, square per the kernel's --cornerRadius: 0
    o.append('      <div>')
    o.append('        <p style="%s">Find us</p>' % lab)
    o.append('        <div style="overflow: hidden; border: 1px solid rgba(255,255,255,0.16)">')
    o.append('          <iframe src="%s" title="Map to Nashville MMA Training Camp, 1504 Elm Hill Pike" '
             'loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen '
             'style="display: block; width: 100%%; height: 240px; border: 0"></iframe>' % FOOT_EMBED)
    o.append('        </div>\n      </div>')

    o.append('    </div>')
    o.append('    <div style="padding: 20px 48px 26px 48px; border-top: 1px solid rgba(255,255,255,0.14)">')
    o.append('      <p style="font-size: 14px; color: rgba(255,255,255,0.42); margin: 0">'
             '&copy; 2026 Nashville MMA Training Camp. All rights reserved.</p>')
    o.append('    </div>\n  </div>\n')
    return "\n".join(o)

def swap_footer(body, url):
    """Replace the artboard footer with the one built above."""
    a = body.find("<!-- \u2550")
    while a != -1 and "FOOTER" not in body[a:a + 90]:
        a = body.find("<!-- \u2550", a + 4)
    if a == -1:
        return body
    b = body.find("<!-- \u2550", a + 4)
    while b != -1 and "POPUP LEAD FORM" not in body[b:b + 90]:
        b = body.find("<!-- \u2550", b + 4)
    if b == -1:
        return body
    return body[:a] + build_footer(url) + body[b:]

FOOTER_CSS = """
/* Footer styling that inline styles cannot carry: underlines off so the
   address and email match the links column, and a gold hover so every
   footer link behaves the same way. */
.site-footer a { text-decoration: none; }
.site-footer a:hover, .site-footer a:focus-visible { color: #D7AD56; }
@media (max-width: 900px) {
  .site-footer > div:first-child { grid-template-columns: 1fr 1fr !important; }
  .site-footer > div:first-child > div:last-child { grid-column: 1 / -1; }
}
@media (max-width: 560px) {
  .site-footer > div:first-child { grid-template-columns: 1fr !important; }
}
"""

MOBILE_CSS = """
/* ── mobile ────────────────────────────────────────────────────────────
   The artboards are drawn at a fixed 1440px, so without this a phone shows
   the top-left corner of a desktop page. Everything in the artboards is
   inline-styled and inline styles beat a stylesheet, so these overrides
   have to carry !important. Desktop is untouched: every rule sits inside a
   max-width query. */

/* the hamburger. Hidden until the breakpoint. */
.navtoggle { display: none; background: none; border: 0; cursor: pointer;
  flex-direction: column; gap: 5px; padding: 11px; margin-left: auto; }
.navtoggle span { display: block; width: 26px; height: 2px; background: #FFFFFF; }
.navtoggle[aria-expanded="true"] span { background: #D7AD56; }

@media (max-width: 1100px) {
  body > div[style*="1440px"] { width: 100% !important; max-width: 100% !important; }
}

@media (max-width: 900px) {
  /* every inline grid collapses to a single column */
  [style*="grid-template-columns"] { grid-template-columns: 1fr !important; }
  [style*="grid-column: span"] { grid-column: auto !important; }

  .rv { padding-left: 22px !important; padding-right: 22px !important;
        padding-top: 56px !important; padding-bottom: 56px !important; }
  .site-footer > div { padding-left: 22px !important; padding-right: 22px !important; }

  /* the seven-link row becomes a panel the toggle opens */
  .navtoggle { display: inline-flex; }
  div:has(> .navtoggle) { flex-wrap: wrap !important; }
  .mainnav { display: none !important; width: 100%; order: 9;
    flex-direction: column !important; align-items: stretch !important;
    gap: 0 !important; padding: 4px 0 12px !important; }
  .mainnav.open { display: flex !important; }
  .mainnav .nav { padding: 15px 2px; border-bottom: 1px solid rgba(255,255,255,0.09); }
  .mainnav .btn { margin-top: 16px; text-align: center; }

  /* header chrome: the full street address does not fit a phone */
  [style*="z-index: 6"] .micro { display: none !important; }
  [style*="z-index: 6"] img { height: 64px !important; }
  [style*="z-index: 6"] > div { padding-left: 22px !important; padding-right: 22px !important; }

  /* tall artboard blocks are sized for a desktop column */
  [style*="min-height"] { min-height: 260px !important; }
  [style*="height: 620px"], [style*="height: 560px"] { height: auto !important; }
}

@media (max-width: 620px) {
  h1 { font-size: 40px !important; line-height: 1.03 !important; }
  h2 { font-size: 30px !important; line-height: 1.08 !important; }
  h3 { font-size: 22px !important; line-height: 1.12 !important; }
  .body, p.body { font-size: 16px !important; line-height: 1.66 !important; }
  /* nowrap is set on the gym's name, which is too long for a phone line */
  [style*="white-space: nowrap"] { white-space: normal !important; }
  .rv { padding-top: 44px !important; padding-bottom: 44px !important; }
}
"""

# ── the page-wide gold wash ────────────────────────────────────────────────
# Three layers over a near-black ground. Each one travels on a different
# period in x and y, so the path is a slow wave rather than a straight
# diagonal slide, and cross-fades its own opacity on a third period. All of
# it is driven by requestAnimationFrame in site.js, never CSS animation:
# low-power mode pauses CSS animation while leaving rAF running, which is
# exactly how a gradient ends up frozen on one machine and fine everywhere
# else.
_GOLDS = {"light": "243,225,178", "gold": "215,173,86", "mid": "197,149,67",
          "deep": "138,98,36", "btn": "192,136,58"}

def _rg(size, at, key, a):
    c = _GOLDS[key]
    return "radial-gradient(%s at %s, rgba(%s,%s) 0%%, rgba(%s,0) 55%%)" % (size, at, c, a, c)

def _wash(ax, ay, perx, pery, ph, oper, oph, omin, omax, blur, stops):
    return ('<div aria-hidden="true" class="pgdg"'
            ' data-ax="%s" data-ay="%s" data-perx="%s" data-pery="%s" data-ph="%s"'
            ' data-oper="%s" data-oph="%s" data-omin="%s" data-omax="%s"'
            ' style="filter: blur(%s); background-image: %s"></div>'
            % (ax, ay, perx, pery, ph, oper, oph, omin, omax, blur, ", ".join(stops)))

PGBG = '<div class="pgbg" aria-hidden="true">' + "".join([
    # broad sweep, travels furthest across
    _wash(300, 110, 15, 23, 0.0, 17, 0.0, 0.34, 0.78, "34px", [
        _rg("90% 60%",  "22% 18%", "light", "0.32"),
        _rg("100% 65%", "68% 36%", "gold",  "0.36"),
        _rg("85% 55%",  "40% 72%", "mid",   "0.30")]),
    # counter-sweep, warmer
    _wash(-240, 140, 21, 13, 2.1, 11, 2.0, 0.18, 0.58, "42px", [
        _rg("95% 62%",  "78% 22%", "gold", "0.32"),
        _rg("90% 58%",  "18% 54%", "btn",  "0.32"),
        _rg("100% 60%", "62% 88%", "deep", "0.36")]),
    # slow bronze undertow
    _wash(170, -96, 27, 19, 4.2, 19, 4.0, 0.24, 0.50, "56px", [
        _rg("120% 70%", "50% 8%",  "deep", "0.36"),
        _rg("110% 65%", "12% 92%", "mid",  "0.26")]),
]) + '</div>\n'

SEAMLESS_CSS = """
/* ── one continuous background ─────────────────────────────────────────
   Sections no longer paint their own colour block, so the page reads as a
   single surface instead of a stack of pages, and the wash above moves
   across all of it. */
body.seamless { background: #050505; }
.pgbg { position: fixed; inset: 0; z-index: 0; overflow: hidden; pointer-events: none; }
.pgbg .pgdg { position: absolute; top: -34%; bottom: -34%; left: -26%; width: 152%; }
body.seamless > *:not(.pgbg) { position: relative; z-index: 1; }

/* The separator, in place of a colour change. A gold hairline that fades
   out well before either edge reads as punctuation between sections
   rather than a seam between two pages. */
body.seamless .rv + .rv { position: relative; }
body.seamless .rv + .rv::before {
  content: ""; position: absolute; top: 0; left: 8%; right: 8%; height: 1px;
  background: linear-gradient(to right, transparent 0%,
    rgba(215,173,86,0.30) 22%, rgba(215,173,86,0.30) 78%, transparent 100%);
}
/* no rule against the gold slab, on either side of it */
body.seamless .rv.bloom::before, body.seamless .bloom + .rv::before { display: none; }

/* the gold band keeps its fill and loses only its hard top and bottom edge */
.bloom { -webkit-mask-image: linear-gradient(to bottom, transparent 0%, #000 24%, #000 76%, transparent 100%);
         mask-image: linear-gradient(to bottom, transparent 0%, #000 24%, #000 76%, transparent 100%); }

/* With the colour blocks gone, spacing carries the rhythm. Deliberately
   uneven: one uniform gap on every section is itself a generated-looking
   tell. */
body.seamless .rv { padding-top: 104px; padding-bottom: 104px; }
body.seamless .rv:nth-of-type(even) { padding-top: 136px; padding-bottom: 136px; }
body.seamless .rv.bloom { padding-top: 76px; padding-bottom: 76px; }
"""


SHELL = """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>%(title)s | Nashville MMA Training Camp</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Montserrat:ital,wght@0,400;0,700;0,900;1,400&display=swap">
<link rel="stylesheet" href="%(prefix)sassets/site.css">
</head>
<body%(bodycls)s>
%(pgbg)s%(body)s
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
/* mobile nav. The toggle is inserted immediately before the nav row. */
function toggleNav(btn){
  var nav = btn.nextElementSibling;
  if (!nav || nav.className.indexOf('mainnav') === -1) {
    nav = btn.parentNode && btn.parentNode.querySelector('.mainnav');
  }
  if (!nav) { return; }
  var open = nav.className.indexOf('open') === -1;
  nav.className = open ? nav.className + ' open'
                       : nav.className.replace(/\\s*\\bopen\\b/, '');
  btn.setAttribute('aria-expanded', open ? 'true' : 'false');
}
document.addEventListener('keydown',function(e){if(e.key==='Escape'){closeForm();}});

/* Page background wash. Driven by requestAnimationFrame and not a CSS
   animation for the usual reason: low-power mode pauses CSS animation but
   keeps rAF running, which is how a gradient ends up frozen on one machine
   and fine on every other. Each layer drifts on one sine and cross-fades its
   opacity on a slower second sine, so the gold changes tone as well as
   position. Its own class, so this never fights the artboards' .dg loop. */
(function () {
  var L = document.querySelectorAll('.pgdg');
  if (!L.length || typeof requestAnimationFrame !== 'function') { return; }
  for (var i = 0; i < L.length; i++) { L[i].style.willChange = 'transform, opacity'; }
  var num = function (el, k, d) {
    var v = parseFloat(el.getAttribute(k));
    return isNaN(v) ? d : v;
  };
  var t0 = null;
  var tick = function (now) {
    if (t0 === null) { t0 = now; }
    var t = (now - t0) / 1000;
    for (var i = 0; i < L.length; i++) {
      var el = L[i];
      // different periods per axis, so the layer traces a slow wave instead
      // of sliding back and forth along one diagonal
      var ph = num(el, 'data-ph', 0);
      var sx = Math.sin(2 * Math.PI * (t / num(el, 'data-perx', 20)) + ph);
      var sy = Math.sin(2 * Math.PI * (t / num(el, 'data-pery', 27)) + ph * 0.6);
      el.style.transform = 'translate3d(' + (num(el, 'data-ax', 160) * sx).toFixed(1) + 'px, '
                                          + (num(el, 'data-ay', 60) * sy).toFixed(1) + 'px, 0)';
      var oper = num(el, 'data-oper', 0);
      if (oper > 0) {
        var omin = num(el, 'data-omin', 0), omax = num(el, 'data-omax', 1);
        var u = 0.5 + 0.5 * Math.sin(2 * Math.PI * (t / oper) + num(el, 'data-oph', 0));
        el.style.opacity = (omin + (omax - omin) * u).toFixed(3);
      }
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
})();
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
            "/* shared across every page — lifted from the approved artboards */\n"
            + css + FOOTER_CSS + MOBILE_CSS + SEAMLESS_CSS)
        open(os.path.join(ASSET, "site.js"), "w", encoding="utf-8").write(SITE_JS)
        css_written = True
    body = wire_nav(to_plain(body, url), url, url)
    body = swap_footer(body, url)
    body = add_mobile_nav(body)
    seamless = url in SEAMLESS
    if seamless:
        body = make_seamless(body)
    dest = os.path.join(OUT, url)
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    open(dest, "w", encoding="utf-8").write(SHELL % {
        "title": title, "body": body, "prefix": depth_prefix(url), "init": init,
        "bodycls": ' class="seamless"' if seamless else "",
        "pgbg": PGBG if seamless else ""})
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
