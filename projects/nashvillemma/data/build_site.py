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

SPECIAL = {"programs": "programs/index.html"}
for f in sorted(os.listdir(PAGES)):
    if not (f.startswith("Page-") and f.endswith(".dc.html")):
        continue
    slug = f[len("Page-"):-len(".dc.html")]
    if slug.startswith("coach-"):
        url = "coaches/%s.html" % slug[len("coach-"):]
    else:
        url = SPECIAL.get(slug, "%s.html" % slug)
    ROUTES.append((f, url, slug.replace("coach-", "").replace("-", " ").title(), PAGES))

# nav label -> destination. Pages we have not designed yet still get their real
# URL so the gap shows up as a broken link instead of silently vanishing.
# extra destinations added to the footer so every page is reachable
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
    """Depth-prefix the generated nav/footer links and mark the current page."""
    p = depth_prefix(url)
    # Any root-relative .html link gets the depth prefix.  This used to be a
    # hardcoded list of page names, so every page added later broke on nested
    # URLs until someone remembered to list it.
    if p:
        body = re.sub(
            r'href="(?!https?:|//|/|#|\.\./|mailto:|tel:|sms:)([A-Za-z0-9._/-]+\.html)"',
            lambda m: 'href="%s%s"' % (p, m.group(1)), body)
    # current page gets the gold treatment in the header
    body = body.replace('href="%s%s" class="nav"' % (p, url),
                        'href="%s%s" class="nav" style="color: #D7AD56"' % (p, url))
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
  /* Nav dropdowns. Hover opens on a device that can hover, and the trigger
     stays a real link so clicking Martial Arts goes to the programs index.
     On touch, where there is no hover, the first tap opens the panel. */
  function initNavDropdowns(root){
    var wraps = (root || document).querySelectorAll('.dd-wrap');
    var canHover = !window.matchMedia || window.matchMedia('(hover: hover)').matches;
    var open = null;

    function show(w){
      if (open && open !== w) hide(open);
      var p = w.querySelector('.dd-panel'), t = w.querySelector('.dd-trigger');
      if (!p) return;
      p.hidden = false; w.setAttribute('data-open','1');
      if (t) t.setAttribute('aria-expanded','true');
      open = w;
    }
    function hide(w){
      var p = w.querySelector('.dd-panel'), t = w.querySelector('.dd-trigger');
      if (!p) return;
      p.hidden = true; w.removeAttribute('data-open');
      if (t) t.setAttribute('aria-expanded','false');
      if (open === w) open = null;
    }

    for (var i = 0; i < wraps.length; i++) (function(w){
      var trg = w.querySelector('.dd-trigger');
      var shutTimer = null;

      if (canHover) {
        w.addEventListener('mouseenter', function(){
          if (shutTimer) { clearTimeout(shutTimer); shutTimer = null; }
          show(w);
        });
        w.addEventListener('mouseleave', function(){
          shutTimer = setTimeout(function(){ hide(w); }, 120);
        });
        /* click is NOT bound here: the trigger is an anchor, so the click
           navigates. Binding a toggle as well is what closed the panel
           immediately after hover opened it. */
      } else {
        trg.addEventListener('click', function(e){
          if (w.getAttribute('data-open') !== '1') { e.preventDefault(); show(w); }
        });
      }

      trg.addEventListener('keydown', function(e){
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault(); show(w);
          var first = w.querySelector('.dd-item'); if (first) first.focus();
        }
      });
    })(wraps[i]);

    document.addEventListener('keydown', function(e){ if (e.key === 'Escape' && open) hide(open); });
    document.addEventListener('click', function(e){
      if (open && !open.contains(e.target)) hide(open);
    });
    document.addEventListener('focusin', function(e){
      if (open && !open.contains(e.target)) hide(open);
    });
  }
  initNavDropdowns(document);

  /* Review marquee — rAF so it keeps moving in low-power mode, where the
     browser silently pauses CSS animations. Hovering a lane pauses it. */
  function initReviewMarquees(root){
    var lanes = (root || document).querySelectorAll('.rvm');
    for (var i = 0; i < lanes.length; i++) (function(lane){
      var track = lane.querySelector('.rvm-track');
      var sets  = lane.querySelectorAll('.rvm-set');
      if (!track || sets.length < 2) return;
      var speed   = parseFloat(lane.getAttribute('data-speed')) || 26;
      var reverse = lane.getAttribute('data-reverse') === '1';
      var span = 0, x = 0, paused = false, last = 0;

      function measure(){
        span = sets[0].getBoundingClientRect().width;
        if (reverse && span && x === 0) x = -span;
      }
      measure();
      window.addEventListener('resize', measure);
      if (window.ResizeObserver) new ResizeObserver(measure).observe(sets[0]);

      lane.addEventListener('mouseenter', function(){ paused = true; });
      lane.addEventListener('mouseleave', function(){ paused = false; });

      function frame(now){
        if (!last) last = now;
        var dt = Math.min((now - last) / 1000, 0.05);
        last = now;
        if (!paused && span > 0) {
          x += (reverse ? dt * speed : -dt * speed);
          if (!reverse && x <= -span) x += span;
          if (reverse && x >= 0) x -= span;
          track.style.transform = 'translate3d(' + x.toFixed(2) + 'px,0,0)';
        }
        requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    })(lanes[i]);
  }
  initReviewMarquees(document);

/* Minimal stand-in for the canvas runtime so the artboard component class runs
   as-is on a plain page. State changes drive the modal directly. */
class DCLogic {
  constructor(props){ this.props = props || {}; this.state = {}; }
  setState(patch){
    Object.assign(this.state, patch);
    if ('formOpen' in patch) { patch.formOpen ? openForm() : closeForm(); }
  }
}
document.addEventListener('click', function (e) {
  var q = e.target.closest ? e.target.closest('.faq-q') : null;
  if (!q) { return; }
  var a = q.parentNode.querySelector('.faq-a');
  var plus = q.querySelector('.faq-plus');
  a.hidden = !a.hidden;
  if (plus) { plus.textContent = a.hidden ? '+' : '\u2013'; }
});
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
