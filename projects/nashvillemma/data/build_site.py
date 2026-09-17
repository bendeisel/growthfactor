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
# Browser-tab titles that should not be derived from the slug, because the slug
# is a leftover from the old menu naming.
TITLE = {"programs": "Martial Arts", "gear": "Gear Recommendations",
         "recovery-partners": "Recovery Partners", "strength-training":
         "Strength Training and Sports Performance"}

ROUTES = [("Homepage.dc.html", "index.html", "Nashville MMA Training Camp", DESIGN),
          ("Schedule.dc.html", "schedule.html", "Class Schedule", PAGES)]
for f in sorted(os.listdir(PAGES)):
    if f.startswith("Program-") and f.endswith(".dc.html"):
        slug = f[len("Program-"):-len(".dc.html")]
        ROUTES.append((f, "programs/%s.html" % slug, TITLE.get(slug, slug.replace("-", " ").title()), PAGES))

SPECIAL = {"programs": "programs/index.html"}
for f in sorted(os.listdir(PAGES)):
    if not (f.startswith("Page-") and f.endswith(".dc.html")):
        continue
    slug = f[len("Page-"):-len(".dc.html")]
    if slug.startswith("coach-"):
        url = "coaches/%s.html" % slug[len("coach-"):]
    else:
        url = SPECIAL.get(slug, "%s.html" % slug)
    ROUTES.append((f, url, TITLE.get(slug, slug.replace("coach-", "").replace("-", " ").title()), PAGES))

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

# Requires a separator, so it matches 615-297-4430 and (615) 297-4430 but not
# an arbitrary run of ten digits. Leading parens stay outside the link text.
PHONE_RX = re.compile(r"\(?(\d{3})\)?[.\u2013\-\s](\d{3})[.\u2013\-\s](\d{4})(?!\d)")

def link_phones(body):
    """Make every phone number on the page tappable.

    Walks text nodes only: anything inside a tag (so href="tel:...", SVG path
    data and style values are untouched) and anything already inside an <a> is
    left alone. That way a number written into body copy as ( 615-297-4430 )
    becomes a call link without the markup having to know about it.
    """
    out, pos, depth = [], 0, 0
    for m in re.finditer(r"<[^>]+>", body):
        text = body[pos:m.start()]
        out.append(text if depth else PHONE_RX.sub(
            lambda x: '<a href="tel:%s%s%s" style="color: inherit">%s</a>'
                      % (x.group(1), x.group(2), x.group(3), x.group(0)), text))
        tag = m.group(0)
        low = tag.lower()
        if low.startswith("<a ") or low == "<a>":
            depth += 1
        elif low.startswith("</a"):
            depth = max(0, depth - 1)
        out.append(tag)
        pos = m.end()
    tail = body[pos:]
    out.append(tail if depth else PHONE_RX.sub(
        lambda x: '<a href="tel:%s%s%s" style="color: inherit">%s</a>'
                  % (x.group(1), x.group(2), x.group(3), x.group(0)), tail))
    return "".join(out)


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
  /* Coverflow. Same constants as the homepage original: pitch 1.08x card
     width, 44deg tilt, 0.56 falloff, 0.16 settle easing. rAF only. */
  function initCoverflows(root){
    var rigs = (root || document).querySelectorAll('.cf');
    for (var r = 0; r < rigs.length; r++) (function(rig){
      var stage = rig.querySelector('.cf-stage');
      var frame = rig.querySelector('.cf-frame');
      if (!stage || !frame) return;
      var cards = stage.querySelectorAll('[data-cf]');
      var count = cards.length;
      if (!count) return;
      var W = parseFloat(rig.getAttribute('data-w')) || 320;
      var pitch = W * 1.08, rotate = 44, depth = 0.6, falloff = 0.56, fadeK = 0.09;
      var dots = rig.querySelectorAll('.cf-dots span');
      var nameEl = rig.querySelector('.cf-name'), teaseEl = rig.querySelector('.cf-teaser');
      var pos = 0, target = 0, sel = -1, raf = null;
      var dragging = false, startX = 0, startPos = 0, dist = 0, auto = null;

      function paint(){
        for (var i = 0; i < count; i++){
          var off = i - pos;
          off = ((off % count) + count) % count;
          if (off > count / 2) off -= count;
          var d = Math.abs(off);
          var ramp = Math.pow(d, falloff);
          var tilt = Math.min(rotate * ramp, 82) * (off < 0 ? -1 : (off > 0 ? 1 : 0));
          var c = cards[i];
          c.style.transform = 'translateX(calc(-50% + ' + (off * pitch).toFixed(1) + 'px)) '
            + 'translateZ(' + (-depth * W * ramp).toFixed(1) + 'px) rotateY(' + (-tilt).toFixed(2) + 'deg)';
          c.style.opacity = Math.max(0, 1 - fadeK * d * d).toFixed(3);
          c.style.zIndex = String(1000 - Math.round(d * 10));
          c.style.pointerEvents = d < 0.5 ? 'auto' : 'none';
        }
      }
      function indexAt(p){ return ((Math.round(p) % count) + count) % count; }
      function setSel(i){
        if (i === sel) return;
        sel = i;
        var c = cards[i];
        if (nameEl)  nameEl.textContent  = c.getAttribute('data-name')  || '';
        if (teaseEl) teaseEl.textContent = c.getAttribute('data-teaser') || '';
        for (var k = 0; k < dots.length; k++){
          var on = k === i;
          dots[k].style.background = on ? '#D7AD56' : 'rgba(255,255,255,0.2)';
          dots[k].style.width = on ? '30px' : '12px';
        }
      }
      function settle(t){
        if (raf) cancelAnimationFrame(raf);
        target = t; setSel(indexAt(t));
        (function step(){
          var rem = target - pos;
          if (Math.abs(rem) < 0.0005){ pos = target; paint(); raf = null; return; }
          pos += rem * 0.16; paint();
          raf = requestAnimationFrame(step);
        })();
      }
      function goTo(i){ settle(i + Math.round((target - i) / count) * count); }
      function nudge(by){ settle(Math.round(target) + by); }

      var p = rig.querySelector('[data-cf-prev]'), n = rig.querySelector('[data-cf-next]');
      if (p) p.addEventListener('click', function(){ nudge(-1); stopAuto(); });
      if (n) n.addEventListener('click', function(){ nudge(1);  stopAuto(); });
      for (var k = 0; k < dots.length; k++) (function(i){
        dots[i].addEventListener('click', function(){ goTo(i); stopAuto(); });
      })(k);
      for (var c2 = 0; c2 < count; c2++) (function(i){
        cards[i].addEventListener('click', function(e){
          if (dist > 4){ e.preventDefault(); return; }   // a drag is not a click
          if (i !== indexAt(pos)){ e.preventDefault(); goTo(i); stopAuto(); }
        });
      })(c2);

      function cx(e){ return e.clientX !== undefined ? e.clientX
                       : (e.touches && e.touches[0] ? e.touches[0].clientX : 0); }
      frame.addEventListener('pointerdown', function(e){
        dragging = true; dist = 0; startX = cx(e); startPos = pos;
        if (raf) cancelAnimationFrame(raf);
        stopAuto();
        if (frame.setPointerCapture) { try { frame.setPointerCapture(e.pointerId); } catch(_){} }
      });
      frame.addEventListener('pointermove', function(e){
        if (!dragging) return;
        var dx = cx(e) - startX;
        dist = Math.abs(dx);
        pos = startPos - dx / pitch;
        setSel(indexAt(pos)); paint();
      });
      function up(){ if (!dragging) return; dragging = false; settle(Math.round(pos)); }
      frame.addEventListener('pointerup', up);
      frame.addEventListener('pointercancel', up);
      frame.addEventListener('mouseleave', up);

      function stopAuto(){ if (auto){ clearInterval(auto); auto = null; } }
      function startAuto(){
        stopAuto();
        auto = setInterval(function(){
          if (document.hidden) return;
          var b = rig.getBoundingClientRect();
          if (b.bottom < 0 || b.top > innerHeight) return;   // off-screen, leave it
          nudge(1);
        }, 6000);
      }
      rig.addEventListener('mouseenter', stopAuto);
      rig.addEventListener('mouseleave', startAuto);

      setSel(0); paint(); startAuto();
    })(rigs[r]);
  }
  initCoverflows(document);

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
    body = link_phones(wire_nav(to_plain(body, url), url, url))
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
