/* Growth Factor AI — portable components. Vanilla only, no framework. */
(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $  = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* sticky header hairline */
  var hdr = $('.hdr');
  if (hdr) {
    var onScroll = function () { hdr.classList.toggle('is-stuck', window.scrollY > 8); };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* mobile nav */
  var burger = $('.burger'), nav = $('.nav');
  if (burger && nav) {
    burger.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) { nav.classList.remove('is-open'); }
    });
  }

  /* "Build your own ___." types in, then back out again */
  var typer = $('[data-type]');
  if (typer) {
    var out = $('.type__out', typer);
    var words;
    try { words = JSON.parse(typer.getAttribute('data-type')); } catch (e) { words = []; }
    if (out && words.length) {
      if (reduce) {
        out.textContent = words[0];
      } else {
        var wi = 0, ci = 0, del = false;
        (function tick() {
          var w = words[wi];
          ci += del ? -1 : 1;
          out.textContent = w.slice(0, ci);
          var wait = del ? 34 : 62;
          if (!del && ci === w.length) { del = true; wait = 1900; }
          else if (del && ci === 0) { del = false; wi = (wi + 1) % words.length; wait = 320; }
          setTimeout(tick, wait);
        })();
      }
    }
  }

  /* feature rows open and close */
  $$('.idx__btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var row = btn.closest('.idx__row');
      var open = row.classList.toggle('is-open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  });

  /* popup lead form (house standing instruction) */
  var modal = $('#lead-modal');
  if (modal) {
    var lastFocus = null;
    var titleEl  = $('[data-modal-title]', modal);
    var intentEl = $('[data-modal-intent]', modal);

    var open = function (trigger) {
      lastFocus = trigger || document.activeElement;
      var t = trigger && trigger.getAttribute('data-form-title');
      var i = trigger && trigger.getAttribute('data-form-intent');
      if (titleEl && t) { titleEl.textContent = t; }
      if (intentEl) { intentEl.value = i || (t || 'General'); }
      modal.classList.add('is-open');
      document.body.style.overflow = 'hidden';
      var first = $('input, textarea', modal);
      if (first) { first.focus(); }
    };
    var close = function () {
      modal.classList.remove('is-open');
      document.body.style.overflow = '';
      if (lastFocus) { lastFocus.focus(); }
    };

    document.addEventListener('click', function (e) {
      var t = e.target.closest('[data-form]');
      if (t) { e.preventDefault(); open(t); return; }
      if (e.target.closest('[data-form-close]')) { e.preventDefault(); close(); }
    });
    document.addEventListener('keydown', function (e) {
      if (!modal.classList.contains('is-open')) { return; }
      if (e.key === 'Escape') { close(); return; }
      if (e.key === 'Tab') {
        var f = $$('button, input, textarea, a[href]', modal)
                  .filter(function (el) { return el.offsetParent !== null; });
        if (!f.length) { return; }
        var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
  }
})();
