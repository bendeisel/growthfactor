/* Growth Factor AI — portable components. Vanilla only, no framework,
   so each piece can drop into a template platform as a custom block. */
(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $  = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---------- sticky header state ---------- */
  var hdr = $('.hdr');
  if (hdr) {
    var onScroll = function () { hdr.classList.toggle('is-stuck', window.scrollY > 8); };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---------- mobile nav ---------- */
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

  /* ---------- reveal on scroll ---------- */
  var io = null;
  function initReveal(root) {
    var reveals = $$('.rv, .draw', root || document);
    if (!reveals.length) { return; }
    if (reduce || !('IntersectionObserver' in window)) {
      reveals.forEach(function (el) { el.classList.add('is-in'); });
      return;
    }
    if (!io) {
      io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    }
    reveals.forEach(function (el) { if (!el.classList.contains('is-in')) { io.observe(el); } });
  }
  initReveal();
  window.GFReveal = initReveal;   /* preview router re-arms on view change */

  /* ---------- MOTIF: node/edge diagrams draw themselves in ---------- */
  $$('.draw').forEach(function (svg) {
    $$('path, line, polyline', svg).forEach(function (p) {
      var len = 600;
      try { len = Math.ceil(p.getTotalLength()) || 600; } catch (e) {}
      p.style.setProperty('--len', len);
    });
  });

  /* ---------- MOTIF: terminal caret + rotating line (used once) ---------- */
  var typer = $('[data-type]');
  if (typer) {
    var out = $('.type__out', typer);
    var words;
    try { words = JSON.parse(typer.getAttribute('data-type')); }
    catch (e) { words = []; }
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

  /* ---------- expandable feature index ---------- */
  $$('.idx__btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var row = btn.closest('.idx__row');
      var open = row.classList.toggle('is-open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  });

  /* ---------- popup lead form (house standing instruction) ---------- */
  var modal = $('#lead-modal');
  if (modal) {
    var lastFocus = null;
    var titleEl   = $('[data-modal-title]', modal);
    var intentEl  = $('[data-modal-intent]', modal);

    var open = function (trigger) {
      lastFocus = trigger || document.activeElement;
      var t = trigger && trigger.getAttribute('data-form-title');
      var i = trigger && trigger.getAttribute('data-form-intent');
      if (titleEl && t) { titleEl.textContent = t; }
      if (intentEl) { intentEl.value = i || (t || 'General'); }
      modal.classList.add('is-open');
      document.body.style.overflow = 'hidden';
      var first = $('input, select, textarea', modal);
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
      if (e.key === 'Escape' && modal.classList.contains('is-open')) { close(); }
      if (e.key === 'Tab' && modal.classList.contains('is-open')) {
        var f = $$('button, input, select, textarea, a[href]', modal)
                  .filter(function (el) { return el.offsetParent !== null; });
        if (!f.length) { return; }
        var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
  }
})();
