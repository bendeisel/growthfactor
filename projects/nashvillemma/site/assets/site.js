
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
