#!/usr/bin/env python3
"""Build projects/fightersboxing/site.html, the one-artifact-per-site shell
(.claude/skills/site-factory), from the Astro build in site/dist/.

This is a one-time port tool: the Astro project was this build's first
implementation, and this script moves its already-shipped, client-approved
real content onto the house's now-standard flat-shell system without
retyping any copy. Run it again any time the Astro source changes and the
shell needs to catch up.

    cd projects/fightersboxing/site && npx astro build
    cd ../.. && python3 build_shell.py

Requires the Astro build in site/dist/ (not committed; see site/.gitignore).
"""
import re, os, glob, json

DIST = 'site/dist'
SLUG = 'fightersboxing'
CLIENT = 'Fighters Boxing Gym'

# path -> (file, title, description) — title/description repeat what each
# Astro page already set in <title>/<meta name="description">, so nothing
# here is new copy, just where it now lives.
ROUTES = [
    '/', '/beginners-boxing-class/', '/intermediate-boxing-class/',
    '/competition-team-training/', '/youth-boxing-class/', '/boxing-classes/',
    '/coaches/', '/schedule/', '/faqs/', '/what-to-expect/', '/our-gyms/',
    '/contact-us/', '/privacy-policy/', '/terms-conditions/',
    '/boxing-blog/',
]

# The blog posts come off posts.js rather than being listed here, so adding
# a post to the site adds it to the shell without anyone remembering to
# edit this file. Their root-level slugs are the client's original
# WordPress URLs, kept so existing backlinks still resolve.
_posts_js = open('site/src/data/posts.js', encoding='utf-8').read()
_posts = json.loads(_posts_js[_posts_js.index('['):_posts_js.rindex(']') + 1])
ROUTES += ['/%s/' % p['slug'] for p in _posts]


def file_of(route):
    return 'index.html' if route == '/' else route.strip('/') + '.html'


def convert_links(html):
    """/schedule/ -> schedule.html, with data-gf-link so the switcher can
    catch it in the artifact and it's a plain, real link in production."""
    def sub(m):
        href = m.group(1)
        if href not in ROUTES:
            return m.group(0)
        return 'href="%s" data-gf-link' % file_of(href)
    return re.sub(r'href="(/[a-z0-9-]*/?)"', sub, html)


css_seen = {}
def add_css(text):
    text = re.sub(r'@font-face\{[^}]*\}', '', text)
    css_seen.setdefault(text, None)


pages_html = []
header_html = footer_html = popup_html = None

for route in ROUTES:
    path = os.path.join(DIST, route.strip('/'), 'index.html') if route != '/' else os.path.join(DIST, 'index.html')
    html = open(path, encoding='utf-8').read()

    if not css_seen:
        for css_file in glob.glob(os.path.join(DIST, '_astro', '*.css')):
            add_css(open(css_file, encoding='utf-8').read())
    for m in re.findall(r'<style>(.*?)</style>', html, re.S):
        add_css(m)

    title = re.search(r'<title>(.*?)</title>', html).group(1)
    desc_m = re.search(r'<meta name="description" content="([^"]*)"', html)
    desc = desc_m.group(1) if desc_m else ''
    body = re.search(r'<body[^>]*>(.*?)</body>', html, re.S).group(1)

    if header_html is None:
        header_html = re.search(r'(<header.*?</header>)', body, re.S).group(1)
        footer_html = re.search(r'(<footer.*?</footer>)', body, re.S).group(1)
        popup_html = re.search(r'(<div class="lead-overlay".*?)\s*<script[^>]*>', body, re.S).group(1)
        for shared_name in ('header_html', 'footer_html', 'popup_html'):
            pass  # converted together below

    main = re.search(r'<main>(.*?)</main>', body, re.S).group(1)
    main = re.sub(r'<script[^>]*>.*?</script>', '', main, flags=re.S)
    main = re.sub(r'<style>.*?</style>', '', main, flags=re.S)
    main = convert_links(main)

    fname = file_of(route)
    pid = 'home' if route == '/' else fname[:-5]
    label = re.split(r'\s*\|\s*', title)[0].strip()
    first = (route == ROUTES[0])
    esc_title = title.replace('"', '&quot;')
    esc_desc = desc.replace('"', '&quot;')
    pages_html.append(
        '<section class="gf-page" id="%s" data-title="%s" data-file="%s" '
        'data-seo-title="%s" data-seo-desc="%s"%s>\n%s\n</section>'
        % (pid, label.replace('"', '&quot;'), fname, esc_title, esc_desc,
           '' if first else ' hidden', main)
    )

header_html = convert_links(header_html)
footer_html = convert_links(footer_html)

print('pages:', len(pages_html), '| css blocks:', len(css_seen))
open('/tmp/claude-0/-home-user-growthfactor/c03fb9ba-a19a-58ce-ae64-4b9fc8f62b5a/scratchpad/_shell_parts.txt', 'w', encoding='utf-8').write(
    '\n\n=====CSS=====\n\n' + '\n'.join(css_seen.keys())
    + '\n\n=====HEADER=====\n\n' + header_html
    + '\n\n=====FOOTER=====\n\n' + footer_html
    + '\n\n=====POPUP=====\n\n' + popup_html
    + '\n\n=====PAGES=====\n\n' + '\n\n'.join(pages_html)
)
print('wrote scratch parts for inspection')

# ---------------------------------------------------------------------------
# Assembly: wrap the extracted parts in the GF-CHROME contract
# (.claude/skills/site-factory/templates/site-shell.html) and write site.html.
# ---------------------------------------------------------------------------

fluidbg_path = glob.glob(os.path.join(DIST, '_astro', 'fluid-bg.*.js'))[0]
fluidbg_js = open(fluidbg_path, encoding='utf-8').read()
_m = re.search(r'export\{(\w+) as (\w+)\}\s*;?\s*$', fluidbg_js.strip())
fluidbg_local = _m.group(1)

for h in ('header_html', 'footer_html', 'popup_html'):
    pass
header_html = header_html.replace('<header', '<header data-gf-shared', 1)
footer_html = footer_html.replace('<footer', '<footer data-gf-shared', 1)
popup_html = popup_html.replace('<div class="lead-overlay"', '<div class="lead-overlay" data-gf-shared', 1)

gfonts = "@import url('https://fonts.googleapis.com/css2?family=Archivo:wght@500;700;800;900&family=Didact+Gothic&family=Josefin+Sans:wght@700&display=swap');"
combined_css = gfonts + '\n' + '\n'.join(css_seen.keys())

CHROME_HEAD = """<!-- GF-CHROME:START -->
<style>
  .gf-chrome {
    position: sticky; top: 0; z-index: 200;
    display: flex; align-items: center; gap: 0.75rem 1rem; flex-wrap: wrap;
    padding: 0.5rem 0.9rem; background: #101014; border-bottom: 1px solid #2a2a33;
    font: 500 12px/1.4 system-ui, sans-serif; color: #9a9aa6;
  }
  .gf-chrome-brand { display: flex; align-items: center; gap: 0.5rem; }
  .gf-chrome-dot { width: 7px; height: 7px; border-radius: 50%; background: #46d17f; flex: none; }
  .gf-chrome-client { color: #e8e8ee; font-weight: 700; letter-spacing: 0.02em; }
  .gf-chrome-slug { color: #7a7a86; font-family: ui-monospace, monospace; font-size: 11px; padding: 1px 6px; border: 1px solid #2a2a33; border-radius: 4px; }
  .gf-chrome-tabs { display: flex; gap: 4px; flex-wrap: wrap; margin-left: auto; }
  .gf-tab { background: none; border: 1px solid transparent; border-radius: 5px; color: #9a9aa6; font: inherit; padding: 4px 10px; cursor: pointer; }
  .gf-tab:hover { color: #e8e8ee; border-color: #2a2a33; }
  .gf-tab[aria-current="true"] { color: #101014; background: #e8e8ee; font-weight: 700; }
  .gf-chrome-note { text-transform: uppercase; letter-spacing: 0.12em; font-size: 10px; color: #101014; background: #d8b25c; padding: 3px 8px; border-radius: 4px; font-weight: 700; }
</style>
<div class="gf-chrome">
  <span class="gf-chrome-brand">
    <span class="gf-chrome-dot"></span>
    <span class="gf-chrome-client">__CLIENT__</span>
    <span class="gf-chrome-slug">__SLUG__</span>
  </span>
  <span class="gf-chrome-note">Preview</span>
  <span class="gf-chrome-tabs" id="gf-tabs" role="tablist" aria-label="Pages"></span>
</div>
<!-- GF-CHROME:END -->"""
CHROME_HEAD = CHROME_HEAD.replace('__CLIENT__', CLIENT).replace('__SLUG__', SLUG)

CHROME_SCRIPT = """<!-- GF-CHROME:START -->
<script>
  (function () {
    var pages = [].slice.call(document.querySelectorAll('.gf-page'));
    if (!pages.length) return;
    var tabBar = document.getElementById('gf-tabs');
    var KEY = 'gf-page:' + (location.pathname || 'shell');
    function fileOf(p) { return p.getAttribute('data-file') || ''; }
    function show(id, remember) {
      var target = pages.filter(function (p) { return p.id === id; })[0] || pages[0];
      pages.forEach(function (p) { p.hidden = p !== target; });
      [].forEach.call(tabBar.children, function (t) {
        t.setAttribute('aria-current', String(t.dataset.page === target.id));
      });
      [].forEach.call(document.querySelectorAll('[data-gf-link]'), function (a) {
        if (a.getAttribute('href') === fileOf(target)) a.setAttribute('aria-current', 'page');
        else a.removeAttribute('aria-current');
      });
      if (remember) { try { localStorage.setItem(KEY, target.id); } catch (e) {} }
      window.scrollTo(0, 0);
    }
    pages.forEach(function (p) {
      var b = document.createElement('button');
      b.className = 'gf-tab'; b.type = 'button'; b.dataset.page = p.id;
      b.textContent = p.getAttribute('data-title') || p.id;
      b.addEventListener('click', function () { history.replaceState(null, '', '#' + p.id); show(p.id, true); });
      tabBar.appendChild(b);
    });
    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[data-gf-link]');
      if (!a) return;
      var href = a.getAttribute('href');
      var hit = pages.filter(function (p) { return fileOf(p) === href; })[0];
      if (!hit) return;
      e.preventDefault();
      history.replaceState(null, '', '#' + hit.id);
      show(hit.id, true);
    });
    window.addEventListener('hashchange', function () { show(location.hash.slice(1), true); });
    var start = location.hash.slice(1);
    if (!start) { try { start = localStorage.getItem(KEY) || ''; } catch (e) { start = ''; } }
    show(start || pages[0].id, false);
  })();
</script>
<!-- GF-CHROME:END -->"""

# Site behaviour: ships to every production page. Reused close to verbatim
# from the Astro components/pages it came from (Header, LeadPopup, Base,
# ClassCalendar, FAQ search, the homepage card-stack); fluid-bg is the one
# piece rewritten, because this shell keeps every page's markup in the DOM
# at once (hidden, not removed), and mounting a WebGL context per
# .fluid-host across all 14 pages at load exceeds a browser's simultaneous
# WebGL context limit. A MutationObserver on each page's `hidden` attribute
# mounts a page's canvases the first time it is shown and disposes them
# when it is hidden again; in production there is only one page and its
# `hidden` never changes, so this degrades to "mount once at load", exactly
# the behaviour the Astro build already had.
SITE_SCRIPT = """<script type="module">
__FLUIDBG_JS__
const mountFluidBg = __FLUIDBG_LOCAL__;

const fluidState = new WeakMap();
function mountFluidIn(page) {
  page.querySelectorAll('.fluid-host').forEach((host) => {
    if (fluidState.has(host)) return;
    const opts = {};
    const o = Number(host.dataset.fluidOpacity);
    const p = Number(host.dataset.fluidPixel);
    if (o) opts.opacity = o;
    if (p) opts.pixelSize = p;
    fluidState.set(host, mountFluidBg(host, opts));
  });
}
function disposeFluidIn(page) {
  page.querySelectorAll('.fluid-host').forEach((host) => {
    const dispose = fluidState.get(host);
    if (dispose) { dispose(); fluidState.delete(host); }
  });
}
if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const start = () => {
    document.querySelectorAll('.gf-page').forEach((page) => {
      if (!page.hidden) mountFluidIn(page);
    });
    new MutationObserver((records) => {
      records.forEach((r) => {
        const page = r.target;
        if (!page.classList.contains('gf-page')) return;
        if (page.hidden) disposeFluidIn(page);
        else mountFluidIn(page);
      });
    }).observe(document.getElementById('gf-pages') || document.body, {
      attributes: true, attributeFilter: ['hidden'], subtree: true,
    });
  };
  if ('requestIdleCallback' in window) requestIdleCallback(start, { timeout: 2500 });
  else setTimeout(start, 800);
}
</script>

<script>
  // Reveal on scroll (site/src/layouts/Base.astro). IntersectionObserver
  // naturally handles pages hidden at load: a hidden page's .reveal
  // elements have no box, so they simply never fire until the page is
  // shown and actually scrolled to.
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    }
  }, { threshold: 0.15 });
  document.querySelectorAll('.reveal').forEach((el) => io.observe(el));
</script>

<script>
  // Mobile menu (site/src/components/Header.astro).
  const toggle = document.querySelector('.menu-toggle');
  const menu = document.getElementById('mobile-menu');
  toggle?.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!open));
    if (menu) menu.hidden = open;
  });
</script>

<script>
  // Lead popup (site/src/components/LeadPopup.astro).
  const overlay = document.getElementById('lead-popup');
  const iframe = overlay?.querySelector('iframe');
  const closeBtn = overlay?.querySelector('.lead-close');
  let embedLoaded = false, lastFocus = null;
  function openLead() {
    if (!overlay || !iframe) return;
    if (!iframe.src) iframe.src = iframe.dataset.src || '';
    if (!embedLoaded && iframe.dataset.embed) {
      const s = document.createElement('script');
      s.src = iframe.dataset.embed;
      document.body.appendChild(s);
      embedLoaded = true;
    }
    lastFocus = document.activeElement;
    overlay.hidden = false;
    document.body.style.overflow = 'hidden';
    closeBtn?.focus();
  }
  function closeLead() {
    if (!overlay) return;
    overlay.hidden = true;
    document.body.style.overflow = '';
    if (lastFocus instanceof HTMLElement) lastFocus.focus();
  }
  document.querySelectorAll('.js-open-lead').forEach((el) => el.addEventListener('click', openLead));
  closeBtn?.addEventListener('click', closeLead);
  overlay?.addEventListener('click', (e) => { if (e.target === overlay) closeLead(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && overlay && !overlay.hidden) closeLead(); });
</script>

<script>
  // Schedule filter chips (site/src/components/ClassCalendar.astro).
  const cal = document.querySelector('.cal');
  if (cal) {
    const chips = cal.querySelectorAll('.chip');
    const apply = (filter) => {
      chips.forEach((c) => {
        const on = c.dataset.filter === filter;
        c.classList.toggle('is-on', on);
        c.setAttribute('aria-pressed', String(on));
      });
      const shownPerRow = new Map();
      cal.querySelectorAll('.class-chip').forEach((chip) => {
        const row = chip.closest('.m-cell')?.dataset.row;
        const match = filter === 'all' || (chip.dataset.programs || '').split(' ').includes(filter);
        chip.hidden = !match;
        if (match && row) shownPerRow.set(row, (shownPerRow.get(row) || 0) + 1);
      });
      cal.querySelectorAll('[data-row]').forEach((el) => { el.hidden = !shownPerRow.get(el.dataset.row); });
    };
    chips.forEach((c) => c.addEventListener('click', () => apply(c.dataset.filter)));
  }
</script>

<script>
  // FAQ search (site/src/pages/faqs.astro).
  const faqInput = document.getElementById('faq-q');
  if (faqInput) {
    const count = document.getElementById('faq-count');
    const none = document.getElementById('faq-none');
    const items = [...document.querySelectorAll('.qa')];
    const groups = [...document.querySelectorAll('[data-group]')];
    faqInput.addEventListener('input', () => {
      const term = faqInput.value.trim().toLowerCase();
      let shown = 0;
      items.forEach((item) => {
        const match = !term || (item.dataset.q || '').includes(term);
        item.hidden = !match;
        item.open = Boolean(term) && match;
        if (match) shown += 1;
      });
      groups.forEach((group) => { group.hidden = ![...group.querySelectorAll('.qa')].some((q) => !q.hidden); });
      if (count) { count.hidden = !term; count.textContent = shown === 1 ? '1 question matches' : `${shown} questions match`; }
      if (none) none.hidden = shown > 0;
    });
  }
</script>

<script>
  // Card-stack slideshow (site/src/pages/index.astro).
  const stack = document.querySelector('.stack');
  if (stack) {
    const cards = Array.from(stack.querySelectorAll('.stack-card'));
    const dots = Array.from(stack.querySelectorAll('.dot'));
    const n = cards.length;
    const interval = Number(stack.getAttribute('data-interval')) || 2800;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let active = 0, hovering = false, timer;
    const SPREAD = 16, LIFT = 22, DEPTH = 140;
    function offsetOf(i) { let off = i - active; if (off > n / 2) off -= n; if (off < -n / 2) off += n; return off; }
    function layout() {
      const w = cards[0].offsetWidth;
      const spacing = Math.max(10, Math.round(w * 0.52));
      cards.forEach((card, i) => {
        const off = offsetOf(i), abs = Math.abs(off), isActive = off === 0;
        const x = off * spacing, y = abs * 10 + (isActive ? -LIFT : 0), z = -abs * DEPTH;
        const scale = isActive ? 1.03 : 0.94, rotZ = off * SPREAD, rotX = isActive ? 0 : 12;
        card.style.transform = `translateX(${x}px) translateY(${y}px) translateZ(${z}px) rotateZ(${rotZ}deg) rotateX(${rotX}deg) scale(${scale})`;
        card.style.zIndex = String(100 - abs);
        card.style.opacity = abs > 3 ? '0' : '1';
        card.classList.toggle('is-active', isActive);
        card.setAttribute('tabindex', isActive ? '0' : '-1');
      });
      dots.forEach((d, i) => d.classList.toggle('on', i === active));
    }
    function go(i) { active = ((i % n) + n) % n; layout(); }
    function startAuto() {
      if (reduced) return;
      timer = window.setInterval(() => { if (!hovering) go(active + 1); }, Math.max(700, interval));
    }
    cards.forEach((card, i) => card.addEventListener('click', (e) => { if (i !== active) { e.preventDefault(); go(i); } }));
    dots.forEach((d, i) => d.addEventListener('click', () => go(i)));
    stack.addEventListener('mouseenter', () => (hovering = true));
    stack.addEventListener('mouseleave', () => (hovering = false));
    stack.addEventListener('keydown', (e) => { if (e.key === 'ArrowLeft') go(active - 1); if (e.key === 'ArrowRight') go(active + 1); });
    let startX = null;
    stack.addEventListener('pointerdown', (e) => (startX = e.clientX));
    stack.addEventListener('pointerup', (e) => {
      if (startX === null) return;
      const dx = e.clientX - startX; startX = null;
      if (Math.abs(dx) > 60) go(active + (dx < 0 ? 1 : -1));
    });
    window.addEventListener('resize', layout);
    layout();
    startAuto();
  }
</script>"""
# fluidbg_js is a minified JS bundle and near-certainly contains literal '%'
# (e.g. inside string/number literals), so this is a plain substring
# replace, not %-formatting, same reasoning as CHROME_HEAD above.
SITE_SCRIPT = SITE_SCRIPT.replace('__FLUIDBG_JS__', fluidbg_js).replace('__FLUIDBG_LOCAL__', fluidbg_local)

output = """<title>__CLIENT__ | Site Preview</title>

<style>
__CSS__
</style>

__CHROME_HEAD__

__HEADER__
<main id="gf-pages">
__PAGES__
</main>
__FOOTER__
__POPUP__

__CHROME_SCRIPT__
__SITE_SCRIPT__
"""
# combined_css (real client CSS) and the header/footer/page HTML also
# contain literal '%' (percentages, etc.), so this whole assembly uses
# token replace rather than %-formatting for the same reason as above.
output = (
    output.replace('__CLIENT__', CLIENT)
    .replace('__CSS__', combined_css)
    .replace('__CHROME_HEAD__', CHROME_HEAD)
    .replace('__HEADER__', header_html)
    .replace('__PAGES__', '\n\n'.join(pages_html))
    .replace('__FOOTER__', footer_html)
    .replace('__POPUP__', popup_html)
    .replace('__CHROME_SCRIPT__', CHROME_SCRIPT)
    .replace('__SITE_SCRIPT__', SITE_SCRIPT)
)

with open('site.html', 'w', encoding='utf-8') as f:
    f.write(output)
print('wrote site.html:', len(output) // 1024, 'KB')
