# -*- coding: utf-8 -*-
"""Assemble the program-pages artifact from the approved Muay Thai page.

Ben approved the Muay Thai artifact (https://claude.ai/artifact/KPZy5ZfRkZFPLgYee9MTXy)
as the format for every program page, chrome included. This takes that page
verbatim as the template, keeps its header, footer, popup and scripts exactly,
and swaps in each program's body from the built site. Fourteen pages, one
artifact, hash routed, with a switcher strip so all fourteen can be reviewed
from one URL.

The template is artifact/programs-template.html, a saved copy of the artifact's
own index.html. It is not regenerated from the artboards on purpose: the
artboards and the build now carry a header Ben has rejected, and this file is
the header he approved.

  python3 data/build_programs_artifact.py
  then republish build/programs-artifact.html to the URL above
"""
import json, os, re

PROJ  = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE  = os.path.join(PROJ, "site")
TPL   = open(os.path.join(PROJ, "artifact", "programs-template.html"), encoding="utf-8").read()
BUILD = os.path.join(PROJ, "build")
URL   = "https://claude.ai/artifact/KPZy5ZfRkZFPLgYee9MTXy"

# roster order from the site's own routes, so the switcher matches the site
routes = [u for u in json.load(open(os.path.join(SITE, "_links.json")))["built"]
          if u.startswith("programs/") and u != "programs/index.html"]

BODY_START, BODY_END = '<div class="bleedhero"', '<div class="site-footer"'

def content_of(url):
    """The page between its header and its footer, made root-relative."""
    html = open(os.path.join(SITE, url), encoding="utf-8").read()
    body = html[html.index(BODY_START):html.index(BODY_END)]
    body = re.sub(r'(src=")(?:\.\./)*assets/', r'\1./assets/', body)
    # the artifact has no other pages, so in-page links go where the
    # template's own do: nowhere, without moving the route
    body = re.sub(r'href="(?:\.\./)*[a-z0-9/_-]+\.html"', 'href="#"', body)
    return body

# switcher labels, by slug. Derived from the H1s these came out as
# "Personal" and "Women\u2019s Muay Thai &amp; Brazilian Jiu-Jitsu", so they
# are set by hand and match the client's own program names.
LABEL = {"boxing": "Boxing", "jiu-jitsu": "Brazilian Jiu Jitsu",
         "kids-brazilian-jiu-jitsu": "Kids BJJ", "kids-fitness": "Kids Fitness",
         "kids-martial-arts": "Kids Martial Arts", "mixed-martial-arts": "Mixed Martial Arts",
         "mma-fight-team": "MMA Fight Team", "muay-thai": "Muay Thai", "open-gym": "Open Gym",
         "personal-training": "Personal Training", "self-defense": "Self-Defense",
         "sports-performance": "Sports Performance", "womens-classes": "Women's Classes",
         "wrestling": "Wrestling"}

def title_of(url):
    slug = url[len("programs/"):-len(".html")]
    return LABEL.get(slug, slug.replace("-", " ").title())

head  = TPL[:TPL.index(BODY_START)]
tail  = TPL[TPL.index(BODY_END):]

sections = []
for u in routes:
    slug = u[len("programs/"):-len(".html")]
    sections.append('<section class="route" data-route="%s"%s>\n%s\n</section>'
                    % (slug, "" if slug == "muay-thai" else " hidden", content_of(u)))

# preview furniture: the strip that switches pages. Everything between the
# markers is for reviewing the artifact and is not part of the site.
items = "".join('<a href="#%s" data-sw="%s">%s</a>'
                % (u[len("programs/"):-len(".html")], u[len("programs/"):-len(".html")], title_of(u))
                for u in routes)
switcher = '''<!-- GF-CHROME:START -->
<style>
.gf-sw { position: sticky; top: 0; z-index: 50; display: flex; flex-wrap: wrap; align-items: center;
  gap: 2px 14px; padding: 8px 48px; background: #0C0C0D; border-bottom: 1px solid rgba(215,173,86,0.35);
  font-family: 'Montserrat', sans-serif; }
.gf-sw .gf-lab { font-size: 10px; font-weight: 700; letter-spacing: 0.22em; text-transform: uppercase;
  color: rgba(255,255,255,0.42); margin-right: 8px; }
.gf-sw a { font-size: 12px; font-weight: 700; letter-spacing: 0.04em; color: rgba(255,255,255,0.72);
  text-decoration: none; padding: 6px 0; border-bottom: 2px solid transparent; }
.gf-sw a:hover { color: #FFFFFF; }
.gf-sw a.on { color: #D7AD56; border-bottom-color: #D7AD56; }
@media (max-width: 900px) { .gf-sw { padding: 8px 22px; } }
</style>
<nav class="gf-sw" aria-label="Program pages in this preview"><span class="gf-lab">Program pages</span>%s</nav>
<!-- GF-CHROME:END -->
''' % items

router = '''<!-- GF-CHROME:START -->
<script>
(function () {
  var secs = document.querySelectorAll('.route');
  var sw = document.querySelectorAll('.gf-sw a');
  function show(r) {
    var hit = false;
    for (var i = 0; i < secs.length; i++) { hit = hit || secs[i].getAttribute('data-route') === r; }
    if (!hit) { return; }
    for (var j = 0; j < secs.length; j++) { secs[j].hidden = secs[j].getAttribute('data-route') !== r; }
    for (var k = 0; k < sw.length; k++) { sw[k].className = sw[k].getAttribute('data-sw') === r ? 'on' : ''; }
    window.scrollTo(0, 0);
  }
  function fromHash() { var h = location.hash.replace(/^#/, ''); if (h) { show(h); } }
  window.addEventListener('hashchange', fromHash);
  fromHash();
  if (!location.hash) { show('muay-thai'); }
})();
</script>
<!-- GF-CHROME:END -->
'''

# the header ends where the first route begins; the switcher sits above it
# so the page reads as the site with a review strip on top
hdr_at = head.index("<!-- header -->")
out = head[:hdr_at] + switcher + head[hdr_at:] + "\n".join(sections) + "\n" + tail
out = out.replace("</body>", router + "</body>", 1)

os.makedirs(BUILD, exist_ok=True)
dest = os.path.join(BUILD, "programs-artifact.html")
open(dest, "w", encoding="utf-8").write(out)

# files the artifact needs beyond what it already holds
imgs = sorted({m for u in routes for m in re.findall(r'\./assets/([^"]+\.(?:jpg|png))', content_of(u))})
json.dump({"page": os.path.relpath(dest, PROJ), "artifact": URL,
           "files": ["assets/" + f for f in imgs]},
          open(os.path.join(BUILD, "programs-publish.json"), "w", encoding="utf-8"), indent=2)

print("routes      : %d" % len(routes))
for u in routes: print("   %-40s %s" % (u, title_of(u)))
print("page size   : %.2f MB" % (len(out.encode()) / 1048576))
print("image files : %d" % len(imgs))
print("written to  : %s" % dest)
print("publish to  : %s" % URL)
