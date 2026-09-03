#!/usr/bin/env python3
"""Mechanical craft audit for a built static site.

Checks the things that are measurable: kernel conformance, contrast, spacing
system, radius consistency, type scale, motion physics, and the HTML/SEO
defaults. Judgement calls stay with the human reading the report.

    python3 audit.py <site-dir> [--kernel kernel.json] [--json]

Exit codes: 0 clean or advisories only, 1 warnings present, 2 blockers present.
"""

import argparse
import json
import math
import os
import re
import sys
from collections import Counter, defaultdict

# ---------------------------------------------------------------- findings

BLOCKER, WARN, NOTE = "BLOCKER", "WARN", "NOTE"
_RANK = {BLOCKER: 0, WARN: 1, NOTE: 2}


class Report:
    def __init__(self):
        self.items = []
        self._seen = set()

    def add(self, level, check, message, where=""):
        key = (level, check, message, where)
        if key in self._seen:
            return
        self._seen.add(key)
        self.items.append(
            {"level": level, "check": check, "message": message, "where": where}
        )

    def counts(self):
        return Counter(i["level"] for i in self.items)

    def exit_code(self):
        c = self.counts()
        if c[BLOCKER]:
            return 2
        if c[WARN]:
            return 1
        return 0


# ---------------------------------------------------------------- color

_HEX = re.compile(r"#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6,8})\b")
_RGB = re.compile(r"rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)", re.I)


def hex_to_rgb(h):
    h = h.lstrip("#")
    if len(h) in (3, 4):
        h = "".join(c * 2 for c in h[:3])
    h = h[:6]
    if len(h) != 6:
        return None
    try:
        return tuple(int(h[i : i + 2], 16) for i in (0, 2, 4))
    except ValueError:
        return None


_RGBA_A = re.compile(r"rgba?\([^)]*?[\s,/]+([\d.]+)\s*\)", re.I)


def parse_color(value, tokens=None, depth=0):
    """Best-effort (r, g, b, a) out of a CSS value. Resolves var() recursively.

    Alpha is carried rather than discarded. A translucent background composited
    over a dark page is nowhere near the color its literal channels suggest, and
    treating rgba(255,255,255,0.06) as white produces a confident, wrong
    contrast failure.
    """
    if not value or depth > 4:
        return None
    value = value.strip()
    m = re.search(r"var\(\s*(--[\w-]+)", value)
    if m and tokens:
        resolved = tokens.get(m.group(1))
        if resolved:
            got = parse_color(resolved, tokens, depth + 1)
            if got:
                return got
    m = _HEX.search(value)
    if m:
        raw = m.group(0).lstrip("#")
        rgb = hex_to_rgb(m.group(0))
        if rgb is None:
            return None
        alpha = 1.0
        if len(raw) == 8:
            alpha = int(raw[6:8], 16) / 255.0
        elif len(raw) == 4:
            alpha = int(raw[3] * 2, 16) / 255.0
        return (rgb[0], rgb[1], rgb[2], alpha)
    m = _RGB.search(value)
    if m:
        try:
            rgb = tuple(min(255, max(0, int(float(g)))) for g in m.groups())
        except ValueError:
            return None
        alpha = 1.0
        a = _RGBA_A.search(value)
        if a and value.lower().startswith("rgba"):
            try:
                alpha = float(a.group(1))
                if alpha > 1:          # rgba(... / 60%) style
                    alpha /= 100.0
            except ValueError:
                alpha = 1.0
        return (rgb[0], rgb[1], rgb[2], alpha)
    named = {
        "white": (255, 255, 255, 1.0),
        "black": (0, 0, 0, 1.0),
        "red": (255, 0, 0, 1.0),
    }
    first = value.lower().split()[0] if value.split() else ""
    return named.get(first)


def composite(top, under):
    """Flatten a translucent color over an opaque one. Both (r,g,b,a)."""
    a = top[3]
    if a >= 0.999:
        return top[:3]
    return tuple(round(top[i] * a + under[i] * (1 - a)) for i in range(3))


def luminance(rgb):
    rgb = rgb[:3]

    def channel(c):
        c = c / 255.0
        return c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4

    r, g, b = (channel(c) for c in rgb)
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def contrast(fg, bg):
    l1, l2 = luminance(fg), luminance(bg)
    hi, lo = max(l1, l2), min(l1, l2)
    return (hi + 0.05) / (lo + 0.05)


# ---------------------------------------------------------------- css parse

def strip_comments(css):
    return re.sub(r"/\*.*?\*/", "", css, flags=re.S)


def iter_blocks(css):
    """Yield (selector, body) for leaf rule blocks, descending into at-rules."""
    depth, buf, sel_start = 0, [], 0
    i, n = 0, len(css)
    stack = []
    while i < n:
        ch = css[i]
        if ch == "{":
            selector = css[sel_start:i].strip()
            stack.append((selector, i + 1))
            depth += 1
            sel_start = i + 1
        elif ch == "}":
            if stack:
                selector, start = stack.pop()
                body = css[start:i]
                if "{" not in body:  # leaf
                    yield selector, body
            depth -= 1
            sel_start = i + 1
        i += 1


def declarations(body):
    out = []
    for chunk in body.split(";"):
        if ":" not in chunk:
            continue
        prop, _, value = chunk.partition(":")
        prop, value = prop.strip().lower(), value.strip()
        if prop and value:
            out.append((prop, value))
    return out


def px_values(value):
    return [float(m) for m in re.findall(r"(-?\d*\.?\d+)px", value)]


def ms_values(value):
    out = []
    for num, unit in re.findall(r"(\d*\.?\d+)(ms|s)\b", value):
        out.append(float(num) * (1000.0 if unit == "s" else 1.0))
    return out


# ---------------------------------------------------------------- checks

SPACING_PROPS = (
    "margin", "margin-top", "margin-right", "margin-bottom", "margin-left",
    "padding", "padding-top", "padding-right", "padding-bottom", "padding-left",
    "gap", "row-gap", "column-gap",
)

COMPOSITED = ("transform", "opacity", "filter", "color", "background-color",
              "border-color", "box-shadow", "outline-color", "fill", "stroke")

LAYOUT_PROPS = ("width", "height", "top", "left", "right", "bottom", "margin",
                "padding", "font-size", "line-height", "border-width", "all")

SYSTEM_STACKS = {
    "sans-serif", "serif", "monospace", "cursive", "fantasy", "system-ui",
    "ui-sans-serif", "ui-serif", "ui-monospace", "ui-rounded", "inherit",
    "initial", "unset", "-apple-system", "blinkmacsystemfont", "segoe ui",
    "helvetica", "helvetica neue", "arial", "menlo", "consolas", "courier",
    "courier new", "sfmono-regular", "roboto mono",
}

BANNED_FACES = ("inter", "roboto", "open sans", "lato", "poppins", "fraunces")


def check_kernel(report, tokens, css_colors, faces, kernel):
    if not kernel:
        report.add(NOTE, "kernel", "No kernel.json supplied, so conformance was not checked.")
        return
    allowed = {c.upper() for c in kernel.get("token_colors", [])}
    allowed |= {c.upper() for c in kernel.get("extra_allowed_colors", [])}
    if not allowed:
        report.add(NOTE, "kernel", "kernel.json has no token_colors to check against.")
        return
    norm = set()
    for c in allowed:
        rgb = hex_to_rgb(c)
        if rgb:
            norm.add(rgb)
    strays = defaultdict(int)
    for hexval, count in css_colors.items():
        rgb = hex_to_rgb(hexval)
        if rgb is None or rgb in norm:
            continue
        # pure black/white are structural, not brand drift
        if rgb in ((0, 0, 0), (255, 255, 255)):
            continue
        strays[hexval] += count
    for hexval, count in sorted(strays.items(), key=lambda kv: -kv[1])[:20]:
        level = WARN if count > 2 else NOTE
        report.add(level, "kernel",
                   f"{hexval} is not in the kernel ({count} use{'s' if count > 1 else ''}). "
                   "Amplify an existing color or add it to the kernel deliberately.")
    kernel_faces = {f.lower() for f in kernel.get("typefaces", {}).get("webfonts_loaded", [])}
    for face in faces:
        f = face.lower()
        if kernel_faces and f not in kernel_faces and f not in ("ultimate",):
            level = BLOCKER if f in BANNED_FACES else WARN
            report.add(level, "kernel",
                       f"Typeface '{face}' is loaded but is not in the kernel"
                       + (" and is a banned default." if f in BANNED_FACES else "."))


def find_page_ground(blocks, tokens):
    """The opaque background translucent layers sit on. None if undeterminable."""
    for selector, body in blocks:
        sels = [x.strip() for x in selector.split(",")]
        if not any(x in ("body", "html", ":root", "html, body", "body, html") for x in sels):
            continue
        decls = dict(declarations(body))
        for prop in ("background-color", "background"):
            if prop in decls:
                c = parse_color(decls[prop], tokens)
                if c and c[3] >= 0.999:
                    return c[:3]
    return None


def check_contrast(report, blocks, tokens, scope=""):
    ground = find_page_ground(blocks, tokens)
    seen = set()
    skipped_translucent = 0

    for selector, body in blocks:
        decls = dict(declarations(body))
        fg = parse_color(decls.get("color", ""), tokens)
        bg = None
        for prop in ("background-color", "background"):
            if prop in decls:
                bg = parse_color(decls[prop], tokens)
                if bg:
                    break
        if not fg or not bg:
            continue

        # Flatten translucency before comparing, or decline to guess.
        if bg[3] < 0.999:
            if ground is None:
                skipped_translucent += 1
                continue
            bg_rgb = composite(bg, (*ground, 1.0))
        else:
            bg_rgb = bg[:3]
        fg_rgb = composite(fg, (*bg_rgb, 1.0)) if fg[3] < 0.999 else fg[:3]

        ratio = contrast(fg_rgb, bg_rgb)
        size = 0.0
        fs = px_values(decls.get("font-size", ""))
        if fs:
            size = fs[0]
        weight = decls.get("font-weight", "")
        bold = "bold" in weight or any(w in weight for w in ("700", "800", "900"))
        large = size >= 24 or (size >= 18.66 and bold)
        threshold = 3.0 if large else 4.5

        if ratio < threshold:
            key = (selector.strip()[:60], round(ratio, 2))
            if key in seen:
                continue
            seen.add(key)
            level = BLOCKER if ratio < threshold * 0.75 else WARN
            detail = ""
            if size:
                detail = f" at {size:g}px{'/bold' if bold else ''}"
            report.add(level, "contrast",
                       f"#{fg_rgb[0]:02X}{fg_rgb[1]:02X}{fg_rgb[2]:02X} on "
                       f"#{bg_rgb[0]:02X}{bg_rgb[1]:02X}{bg_rgb[2]:02X} is {ratio:.2f}:1"
                       f"{detail}, against a {threshold}:1 requirement"
                       f"{' for large text' if large else ''}.",
                       (f"{scope} " if scope else "") + selector.strip()[:70])

    if skipped_translucent:
        report.add(NOTE, "contrast",
                   f"{skipped_translucent} rule(s) with a translucent background were not "
                   "checked, because no opaque page ground was found to composite them over. "
                   "Verify those by eye.", scope)


def check_text_over_image(report, blocks):
    """Text sitting on a background image with no scrim is the classic defect."""
    for selector, body in blocks:
        decls = dict(declarations(body))
        bg = decls.get("background") or decls.get("background-image") or ""
        if "url(" not in bg:
            continue
        has_scrim = ("gradient" in bg) or ("linear-gradient" in bg)
        if has_scrim:
            continue
        report.add(NOTE, "scrim",
                   "Background image with no gradient scrim in the same rule. "
                   "Verify any text over it has a scrim or an overlay layer.",
                   selector.strip()[:80])


def check_spacing(report, blocks):
    values = Counter()
    for _, body in blocks:
        for prop, value in declarations(body):
            if prop in SPACING_PROPS:
                for v in px_values(value):
                    if v > 0:
                        values[v] += 1
    if not values:
        return
    candidates = [4, 8]
    best, best_rate = None, 0.0
    total = sum(values.values())
    for base in candidates:
        on = sum(c for v, c in values.items() if abs(v / base - round(v / base)) < 1e-6)
        rate = on / total
        if rate > best_rate:
            best, best_rate = base, rate
    off = sorted(
        ((v, c) for v, c in values.items()
         if abs(v / best - round(v / best)) > 1e-6),
        key=lambda kv: -kv[1],
    )
    report.add(NOTE, "spacing",
               f"Spacing system reads as a {best}px base, {best_rate*100:.0f}% of "
               f"{total} declared values on system.")
    if best_rate < 0.85:
        report.add(WARN, "spacing",
                   "Under 85% of spacing values sit on the base unit, which usually "
                   "means values were typed rather than chosen.")
    for v, c in off[:8]:
        report.add(NOTE, "spacing", f"{v:g}px is off the {best}px system ({c} uses).")


def check_radius(report, blocks):
    values = Counter()
    for _, body in blocks:
        for prop, value in declarations(body):
            if prop.startswith("border-radius"):
                for v in px_values(value):
                    values[v] += 1
                if "%" in value:
                    values[-1] += 1
    if not values:
        return
    distinct = sorted(v for v in values if v >= 0)
    label = ", ".join(f"{v:g}px" for v in distinct) + ("" if -1 not in values else ", plus %")
    report.add(NOTE, "radius", f"Radius values in use: {label}.")
    if len([v for v in distinct if v > 0]) > 3:
        report.add(WARN, "radius",
                   "More than three non-zero radii. Radius should be a deliberate "
                   "tension (containers one value, actions another), not a drift.")


def check_type_scale(report, blocks):
    sizes = Counter()
    for _, body in blocks:
        for prop, value in declarations(body):
            if prop == "font-size":
                for v in px_values(value):
                    sizes[v] += 1
    if not sizes:
        return
    ordered = sorted(sizes)
    report.add(NOTE, "type",
               f"{len(ordered)} distinct font sizes: "
               + ", ".join(f"{v:g}" for v in ordered) + ".")
    if len(ordered) > 9:
        report.add(WARN, "type",
                   f"{len(ordered)} distinct sizes is a ladder nobody designed. "
                   "Collapse toward a ratio.")
    for a, b in zip(ordered, ordered[1:]):
        if a >= 10 and 0 < b - a <= 1.01:
            report.add(WARN, "type",
                       f"{a:g}px and {b:g}px are within 1px. One of them is an accident.")
    if len(ordered) >= 3:
        ratio = ordered[-1] / ordered[0]
        report.add(NOTE, "type",
                   f"Display-to-smallest ratio is {ratio:.1f}x "
                   f"({ordered[0]:g}px to {ordered[-1]:g}px).")


def check_motion(report, blocks, raw_css):
    if "prefers-reduced-motion" not in raw_css:
        has_motion = any(
            prop in ("transition", "animation") or prop.startswith(("transition-", "animation-"))
            for _, body in blocks for prop, _ in declarations(body)
        )
        if has_motion:
            report.add(BLOCKER, "motion",
                       "Motion is declared but there is no prefers-reduced-motion block. "
                       "See house-style references/motion.md.")
    for selector, body in blocks:
        for prop, value in declarations(body):
            if prop == "transition" or prop == "transition-property":
                head = value.split(",")
                for part in head:
                    name = part.strip().split()[0] if part.strip() else ""
                    if name in LAYOUT_PROPS and name != "all":
                        report.add(WARN, "motion",
                                   f"Transitioning '{name}' forces layout on every frame. "
                                   "Animate transform and opacity instead.",
                                   selector.strip()[:80])
                    elif name == "all":
                        report.add(WARN, "motion",
                                   "`transition: all` animates properties you did not choose, "
                                   "including layout ones.",
                                   selector.strip()[:80])
            if prop in ("transition", "transition-duration", "animation", "animation-duration"):
                for ms in ms_values(value):
                    if ms == 0:
                        continue
                    if ms > 1000 and "animation" not in prop:
                        report.add(WARN, "motion",
                                   f"{ms:g}ms transition. Over 1000ms needs justifying; "
                                   "entering elements land in 300-500ms.",
                                   selector.strip()[:80])
                    elif 1.0 <= ms < 60:
                        # Below 1ms is the prefers-reduced-motion kill switch,
                        # which is correct and must not be reported as a defect.
                        report.add(NOTE, "motion",
                                   f"{ms:g}ms is below the threshold where motion reads as motion.",
                                   selector.strip()[:80])
    if re.search(r"animation[^;]*infinite", raw_css):
        n = len(re.findall(r"animation[^;]*infinite", raw_css))
        if n > 1:
            report.add(WARN, "motion",
                       f"{n} infinite animations. The Continuous stance is exactly one "
                       "element that never stops; more than one and the page vibrates.")


def check_html(report, html_files):
    for path, html in html_files:
        name = os.path.basename(path)
        doc = is_document(name, html)

        h1 = re.findall(r"<h1\b", html, re.I)
        if doc:
            if len(h1) == 0:
                report.add(WARN, "seo", "No <h1>.", name)
            elif len(h1) > 1:
                report.add(WARN, "seo", f"{len(h1)} <h1> elements. There should be one.", name)
            if not re.search(r"<title>\s*\S", html, re.I):
                report.add(BLOCKER, "seo", "No <title>.", name)
            if not re.search(r'name=["\']description["\']', html, re.I):
                report.add(WARN, "seo", "No meta description.", name)
            if not re.search(r'rel=["\']canonical["\']', html, re.I):
                report.add(NOTE, "seo", "No canonical link.", name)
            if not re.search(r'name=["\']viewport["\']', html, re.I):
                report.add(BLOCKER, "seo", "No viewport meta, so the site is not responsive.", name)
            if "LocalBusiness" not in html:
                report.add(NOTE, "seo", "No LocalBusiness schema found.", name)
            if re.search(r"<a\b[^>]*>\s*(click here|read more|learn more)\s*</a>", html, re.I):
                report.add(NOTE, "seo",
                           "Generic link text found. Descriptive anchors rank better.", name)

        imgs = re.findall(r"<img\b[^>]*>", html, re.I)
        no_alt = [t for t in imgs if not re.search(r'\balt\s*=', t, re.I)]
        no_dims = [t for t in imgs
                   if not (re.search(r'\bwidth\s*=', t, re.I) and re.search(r'\bheight\s*=', t, re.I))]
        if no_alt:
            report.add(WARN, "a11y", f"{len(no_alt)} of {len(imgs)} <img> without alt.", name)
        if no_dims and doc:
            report.add(NOTE, "perf",
                       f"{len(no_dims)} of {len(imgs)} <img> without width/height, which causes "
                       "layout shift.", name)

        levels = [int(m) for m in re.findall(r"<h([1-6])\b", html, re.I)]
        for a, b in zip(levels, levels[1:]):
            if b - a > 1:
                report.add(NOTE, "a11y",
                           f"Heading jumps from h{a} to h{b}.", name)
                break
        for emoji_hit in re.findall(r"[\U0001F300-\U0001FAFF☀-➿]", html):
            report.add(WARN, "house", "Emoji found in markup. House style is inline SVG.", name)
            break


def check_focus(report, raw_css):
    if ":focus" not in raw_css and ":focus-visible" not in raw_css:
        report.add(WARN, "a11y", "No focus styles anywhere in the CSS.")
    if re.search(r"outline\s*:\s*(none|0)\b", raw_css) and ":focus-visible" not in raw_css:
        report.add(BLOCKER, "a11y",
                   "outline removed with no :focus-visible replacement. "
                   "Keyboard users lose the cursor entirely.")


# ---------------------------------------------------------------- driver

_STYLE = re.compile(r"<style\b[^>]*>(.*?)</style>", re.I | re.S)


def is_document(name, html):
    """A shippable page, as opposed to a design-canvas artboard fragment.

    Artboards (.dc.html) are compositions, not pages: they have no <title>,
    no viewport, and no schema by design. Running page-level SEO checks on
    them produces noise that trains people to ignore the report.
    """
    if name.endswith(".dc.html"):
        return False
    return bool(re.search(r"<!doctype\s+html|<html\b", html, re.I))


def collect(site_dir):
    """Returns (css_sources, html_files, doc_count).

    css_files entries are (label, text, owner). owner is the HTML document an
    inline <style> came from, or None for a standalone stylesheet. Scoping
    matters: nine artboards in one folder are nine independent documents with
    nine different page grounds, and flattening them together makes every
    ground-dependent check wrong.
    """
    css_files, html_files = [], []
    skip = {"node_modules", ".git", "dist-cache", "vendor"}
    for root, dirs, files in os.walk(site_dir):
        dirs[:] = [d for d in dirs if d not in skip]
        for f in sorted(files):
            path = os.path.join(root, f)
            try:
                if f.endswith(".css"):
                    css_files.append(
                        (path, open(path, encoding="utf-8", errors="replace").read(), None))
                elif f.endswith((".html", ".htm")):
                    html = open(path, encoding="utf-8", errors="replace").read()
                    html_files.append((path, html))
                    for i, block in enumerate(_STYLE.findall(html)):
                        if block.strip():
                            css_files.append((f"{path} <style {i + 1}>", block, path))
            except OSError:
                continue
    return css_files, html_files


def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("site_dir")
    ap.add_argument("--kernel", help="path to kernel.json")
    ap.add_argument("--json", action="store_true", help="machine-readable output")
    args = ap.parse_args()

    if not os.path.isdir(args.site_dir):
        print(f"Not a directory: {args.site_dir}", file=sys.stderr)
        return 2

    css_files, html_files = collect(args.site_dir)
    if not css_files and not html_files:
        print(f"No .css or .html found under {args.site_dir}", file=sys.stderr)
        return 2

    raw_css = "\n".join(strip_comments(c) for _, c, _ in css_files)
    blocks = list(iter_blocks(raw_css))

    def tokens_of(block_list):
        out = {}
        for selector, body in block_list:
            if ":root" in selector:
                for prop, value in declarations(body):
                    if prop.startswith("--"):
                        out[prop] = value
        return out

    tokens = tokens_of(blocks)

    # Ground-dependent checks run per document. A standalone stylesheet is
    # shared by every document, so it joins each scope.
    shared = [(label, text) for label, text, owner in css_files if owner is None]
    owned = defaultdict(list)
    for label, text, owner in css_files:
        if owner is not None:
            owned[owner].append((label, text))

    scopes = []
    if owned:
        for doc, sheets in owned.items():
            text = "\n".join(strip_comments(t) for _, t in shared + sheets)
            scopes.append((os.path.basename(doc), list(iter_blocks(text))))
    if shared and not owned:
        text = "\n".join(strip_comments(t) for _, t in shared)
        scopes.append((os.path.basename(args.site_dir.rstrip("/")), list(iter_blocks(text))))

    css_colors = Counter()
    for _, body in blocks:
        for prop, value in declarations(body):
            if prop.startswith("--"):
                continue
            for m in _HEX.finditer(value):
                rgb = hex_to_rgb(m.group(0))
                if rgb:
                    css_colors["#%02X%02X%02X" % rgb] += 1
    for value in tokens.values():
        for m in _HEX.finditer(value):
            rgb = hex_to_rgb(m.group(0))
            if rgb:
                css_colors["#%02X%02X%02X" % rgb] += 1

    faces = set()
    for m in re.finditer(r"font-family\s*:\s*([^;}]+)", raw_css, re.I):
        first = m.group(1).split(",")[0].strip().strip("'\"")
        if first and not first.startswith("var(") and first.lower() not in SYSTEM_STACKS:
            faces.add(first)

    kernel = None
    kernel_path = args.kernel
    if not kernel_path:
        guess = os.path.join(args.site_dir, "kernel.json")
        if os.path.exists(guess):
            kernel_path = guess
    if kernel_path and os.path.exists(kernel_path):
        try:
            kernel = json.load(open(kernel_path, encoding="utf-8"))
        except (OSError, ValueError) as e:
            print(f"Could not read kernel: {e}", file=sys.stderr)

    report = Report()
    check_kernel(report, tokens, css_colors, faces, kernel)
    for scope_name, scope_blocks in scopes:
        check_contrast(report, scope_blocks, tokens_of(scope_blocks) or tokens, scope_name)
    check_text_over_image(report, blocks)
    check_spacing(report, blocks)
    check_radius(report, blocks)
    check_type_scale(report, blocks)
    check_motion(report, blocks, raw_css)
    check_focus(report, raw_css)
    check_html(report, html_files)

    if args.json:
        print(json.dumps({"findings": report.items,
                          "counts": dict(report.counts())}, indent=2))
        return report.exit_code()

    print(f"Craft audit: {args.site_dir}")
    print(f"  {len(css_files)} css sources, {len(html_files)} html, "
          f"{len(scopes)} scope(s), {len(tokens)} custom properties, {len(faces)} typefaces"
          + (f", kernel {os.path.basename(kernel_path)}" if kernel else ", no kernel"))
    print()
    items = sorted(report.items, key=lambda i: (_RANK[i["level"]], i["check"]))
    current = None
    for item in items:
        if item["level"] != current:
            current = item["level"]
            print(f"--- {current} ---")
        where = f"  [{item['where']}]" if item["where"] else ""
        print(f"  {item['check']:<9} {item['message']}{where}")
    c = report.counts()
    print()
    print(f"{c[BLOCKER]} blockers, {c[WARN]} warnings, {c[NOTE]} notes.")
    return report.exit_code()


if __name__ == "__main__":
    sys.exit(main())
