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

if __name__ == "__main__":
    n = nav()
    print("top-level items : %d" % len(MENU))
    print("dropdowns       : %d" % sum(1 for _, _, i in MENU if i))
    print("total links     : %d" % (len(MENU) + sum(len(i) for _, _, i in MENU)))
    print("markup chars    : %d" % len(n))
