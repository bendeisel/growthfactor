/* Growth Factor contact buttons -- browser side.
 *
 * Loaded by the private HighLevel marketplace app as a custom script. Draws an
 * always-on dock that follows whichever contact the user is looking at, on the
 * contact page, inside a conversation, or on an opportunity. The worker
 * resolves the contact behind a conversation or opportunity through the API,
 * so we never depend on HighLevel's markup for identity. Nothing here holds a
 * HighLevel API token.
 */
(function () {
  'use strict';

  var VERSION = '0.2.0';
  if (window.__gfContactButtons && window.__gfContactButtons.version === VERSION) return;

  var CONFIG = window.GF_BUTTONS_CONFIG || {};
  var API_BASE = (CONFIG.apiBase || '__API_BASE__').replace(/\/$/, '');
  var APP_ID = CONFIG.appId || '__APP_ID__';
  var HOST_ID = 'gf-contact-buttons-host';
  var STORAGE_PREFIX = 'gfb:dock:';

  var state = {
    sso: null,
    ssoPromise: null,
    key: null, // surface + id currently resolved
    route: null,
    context: null, // {contactId, contact, buttons, settings}
    settings: {},
    collapsed: false,
    error: null,
    loading: false,
    openGroup: null,
    lastHref: null,
    heartbeat: null,
  };

  // --- route detection ---------------------------------------------------

  // HighLevel ids are 20 character alphanumerics; matching on that keeps us
  // from mistaking "list" or "pipeline" for an id.
  var ID = '([A-Za-z0-9]{18,24})';
  var ROUTES = [
    { surface: 'contact', re: new RegExp('/location/' + ID + '/contacts/detail/' + ID) },
    { surface: 'contact', re: new RegExp('/location/' + ID + '/customers/detail/' + ID) },
    { surface: 'conversation', re: new RegExp('/location/' + ID + '/conversations/conversations/' + ID) },
    { surface: 'opportunity', re: new RegExp('/location/' + ID + '/opportunities/[^?#]*?/' + ID + '(?:[/?#]|$)') },
  ];

  function parseRoute(href) {
    var url;
    try {
      url = new URL(href, 'https://app.gohighlevel.com');
    } catch (e) {
      return null;
    }
    var path = url.pathname;
    for (var i = 0; i < ROUTES.length; i++) {
      var match = path.match(ROUTES[i].re);
      if (match) return { surface: ROUTES[i].surface, locationId: match[1], id: match[2] };
    }
    // Opportunity modals sometimes carry the id in the query string instead.
    var loc = path.match(new RegExp('/location/' + ID + '/'));
    if (loc && /\/opportunities/.test(path)) {
      var oppId = url.searchParams.get('opportunityId') || url.searchParams.get('opportunity_id');
      if (oppId) return { surface: 'opportunity', locationId: loc[1], id: oppId };
    }
    if (loc) return { surface: 'none', locationId: loc[1], id: null };
    return null;
  }

  // Last resort for surfaces whose URL carries nothing: an open opportunity or
  // conversation panel always links to the contact record somewhere.
  function contactIdFromDom(scopeSelectors) {
    var scopes = [];
    (scopeSelectors || ['[role="dialog"]', '.modal', '#opportunity-detail', '.conversation-header']).forEach(function (s) {
      var nodes = document.querySelectorAll(s);
      for (var i = 0; i < nodes.length; i++) scopes.push(nodes[i]);
    });
    for (var j = 0; j < scopes.length; j++) {
      var link = scopes[j].querySelector('a[href*="/contacts/detail/"]');
      if (link) {
        var m = link.getAttribute('href').match(new RegExp('/contacts/detail/' + ID));
        if (m) return m[1];
      }
    }
    return null;
  }

  // --- session -----------------------------------------------------------

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
        if (attempts > 40) return resolve(null);
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
        body: JSON.stringify(Object.assign({ sso: sso, v: VERSION }, body)),
        cache: 'no-store',
      }).then(function (res) {
        return res.json().then(function (data) {
          if (!res.ok) throw new Error(data && data.error ? data.error : 'Request failed (' + res.status + ')');
          return data;
        });
      });
    });
  }

  // --- persistence -------------------------------------------------------

  function storageKey(locationId) {
    return STORAGE_PREFIX + (locationId || 'global');
  }

  function loadPrefs(locationId) {
    try {
      return JSON.parse(localStorage.getItem(storageKey(locationId))) || {};
    } catch (e) {
      return {};
    }
  }

  function savePrefs(locationId, patch) {
    try {
      var next = Object.assign(loadPrefs(locationId), patch);
      localStorage.setItem(storageKey(locationId), JSON.stringify(next));
    } catch (e) {
      /* private mode etc. */
    }
  }

  // --- styles ------------------------------------------------------------

  var STYLES = [
    ':host{all:initial;font-family:Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;font-size:13px;color:#0f172a}',
    '.dock{position:fixed;z-index:2147483000;display:flex;flex-direction:column;min-width:180px;max-width:min(92vw,720px);',
    'background:rgba(255,255,255,.98);border:1px solid rgba(15,23,42,.1);border-radius:14px;',
    'box-shadow:0 10px 30px rgba(15,23,42,.16),0 1px 2px rgba(15,23,42,.08);backdrop-filter:blur(8px);',
    'user-select:none;-webkit-user-select:none;transition:box-shadow .15s ease}',
    '.dock.dragging{box-shadow:0 18px 44px rgba(15,23,42,.28);cursor:grabbing}',
    '.dock.column{max-width:280px}',
    '.head{display:flex;align-items:center;gap:8px;padding:8px 10px 8px 8px;border-bottom:1px solid rgba(15,23,42,.06);cursor:grab;min-height:38px}',
    '.dock.collapsed .head{border-bottom:0}',
    '.grip{width:14px;height:14px;flex:0 0 14px;color:#94a3b8}',
    '.who{flex:1;min-width:0;display:flex;flex-direction:column;line-height:1.2}',
    '.who .name{font-weight:700;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.who .meta{font-size:11px;color:#64748b;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.who.none .name{color:#94a3b8;font-weight:600}',
    '.surface{font-size:10px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;padding:2px 6px;border-radius:999px;background:#eef2ff;color:#4338ca;flex:0 0 auto}',
    '.surface.conversation{background:#ecfeff;color:#0e7490}',
    '.surface.opportunity{background:#fef3c7;color:#b45309}',
    '.dot{width:8px;height:8px;border-radius:50%;background:#22c55e;flex:0 0 8px}',
    '.dot.loading{background:#f59e0b;animation:gfpulse 1s ease infinite}',
    '.dot.error{background:#ef4444}',
    '@keyframes gfpulse{50%{opacity:.35}}',
    '.iconbtn{all:unset;display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;border-radius:6px;color:#64748b;cursor:pointer}',
    '.iconbtn:hover{background:rgba(15,23,42,.06);color:#0f172a}',
    '.iconbtn svg{width:14px;height:14px}',
    '.body{padding:8px;display:flex;flex-wrap:wrap;gap:6px;align-items:center}',
    '.dock.column .body{flex-direction:column;align-items:stretch}',
    '.dock.collapsed .body{display:none}',
    '.error{padding:8px 10px;font-size:12px;color:#991b1b;background:#fef2f2;border-top:1px solid #fecaca;display:flex;gap:8px;align-items:center}',
    '.error .retry{all:unset;cursor:pointer;font-weight:700;color:#7f1d1d;text-decoration:underline}',
    '.empty{padding:10px 12px;font-size:12px;color:#64748b}',
    'button.act{all:unset;box-sizing:border-box;display:inline-flex;align-items:center;justify-content:flex-start;gap:7px;border-radius:999px;cursor:pointer;',
    'padding:7px 13px;font-size:13px;font-weight:600;line-height:1;letter-spacing:.005em;color:#fff;white-space:nowrap;max-width:260px;',
    'transition:transform .12s ease,filter .12s ease,opacity .12s ease}',
    'button.act.sm{padding:5px 10px;font-size:12px;gap:6px}',
    'button.act.sm .icon{width:13px;height:13px;flex-basis:13px}',
    'button.act.iconOnly{padding:7px;width:32px;height:32px;justify-content:center;border-radius:10px}',
    'button.act.iconOnly.sm{padding:5px;width:26px;height:26px}',
    'button.act.iconOnly .label{display:none}',
    '.dock.column button.act{width:100%;max-width:none;border-radius:9px}',
    'button.act:hover{filter:brightness(1.08)}',
    'button.act:active{transform:translateY(1px)}',
    'button.act:disabled{opacity:.55;cursor:progress}',
    'button.act.outline{background:transparent!important;border:1.5px solid currentColor}',
    '.label{overflow:hidden;text-overflow:ellipsis}',
    '.icon{width:15px;height:15px;flex:0 0 15px}',
    '.chev{width:12px;height:12px;flex:0 0 12px;margin-left:-2px;opacity:.85}',
    '.spin{animation:gfspin .7s linear infinite}',
    '@keyframes gfspin{to{transform:rotate(360deg)}}',
    '.group{position:relative}',
    '.menu{position:absolute;top:calc(100% + 6px);left:0;min-width:200px;max-width:320px;padding:6px;background:#fff;border:1px solid rgba(15,23,42,.1);',
    'border-radius:12px;box-shadow:0 14px 34px rgba(15,23,42,.2);display:flex;flex-direction:column;gap:4px;z-index:2}',
    '.menu.up{top:auto;bottom:calc(100% + 6px)}',
    '.menu.right{left:auto;right:0}',
    '.menu button.act{width:100%;max-width:none;border-radius:9px;justify-content:flex-start}',
    '.toast{position:fixed;z-index:2147483001;display:flex;gap:10px;align-items:flex-start;max-width:380px;padding:11px 15px;border-radius:12px;',
    'font-size:13px;line-height:1.45;color:#f8fafc;background:#0f172a;box-shadow:0 12px 32px rgba(15,23,42,.28);animation:gfin .18s ease}',
    '.toast.err{background:#7f1d1d}',
    '@keyframes gfin{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}',
    '@media (prefers-color-scheme: dark){.dock{background:rgba(17,24,39,.98);border-color:rgba(255,255,255,.1);color:#e5e7eb}',
    '.head{border-bottom-color:rgba(255,255,255,.08)}.who .meta{color:#9ca3af}.iconbtn:hover{background:rgba(255,255,255,.08);color:#fff}',
    '.menu{background:#111827;border-color:rgba(255,255,255,.1)}.empty{color:#9ca3af}}',
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
    folder: '<path d="M3 6a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
    dot: '<circle cx="12" cy="12" r="6"/>',
  };

  function svg(name, cls) {
    return '<svg class="' + (cls || 'icon') + '" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">' + (ICONS[name] || ICONS.dot) + '</svg>';
  }
  var GRIP = '<svg class="grip" viewBox="0 0 24 24" fill="currentColor"><circle cx="9" cy="6" r="1.8"/><circle cx="15" cy="6" r="1.8"/><circle cx="9" cy="12" r="1.8"/><circle cx="15" cy="12" r="1.8"/><circle cx="9" cy="18" r="1.8"/><circle cx="15" cy="18" r="1.8"/></svg>';
  var CHEV = '<svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="m6 9 6 6 6-6"/></svg>';
  var SPIN = '<svg class="icon spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><circle cx="12" cy="12" r="9" opacity=".25"/><path d="M21 12a9 9 0 0 0-9-9"/></svg>';

  // --- host --------------------------------------------------------------

  function host() {
    var existing = document.getElementById(HOST_ID);
    if (existing && existing.shadowRoot) return existing;
    var el = document.createElement('div');
    el.id = HOST_ID;
    el.attachShadow({ mode: 'open' });
    el.shadowRoot.innerHTML = '<style>' + STYLES + '</style><div class="dock"></div>';
    (document.body || document.documentElement).appendChild(el);
    return el;
  }

  function dockEl() {
    return host().shadowRoot.querySelector('.dock');
  }

  // --- positioning -------------------------------------------------------

  var DEFAULT_POSITIONS = {
    'top-right': function (w, h) { return { x: window.innerWidth - w - 16, y: 64 }; },
    'top-left': function () { return { x: 16, y: 64 }; },
    'bottom-right': function (w, h) { return { x: window.innerWidth - w - 16, y: window.innerHeight - h - 16 }; },
    'bottom-left': function (w, h) { return { x: 16, y: window.innerHeight - h - 16 }; },
    'top-center': function (w) { return { x: (window.innerWidth - w) / 2, y: 64 }; },
  };

  function clamp(x, y, w, h) {
    var maxX = Math.max(8, window.innerWidth - w - 8);
    var maxY = Math.max(8, window.innerHeight - h - 8);
    return { x: Math.min(Math.max(8, x), maxX), y: Math.min(Math.max(8, y), maxY) };
  }

  function applyPosition(dock) {
    var locationId = state.route && state.route.locationId;
    var prefs = loadPrefs(locationId);
    var w = dock.offsetWidth || 240;
    var h = dock.offsetHeight || 80;
    var pos;
    if (prefs.pos && typeof prefs.pos.x === 'number') {
      pos = prefs.pos;
    } else {
      var preset = DEFAULT_POSITIONS[state.settings.dockPosition] || DEFAULT_POSITIONS['top-right'];
      pos = preset(w, h);
    }
    pos = clamp(pos.x, pos.y, w, h);
    dock.style.left = pos.x + 'px';
    dock.style.top = pos.y + 'px';
  }

  function makeDraggable(dock, handle) {
    var start = null;
    handle.addEventListener('pointerdown', function (e) {
      if (e.button !== 0) return;
      if (e.target.closest('.iconbtn')) return;
      start = { x: e.clientX, y: e.clientY, left: dock.offsetLeft, top: dock.offsetTop, moved: false };
      handle.setPointerCapture(e.pointerId);
      dock.classList.add('dragging');
    });
    handle.addEventListener('pointermove', function (e) {
      if (!start) return;
      var dx = e.clientX - start.x;
      var dy = e.clientY - start.y;
      if (Math.abs(dx) + Math.abs(dy) > 3) start.moved = true;
      var pos = clamp(start.left + dx, start.top + dy, dock.offsetWidth, dock.offsetHeight);
      dock.style.left = pos.x + 'px';
      dock.style.top = pos.y + 'px';
    });
    function end(e) {
      if (!start) return;
      dock.classList.remove('dragging');
      if (start.moved) {
        savePrefs(state.route && state.route.locationId, { pos: { x: dock.offsetLeft, y: dock.offsetTop } });
      }
      start = null;
    }
    handle.addEventListener('pointerup', end);
    handle.addEventListener('pointercancel', end);
    handle.addEventListener('dblclick', function (e) {
      if (e.target.closest('.iconbtn')) return;
      savePrefs(state.route && state.route.locationId, { pos: null });
      applyPosition(dock);
    });
  }

  window.addEventListener('resize', function () {
    var el = document.getElementById(HOST_ID);
    if (el && el.shadowRoot) applyPosition(el.shadowRoot.querySelector('.dock'));
  });

  // --- rendering ---------------------------------------------------------

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function contactLine(contact) {
    if (!contact) return '';
    return contact.phone || contact.email || '';
  }

  function render() {
    var dock = dockEl();
    var s = state.settings;
    var ctx = state.context;
    var layout = loadPrefs(state.route && state.route.locationId).layout || s.dockLayout || 'row';
    var size = s.buttonSize || 'md';
    var iconOnly = layout === 'compact';

    dock.className = 'dock' + (layout === 'column' ? ' column' : '') + (state.collapsed ? ' collapsed' : '');

    var surface = state.route ? state.route.surface : 'none';
    var hasContact = ctx && ctx.contactId;
    var name = hasContact ? (ctx.contact && ctx.contact.name) || 'Unnamed contact' : 'No contact on this screen';
    var meta = hasContact ? contactLine(ctx.contact) : 'Open a contact, conversation or opportunity';

    var html = '';
    html += '<div class="head" title="Drag to move. Double-click to reset.">' + GRIP;
    html += '<div class="who' + (hasContact ? '' : ' none') + '"><span class="name">' + esc(name) + '</span>';
    if (meta) html += '<span class="meta">' + esc(meta) + '</span>';
    html += '</div>';
    if (hasContact && surface !== 'none') html += '<span class="surface ' + surface + '">' + surface + '</span>';
    html += '<span class="dot' + (state.loading ? ' loading' : state.error ? ' error' : '') + '" title="' + (state.error ? esc(state.error) : 'Connected') + '"></span>';
    html += '<button class="iconbtn layout" title="Switch layout">' + svg('folder', '') + '</button>';
    html += '<button class="iconbtn collapse" title="' + (state.collapsed ? 'Expand' : 'Collapse') + '">' + (state.collapsed ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m6 9 6 6 6-6"/></svg>' : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m18 15-6-6-6 6"/></svg>') + '</button>';
    html += '</div>';

    html += '<div class="body"></div>';
    if (state.error) html += '<div class="error"><span>' + esc(state.error) + '</span><button class="retry">Retry</button></div>';
    dock.innerHTML = html;

    var body = dock.querySelector('.body');
    if (!hasContact) {
      body.innerHTML = '<div class="empty">' + (state.loading ? 'Looking up contact' : 'Buttons appear when a contact is in view.') + '</div>';
    } else if (!ctx.buttons || !ctx.buttons.length) {
      body.innerHTML = '<div class="empty">No buttons set up for this sub-account yet.</div>';
    } else {
      renderButtons(body, ctx.buttons, { size: size, iconOnly: iconOnly, layout: layout });
    }

    dock.querySelector('.collapse').addEventListener('click', function () {
      state.collapsed = !state.collapsed;
      savePrefs(state.route && state.route.locationId, { collapsed: state.collapsed });
      render();
    });
    dock.querySelector('.layout').addEventListener('click', function () {
      var order = ['row', 'column', 'compact'];
      var next = order[(order.indexOf(layout) + 1) % order.length];
      savePrefs(state.route && state.route.locationId, { layout: next });
      render();
    });
    var retry = dock.querySelector('.retry');
    if (retry) retry.addEventListener('click', function () { state.key = null; sync(true); });

    makeDraggable(dock, dock.querySelector('.head'));
    applyPosition(dock);
  }

  function buttonEl(button, opts) {
    var el = document.createElement('button');
    var color = button.color || '#4f46e5';
    el.className = 'act' + (opts.size === 'sm' ? ' sm' : '') + (opts.iconOnly ? ' iconOnly' : '') + (button.style === 'outline' ? ' outline' : '');
    el.style.background = color;
    el.style.color = button.style === 'outline' ? color : button.textColor || '#ffffff';
    el.title = button.tooltip || button.label;
    el.innerHTML = svg(button.icon) + '<span class="label"></span>';
    el.querySelector('.label').textContent = button.label;
    return el;
  }

  function renderButtons(body, buttons, opts) {
    var groups = {};
    var order = [];
    buttons.forEach(function (b) {
      var key = b.group ? 'g:' + b.group : 'b:' + b.id;
      if (!groups[key]) {
        groups[key] = { name: b.group || null, items: [] };
        order.push(key);
      }
      groups[key].items.push(b);
    });

    order.forEach(function (key) {
      var g = groups[key];
      if (!g.name) {
        var el = buttonEl(g.items[0], opts);
        el.addEventListener('click', function () { fire(el, g.items[0]); });
        body.appendChild(el);
        return;
      }

      var wrap = document.createElement('div');
      wrap.className = 'group';
      var trigger = buttonEl({ label: g.name, icon: g.items[0].icon || 'folder', color: g.items[0].groupColor || g.items[0].color }, opts);
      trigger.insertAdjacentHTML('beforeend', CHEV);
      trigger.title = g.name + ' (' + g.items.length + ')';
      wrap.appendChild(trigger);

      trigger.addEventListener('click', function (e) {
        e.stopPropagation();
        var open = wrap.querySelector('.menu');
        closeMenus();
        if (open) return;
        var menu = document.createElement('div');
        menu.className = 'menu';
        g.items.forEach(function (b) {
          var item = buttonEl(b, { size: opts.size, iconOnly: false });
          item.addEventListener('click', function () {
            closeMenus();
            fire(trigger, b);
          });
          menu.appendChild(item);
        });
        wrap.appendChild(menu);
        var rect = menu.getBoundingClientRect();
        if (rect.bottom > window.innerHeight - 8) menu.classList.add('up');
        if (rect.right > window.innerWidth - 8) menu.classList.add('right');
      });
      body.appendChild(wrap);
    });
  }

  function closeMenus() {
    var root = document.getElementById(HOST_ID);
    if (!root || !root.shadowRoot) return;
    root.shadowRoot.querySelectorAll('.menu').forEach(function (m) { m.remove(); });
  }
  document.addEventListener('click', closeMenus, true);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenus(); });

  function toast(message, isError) {
    var root = host().shadowRoot;
    var existing = root.querySelector('.toast');
    if (existing) existing.remove();
    var el = document.createElement('div');
    el.className = 'toast' + (isError ? ' err' : '');
    el.textContent = message;
    var dock = root.querySelector('.dock');
    // Sit the toast just under (or over) the dock so the eye does not travel.
    var below = dock.offsetTop + dock.offsetHeight + 60 < window.innerHeight;
    el.style.left = dock.offsetLeft + 'px';
    el.style.top = below ? dock.offsetTop + dock.offsetHeight + 8 + 'px' : '';
    el.style.bottom = below ? '' : window.innerHeight - dock.offsetTop + 8 + 'px';
    root.appendChild(el);
    setTimeout(function () { if (el.isConnected) el.remove(); }, isError ? 8000 : 3200);
  }

  // --- actions -----------------------------------------------------------

  function fire(el, button) {
    var ctx = state.context;
    if (!ctx || !ctx.contactId) return toast('No contact selected', true);

    var who = (ctx.contact && ctx.contact.name) || 'this contact';
    if (button.confirm && !window.confirm(button.confirm.replace(/\{\{\s*contact\.name\s*\}\}/g, who))) return;

    var openUrl = (button.actions || []).find(function (a) { return a.type === 'open_url'; });
    if (openUrl && openUrl.url) {
      var url = openUrl.url
        .replace(/\{\{\s*contact\.id\s*\}\}/g, ctx.contactId)
        .replace(/\{\{\s*location\.id\s*\}\}/g, state.route.locationId);
      window.open(url, openUrl.target || '_blank', 'noopener');
    }

    var hasServer = (button.actions || []).some(function (a) { return a.type !== 'open_url'; });
    if (!hasServer) return;

    var original = el.innerHTML;
    el.disabled = true;
    el.innerHTML = SPIN + '<span class="label">Working</span>';

    api('/api/run', { locationId: state.route.locationId, contactId: ctx.contactId, buttonId: button.id })
      .then(function (result) { toast((result.message || 'Done') + ' · ' + who, !result.ok); })
      .catch(function (err) { toast(err.message || 'Something went wrong', true); })
      .finally(function () {
        el.disabled = false;
        el.innerHTML = original;
      });
  }

  // --- lifecycle ---------------------------------------------------------

  function surfaceEnabled(surface) {
    var s = state.settings.surfaces || {};
    if (surface === 'none') return false;
    return s[surface] !== false;
  }

  function sync(force) {
    var route = parseRoute(window.location.href);
    var prevLocation = state.route && state.route.locationId;
    state.route = route;

    if (!route) {
      // Not inside a sub-account at all (agency views); keep quiet.
      var el = document.getElementById(HOST_ID);
      if (el) el.remove();
      state.key = null;
      return;
    }

    if (route.locationId !== prevLocation) {
      var prefs = loadPrefs(route.locationId);
      state.collapsed = Boolean(prefs.collapsed);
    }

    var key = route.surface + ':' + route.id;
    if (!force && key === state.key && document.getElementById(HOST_ID)) return;
    state.key = key;
    state.openGroup = null;

    if (route.surface === 'none' || !surfaceEnabled(route.surface)) {
      state.context = null;
      state.error = null;
      state.loading = false;
      if (state.settings.idleMode === 'hidden') {
        var h = document.getElementById(HOST_ID);
        if (h) h.remove();
      } else {
        render();
      }
      return;
    }

    state.loading = true;
    state.error = null;
    render();

    var body = { locationId: route.locationId, surface: route.surface };
    if (route.surface === 'contact') body.contactId = route.id;
    if (route.surface === 'conversation') body.conversationId = route.id;
    if (route.surface === 'opportunity') {
      body.opportunityId = route.id;
      var hint = contactIdFromDom(state.settings.domScopes);
      if (hint) body.contactIdHint = hint;
    }

    api('/api/context', body)
      .then(function (data) {
        if (state.key !== key) return;
        state.settings = data.settings || state.settings;
        state.context = data;
        state.loading = false;
        state.error = null;
        render();
      })
      .catch(function (err) {
        if (state.key !== key) return;
        state.loading = false;
        state.error = err.message || 'Could not reach the buttons service';
        state.context = null;
        render();
      });
  }

  var debounceTimer = null;
  function scheduleSync() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(function () { sync(false); }, 200);
  }

  function boot() {
    ['pushState', 'replaceState'].forEach(function (method) {
      var original = history[method];
      history[method] = function () {
        var result = original.apply(this, arguments);
        scheduleSync();
        return result;
      };
    });
    window.addEventListener('popstate', scheduleSync);
    window.addEventListener('hashchange', scheduleSync);

    // Belt and braces: some navigations bypass the history hooks, and the
    // host can be removed when HighLevel rebuilds the page. A cheap heartbeat
    // catches both, which is the difference between "sometimes shows up" and
    // "always there".
    state.lastHref = window.location.href;
    state.heartbeat = setInterval(function () {
      if (window.location.href !== state.lastHref) {
        state.lastHref = window.location.href;
        scheduleSync();
        return;
      }
      if (state.route && state.route.surface !== 'none' && !document.getElementById(HOST_ID)) {
        state.key = null;
        scheduleSync();
      }
    }, 750);

    scheduleSync();
  }

  window.__gfContactButtons = { version: VERSION, parseRoute: parseRoute, resync: function () { state.key = null; sync(true); } };

  if (!CONFIG.disableAutostart) boot();
})();
