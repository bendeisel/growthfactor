# -*- coding: utf-8 -*-
"""Fold the built site into one navigable file for review.

Hash routing, every asset inlined. Links to pages we have not designed yet
resolve to a visible "not built" panel rather than a dead link, so the gaps are
part of the walkthrough instead of a list somewhere else.
"""
import base64, json, os, re

PROJ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE = os.path.join(PROJ, "site")
ASSET = os.path.join(SITE, "assets")
MIME = {".jpg":"image/jpeg",".jpeg":"image/jpeg",".png":"image/png",
        ".mp4":"video/mp4",".webm":"video/webm"}

cache = {}
def data_uri(name):
    if name not in cache:
        p = os.path.join(ASSET, name)
        if not os.path.exists(p):
            cache[name] = ""
        else:
            ext = os.path.splitext(name)[1].lower()
            cache[name] = "data:%s;base64,%s" % (
                MIME.get(ext, "application/octet-stream"),
                base64.b64encode(open(p, "rb").read()).decode())
    return cache[name]

links = json.load(open(os.path.join(SITE, "_links.json")))
routes, missing = links["built"], links["missing_targets"]

css = open(os.path.join(ASSET, "site.css"), encoding="utf-8").read()
js  = open(os.path.join(ASSET, "site.js"),  encoding="utf-8").read()

sections, scripts = [], []
for i, url in enumerate(routes):
    html = open(os.path.join(SITE, url), encoding="utf-8").read()
    body = html[html.index("<body>") + 6:html.index("<script src=")]
    script = ""
    m = re.search(r"<script>(.*?)</script>", html[html.index("<script src="):], re.S)
    if m:
        script = m.group(1).replace("class Component ", "class Component%d " % i)
        script = script.replace("new Component(", "new Component%d(" % i)
        script = script.replace("var __page", "var __page%d" % i).replace("__page.", "__page%d." % i)
    # assets -> data URIs
    body = re.sub(r'(src=")(?:\.\./)*assets/([^"]+)"',
                  lambda m: m.group(1) + data_uri(m.group(2)) + '"', body)
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

out = """<title>Nashville MMA — Full Site</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Montserrat:ital,wght@0,400;0,700;0,900;1,400&display=swap">
<style>
%s
.route { display: block; }
body { background: #000000; }
</style>
%s
%s
<script>
%s
function boot(r){
%s
}
%s
</script>
""" % (css, NOTBUILT, "\n".join(sections), js, "\n".join(scripts), ROUTER)

dest = "/tmp/claude-0/-home-user-growthfactor/fd25f9a5-2f01-5cdc-827f-ef9f8685f442/scratchpad/nmma-full-site.html"
open(dest, "w", encoding="utf-8").write(out)
print("routes bundled : %d" % len(routes))
print("missing shown  : %s" % ", ".join(missing))
print("bundle size    : %.2f MB" % (len(out.encode()) / 1048576))
