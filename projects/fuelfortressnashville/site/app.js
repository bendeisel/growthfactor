/* Fuel Fortress Nashville, portable vanilla components.
   No framework, no build step. Each block below can drop into a template
   platform as a standalone custom block. */
(function () {
  'use strict';


  /* --- hero entrance: stagger the children in on load --- */
  var hero = document.querySelector('.hero');
  if (hero) {
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        hero.classList.add('is-ready');
        document.body.classList.add('hero-done');
      });
    });
  }

  /* --- sticky header --- */
  var hdr = document.getElementById('hdr');
  if (hdr) {
    var onScroll = function () {
      hdr.classList.toggle('is-stuck', window.scrollY > 40);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* --- mobile nav --- */
  var toggle = document.getElementById('navtoggle');
  var nav = document.getElementById('nav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    nav.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') {
        nav.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* --- lead modal: opens from every request CTA --- */
  var modal = document.getElementById('modal');
  var lastFocus = null;
  var COPY = {
    join:    ['Join Fuel Fortress', 'Tell us how to reach you and we’ll get your membership started.'],
    tour:    ['Book a Gym Tour', 'Come walk the floor. Leave your details and we’ll set up a time.'],
    daypass: ['Day Pass', '$25 for the day. Leave your details and we’ll have you set up when you arrive.'],
    annual:  ['Annual Membership', '$84.99/mo, billed annually. Our lowest rate at all four locations.'],
    monthly: ['Month to Month', '$104.99/mo, cancel anytime. Full access, no penalties.']
  };

  function openModal(kind) {
    if (!modal) return;
    var copy = COPY[kind] || COPY.join;
    document.getElementById('modal-title').textContent = copy[0];
    document.getElementById('modal-sub').textContent = copy[1];
    document.getElementById('modal-interest').value = kind;
    lastFocus = document.activeElement;
    modal.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    var first = modal.querySelector('input:not([type=hidden]):not(.hp)');
    if (first) first.focus();
  }

  function closeModal() {
    if (!modal) return;
    modal.classList.remove('is-open');
    document.body.style.overflow = '';
    if (lastFocus) lastFocus.focus();
  }

  document.addEventListener('click', function (e) {
    var trigger = e.target.closest('[data-modal]');
    if (trigger) { e.preventDefault(); openModal(trigger.getAttribute('data-modal')); return; }
    if (e.target.id === 'modal-close' || e.target === modal) closeModal();
  });

  /* --- gallery lightbox --- */
  var lb = document.getElementById('lb');
  var lbImg = document.getElementById('lb-img');
  var mosaic = document.getElementById('mosaic');
  if (lb && mosaic) {
    mosaic.addEventListener('click', function (e) {
      var slot = e.target.closest('.slot');
      var img = slot && slot.querySelector('img');
      if (!img) return; // placeholder slots have no image yet
      lbImg.src = img.currentSrc || img.src;
      lbImg.alt = img.alt || '';
      lb.classList.add('is-open');
      document.body.style.overflow = 'hidden';
    });
    lb.addEventListener('click', function () {
      lb.classList.remove('is-open');
      lbImg.removeAttribute('src');
      document.body.style.overflow = '';
    });
  }

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (modal && modal.classList.contains('is-open')) closeModal();
    if (lb && lb.classList.contains('is-open')) { lb.classList.remove('is-open'); document.body.style.overflow = ''; }
  });

  /* --- reveal on scroll --- */
  var revealables = document.querySelectorAll('.rv');
  if (!('IntersectionObserver' in window)) {
    Array.prototype.forEach.call(revealables, function (el) { el.classList.add('is-in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });
    Array.prototype.forEach.call(revealables, function (el) { io.observe(el); });
  }


  /* --- equipment showcase: tablist, arrow-key navigable --- */
  var eqTabs = Array.prototype.slice.call(document.querySelectorAll('.eq-item'));
  var eqPanels = Array.prototype.slice.call(document.querySelectorAll('.eq-panel'));
  if (eqTabs.length && eqTabs.length === eqPanels.length) {
    var selectEq = function (i, focus) {
      eqTabs.forEach(function (tab, n) {
        var on = n === i;
        tab.classList.toggle('is-active', on);
        tab.setAttribute('aria-selected', on ? 'true' : 'false');
        tab.tabIndex = on ? 0 : -1;
      });
      eqPanels.forEach(function (panel, n) {
        var on = n === i;
        panel.classList.toggle('is-active', on);
        panel.hidden = !on;
      });
      if (focus) eqTabs[i].focus();
    };

    eqTabs.forEach(function (tab, i) {
      tab.addEventListener('click', function () { selectEq(i, false); });
      // pointer-over switches too, but never steals focus from a keyboard user
      tab.addEventListener('mouseenter', function () { selectEq(i, false); });
      tab.addEventListener('keydown', function (e) {
        var delta = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
        if (delta) {
          e.preventDefault();
          selectEq((i + delta + eqTabs.length) % eqTabs.length, true);
        } else if (e.key === 'Home') {
          e.preventDefault(); selectEq(0, true);
        } else if (e.key === 'End') {
          e.preventDefault(); selectEq(eqTabs.length - 1, true);
        }
      });
    });
  }


  /* --- review deck: staggered cards, click or arrow to advance --- */
  var deck = document.getElementById('deck');
  var deckCards = deck ? Array.prototype.slice.call(deck.querySelectorAll('.deck-card')) : [];
  if (deck && deckCards.length) {
    var n = deckCards.length;
    var idx = 0;
    var timer = null;
    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    var cardSize = function () {
      return window.matchMedia('(min-width: 901px)').matches ? 365 : 290;
    };

    var layout = function () {
      var size = cardSize();
      deck.style.setProperty('--card', size + 'px');
      deckCards.forEach(function (card, i) {
        var off = i - idx;
        if (off > n / 2) off -= n;
        if (off < -n / 2) off += n;
        var abs = Math.abs(off);
        var centered = off === 0;
        var lift = centered ? -46 : (off % 2 ? 14 : -14);
        var tilt = centered ? 0 : (off % 2 ? 2.5 : -2.5);
        card.style.transform =
          'translate(-50%, -50%)' +
          ' translateX(' + (off * size / 1.5) + 'px)' +
          ' translateY(' + lift + 'px)' +
          ' rotate(' + tilt + 'deg)';
        card.style.zIndex = String(50 - abs);
        card.style.opacity = abs > 3 ? '0' : '1';
        card.style.pointerEvents = abs > 3 ? 'none' : 'auto';
        card.classList.toggle('is-center', centered);
        card.setAttribute('aria-hidden', centered ? 'false' : 'true');
      });
    };

    var move = function (step) {
      idx = (idx + step % n + n) % n;
      layout();
    };

    var stop = function () { if (timer) { clearInterval(timer); timer = null; } };
    var start = function () {
      if (reduced || timer) return;
      timer = setInterval(function () { move(1); }, 5200);
    };

    deckCards.forEach(function (card, i) {
      card.addEventListener('click', function () {
        if (i !== idx) { stop(); idx = i; layout(); start(); }
      });
    });

    deck.querySelectorAll('.deck-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        stop();
        move(parseInt(btn.getAttribute('data-dir'), 10));
        start();
      });
    });

    deck.addEventListener('mouseenter', stop);
    deck.addEventListener('mouseleave', start);
    deck.addEventListener('focusin', stop);
    deck.addEventListener('focusout', start);
    deck.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { e.preventDefault(); stop(); move(-1); }
      if (e.key === 'ArrowRight') { e.preventDefault(); stop(); move(1); }
    });

    // swipe
    var startX = null;
    deck.addEventListener('touchstart', function (e) { startX = e.touches[0].clientX; stop(); }, { passive: true });
    deck.addEventListener('touchend', function (e) {
      if (startX === null) return;
      var dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 40) move(dx < 0 ? 1 : -1);
      startX = null;
      start();
    });

    window.addEventListener('resize', layout, { passive: true });
    layout();
    start();
  }

  /* --- footer year --- */
  var yr = document.getElementById('yr');
  if (yr) yr.textContent = new Date().getFullYear();
})();
