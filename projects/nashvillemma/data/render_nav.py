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
    """Four real link columns, the gym's own photo, and contact that works.

    The previous version put a fake map on the right — CSS grid lines, a grey
    bar and a pin — which reads as a placeholder for a map rather than a map.
    A photograph of the actual building does the same job honestly.  The
    Explore list of eight tiny links is now four titled columns, so the footer
    carries the whole site instead of hinting at it.
    """
    COLS = [
        ("Martial Arts", MENU[1][2][:6]),
        ("Kids & Strength", MENU[2][2] + MENU[3][2]),
        ("The Gym", [("Schedule", "schedule.html", ""),
                     ("Facilities", "facilities.html", ""),
                     ("Recovery Room", "recovery.html", ""),
                     ("Recovery Partners", "recovery-partners.html", ""),
                     ("Open Gym", "programs/open-gym.html", "")]),
        ("About", [("Coaches & Trainers", "coaches.html", ""),
                   ("Reviews", "reviews.html", ""),
                   ("FAQ", "faq.html", ""),
                   ("Gear Recommendations", "gear.html", ""),
                   ("Events", "events.html", ""),
                   ("Sponsors", "sponsors.html", ""),
                   ("Blog", "blog.html", ""),
                   ("Contact Us", "contact.html", "")]),
    ]
    cols = "".join(
        '<div><div class="micro" style="color: #D7AD56; margin-bottom: 14px">%s</div>'
        '<ul style="display: flex; flex-direction: column; gap: 10px">%s</ul></div>'
        % (esc(title), "".join(
            '<li><a href="%s" style="color: rgba(255,255,255,0.72); font-size: 15px">%s</a></li>'
            % (h, esc(n)) for n, h, _ in items))
        for title, items in COLS)

    icons = {
      "Facebook": '<path d="M14 9h3V6h-3c-2.2 0-4 1.8-4 4v2H8v3h2v7h3v-7h3l1-3h-4v-2c0-.6.4-1 1-1z"/>',
      "Instagram": '<rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="17.2" cy="6.8" r="1.2"/>',
      "YouTube": '<path d="M21.6 7.2a2.5 2.5 0 0 0-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4A2.5 2.5 0 0 0 2.4 7.2C2 8.8 2 12 2 12s0 3.2.4 4.8a2.5 2.5 0 0 0 1.8 1.8C5.8 19 12 19 12 19s6.2 0 7.8-.4a2.5 2.5 0 0 0 1.8-1.8C22 15.2 22 12 22 12s0-3.2-.4-4.8zM10 15V9l5 3-5 3z"/>',
    }
    social = "".join(
        '<a href="%s" rel="noopener" aria-label="%s" style="width: 42px; height: 42px; display: flex; '
        'align-items: center; justify-content: center; color: #FFFFFF; '
        'box-shadow: inset 0 0 0 1px rgba(215,173,86,0.38); background: rgba(215,173,86,0.07)">'
        '<svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">%s</svg></a>'
        % (h, n, icons[n]) for n, h in SOCIAL)

    return """<!-- \u2550\u2550\u2550 FOOTER \u2550\u2550\u2550 -->
  <div style="background: #000000; border-top: 1px solid rgba(255,255,255,0.09)">

    <div style="display: grid; grid-template-columns: 1.06fr 0.94fr; align-items: stretch">

      <div style="padding: 62px 48px 54px 48px">
        <a href="index.html"><img src="logo.png" alt="Nashville MMA Training Camp" style="display: block; height: 86px; width: auto; margin-bottom: 30px"></a>
        <div class="micro" style="margin-bottom: 12px">Our Location</div>
        <h3 style="font-size: 54px; line-height: 0.98; margin-bottom: 24px">Visit Us Today</h3>
        <div class="body" style="font-size: 17px; margin-bottom: 22px">%s<br>%s</div>
        <a href="%s" style="display: block; font-family: 'Bebas Neue','Oswald','Arial Narrow',sans-serif; font-size: 46px; line-height: 1; color: #D7AD56; margin-bottom: 8px">%s</a>
        <a href="mailto:%s" style="display: inline-block; font-size: 16px; color: rgba(255,255,255,0.7); margin-bottom: 30px">%s</a>
        <div style="display: flex; gap: 10px; margin-bottom: 30px">%s</div>
        <a href="%s" class="btn" style="padding: 16px 32px" rel="noopener">Get Directions</a>
      </div>

      <a href="%s" rel="noopener" style="position: relative; display: block; min-height: 580px; overflow: hidden; border-left: 1px solid rgba(255,255,255,0.09)">
        <img src="facility-bg.jpg" alt="Inside Nashville MMA Training Camp" style="position: absolute; inset: 0; width: 100%%; height: 100%%; object-fit: cover">
        <div style="position: absolute; inset: 0; background: linear-gradient(to top, rgba(0,0,0,0.92) 0%%, rgba(0,0,0,0.25) 45%%, rgba(0,0,0,0.45) 100%%)"></div>
        <div style="position: absolute; left: 40px; right: 40px; bottom: 38px">
          <div class="micro" style="color: #D7AD56; margin-bottom: 10px">40,000 Sq Ft &nbsp;\u00b7&nbsp; 13,000 Sq Ft Of Mats</div>
          <div style="font-family: 'Bebas Neue','Oswald','Arial Narrow',sans-serif; font-size: 40px; line-height: 1; color: #FFFFFF">1504 Elm Hill Pike<br>Nashville, TN 37210</div>
        </div>
      </a>

    </div>

    <div style="display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 30px; padding: 52px 48px; border-top: 1px solid rgba(255,255,255,0.09)">%s</div>

    <div style="padding: 22px 48px; text-align: center; border-top: 1px solid rgba(255,255,255,0.09)">
      <span style="font-size: 12px; color: rgba(255,255,255,0.32)">Copyright &copy; 2026 <span style="white-space: nowrap">Nashville MMA Training Camp</span> &nbsp;\u00b7&nbsp; <a href="privacy.html" style="color: rgba(255,255,255,0.45)">Privacy Policy</a> &nbsp;\u00b7&nbsp; <a href="terms.html" style="color: rgba(255,255,255,0.45)">Terms</a></span>
    </div>
  </div>""" % (ADDRESS[0], ADDRESS[1], PHONE_HREF, PHONE, EMAIL, EMAIL,
               social, MAPS, MAPS, cols)


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
