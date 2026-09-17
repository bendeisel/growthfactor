
/* Minimal stand-in for the canvas runtime so the artboard component class runs
   as-is on a plain page. State changes drive the modal directly. */
class DCLogic {
  constructor(props){ this.props = props || {}; this.state = {}; }
  setState(patch){
    Object.assign(this.state, patch);
    if ('formOpen' in patch) { patch.formOpen ? openForm() : closeForm(); }
  }
}
function openForm(){var m=document.getElementById('leadModal'); if(m){m.hidden=false;}}
function closeForm(){var m=document.getElementById('leadModal'); if(m){m.hidden=true;}}
document.addEventListener('keydown',function(e){if(e.key==='Escape'){closeForm();}});

/* Page background wash. Driven by requestAnimationFrame and not a CSS
   animation for the usual reason: low-power mode pauses CSS animation but
   keeps rAF running, which is how a gradient ends up frozen on one machine
   and fine on every other. Each layer drifts on one sine and cross-fades its
   opacity on a slower second sine, so the gold changes tone as well as
   position. Its own class, so this never fights the artboards' .dg loop. */
(function () {
  var L = document.querySelectorAll('.pgdg');
  if (!L.length || typeof requestAnimationFrame !== 'function') { return; }
  for (var i = 0; i < L.length; i++) { L[i].style.willChange = 'transform, opacity'; }
  var num = function (el, k, d) {
    var v = parseFloat(el.getAttribute(k));
    return isNaN(v) ? d : v;
  };
  var t0 = null;
  var tick = function (now) {
    if (t0 === null) { t0 = now; }
    var t = (now - t0) / 1000;
    for (var i = 0; i < L.length; i++) {
      var el = L[i];
      var s = Math.sin(2 * Math.PI * (t / num(el, 'data-per', 20)) + num(el, 'data-ph', 0));
      el.style.transform = 'translate3d(' + (num(el, 'data-ax', 160) * s).toFixed(1) + 'px, '
                                          + (num(el, 'data-ay', 60) * s).toFixed(1) + 'px, 0)';
      var oper = num(el, 'data-oper', 0);
      if (oper > 0) {
        var omin = num(el, 'data-omin', 0), omax = num(el, 'data-omax', 1);
        var u = 0.5 + 0.5 * Math.sin(2 * Math.PI * (t / oper) + num(el, 'data-oph', 0));
        el.style.opacity = (omin + (omax - omin) * u).toFixed(3);
      }
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
})();
