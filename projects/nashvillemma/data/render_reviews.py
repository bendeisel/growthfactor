#!/usr/bin/env python3
"""Render the review marquee.

This is the 21st.dev marquee-card pattern rebuilt in our stack:

  * Motion is requestAnimationFrame, NOT a CSS keyframe animation.  CSS
    animations get paused by the browser in low-power mode, which is why the
    earlier gold-gradient drift was invisible on the client's machine.
  * Square panels with a gold hairline, per --cornerRadius: 0px.  The source
    component used rounded-3xl, which is the look we rejected as generic.
  * No star icons.  The gym is at 4.9, so five-star rows would be a claim we
    cannot make.  Removed deliberately, not overlooked.
  * No avatar photos.  We have no real headshots for these reviewers, and stock
    faces on real names would be fabricated.  A gold monogram stands in.

Duplicated tiles that exist only to make the loop seamless are aria-hidden so
crawlers and screen readers see each review exactly once.
"""
import json
import pathlib

HERE = pathlib.Path(__file__).resolve().parent
REVIEWS = HERE / "reviews.json"

GOLD = "#D7AD56"
PANEL = "#0F0F10"


def load(tag=None, limit=None, min_words=8, floor=4):
    """tag may be a string, or a list meaning "must carry ALL of these".

    An intersection like kids + jiu-jitsu is the most on-topic thing we can put
    on the Kids BJJ page, but it is also the smallest pool.  If it comes back
    under `floor` reviews the lane would visibly repeat, so we widen to the
    first tag rather than show four cards looping every six seconds.
    """
    rows = json.loads(REVIEWS.read_text(encoding="utf-8"))
    rows = [r for r in rows if r["words"] >= min_words]
    if tag:
        want = [tag] if isinstance(tag, str) else list(tag)
        hit = [r for r in rows if all(t in r["tags"] for t in want)]
        if len(hit) < floor and len(want) > 1:
            hit = [r for r in rows if want[0] in r["tags"]]
        rows = hit
    rows.sort(key=lambda r: -r["words"])
    return rows[:limit] if limit else rows


# Which reviews belong on which program page.  A list means "must mention all".
PROGRAM_TAGS = {
    "jiu-jitsu":                ["jiu-jitsu"],
    "kids-brazilian-jiu-jitsu": ["kids", "jiu-jitsu"],
    "boxing":                   ["boxing"],
    "muay-thai":                ["muay-thai"],
    "mixed-martial-arts":       ["mma"],
    "mma-fight-team":           ["mma"],
    "wrestling":                ["wrestling"],
    "self-defense":             ["self-defense"],
    "womens-classes":           ["self-defense"],
    "kids-martial-arts":        ["kids"],
    "kids-fitness":             ["kids"],
    "sports-performance":       ["fitness"],
    "open-gym":                 ["fitness"],
    "personal-training":        ["coaches"],
}



# How hard each topic pushes to the front of a mixed lane (homepage, reviews
# page).  Boxing and kids jiu jitsu lead; Muay Thai and MMA are still present,
# just not first.  Applies to any review added later, without touching a page.
FEATURE_WEIGHT = {
    "boxing": 6,
    "kids": 4,
    "jiu-jitsu": 3,
    "muay-thai": 2,
    "mma": 1,
    "self-defense": 1,
}


def score(r):
    w = sum(FEATURE_WEIGHT.get(t, 0) for t in r["tags"])
    if "kids" in r["tags"] and "jiu-jitsu" in r["tags"]:
        w += 5          # the exact combination we want most of
    return w


def featured(limit=None, min_words=8):
    """Mixed pool, ordered by topic priority first and length second."""
    rows = load(min_words=min_words)
    rows.sort(key=lambda r: (-score(r), -r["words"]))
    return rows[:limit] if limit else rows

def initials(name):
    parts = [p for p in name.replace('"', " ").replace("“", " ").split() if p[:1].isalpha()]
    if not parts:
        return "?"
    if len(parts) == 1:
        return parts[0][:1].upper()
    return (parts[0][:1] + parts[-1][:1]).upper()


def card(r, hidden=False):
    ar = ' aria-hidden="true"' if hidden else ""
    return (
        '<figure class="rvm-card"%s>'
        '<blockquote class="rvm-text">%s</blockquote>'
        '<figcaption class="rvm-by">'
        '<span class="rvm-mono" aria-hidden="true">%s</span>'
        '<span class="rvm-name">%s</span>'
        "</figcaption>"
        "</figure>"
    ) % (ar, esc(r["text"]), initials(r["name"]), esc(r["name"]))


def esc(s):
    return (s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;"))


def marquee(rows, speed=28, reverse=False, decorative=False):
    """One scrolling row.  speed is px/sec.

    decorative=True hides the whole lane from crawlers and screen readers, for
    pages that also print the same reviews in full below — otherwise the text
    would be counted twice.
    """
    if not rows:
        return ""
    real = "".join(card(r, hidden=decorative) for r in rows)
    ghost = "".join(card(r, hidden=True) for r in rows)
    return (
        '<div class="rvm"%s data-speed="%d" data-reverse="%d">'
        '<div class="rvm-track">'
        '<div class="rvm-set">%s</div>'
        '<div class="rvm-set">%s</div>'
        "</div></div>"
    ) % (' aria-hidden="true"' if decorative else "", speed, 1 if reverse else 0, real, ghost)


def block(tag=None, rows_of=2, per_row=9, speed=26, heading=None, kicker="Google Reviews",
          blurb=None, pad="90px 48px"):
    """A full reviews section: kicker, heading, and one or two marquee rows."""
    pool = load(tag=tag)
    if not pool:
        return ""
    lanes = []
    if rows_of >= 2 and len(pool) >= 6:
        half = pool[: per_row * 2]
        lanes.append(marquee(half[0::2], speed=speed, reverse=False))
        lanes.append(marquee(half[1::2], speed=speed - 5, reverse=True))
    else:
        lanes.append(marquee(pool[:per_row], speed=speed, reverse=False))

    head = ""
    if heading:
        head = (
            '<div style="padding: 0 48px; margin-bottom: 38px">'
            '<div class="micro" style="margin-bottom: 14px">%s</div>'
            '<h2 style="font-size: 62px; line-height: 1">%s</h2>'
            "%s</div>"
        ) % (
            esc(kicker),
            esc(heading),
            ('<p class="body" style="font-size: 18px; max-width: 620px; margin-top: 16px">%s</p>' % esc(blurb)) if blurb else "",
        )

    return (
        '<div class="rv rvm-wrap" style="background: radial-gradient(1000px 500px at 8%% 110%%, '
        "rgba(215,173,86,0.11), transparent 60%%), #000000; padding: %s; overflow: hidden\">"
        "%s%s</div>"
    ) % (pad, head, "".join(lanes))


CSS = """
    /* ── Review marquee ───────────────────────────────────────────────
       Cards scroll on requestAnimationFrame (see site.js).  No CSS
       animation here on purpose: low-power mode pauses those. */
    .rvm { position: relative; overflow: hidden; padding: 6px 0; }
    .rvm::before, .rvm::after { content: ""; position: absolute; top: 0; bottom: 0; width: 140px;
          z-index: 3; pointer-events: none; }
    .rvm::before { left: 0;  background: linear-gradient(90deg, #000000 8%, rgba(0,0,0,0)); }
    .rvm::after  { right: 0; background: linear-gradient(270deg, #000000 8%, rgba(0,0,0,0)); }
    .rvm-track { display: flex; width: max-content; will-change: transform; }
    .rvm-set { display: flex; }
    .rvm-card { margin: 0 11px 0 0; width: 372px; flex: 0 0 372px; display: flex;
          flex-direction: column; justify-content: space-between;
          background: rgba(255,255,255,0.028);
          box-shadow: inset 0 0 0 1px rgba(215,173,86,0.30);
          border-top: 3px solid #D7AD56; padding: 30px 28px 26px; }
    .rvm-text { margin: 0 0 24px 0; font-size: 16.5px; line-height: 1.65;
          color: rgba(255,255,255,0.74); font-style: normal; }
    .rvm-by { display: flex; align-items: center; gap: 13px; }
    .rvm-mono { width: 42px; height: 42px; flex-shrink: 0; display: flex; align-items: center;
          justify-content: center; font-family: 'Bebas Neue','Oswald',sans-serif; font-size: 19px;
          letter-spacing: 0.04em; color: #D7AD56; background: rgba(215,173,86,0.10);
          box-shadow: inset 0 0 0 1px rgba(215,173,86,0.38); }
    .rvm-name { font-family: 'Bebas Neue','Oswald','Arial Narrow',sans-serif; font-size: 23px;
          letter-spacing: 0.02em; color: #FFFFFF; }
"""

JS = """
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
"""


if __name__ == "__main__":
    import sys
    tag = sys.argv[1] if len(sys.argv) > 1 else None
    pool = load(tag=tag)
    print("tag=%s  reviews=%d" % (tag or "(all)", len(pool)))
    for r in pool[:5]:
        print("  %-22s %s..." % (r["name"], r["text"][:70]))
