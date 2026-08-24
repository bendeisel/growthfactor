#!/usr/bin/env python3
"""
Extract a client's brand kernel from a downloaded site.

The kernel is the set of values a redesign is NOT allowed to invent: the real
typefaces, the real hexes, and the structural motifs the site already uses.
Pulling these mechanically matters because reading them off a screenshot is
where drift starts -- you approximate #D7AD56 as "gold", then "gold" becomes
whatever gold you like, and three edits later it is someone else's site.

Usage:
    python3 extract_kernel.py <site-dir-or-html> [-o kernel.json] [--palette]

<site-dir-or-html>  A saved-site directory (saveweb2zip, wget -r, HTTrack) or a
                    single .html file. Directories are searched for .html/.css.
--palette           Also sample dominant colors from images (needs Pillow).
"""

import argparse
import json
import os
import re
import sys
from collections import Counter

CSS_VAR = re.compile(r"(--[A-Za-z0-9_-]+)\s*:\s*([^;}!]+)")
FONT_FAMILY = re.compile(r"font-family\s*:\s*([^;}]+)", re.I)
GOOGLE_FONTS = re.compile(r"fonts\.googleapis\.com/css2?\?([^\"'>\s]+)")
HEX = re.compile(r"#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})\b")
# Template systems name their section variants in the class list; capturing them
# tells you which archetypes the vendor ships and which one this site picked.
VARIANT = re.compile(r"\b([a-z]{1,4}[A-Z][A-Za-z]+-(?:tiny-)?[A-Za-z0-9]+)\b")
TITLE = re.compile(r"<title[^>]*>(.*?)</title>", re.S | re.I)
IMG_EXT = (".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg", ".avif")

GENERIC_FAMILIES = {
    "inherit", "initial", "unset", "sans-serif", "serif", "monospace",
    "cursive", "fantasy", "system-ui", "ui-monospace", "ui-sans-serif",
}

# Icon fonts and framework fallback stacks are not brand typefaces. They show up
# constantly in vendor CSS and would otherwise crowd out the two faces that
# actually matter, so drop them rather than making a human sift the list.
NOISE_FAMILY = re.compile(
    r"icon|glyph|swiper|fontawesome|^-apple-system$|BlinkMacSystemFont|"
    r"^Segoe UI$|^Roboto$|^Helvetica Neue$|^Helvetica$|^Arial$|^Ubuntu$|"
    r"^Cantarell$|^Noto Sans$|^Liberation|^Apple Color|^Emoji",
    re.I,
)


def collect_files(target):
    """Return (html_paths, css_paths, image_paths)."""
    if os.path.isfile(target):
        return ([target], [], [])
    html, css, imgs = [], [], []
    for root, _, names in os.walk(target):
        for n in names:
            p = os.path.join(root, n)
            low = n.lower()
            if low.endswith((".html", ".htm")):
                html.append(p)
            elif low.endswith(".css"):
                css.append(p)
            elif low.endswith(IMG_EXT):
                imgs.append(p)
            elif "." not in n:
                # Saved sites often store CSS under an extensionless bundle path.
                try:
                    with open(p, "r", encoding="utf-8", errors="replace") as fh:
                        head = fh.read(400)
                    if "{" in head and (":" in head) and "function" not in head:
                        css.append(p)
                except OSError:
                    pass
    return (html, css, imgs)


def read(path):
    try:
        with open(path, "r", encoding="utf-8", errors="replace") as fh:
            return fh.read()
    except OSError:
        return ""


def clean_font_stack(raw):
    """First non-generic family in a font stack, quotes stripped."""
    for part in raw.split(","):
        fam = part.strip()
        # Vendor CSS often trails a declaration with !important inside the stack.
        fam = re.sub(r"\s*!\s*important\s*$", "", fam).strip().strip("'\"").strip()
        if not fam or fam.lower() in GENERIC_FAMILIES:
            continue
        if fam.startswith("var(") or NOISE_FAMILY.search(fam):
            continue
        return fam
    return None


CHROME_PATH = re.compile(r"social|sprite|icon|/global/|favicon|logo|share|badge", re.I)


def sample_palette(images, limit=12):
    """Dominant colors from the largest CONTENT images.

    Third-party icons carry other companies' brand colors, and sampling them is
    how a palette ends up with Facebook blue in it. Filtering by path and
    preferring big files keeps this to photography and artwork.
    """
    try:
        from PIL import Image
    except ImportError:
        return None, "Pillow not installed - skipping image palette"
    candidates = [p for p in images
                  if not p.lower().endswith(".svg") and not CHROME_PATH.search(p)]
    # Big files are hero art and photography; small ones are UI chrome.
    candidates.sort(key=lambda p: os.path.getsize(p) if os.path.exists(p) else 0,
                    reverse=True)
    candidates = [p for p in candidates
                  if os.path.exists(p) and os.path.getsize(p) > 8000]
    swatches = Counter()
    for p in candidates[:limit]:
        try:
            im = Image.open(p).convert("RGB")
            im.thumbnail((80, 80))
            # Quantize so near-identical pixels collapse into one bucket.
            for count, (r, g, b) in im.quantize(colors=6).convert("RGB").getcolors(6400) or []:
                swatches["#%02X%02X%02X" % (r, g, b)] += count
        except Exception:
            continue
    return [c for c, _ in swatches.most_common(14)], None


def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("target", help="saved-site directory or .html file")
    ap.add_argument("-o", "--out", default="kernel.json")
    ap.add_argument("--palette", action="store_true",
                    help="sample dominant colors from images (needs Pillow)")
    args = ap.parse_args()

    if not os.path.exists(args.target):
        sys.exit("not found: %s" % args.target)

    html_files, css_files, images = collect_files(args.target)
    if not html_files and not css_files:
        sys.exit("no HTML or CSS found under %s" % args.target)

    html_blob = "\n".join(read(p) for p in html_files)
    css_blob = "\n".join(read(p) for p in css_files)
    both = html_blob + "\n" + css_blob

    # --- design tokens -----------------------------------------------------
    # Declared custom properties are the highest-confidence source there is:
    # the vendor wrote them down as the site's own theme contract.
    tokens = {}
    for m in CSS_VAR.finditer(both):
        name, val = m.group(1), m.group(2).strip()
        if val and not val.startswith("var("):
            tokens.setdefault(name, val)

    # --- typefaces ---------------------------------------------------------
    families = Counter()
    for raw in FONT_FAMILY.finditer(both):
        fam = clean_font_stack(raw.group(1))
        if fam:
            families[fam] += 1
    webfonts = set()
    for m in GOOGLE_FONTS.finditer(html_blob):
        for fam in re.findall(r"family=([A-Za-z0-9+]+)", m.group(1)):
            webfonts.add(fam.replace("+", " "))

    # --- colors ------------------------------------------------------------
    token_hexes = [v.upper() for v in tokens.values() if HEX.fullmatch(v.strip())]
    all_hexes = Counter(h.upper() for h in HEX.findall(css_blob))

    # --- structural motifs -------------------------------------------------
    variants = sorted(set(VARIANT.findall(css_blob)))
    used = sorted({v for v in variants if re.search(r'class="[^"]*\b%s\b' % re.escape(v), html_blob)})

    kernel = {
        "source": os.path.abspath(args.target),
        "title": (TITLE.search(html_blob).group(1).strip() if TITLE.search(html_blob) else None),
        "counts": {"html": len(html_files), "css": len(css_files), "images": len(images)},
        "tokens": tokens,
        "token_colors": sorted(set(token_hexes)),
        "typefaces": {
            "webfonts_loaded": sorted(webfonts),
            "declared": [f for f, _ in families.most_common(12)],
        },
        "top_css_colors": [c for c, _ in all_hexes.most_common(16)],
        "section_variants_available": variants,
        "section_variants_used": used,
    }

    if args.palette:
        pal, warn = sample_palette(images)
        kernel["image_palette"] = pal
        if warn:
            kernel["image_palette_note"] = warn

    with open(args.out, "w", encoding="utf-8") as fh:
        json.dump(kernel, fh, indent=2)

    # --- human-readable summary -------------------------------------------
    print("kernel for: %s" % (kernel["title"] or args.target))
    print("  scanned      %d html, %d css, %d images"
          % (len(html_files), len(css_files), len(images)))
    print("  webfonts     %s" % (", ".join(kernel["typefaces"]["webfonts_loaded"]) or "none found"))
    print("  declared     %s" % ", ".join(kernel["typefaces"]["declared"][:6]))
    print("  tokens       %d custom properties, %d of them colors"
          % (len(tokens), len(kernel["token_colors"])))
    if kernel["token_colors"]:
        print("  palette      %s" % " ".join(kernel["token_colors"][:14]))
    if used:
        print("  using        %s" % ", ".join(used))
    print("  available    %d section variants in this theme" % len(variants))
    if args.palette and kernel.get("image_palette"):
        print("  from images  %s" % " ".join(kernel["image_palette"][:10]))
    print("wrote %s" % args.out)


if __name__ == "__main__":
    main()
