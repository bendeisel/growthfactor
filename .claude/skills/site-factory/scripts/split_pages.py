#!/usr/bin/env python3
"""Split a Growth Factor multi-page site shell into production HTML.

The shell is one artifact holding every page as <section class="gf-page">.
This emits one standalone HTML file per page: preview chrome stripped, shared
header/footer/dialog copied into each page, per-page <title> and meta
description, plus robots.txt and sitemap.xml.

    python3 split_pages.py projects/<slug>/site.html -o build/ \
        --base https://clientdomain.com

Stdlib only, by design: it has to run anywhere without an install step.
"""

import argparse
import html.parser
import os
import re
import sys
from datetime import date

CHROME_START = "<!-- GF-CHROME:START -->"
CHROME_END = "<!-- GF-CHROME:END -->"
VOID = {
    "area", "base", "br", "col", "embed", "hr", "img", "input", "link",
    "meta", "param", "source", "track", "wbr",
}


def strip_chrome(markup):
    """Remove every GF-CHROME block. Unbalanced markers are a hard error:
    silently shipping the preview switcher to a client's live site, or
    silently dropping the rest of the page, are both worse than stopping."""
    out, rest, removed = [], markup, 0
    while True:
        i = rest.find(CHROME_START)
        if i == -1:
            out.append(rest)
            break
        j = rest.find(CHROME_END, i)
        if j == -1:
            raise SystemExit(
                "error: %s at offset %d has no matching %s"
                % (CHROME_START, i, CHROME_END)
            )
        out.append(rest[:i])
        rest = rest[j + len(CHROME_END):]
        removed += 1
    if rest.find(CHROME_END) != -1:
        raise SystemExit("error: stray %s with no opening marker" % CHROME_END)
    return "".join(out), removed


class Regions(html.parser.HTMLParser):
    """Records byte offsets of top-level elements of interest.

    HTMLParser reports line/column, so we keep a line-offset table to convert
    positions into absolute offsets and slice the original markup. Slicing the
    source keeps the author's own formatting in the output rather than
    re-serializing it.
    """

    def __init__(self, markup):
        super().__init__(convert_charrefs=False)
        self.markup = markup
        self.line_starts = [0]
        for m in re.finditer(r"\n", markup):
            self.line_starts.append(m.end())
        self.depth = 0
        self.open_stack = []
        self.found = []          # (kind, start, end, attrs)
        self._pending = None

    def _pos(self):
        line, col = self.getpos()
        return self.line_starts[line - 1] + col

    def handle_starttag(self, tag, attrs):
        start = self._pos()
        a = dict(attrs)
        if tag not in VOID:
            self.open_stack.append((tag, start, a, self.depth))
            self.depth += 1
        if self.depth == 0 and tag in VOID:
            self._maybe_record(tag, start, self._end_of_tag(start), a)

    def handle_startendtag(self, tag, attrs):
        start = self._pos()
        if self.depth == 0:
            self._maybe_record(tag, start, self._end_of_tag(start), dict(attrs))

    def handle_endtag(self, tag):
        for idx in range(len(self.open_stack) - 1, -1, -1):
            if self.open_stack[idx][0] == tag:
                t, start, a, d = self.open_stack.pop(idx)
                del self.open_stack[idx:]
                self.depth = d
                end = self._end_of_tag(self._pos())
                if d == 0:
                    self._maybe_record(t, start, end, a)
                return

    def _end_of_tag(self, start):
        gt = self.markup.find(">", start)
        return len(self.markup) if gt == -1 else gt + 1

    def _maybe_record(self, tag, start, end, attrs):
        kind = None
        if tag in ("style", "script", "title"):
            kind = tag
        elif "data-gf-shared" in attrs:
            kind = "shared"
        elif tag == "main":
            kind = "main"
        if kind:
            self.found.append((kind, start, end, attrs))


class Pages(html.parser.HTMLParser):
    """Finds the .gf-page sections inside <main>, at any nesting depth."""

    def __init__(self, markup):
        super().__init__(convert_charrefs=False)
        self.markup = markup
        self.line_starts = [0]
        for m in re.finditer(r"\n", markup):
            self.line_starts.append(m.end())
        self.stack = []
        self.pages = []
        self.depth_in_page = None

    def _pos(self):
        line, col = self.getpos()
        return self.line_starts[line - 1] + col

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag in VOID:
            return
        is_page = "gf-page" in (a.get("class") or "").split()
        self.stack.append([tag, self._pos(), a, is_page])

    def handle_endtag(self, tag):
        for idx in range(len(self.stack) - 1, -1, -1):
            if self.stack[idx][0] == tag:
                t, start, a, is_page = self.stack[idx]
                del self.stack[idx:]
                if is_page:
                    gt = self.markup.find(">", self._pos())
                    end = len(self.markup) if gt == -1 else gt + 1
                    self.pages.append((a, self.markup[start:end]))
                return


def unhide(section_html):
    """Drop the `hidden` attribute from a section's own start tag."""
    gt = section_html.find(">")
    head, tail = section_html[:gt + 1], section_html[gt + 1:]
    head = re.sub(r'\shidden(=(""|\'\'|"[^"]*"|\'[^\']*\'))?(?=[\s/>])', "", head)
    return head + tail


def esc(s):
    return (s.replace("&", "&amp;").replace("<", "&lt;")
             .replace(">", "&gt;").replace('"', "&quot;"))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("shell", help="the multi-page shell HTML")
    ap.add_argument("-o", "--out", default="build", help="output directory")
    ap.add_argument("--base", default="", help="site base URL, for canonical + sitemap")
    ap.add_argument("--site-name", default="", help="overrides the name parsed from <title>")
    ap.add_argument("--noindex", action="store_true",
                    help="add robots noindex + a disallow-all robots.txt (previews)")
    ap.add_argument("--lang", default="en")
    args = ap.parse_args()

    raw = open(args.shell, encoding="utf-8").read()
    body, chrome_blocks = strip_chrome(raw)

    r = Regions(body)
    r.feed(body)

    styles, scripts, shared_pre, shared_post = [], [], [], []
    main_span = next((f for f in r.found if f[0] == "main"), None)
    if not main_span:
        raise SystemExit("error: no <main> found; pages must live inside <main>")
    main_start = main_span[1]

    title_text = ""
    for kind, start, end, attrs in r.found:
        chunk = body[start:end]
        if kind == "style":
            styles.append(chunk)
        elif kind == "script":
            scripts.append(chunk)
        elif kind == "title":
            title_text = re.sub(r"<[^>]+>", "", chunk).strip()
        elif kind == "shared":
            (shared_pre if start < main_start else shared_post).append(chunk)

    site_name = args.site_name or re.split(r"[—|]", title_text)[0].strip() or "Site"

    p = Pages(body[main_span[1]:main_span[2]])
    p.feed(body[main_span[1]:main_span[2]])
    pages = p.pages
    if not pages:
        raise SystemExit("error: no <section class=\"gf-page\"> found inside <main>")

    os.makedirs(args.out, exist_ok=True)
    base = args.base.rstrip("/")
    written, warnings = [], []
    todos = len(re.findall(r"GF-TODO", raw))

    seen_files = {}
    for attrs, section in pages:
        fname = attrs.get("data-file")
        pid = attrs.get("id") or "?"
        if not fname:
            raise SystemExit("error: page id=%r has no data-file" % pid)
        if fname in seen_files:
            raise SystemExit(
                "error: two pages both claim data-file=%r (ids %s and %s)"
                % (fname, seen_files[fname], pid)
            )
        seen_files[fname] = pid

        label = attrs.get("data-title") or pid
        seo_title = attrs.get("data-seo-title") or (
            site_name if fname == "index.html" else "%s | %s" % (label, site_name)
        )
        desc = attrs.get("data-seo-desc", "")
        if not desc:
            warnings.append("%s has no data-seo-desc (per-page meta description)" % fname)

        head = [
            "<!doctype html>",
            '<html lang="%s">' % esc(args.lang),
            "<head>",
            '<meta charset="utf-8">',
            '<meta name="viewport" content="width=device-width, initial-scale=1">',
            "<title>%s</title>" % esc(seo_title),
        ]
        if desc:
            head.append('<meta name="description" content="%s">' % esc(desc))
        if args.noindex:
            head.append('<meta name="robots" content="noindex,nofollow">')
        if base:
            head.append('<link rel="canonical" href="%s/%s">'
                        % (base, "" if fname == "index.html" else fname))
        head.extend(styles)
        head.append("</head>")
        head.append("<body>")

        doc = "\n".join(head) + "\n"
        doc += "\n".join(shared_pre) + "\n"
        doc += "<main>\n%s\n</main>\n" % unhide(section)
        doc += "\n".join(shared_post) + "\n"
        doc += "\n".join(scripts) + "\n</body>\n</html>\n"

        with open(os.path.join(args.out, fname), "w", encoding="utf-8") as fh:
            fh.write(doc)
        written.append(fname)

    if args.noindex:
        with open(os.path.join(args.out, "robots.txt"), "w", encoding="utf-8") as fh:
            fh.write("User-agent: *\nDisallow: /\n")
    elif base:
        with open(os.path.join(args.out, "robots.txt"), "w", encoding="utf-8") as fh:
            fh.write("User-agent: *\nAllow: /\nSitemap: %s/sitemap.xml\n" % base)

    if base and not args.noindex:
        today = date.today().isoformat()
        urls = "\n".join(
            "  <url><loc>%s/%s</loc><lastmod>%s</lastmod></url>"
            % (base, "" if f == "index.html" else f, today)
            for f in written
        )
        with open(os.path.join(args.out, "sitemap.xml"), "w", encoding="utf-8") as fh:
            fh.write('<?xml version="1.0" encoding="UTF-8"?>\n'
                     '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
                     "%s\n</urlset>\n" % urls)
    elif not base:
        warnings.append("no --base: skipped sitemap.xml and canonical links")

    print("%d page(s) -> %s" % (len(written), args.out))
    for f in written:
        print("  %s" % f)
    print("chrome blocks stripped: %d" % chrome_blocks)
    if todos:
        print("\n%d unresolved GF-TODO marker(s) — these must be closed before ship:" % todos)
        for m in re.finditer(r"GF-TODO:?\s*([^\n>-]*)", raw):
            note = m.group(1).strip()
            if note:
                print("  - %s" % note)
    for w in warnings:
        print("warning: %s" % w, file=sys.stderr)


if __name__ == "__main__":
    main()
