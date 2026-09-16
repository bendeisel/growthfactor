#!/usr/bin/env python3
"""The site navigation, generated once and shared by every page.

Before this, the nav was hand-written into each artboard and only Programs was
a real dropdown — About, Kids, Schedule, Recovery and Events were href="#".
Now the whole menu comes from MENU below, so adding a page means adding a line
here and it appears on all 47 pages at once.

The dropdown behaviour is deliberate.  The old handler bound BOTH mouseenter
(open) and click (toggle) to the same trigger, so on a desktop the panel opened
under the cursor and the click that followed immediately closed it again —
which read as "the Programs tab doesn't open".  Now:

  * pointers that can hover  -> hover opens; clicking the trigger follows
                                through to that section's landing page
  * touch (no hover)         -> tap toggles the panel, second tap follows the link
"""

# (label, href, [(name, href, blurb), ...])   empty list = plain link
MENU = [
    ("About", "about.html", [
        ("Coaches & Trainers",  "coaches.html",        "The people who run the mats"),
        ("Facilities",          "facilities.html",     "40,000 sqft, cage, turf, weights"),
        ("FAQ",                 "faq.html",            "First day, gear, memberships"),
        ("Reviews",             "reviews.html",        "What members actually say"),
        ("Gear Recommendations","gear.html",           "What to buy, what to skip"),
        ("Blog",                "blog.html",           "News and notes"),
        ("Contact Us",          "contact.html",        "Come see the place"),
    ]),
    ("Martial Arts", "programs/index.html", [
        ("Brazilian Jiu Jitsu", "programs/jiu-jitsu.html",          "Gi and No-Gi, all levels"),
        ("Muay Thai",           "programs/muay-thai.html",          "Fundamentals to advanced"),
        ("Boxing",              "programs/boxing.html",             "Fundamentals through intermediate"),
        ("Mixed Martial Arts",  "programs/mixed-martial-arts.html", "Striking and grappling together"),
        ("Wrestling",           "programs/wrestling.html",          "All levels"),
        ("Self-Defense",        "programs/self-defense.html",       "Classes and seminars"),
        ("MMA Fight Team",      "programs/mma-fight-team.html",     "Competition team, tryouts"),
        ("Women's Classes",     "programs/womens-classes.html",     "Women-only Muay Thai and BJJ"),
    ]),
    ("Kids Classes", "programs/kids-martial-arts.html", [
        ("Kids Martial Arts",   "programs/kids-martial-arts.html",       "Ages 6–14, every discipline"),
        ("Kids Jiu Jitsu",      "programs/kids-brazilian-jiu-jitsu.html","Gi and No-Gi for kids"),
        ("Kids Fitness",        "programs/kids-fitness.html",            "Ages 9–14"),
    ]),
    ("Strength Training", "programs/strength-training.html", [
        ("Strength Training",   "programs/strength-training.html",  "6am group exercise, weightlifting"),
        ("Personal Training",   "programs/personal-training.html",  "One on one, by appointment"),
        ("Open Gym",            "programs/open-gym.html",           "Weights, two turf areas, sleds"),
    ]),
    ("Schedule", "schedule.html", []),
    ("Recovery", "recovery.html", [
        ("Recovery Room",       "recovery.html",          "Sauna, cold plunge, compression"),
        ("Recovery Partners",   "recovery-partners.html", "Who we work with"),
    ]),
    ("Events",   "events.html",   []),
    ("Sponsors", "sponsors.html", []),
]

CARET = ('<svg class="dd-caret" width="9" height="9" viewBox="0 0 24 24" fill="none" '
         'stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M6 9l6 6 6-6"/></svg>')

FOOT = '<a href="schedule.html" class="dd-foot">See every class on the schedule &rarr;</a>'


def esc(s):
    return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def nav(columns=2):
    """The row of top-level links, with panels attached."""
    out = []
    for n, (label, href, items) in enumerate(MENU):
        if not items:
            out.append('<a href="%s" class="nav">%s</a>' % (href, esc(label)))
            continue
        pid = "dd%d" % n
        # split the items into balanced columns
        cols = columns if len(items) > 4 else 1
        per = -(-len(items) // cols)
        chunks = [items[i:i + per] for i in range(0, len(items), per)]
        grid = []
        for ch in chunks:
            links = "".join(
                '<a href="%s" class="dd-item"><span class="dd-name">%s</span>'
                '<span class="dd-blurb">%s</span></a>' % (h, esc(nm), esc(bl))
                for nm, h, bl in ch)
            grid.append('<div class="dd-col">%s</div>' % links)
        width = 300 * len(chunks) + 60
        out.append(
            '<div class="dd-wrap">'
            '<a href="%s" class="nav dd-trigger" role="button" aria-haspopup="true" '
            'aria-expanded="false" aria-controls="%s">%s%s</a>'
            '<div class="dd-panel" id="%s" hidden style="width: %dpx">'
            '<div class="dd-grid" style="grid-template-columns: repeat(%d, 1fr)">%s</div>%s</div>'
            '</div>'
            % (href, pid, esc(label), CARET, pid, width, len(chunks), "".join(grid), FOOT))
    return "".join(out)


JS = """
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
"""


# ── Footer ──────────────────────────────────────────────────────────────────
# Generated from the same MENU as the header.  It used to be hand-written into
# each artboard with href="#" placeholders that build_site.py filled from a
# second, separate list — so when the header menu was renamed, every footer
# kept the old names and pointed at the old pages.  One source now.

PHONE      = "615-297-4430"
PHONE_HREF = "tel:6152974430"
EMAIL      = "frontdesk@nashvillemma.com"
ADDRESS    = ("1504 Elm Hill Pike", "Nashville, Tennessee 37210")
MAPS = ("https://www.google.com/maps/search/?api=1&query="
        "Nashville+MMA+Training+Camp+1504+Elm+Hill+Pike+Nashville+TN+37210")
SOCIAL = [("Facebook",  "https://www.facebook.com/nashvillemma/"),
          ("Instagram", "https://www.instagram.com/nashvillemma/"),
          ("YouTube",   "https://www.youtube.com/@nashvillemmatrainingcamp1")]


def footer():
    # Explore: every top-level section, in two columns
    items = [(label, href) for label, href, _ in MENU]
    half = -(-len(items) // 2)
    cols = [items[:half], items[half:]]
    explore = "".join(
        '<ul style="display: flex; flex-direction: column; gap: 9px">%s</ul>' % "".join(
            '<li><a href="%s" class="nav">%s</a></li>' % (h, esc(l)) for l, h in col)
        for col in cols)

    social = " &nbsp;·&nbsp; ".join(
        '<a href="%s" style="color: rgba(255,255,255,0.45)" rel="noopener">%s</a>' % (h, n)
        for n, h in SOCIAL)

    return """<!-- ═══════════════ FOOTER — contact left, map right ═══════════════ -->
  <div style="background: #000000">
    <div style="display: grid; grid-template-columns: 1fr 1fr; align-items: stretch">

      <div style="padding: 66px 48px 60px 48px">
        <a href="index.html"><img src="logo.png" alt="Nashville MMA Training Camp" style="display: block; height: 100px; width: auto; margin-bottom: 34px"></a>
        <div class="micro" style="margin-bottom: 12px">Our Location</div>
        <h3 style="font-size: 44px; line-height: 1; margin-bottom: 26px">Visit Us Today</h3>
        <div style="display: grid; grid-template-columns: 1fr 1.25fr; gap: 26px; margin-bottom: 30px">
          <div style="display: flex; flex-direction: column; gap: 16px">
            <div><div class="micro" style="color: rgba(255,255,255,0.34); margin-bottom: 4px">Address</div><div class="body" style="font-size: 14px">%s<br>%s</div></div>
            <div><div class="micro" style="color: rgba(255,255,255,0.34); margin-bottom: 4px">Phone</div><a href="%s" style="font-family: 'Bebas Neue','Oswald','Arial Narrow',sans-serif; font-size: 24px; color: #FFFFFF">%s</a></div>
            <div><div class="micro" style="color: rgba(255,255,255,0.34); margin-bottom: 4px">Email</div><a href="mailto:%s" style="font-size: 14px; color: rgba(255,255,255,0.75)">%s</a></div>
          </div>
          <div>
            <div class="micro" style="color: rgba(255,255,255,0.34); margin-bottom: 10px">Explore</div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 9px 20px">%s</div>
          </div>
        </div>
        <a href="%s" class="btn" style="padding: 15px 30px" rel="noopener">View Our Location</a>
      </div>

      <div style="position: relative; min-height: 560px; overflow: hidden; background: #0F0F10; border-left: 1px solid rgba(255,255,255,0.1)">
        <div style="position: absolute; inset: 0; background:
          repeating-linear-gradient(0deg,  #1A1A1D 0 1px, transparent 1px 56px),
          repeating-linear-gradient(90deg, #1A1A1D 0 1px, transparent 1px 56px)"></div>
        <div style="position: absolute; top: 0; left: 58%%; width: 9px; height: 100%%; background: #1F1F23; transform: rotate(8deg)"></div>
        <div style="position: absolute; top: 47%%; left: 0; width: 100%%; height: 11px; background: #1F1F23"></div>
        <div style="position: absolute; top: 74%%; left: 0; width: 100%%; height: 5px; background: #17171A"></div>
        <div class="map-ping" style="position: absolute; top: 47%%; left: 62%%; transform: translate(-50%%,-50%%) scale(0.6); width: 22px; height: 22px; border-radius: 30px; background: #D7AD56; opacity: 0.85"></div>
        <a href="%s" rel="noopener" style="position: absolute; top: 47%%; left: 62%%; transform: translate(-50%%,-100%%)" aria-label="Open in Google Maps">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="#D7AD56" stroke="#000000" stroke-width="1.2"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="2.6" fill="#000000" stroke="none"/></svg>
        </a>
        <div class="micro" style="position: absolute; left: 26px; bottom: 22px; color: rgba(255,255,255,0.4)">1504 Elm Hill Pike &nbsp;·&nbsp; Nashville, TN</div>
      </div>

    </div>

    <div style="padding: 24px 48px; text-align: center; border-top: 1px solid rgba(255,255,255,0.08)">
      <span style="font-size: 12px; color: rgba(255,255,255,0.3)">Copyright &copy; 2026 <span style="white-space: nowrap">Nashville MMA Training Camp</span> &nbsp;·&nbsp; <a href="privacy.html" style="color: rgba(255,255,255,0.45)">Privacy Policy</a> &nbsp;·&nbsp; <a href="terms.html" style="color: rgba(255,255,255,0.45)">Terms</a> &nbsp;·&nbsp; %s</span>
    </div>
  </div>""" % (ADDRESS[0], ADDRESS[1], PHONE_HREF, PHONE, EMAIL, EMAIL,
               explore, MAPS, MAPS, social)


PING_JS = """
  /* Map pin pulse. Was a CSS @keyframes, which the browser pauses in
     low-power mode, so the footer sat dead. rAF keeps it alive. */
  function initMapPing(root){
    var pins = (root || document).querySelectorAll('.map-ping');
    if (!pins.length || typeof requestAnimationFrame !== 'function') return;
    var t0 = null;
    function frame(now){
      if (t0 === null) t0 = now;
      var t = ((now - t0) / 1000) % 3.2, k = t / 3.2;
      for (var i = 0; i < pins.length; i++) {
        pins[i].style.transform = 'translate(-50%,-50%) scale(' + (0.6 + k * 2.2).toFixed(3) + ')';
        pins[i].style.opacity = (0.85 * (1 - k)).toFixed(3);
      }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }
  initMapPing(document);
"""

if __name__ == "__main__":
    n = nav()
    print("top-level items : %d" % len(MENU))
    print("dropdowns       : %d" % sum(1 for _, _, i in MENU if i))
    print("total links     : %d" % (len(MENU) + sum(len(i) for _, _, i in MENU)))
    print("markup chars    : %d" % len(n))
