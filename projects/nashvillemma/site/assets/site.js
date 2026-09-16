
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
  if (plus) { plus.textContent = a.hidden ? '+' : '–'; }
});
function openForm(){var m=document.getElementById('leadModal'); if(m){m.hidden=false;}}
function closeForm(){var m=document.getElementById('leadModal'); if(m){m.hidden=true;}}
document.addEventListener('keydown',function(e){if(e.key==='Escape'){closeForm();}});
