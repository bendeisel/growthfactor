#!/usr/bin/env python3
"""The coverflow from the homepage, as a component any page can use.

This is the same slideshow Ben approved under "Find your discipline" — same
perspective, same pitch and tilt constants, same settle easing, same drag and
flick behaviour. It lived inside the Homepage component class and was bound
through DCLogic, so nothing else could use it; here the maths is identical but
the JS reads its items out of the markup, so it runs anywhere.

Motion is requestAnimationFrame, never a CSS animation.
"""

GOLD = "#D7AD56"
BEBAS = "'Bebas Neue','Oswald','Arial Narrow',sans-serif"


def esc(s):
    return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def slideshow(items, sid, kicker="", heading="", width=320, height=400, foot=None):
    """items: [{name, teaser, href, img}]  — img may be None."""
    if not items:
        return ""

    cards = []
    for n, it in enumerate(items):
        media = ('<img src="%s" alt="%s" draggable="false" style="position: absolute; inset: 0; '
                 'width: 100%%; height: 100%%; object-fit: cover; object-position: top">'
                 % (it["img"], esc(it["name"]))) if it.get("img") else ""
        cards.append(
            '<a data-cf data-name="%s" data-teaser="%s" href="%s" '
            'style="position: absolute; left: 50%%; top: 0; width: %dpx; height: %dpx; '
            'border-radius: 8px; overflow: hidden; background: #131313; '
            'box-shadow: 0 24px 60px rgba(0,0,0,0.55), inset 0 0 0 1px rgba(215,173,86,0.28); '
            'display: block; will-change: transform">'
            '%s'
            '<div style="position: absolute; inset: 0; background: linear-gradient(to top, '
            'rgba(0,0,0,0.9) 0%%, rgba(0,0,0,0.05) 58%%)"></div>'
            '<div style="position: absolute; left: 20px; bottom: 18px; right: 20px">'
            '<div class="micro" style="margin-bottom: 6px">%02d</div>'
            '<h3 class="shim" style="font-size: 30px; line-height: 1">%s</h3>'
            '</div></a>' % (esc(it["name"]), esc(it.get("teaser", "")), it.get("href", "#"),
                            width, height, media, n + 1, esc(it["name"])))

    dots = "".join(
        '<span style="height: 4px; width: %s; border-radius: 0; background: %s; '
        'cursor: pointer; transition: width .22s ease, background .22s ease"></span>'
        % ("30px" if i == 0 else "12px", GOLD if i == 0 else "rgba(255,255,255,0.2)")
        for i in range(len(items)))

    head = ""
    if kicker or heading:
        head = (
            '<div style="display: flex; align-items: flex-end; justify-content: space-between; '
            'gap: 24px; margin-bottom: 10px">'
            '<div>%s%s</div>'
            '<div style="display: flex; align-items: center; gap: 12px">'
            '<div class="ctl" data-cf-prev><svg width="18" height="18" viewBox="0 0 24 24" fill="none" '
            'stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="m15 18-6-6 6-6"/></svg></div>'
            '<div class="ctl" data-cf-next><svg width="18" height="18" viewBox="0 0 24 24" fill="none" '
            'stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="m9 18 6-6-6-6"/></svg></div>'
            '</div></div>'
            % (('<div class="micro" style="margin-bottom: 14px">%s</div>' % esc(kicker)) if kicker else "",
               ('<h2 style="font-size: 58px; line-height: 1">%s</h2>' % esc(heading)) if heading else ""))

    return (
        '<div class="cf" id="%s" data-w="%d">'
        '%s'
        '<div class="cf-frame" style="perspective: 960px; overflow: hidden; padding: 44px 0; '
        'cursor: grab; touch-action: pan-y">'
        '<div class="cf-stage" style="position: relative; height: %dpx; transform-style: preserve-3d">%s</div>'
        '</div>'
        '<div style="display: flex; align-items: center; justify-content: space-between; gap: 20px; margin-top: 6px">'
        '<div class="cf-caption" style="min-height: 26px"><span class="cf-name" style="font-family: %s; '
        'font-size: 26px; color: #FFFFFF; letter-spacing: 0.02em"></span> '
        '<span class="cf-teaser body" style="font-size: 15px; margin-left: 10px"></span></div>'
        '<div class="cf-dots" style="display: flex; align-items: center; gap: 7px">%s</div>'
        '</div>'
        '%s'
        '</div>'
        % (sid, width, head, height, "".join(cards), BEBAS, dots,
           ('<div style="margin-top: 24px">%s</div>' % foot) if foot else ""))


CSS = """
    /* Coverflow slideshow — the Find Your Discipline component, reusable */
    .cf-frame:active { cursor: grabbing; }
    .cf [data-cf] { text-decoration: none; }
    .cf [data-cf] h3 { color: #FFFFFF; }
"""

JS = """
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
"""
