/* Growth Factor contact buttons -- browser side.
 *
 * Loaded by the private HighLevel marketplace app as a custom script. It draws
 * a button bar on the contact detail page, asks the worker which buttons this
 * sub-account should see, and hands clicks back to the worker to execute.
 * Nothing here holds a HighLevel API token.
 */
(function () {
  'use strict';

  if (window.__gfContactButtons) return;
  window.__gfContactButtons = true;

  var CONFIG = window.GF_BUTTONS_CONFIG || {};
  var API_BASE = (CONFIG.apiBase || '__API_BASE__').replace(/\/$/, '');
  var APP_ID = CONFIG.appId || '__APP_ID__';
  var HOST_ID = 'gf-contact-buttons-host';

  var state = {
    sso: null,
    ssoPromise: null,
    key: null, // locationId + contactId currently rendered
    settings: {},
    inFlight: {},
  };

  // --- context -----------------------------------------------------------

  // Contact detail lives at /v2/location/<loc>/contacts/detail/<contact> on the
  // current app and /location/<loc>/contacts/detail/<contact> on the old one.
  var ROUTES = [
    /\/location\/([^/]+)\/contacts\/detail\/([^/?#]+)/,
    /\/location\/([^/]+)\/customers\/detail\/([^/?#]+)/,
  ];

  function readContext() {
    var path = window.location.pathname;
    for (var i = 0; i < ROUTES.length; i++) {
      var match = path.match(ROUTES[i]);
      if (match) return { locationId: match[1], contactId: match[2] };
    }
    return null;
  }

  // --- session -----------------------------------------------------------

  // HighLevel exposes the signed-in user as an encrypted blob; the worker
  // decrypts it with the app's shared secret, which is what proves a call is
  // coming from a real logged-in user and not a stray script.
  function getSession() {
    if (state.sso) return Promise.resolve(state.sso);
    if (state.ssoPromise) return state.ssoPromise;

    state.ssoPromise = new Promise(function (resolve) {
      var attempts = 0;
      (function attempt() {
        attempts++;
        if (typeof window.exposeSessionDetails === 'function') {
          Promise.resolve(window.exposeSessionDetails(APP_ID))
            .then(function (encrypted) {
              state.sso = encrypted;
              resolve(encrypted);
            })
            .catch(function () {
              resolve(null);
            });
          return;
        }
        if (attempts > 40) return resolve(null); // ~10s, then give up quietly
        setTimeout(attempt, 250);
      })();
    });

    return state.ssoPromise;
  }

  function api(path, body) {
    return getSession().then(function (sso) {
      return fetch(API_BASE + path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(Object.assign({ sso: sso }, body)),
      }).then(function (res) {
        return res.json().then(function (data) {
          if (!res.ok) throw new Error(data && data.error ? data.error : 'Request failed');
          return data;
        });
      });
    });
  }

  // --- mounting ----------------------------------------------------------

  function findAnchor() {
    var selectors = (state.settings.anchorSelectors || []).concat([
      '[data-testid="contact-detail-header"]',
      '[data-testid="contact-header"]',
      '#contact-detail-panel .header',
      '.contact-detail-header',
      '#contact-detail-header',
    ]);
    for (var i = 0; i < selectors.length; i++) {
      var el = document.querySelector(selectors[i]);
      if (el) return el;
    }
    return null;
  }

  function ensureHost() {
    var existing = document.getElementById(HOST_ID);
    if (existing) return existing;

    var host = document.createElement('div');
    host.id = HOST_ID;
    host.attachShadow({ mode: 'open' });

    var anchor = state.settings.placement === 'pinned' ? null : findAnchor();
    if (anchor) {
      host.dataset.gfMode = 'inline';
      anchor.appendChild(host);
    } else {
      // No reliable anchor: pin a bar just under the top navigation. This is
      // the default that survives HighLevel reshuffling its markup.
      host.dataset.gfMode = 'pinned';
      document.body.appendChild(host);
    }
    return host;
  }

  var STYLES = [
    ':host{all:initial;font-family:Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif}',
    '.bar{display:flex;flex-wrap:wrap;gap:8px;align-items:center;padding:8px 12px;box-sizing:border-box}',
    ':host([data-gf-mode="pinned"]) .bar{position:fixed;top:8px;right:16px;z-index:2147483000;',
    'background:rgba(255,255,255,.96);backdrop-filter:blur(6px);border:1px solid rgba(15,23,42,.08);',
    'border-radius:12px;box-shadow:0 8px 24px rgba(15,23,42,.12);max-width:min(70vw,900px)}',
    'button{display:inline-flex;align-items:center;gap:7px;border:0;border-radius:999px;cursor:pointer;',
    'padding:7px 15px;font-size:13px;font-weight:600;line-height:1;letter-spacing:.01em;color:#fff;',
    'transition:transform .12s ease,filter .12s ease,opacity .12s ease;white-space:nowrap;max-width:260px}',
    'button:hover{filter:brightness(1.08)}',
    'button:active{transform:translateY(1px)}',
    'button:disabled{opacity:.55;cursor:progress}',
    'button.outline{background:transparent!important;border:1.5px solid currentColor}',
    '.label{overflow:hidden;text-overflow:ellipsis}',
    '.icon{width:15px;height:15px;flex:0 0 15px}',
    '.spin{animation:gfspin .7s linear infinite}',
    '@keyframes gfspin{to{transform:rotate(360deg)}}',
    '.toast{position:fixed;bottom:24px;right:24px;z-index:2147483001;display:flex;gap:10px;align-items:flex-start;',
    'max-width:380px;padding:12px 16px;border-radius:12px;font-size:13px;line-height:1.45;color:#f8fafc;',
    'background:#0f172a;box-shadow:0 12px 32px rgba(15,23,42,.28);animation:gfin .18s ease}',
    '.toast.err{background:#7f1d1d}',
    '@keyframes gfin{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}',
  ].join('');

  var ICONS = {
    tag: '<path d="M2 2h7l11 11-7 7L2 9V2z"/><circle cx="6" cy="6" r="1.6" fill="#fff"/>',
    bolt: '<path d="M13 2 4 13h6l-1 9 9-11h-6l1-9z"/>',
    alert: '<circle cx="12" cy="12" r="9"/><path d="M12 7v6" stroke="#fff" stroke-width="2"/><circle cx="12" cy="16.5" r="1.2" fill="#fff"/>',
    user: '<circle cx="10" cy="8" r="4"/><path d="M2 21c0-4.4 3.6-7 8-7s8 2.6 8 7z"/><path d="M19 6v6M16 9h6" stroke="#fff" stroke-width="2" fill="none"/>',
    check: '<path d="M20 6 9 17l-5-5" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>',
    trash: '<path d="M4 6h16M9 6V4h6v2M6 6l1 15h10l1-15"/>',
    link: '<path d="M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1" fill="none" stroke="currentColor" stroke-width="2"/><path d="M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1" fill="none" stroke="currentColor" stroke-width="2"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4" stroke="#fff" stroke-width="2"/>',
    note: '<path d="M5 3h9l5 5v13H5z"/><path d="M14 3v5h5" fill="#fff"/>',
    dot: '<circle cx="12" cy="12" r="6"/>',
  };

  function iconSvg(name) {
    var body = ICONS[name] || ICONS.dot;
    return '<svg class="icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">' + body + '</svg>';
  }

  function toast(shadow, message, isError) {
    var existing = shadow.querySelector('.toast');
    if (existing) existing.remove();
    var el = document.createElement('div');
    el.className = 'toast' + (isError ? ' err' : '');
    el.textContent = message;
    shadow.appendChild(el);
    setTimeout(function () {
      if (el.isConnected) el.remove();
    }, isError ? 8000 : 3500);
  }

  function render(shadow, buttons, ctx) {
    shadow.innerHTML = '<style>' + STYLES + '</style>';
    if (!buttons.length) return;

    var bar = document.createElement('div');
    bar.className = 'bar';

    buttons.forEach(function (button) {
      var el = document.createElement('button');
      var color = button.color || '#4f46e5';
      el.className = button.style === 'outline' ? 'outline' : '';
      el.style.background = color;
      if (button.style === 'outline') el.style.color = color;
      else el.style.color = button.textColor || '#ffffff';
      el.title = button.tooltip || button.label;
      el.innerHTML = iconSvg(button.icon) + '<span class="label"></span>';
      el.querySelector('.label').textContent = button.label;

      el.addEventListener('click', function () {
        handleClick(shadow, el, button, ctx);
      });
      bar.appendChild(el);
    });

    shadow.appendChild(bar);
  }

  function handleClick(shadow, el, button, ctx) {
    var openUrl = (button.actions || []).find(function (a) {
      return a.type === 'open_url';
    });

    if (button.confirm && !window.confirm(button.confirm)) return;

    // Pop the link first: browsers only allow it during the click gesture.
    if (openUrl && openUrl.url) {
      var url = openUrl.url
        .replace(/\{\{\s*contact\.id\s*\}\}/g, ctx.contactId)
        .replace(/\{\{\s*location\.id\s*\}\}/g, ctx.locationId);
      window.open(url, openUrl.target || '_blank', 'noopener');
    }

    var serverActions = (button.actions || []).filter(function (a) {
      return a.type !== 'open_url';
    });
    if (!serverActions.length) return;

    var originalHtml = el.innerHTML;
    el.disabled = true;
    el.innerHTML = '<svg class="icon spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">' +
      '<circle cx="12" cy="12" r="9" opacity=".25"/><path d="M21 12a9 9 0 0 0-9-9"/></svg><span class="label"></span>';
    el.querySelector('.label').textContent = 'Working';

    api('/api/run', {
      locationId: ctx.locationId,
      contactId: ctx.contactId,
      buttonId: button.id,
    })
      .then(function (result) {
        toast(shadow, result.message || 'Done', !result.ok);
      })
      .catch(function (err) {
        toast(shadow, err.message || 'Something went wrong', true);
      })
      .finally(function () {
        el.disabled = false;
        el.innerHTML = originalHtml;
      });
  }

  // --- lifecycle ---------------------------------------------------------

  function teardown() {
    var host = document.getElementById(HOST_ID);
    if (host) host.remove();
  }

  function sync() {
    var ctx = readContext();
    if (!ctx) {
      if (state.key) {
        state.key = null;
        teardown();
      }
      return;
    }

    var key = ctx.locationId + '/' + ctx.contactId;
    if (key === state.key && document.getElementById(HOST_ID)) return;
    state.key = key;
    teardown();

    api('/api/buttons', { locationId: ctx.locationId, contactId: ctx.contactId })
      .then(function (data) {
        if (state.key !== key) return; // navigated away mid-flight
        state.settings = data.settings || {};
        var host = ensureHost();
        render(host.shadowRoot, data.buttons || [], ctx);
      })
      .catch(function (err) {
        if (console && console.warn) console.warn('[gf-buttons]', err.message);
      });
  }

  var debounceTimer = null;
  function scheduleSync() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(sync, 250);
  }

  ['pushState', 'replaceState'].forEach(function (method) {
    var original = history[method];
    history[method] = function () {
      var result = original.apply(this, arguments);
      scheduleSync();
      return result;
    };
  });
  window.addEventListener('popstate', scheduleSync);

  // HighLevel swaps the contact panel without always touching the URL, so keep
  // a cheap observer on top of the history hooks.
  new MutationObserver(function () {
    if (!document.getElementById(HOST_ID) && readContext()) scheduleSync();
  }).observe(document.documentElement, { childList: true, subtree: true });

  scheduleSync();
})();
