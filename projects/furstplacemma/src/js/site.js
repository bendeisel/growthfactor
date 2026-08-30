/* Furst Place MMA — vanilla JS only.
   House default: interactive pieces must be portable enough to drop into a
   template platform as a custom block, so no framework and no build step. */
(function () {
  'use strict';

  /* ---- Current year -------------------------------------------------- */
  var yr = document.getElementById('yr');
  if (yr) { yr.textContent = new Date().getFullYear(); }

  /* ---- Mobile nav ---------------------------------------------------- */
  var navBtn = document.querySelector('[data-navtoggle]');
  var nav    = document.getElementById('primaryNav');
  if (navBtn && nav) {
    navBtn.addEventListener('click', function () {
      var open = navBtn.getAttribute('aria-expanded') === 'true';
      navBtn.setAttribute('aria-expanded', String(!open));
      nav.classList.toggle('is-open', !open);
    });
    // Close after choosing a destination, so the panel never covers the target.
    nav.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') {
        navBtn.setAttribute('aria-expanded', 'false');
        nav.classList.remove('is-open');
      }
    });
  }

  /* ---- Lead modal ------------------------------------------------------
     Every "request" CTA opens the popup rather than scrolling to an inline
     form. Any element with data-lead opens it; the attribute value is passed
     through as the lead source so we can tell which CTA converted.        */
  var modal   = document.getElementById('leadModal');
  if (!modal) { return; }
  var sourceEl = document.getElementById('leadSource');
  var lastFocus = null;

  function focusable() {
    return modal.querySelectorAll(
      'a[href], button:not([disabled]), input:not([type="hidden"]), select, textarea'
    );
  }

  function open(source) {
    lastFocus = document.activeElement;
    if (sourceEl && source) { sourceEl.value = source; }
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
    var f = focusable();
    if (f.length) { f[0].focus(); }
  }

  function close() {
    modal.hidden = true;
    document.body.style.overflow = '';
    if (lastFocus && lastFocus.focus) { lastFocus.focus(); }
  }

  document.addEventListener('click', function (e) {
    var trigger = e.target.closest('[data-lead]');
    if (trigger) {
      e.preventDefault();
      open(trigger.getAttribute('data-lead'));
      return;
    }
    if (e.target.closest('[data-lead-close]')) { close(); return; }
    // Click on the backdrop, outside the panel.
    if (!modal.hidden && e.target === modal) { close(); }
  });

  document.addEventListener('keydown', function (e) {
    if (modal.hidden) { return; }
    if (e.key === 'Escape') { close(); return; }
    if (e.key !== 'Tab') { return; }

    // Trap focus inside the dialog while it is open.
    var f = focusable();
    if (!f.length) { return; }
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault(); last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault(); first.focus();
    }
  });
}());
