# -*- coding: utf-8 -*-
"""Fold a built static site into one artifact: every page, one URL.

The built site in `projects/<slug>/site/dist` (or any directory of real HTML) is
the source of truth. This turns it into the single reviewable artifact the
pipeline requires, without touching the build:

  - every page becomes a `<section class="gf-page">`, switched by hash routing
  - the shared header and footer are hoisted out of the pages and written once
  - stylesheets, images and video are inlined, so the artifact stands alone
  - local @font-face rules are dropped for the Google Fonts stylesheet, which
    is on the artifact host's allowlist while /_astro/*.woff2 is not
  - identical scripts across pages run once, and page scripts keep module scope

Run it after the site build, then publish the output to the project's artifact
URL. Nothing here edits the build, so the artifact can always be regenerated.

  python3 bundle_artifact.py --root projects/<slug>/site/dist \
      --client "Fighters Boxing Gym" --out /tmp/<slug>.html \
      --fonts "Archivo:wght@500;700;800;900" --fonts "Didact+Gothic"

The artifact's name is not a free text field. It is the client name and the
word Site, and this script builds it that way so it cannot drift into
"Preview", "Full Site Preview", "v2" or a dated variant again.
"""
import argparse, base64, hashlib, os, posixpath, re, sys

MIME = {".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png",
        ".webp": "image/webp", ".gif": "image/gif", ".svg": "image/svg+xml",
        ".mp4": "video/mp4", ".webm": "video/webm", ".woff2": "font/woff2"}

# Any asset reference, however the build writes it: /img/hero.jpg from an
# Astro build, assets/hero.jpg or ../assets/hero.jpg from a flat one.
ASSET_EXT = "jpg|jpeg|png|webp|gif|svg|avif|mp4|webm|ogg"
# Kept to URL characters on purpose: minified CSS puts `content:""` a few
# bytes before `url(/img/grain.png)`, and a looser class swallows the gap.
ASSET_RE = re.compile(
    r'(?<=["\'(])((?!data:|https?:|//)[\w./~+%%-]+\.(?:%s))' % ASSET_EXT, re.I)
ASTRO_MODULE_RE = re.compile(
    r'<script[^>]*type="module"[^>]*src="([^"]+)"[^>]*>\s*</script>')


def read(path):
    with open(path, encoding="utf-8") as fh:
        return fh.read()


class Assets:
    """Encodes each file once; reports anything referenced but missing."""

    def __init__(self, root):
        self.root, self.cache, self.missing = root, {}, set()

    def resolve(self, url, base):
        """Site-relative path for a reference, from wherever it was written."""
        clean = url.split("?")[0].split("#")[0]
        if clean.startswith("/"):
            return clean.lstrip("/")
        return posixpath.normpath(posixpath.join(base, clean)).lstrip("/")

    def uri(self, url, base):
        key = self.resolve(url, base)
        if key not in self.cache:
            path = os.path.join(self.root, key)
            if not os.path.isfile(path):
                self.missing.add(key)
                self.cache[key] = url
            else:
                ext = os.path.splitext(key)[1].lower()
                with open(path, "rb") as fh:
                    blob = fh.read()
                self.cache[key] = "data:%s;base64,%s" % (
                    MIME.get(ext, "application/octet-stream"),
                    base64.b64encode(blob).decode())
        return self.cache[key]

    def inline(self, text, base=""):
        """base: the directory references in `text` are written relative to."""
        return ASSET_RE.sub(lambda m: self.uri(m.group(1), base), text)


def route_of(rel):
    """dist-relative path -> the URL the built site serves it at."""
    parts = rel.replace(os.sep, "/").split("/")
    if parts[-1] == "index.html":
        parts = parts[:-1]
    else:
        parts[-1] = re.sub(r"\.html$", "", parts[-1])
    return "/" + "/".join(p for p in parts if p) + ("/" if parts else "")


def link_rewriter(routes, alias):
    """Point the site's own links at hash routes; leave everything else alone.

    The production HTML in dist keeps its real hrefs — only the artifact copy
    is rewritten, so review navigation works without a dual-mode attribute on
    every link in the source.
    """
    def rewrite(text, base=""):
        def sub(match):
            href = match.group(1)
            for form in (href, posixpath.normpath(
                    posixpath.join(base, href)).lstrip("/")):
                if form in routes:
                    return 'href="#%s"' % form
                if form in alias:
                    return 'href="#%s"' % alias[form]
            return match.group(0)

        return re.sub(r'href="((?!data:|https?:|//|#|mailto:|tel:)[^"]+)"',
                      sub, text)

    return rewrite


def extract(tag, html):
    """Pull one top-level element out, returning (element, remainder)."""
    m = re.search(r"<%s\b[^>]*>" % tag, html)
    if not m:
        return None, html
    depth, pos = 0, m.start()
    for tok in re.finditer(r"</?%s\b[^>]*>" % tag, html[m.start():]):
        depth += -1 if tok.group(0).startswith("</") else 1
        if depth == 0:
            pos = m.start() + tok.end()
            break
    return html[m.start():pos], html[:m.start()] + html[pos:]


CHROME = """<!-- GF-CHROME:START -->
<style>
  #gf-chrome { position: fixed; z-index: 9999; bottom: 0; left: 0; right: 0;
    display: flex; flex-wrap: wrap; gap: 4px; align-items: center;
    padding: 8px 12px; background: #17171a; border-top: 1px solid #34343a;
    font: 500 11px/1 ui-sans-serif, system-ui, sans-serif; }
  #gf-chrome b { color: #8d8d99; font-weight: 600; letter-spacing: .08em;
    text-transform: uppercase; margin-right: 6px; }
  #gf-chrome a { color: #cfcfd8; text-decoration: none; padding: 5px 9px;
    border-radius: 5px; background: #22222a; }
  #gf-chrome a:hover { background: #33333d; color: #fff; }
  #gf-chrome a[aria-current="page"] { background: #e5e5ea; color: #17171a; }
  body { padding-bottom: 64px; }
  @media print { #gf-chrome { display: none; } body { padding-bottom: 0; } }
</style>
<nav id="gf-chrome" aria-label="Page switcher"><b>Preview</b>%s</nav>
<!-- GF-CHROME:END -->"""

ROUTER = """
var PAGES = %s, ALIAS = %s;
function resolve(hash) {
  var want = (hash || '').replace(/^#/, '');
  if (!want) return PAGES[0];
  if (PAGES.indexOf(want) > -1) return want;
  if (ALIAS[want]) return ALIAS[want];
  if (ALIAS[want.replace(/\\/$/, '')]) return ALIAS[want.replace(/\\/$/, '')];
  return null;
}
function fluid(scope) {
  if (!window.__gfFluid) return;
  scope.querySelectorAll('.fluid-host').forEach(function (host) {
    if (host.dataset.gfFluidOn) return;
    host.dataset.gfFluidOn = '1';
    var opts = {}, o = Number(host.dataset.fluidOpacity),
        p = Number(host.dataset.fluidPixel);
    if (o) { opts.opacity = o; }
    if (p) { opts.pixelSize = p; }
    window.__gfFluid(host, opts);
  });
}
function show(route) {
  var target = resolve(route) || PAGES[0];
  document.querySelectorAll('.gf-page').forEach(function (sec) {
    sec.hidden = sec.dataset.route !== target;
  });
  document.querySelectorAll('#gf-chrome a').forEach(function (a) {
    if (a.dataset.route === target) { a.setAttribute('aria-current', 'page'); }
    else { a.removeAttribute('aria-current'); }
  });
  var live = document.querySelector('.gf-page[data-route="' + target + '"]');
  if (live) {
    document.title = live.dataset.title || document.title;
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      var run = function () { fluid(live); };
      'requestIdleCallback' in window ? requestIdleCallback(run, {timeout: 2000})
                                      : setTimeout(run, 300);
    }
  }
  window.scrollTo(0, 0);
}
// Links built at runtime (schedule chips, for one) still carry real paths.
document.addEventListener('click', function (event) {
  var link = event.target.closest && event.target.closest('a[href]');
  if (!link || event.defaultPrevented || event.metaKey || event.ctrlKey) return;
  var href = link.getAttribute('href');
  if (!href || href.charAt(0) === '#') return;
  var route = PAGES.indexOf(href) > -1 ? href : ALIAS[href];
  if (!route) return;
  event.preventDefault();
  location.hash = route;
});
window.addEventListener('hashchange', function () { show(location.hash); });
show(location.hash);
"""


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--root", required=True, help="built site directory")
    ap.add_argument("--out", required=True)
    ap.add_argument("--client", required=True,
                    help="client name exactly as in sites.csv; the artifact is "
                         "named '<client> Site'")
    ap.add_argument("--fonts", action="append", default=[],
                    help="Google Fonts family spec, repeatable")
    ap.add_argument("--order", default="",
                    help="comma-separated routes to put first, home first")
    args = ap.parse_args()

    # One name shape for every site, enforced here rather than remembered.
    client = " ".join(args.client.split())
    if re.search(r"[-:|—]|\b(preview|full site|final|v\d)\b", client, re.I):
        sys.exit("--client is the client name only: %r. The artifact is named\n"
                 "'<client> Site', with no dash, colon, stage word or version."
                 % args.client)
    artifact_title = "%s Site" % client

    root = os.path.abspath(args.root)
    assets = Assets(root)

    pages = []
    for dirpath, _, files in os.walk(root):
        for name in sorted(files):
            if name.endswith(".html"):
                rel = os.path.relpath(os.path.join(dirpath, name), root)
                rel = rel.replace(os.sep, "/")
                pages.append((route_of(rel), rel))

    preferred = [r for r in args.order.split(",") if r]
    pages.sort(key=lambda p: (preferred.index(p[0]) if p[0] in preferred
                              else len(preferred), p[0]))
    if not pages:
        sys.exit("no HTML found under %s" % root)

    # Routes and their aliases have to exist before any page is rewritten,
    # because rewriting a link means recognising where it points.
    routes = [route for route, _ in pages]
    alias = {}
    for route, rel in pages:
        for form in (route.rstrip("/"), route.strip("/"),
                     route.strip("/") + ".html", rel):
            if form and form not in routes:
                alias[form] = route
    alias["index.html"] = routes[0]
    alias["/"] = routes[0]
    relink = link_rewriter(routes, alias)

    css_blocks, scripts, sections = [], [], []
    seen_css, seen_script = set(), set()
    shared = {"header": None, "footer": None}
    module_files = []

    for route, rel in pages:
        html = read(os.path.join(root, rel))
        base = posixpath.dirname(rel)
        title = re.search(r"<title>(.*?)</title>", html, re.S)
        title = re.sub(r"\s+", " ", title.group(1)).strip() if title else route

        # stylesheets: linked files first, then the page's own <style> blocks
        css = []
        for href in re.findall(
                r'<link[^>]+rel="stylesheet"[^>]+href="([^"]+)"', html):
            path = os.path.join(root, assets.resolve(href, base))
            if os.path.isfile(path):
                css.append((read(path), posixpath.dirname(
                    assets.resolve(href, base))))
        body = html[html.index("<body"):]
        body = body[body.index(">") + 1:body.rindex("</body>")]
        css += [(block, base) for block in re.findall(
            r"<style[^>]*>(.*?)</style>", html[:html.index("<body")], re.S)]
        for block, css_base in css:
            key = hashlib.md5(block.encode()).hexdigest()
            if key not in seen_css:
                seen_css.add(key)
                css_blocks.append((block, css_base))

        # module bundles referenced by src are re-driven by the router instead
        for src in ASTRO_MODULE_RE.findall(body):
            if src not in module_files:
                module_files.append(assets.resolve(src, base))
        body = ASTRO_MODULE_RE.sub("", body)

        for attrs, code in re.findall(r"<script([^>]*)>(.*?)</script>", body, re.S):
            if "ld+json" in attrs or not code.strip():
                continue
            key = hashlib.md5((attrs + code).encode()).hexdigest()
            if key not in seen_script:
                seen_script.add(key)
                kind = "module" if 'type="module"' in attrs else "classic"
                scripts.append((kind, code))
        body = re.sub(r"<script(?![^>]*ld\+json)[^>]*>.*?</script>", "", body,
                      flags=re.S)

        # Normalise before comparing chrome: a flat build writes the same
        # header as assets/logo.png on one page and ../assets/logo.png on
        # another, and those are the same header.
        body = relink(assets.inline(body, base), base)

        for tag in ("header", "footer"):
            element, body = extract(tag, body)
            if element is None:
                continue
            if shared[tag] is None:
                shared[tag] = element
            elif shared[tag] != element:
                sys.exit("%s differs on %s: hoisting needs one shared %s"
                         % (tag, route, tag))

        sections.append((route, title, body))

    # Walk the /_astro module graph from the page entry points. The page
    # scripts only start the fluid background; the router restarts it per
    # route, so all this needs from the graph is the leaf that exports it.
    fluid, queue, walked = "", list(module_files), set()
    while queue:
        src = queue.pop(0)
        path = os.path.join(root, src.lstrip("/"))
        if src in walked or not os.path.isfile(path):
            continue
        walked.add(src)
        code = read(path)
        for dep in re.findall(r'from"([^"]+)"', code):
            queue.append(posixpath.normpath(
                posixpath.join(posixpath.dirname(src), dep)).lstrip("/"))
        exported = re.search(r"export\{(\w+) as m\};?", code)
        if exported:
            fluid = code[:exported.start()] + "window.__gfFluid=%s;" % exported.group(1)

    style = "\n".join(assets.inline(block, css_base)
                      for block, css_base in css_blocks)
    style = re.sub(r"@font-face\s*\{[^}]*\}", "", style)  # local woff2 is blocked

    tabs = "".join(
        '<a href="#%s" data-route="%s">%s</a>'
        % (route, route, title.split("|")[0].strip())
        for route, title, _ in sections)

    parts = ["<title>%s</title>" % artifact_title]
    if args.fonts:
        parts.append('<link rel="stylesheet" href="https://fonts.googleapis.com/'
                     'css2?%s&display=swap">'
                     % "&".join("family=" + f for f in args.fonts))
    parts.append("<style>\n%s\n.gf-page[hidden]{display:none!important}\n</style>"
                 % style)
    parts.append(CHROME % tabs)
    if shared["header"]:
        parts.append(shared["header"])
    parts.append('<main id="gf-pages">')
    for route, title, body in sections:
        parts.append(
            '<section class="gf-page" data-route="%s" data-title="%s"%s>\n%s\n</section>'
            % (route, title.replace('"', "&quot;"),
               "" if route == routes[0] else " hidden", body))
    parts.append("</main>")
    if shared["footer"]:
        parts.append(shared["footer"])

    if fluid:
        parts.append("<script>\n%s\n</script>" % fluid)
    for kind, code in scripts:
        parts.append("<script%s>\n%s\n</script>"
                     % (' type="module"' if kind == "module" else "", code))
    parts.append("<script>\n%s\n</script>"
                 % (ROUTER % (repr(routes).replace("'", '"'),
                              repr(alias).replace("'", '"'))))

    out = "\n".join(parts)
    with open(args.out, "w", encoding="utf-8") as fh:
        fh.write(out)

    print("artifact name : %s" % artifact_title)
    print("gallery text  : Every page of the %s build in one artifact: "
          "%d pages." % (client, len(sections)))
    print("pages bundled : %d" % len(sections))
    print("shared chrome : %s" % (", ".join(k for k, v in shared.items() if v)
                                  or "none hoisted"))
    print("scripts kept  : %d unique%s"
          % (len(scripts), " + fluid background" if fluid else ""))
    print("bundle size   : %.2f MB of the 16 MB ceiling"
          % (len(out.encode()) / 1048576))
    if assets.missing:
        print("MISSING assets: %s" % ", ".join(sorted(assets.missing)))
    for route, title, _ in sections:
        print("  %-30s %s" % (route, title))


if __name__ == "__main__":
    main()
