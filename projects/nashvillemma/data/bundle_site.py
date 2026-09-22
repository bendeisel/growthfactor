# -*- coding: utf-8 -*-
"""Fold the built site into the one file the site artifact is published from.

Hash routing. Links to pages we have not designed yet resolve to a visible
"not built" panel rather than a dead link, so the gaps are part of the
walkthrough instead of a list somewhere else.

Assets are referenced, not inlined. They used to be base64 data URIs, which
meant the logo was embedded once per page: 41 copies of the same bytes, and a
file that grew faster than the site did. They ship as the artifact's own files
instead, so each one is stored once and the page stays small.

Output is build/nmma-full-site.html, next to the project, not a scratchpad
path belonging to whichever session happened to run it last.

  python3 data/bundle_site.py
"""
import json, os, re

PROJ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE = os.path.join(PROJ, "site")
ASSET = os.path.join(SITE, "assets")
links = json.load(open(os.path.join(SITE, "_links.json")))
routes, missing = links["built"], links["missing_targets"]

css = open(os.path.join(ASSET, "site.css"), encoding="utf-8").read()
js  = open(os.path.join(ASSET, "site.js"),  encoding="utf-8").read()

DIV_RE = re.compile(r'<(/?)div\b[^>]*>', re.I)
MAP_RE = re.compile(r'<iframe[^>]*maps\.google[^>]*>\s*</iframe>', re.I)
MAP_STANDIN = (
    '<div style="width:100%;height:240px;display:flex;flex-direction:column;'
    'align-items:center;justify-content:center;gap:10px;background:'
    'repeating-linear-gradient(0deg,#151517 0 1px,transparent 1px 44px),'
    'repeating-linear-gradient(90deg,#151517 0 1px,transparent 1px 44px),#0C0C0D">'
    '<svg width="30" height="30" viewBox="0 0 24 24" fill="#D7AD56">'
    '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/>'
    '<circle cx="12" cy="10" r="2.6" fill="#0C0C0D"/></svg>'
    '<span style="font-size:12px;letter-spacing:0.1em;text-transform:uppercase;'
    'color:rgba(255,255,255,0.46);text-align:center;padding:0 16px">'
    'Live Google map on the real site.<br>Preview frames are blocked here.</span></div>')

def cut_pgbg(body):
    """Lift the fixed background layer out of a page body.

    It nests, so this counts div depth rather than matching to the first
    closing tag, which would have cut it off inside the first wash layer.
    Returns (body without it, the block) or (body, None).
    """
    i = body.find('<div class="pgbg"')
    if i == -1:
        return body, None
    depth = 0
    for m in DIV_RE.finditer(body, i):
        depth += -1 if m.group(1) else 1
        if depth == 0:
            return body[:i] + body[m.end():], body[i:m.end()]
    return body, None

sections, scripts, hoisted = [], [], []
for i, url in enumerate(routes):
    html = open(os.path.join(SITE, url), encoding="utf-8").read()
    body = html[html.index(">", html.index("<body")) + 1:html.index("<script src=")]
    # The page wash and its WebGL host are one thing behind the whole site, so
    # they are hoisted out of the routes and emitted once below. Left in place
    # they would ship 41 identical copies and 41 canvases.
    body, pgbg = cut_pgbg(body)
    if pgbg and not hoisted:
        hoisted.append(pgbg)
    script = ""
    m = re.search(r"<script>(.*?)</script>", html[html.index("<script src="):], re.S)
    if m:
        script = m.group(1).replace("class Component ", "class Component%d " % i)
        script = script.replace("new Component(", "new Component%d(" % i)
        script = script.replace("var __page", "var __page%d" % i).replace("__page.", "__page%d." % i)
    # every page sits at the artifact root once routing is by hash, so a
    # coach page's "../assets/x.jpg" has to flatten to "assets/x.jpg"
    body = re.sub(r'(src=")(?:\.\./)*assets/([^"]+)"',
                  lambda m: m.group(1) + "assets/" + m.group(2) + '"', body)
    body = re.sub(r'url\((["\']?)(?:\.\./)*assets/([^"\'()]+)\1\)',
                  lambda m: "url(" + m.group(1) + "assets/" + m.group(2) + m.group(1) + ")", body)
    # The footer's Google map is a live embed. The artifact viewer's content
    # security policy admits only the artifact's own files, so the frame is
    # blocked and the panel renders blank, once per route. It becomes a drawn
    # placeholder that says where the real map is.
    body = MAP_RE.sub(MAP_STANDIN, body)
    # internal links -> hash routes
    body = re.sub(r'href="(?:\.\./)*([a-z0-9/_-]+\.html)"', r'href="#\1"', body)
    sections.append('<section class="route" data-route="%s" hidden>\n%s\n</section>' % (url, body))
    scripts.append('  if (r === %s) { %s }' % (json.dumps(url), script.replace("\n", "\n    ")))

ROUTER = """
var booted = {};
function show(r){
  if (!document.querySelector('[data-route="' + (r||'') + '"]')) { r = null; }
  var secs = document.querySelectorAll('.route');
  for (var i = 0; i < secs.length; i++) { secs[i].hidden = true; }
  var nb = document.getElementById('notbuilt');
  if (r === null) {
    var want = (location.hash || '').replace(/^#/, '') || 'index.html';
    document.getElementById('nb-name').textContent = want;
    nb.hidden = false; window.scrollTo(0, 0); return;
  }
  nb.hidden = true;
  document.querySelector('[data-route="' + r + '"]').hidden = false;
  window.scrollTo(0, 0);
  if (!booted[r]) { booted[r] = true; boot(r); }
}
function route(){ show((location.hash || '').replace(/^#/, '') || 'index.html'); }
window.addEventListener('hashchange', route);
document.addEventListener('DOMContentLoaded', route);
route();
"""

NOTBUILT = """
<div id="notbuilt" hidden style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:60px 40px">
  <div style="max-width:640px;text-align:center">
    <div class="micro" style="margin-bottom:18px">Not designed yet</div>
    <h2 style="font-family:'Bebas Neue',sans-serif;font-size:72px;line-height:.95;margin:0 0 18px">
      <span id="nb-name"></span></h2>
    <p class="body" style="font-size:18px">This page is linked from the navigation but has not been
      built. It is one of the gaps in the current site.</p>
    <a href="#index.html" class="btn" style="margin-top:12px">Back to the homepage</a>
  </div>
</div>
"""

# The importmap and the module mount live in the page shell, outside the slice
# each route contributes, so the bundle used to drop them and the artifact had
# no WebGL gradient at all while the built site did. One of each, hoisted.
FLUID = """<script type="importmap">{"imports":{"three":"./assets/three.module.min.js"}}</script>
<script type="module">
import { mountFluidBg } from './assets/fluid-bg.js';
var host = document.querySelector('.pgbg');
var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (host && !reduced) {
  try {
    mountFluidBg(host, { opacity: 0.9, autoIntensity: 3.2, autoSpeed: 0.26, pixelSize: 7 });
    host.className += ' fluid-on';
  } catch (e) { console.error('fluid bg', e); }
}
</script>"""

out = """<title>Nashville MMA \u2014 Full Site</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Montserrat:ital,wght@0,400;0,700;0,900;1,400&display=swap">
%s
<style>
%s
.route { display: block; }
body { background: #000000; }
</style>
%s
%s
%s
<script>
/* the shell sets this on <body>; the artifact owns its own body tag, so the
   class that the seamless rules hang off is applied here instead */
document.body.className += ' seamless';
%s
function boot(r){
%s
}
%s
</script>
%s
""" % (FLUID.split("</script>")[0] + "</script>", css, "".join(hoisted), NOTBUILT,
       "\n".join(sections), js, "\n".join(scripts), ROUTER,
       "</script>".join(FLUID.split("</script>")[1:]).lstrip())

BUILD = os.path.join(PROJ, "build")
os.makedirs(BUILD, exist_ok=True)
dest = os.path.join(BUILD, "nmma-full-site.html")
open(dest, "w", encoding="utf-8").write(out)

# the file list the artifact is published with, so nobody has to work out
# which assets a republish needs
INLINED = {"site.css", "site.js"}
files = sorted(f for f in os.listdir(ASSET) if f not in INLINED)
json.dump({"page": os.path.relpath(dest, PROJ),
           "artifact": "https://claude.ai/artifact/QtSo866CTUqKxEQGTGk67a",
           "files": ["assets/" + f for f in files]},
          open(os.path.join(BUILD, "publish.json"), "w", encoding="utf-8"), indent=2)

print("routes bundled : %d" % len(routes))
print("missing shown  : %s" % (", ".join(missing) or "none"))
print("page size      : %.2f MB" % (len(out.encode()) / 1048576))
print("asset files    : %d" % len(files))
print("written to     : %s" % dest)
print("publish to     : https://claude.ai/artifact/QtSo866CTUqKxEQGTGk67a")
