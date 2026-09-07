
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
