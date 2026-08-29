/* Fuel Fortress Nashville — portable vanilla components.
   No framework, no build step. Each block below can drop into a template
   platform as a standalone custom block. */
(function () {
  'use strict';

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

  /* --- footer year --- */
  var yr = document.getElementById('yr');
  if (yr) yr.textContent = new Date().getFullYear();
})();
