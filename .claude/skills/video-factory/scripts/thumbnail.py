#!/usr/bin/env python3
"""Step 7: a thumbnail per video, so the course player is not picking frames.

    thumbnail.py <slug> [--at 0.35] [--title "..."] [--label "..."] [--force]

Reads  video/jobs/<slug>/out/final.mp4
       video/jobs/<slug>/assets/logo.png        (optional)
Writes video/jobs/<slug>/out/thumbnail.jpg

Pulls a frame out of the finished video, darkens it under a gradient, and
sets the module label and the title over it. Same treatment on every video in
the library, which is the entire point: a course whose tiles do not match
looks abandoned before anyone presses play.

Pillow rather than ffmpeg's drawtext, for three reasons: real line wrapping,
automatic shrink-to-fit so a long title never overflows, and it works on a
Windows ffmpeg build that was compiled without libfreetype.

Everything about the treatment is config, so changing the look never means
editing this file. GF_THUMB_ACCENT is the only one that usually matters.
"""

import argparse
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import (  # noqa: E402
    Manifest, cfg, cfg_float, cfg_int, die, log, probe_duration, require_binary,
    run,
)
import registry  # noqa: E402

# Bold first, regular second. Windows paths first because that is where this
# actually runs.
FONT_CANDIDATES = {
    "bold": [
        r"C:\Windows\Fonts\segoeuib.ttf",
        r"C:\Windows\Fonts\arialbd.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
    ],
    "regular": [
        r"C:\Windows\Fonts\segoeui.ttf",
        r"C:\Windows\Fonts\arial.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/System/Library/Fonts/Supplemental/Arial.ttf",
    ],
}


def find_font(kind):
    explicit = cfg("GF_THUMB_FONT_BOLD" if kind == "bold" else "GF_THUMB_FONT_REGULAR")
    for path in ([explicit] if explicit else []) + FONT_CANDIDATES[kind]:
        if path and os.path.exists(path):
            return path
    return None


def load_font(kind, size):
    from PIL import ImageFont
    path = find_font(kind)
    if not path:
        log("no %s font found, falling back to Pillow's bitmap font. Set "
            "GF_THUMB_FONT_BOLD and GF_THUMB_FONT_REGULAR for a real one." % kind)
        return ImageFont.load_default()
    return ImageFont.truetype(path, size)


def grab_frame(video, dest, at_fraction):
    """A frame from partway in. The opening seconds are usually an intro or a
    fade, which makes a poor tile."""
    require_binary("ffmpeg")
    duration = probe_duration(video)
    ts = max(0.0, min(duration - 0.2, duration * at_fraction))
    run(["ffmpeg", "-y", "-ss", "%.3f" % ts, "-i", video,
         "-frames:v", "1", "-q:v", "2", dest])
    return dest


def text_width(draw, text, font, tracking=0):
    if not text:
        return 0
    base = draw.textlength(text, font=font)
    return base + tracking * max(0, len(text) - 1)


def draw_tracked(draw, xy, text, font, fill, tracking=0):
    """Letter spacing, which Pillow has no native support for. Worth the loop
    on the small label: it is the difference between set and typed."""
    if tracking == 0:
        draw.text(xy, text, font=font, fill=fill)
        return
    x, y = xy
    for ch in text:
        draw.text((x, y), ch, font=font, fill=fill)
        x += draw.textlength(ch, font=font) + tracking


def wrap_to_width(draw, text, font, max_width):
    lines, current = [], ""
    for word in text.split():
        candidate = (current + " " + word).strip()
        if current and text_width(draw, candidate, font) > max_width:
            lines.append(current)
            current = word
        else:
            current = candidate
    if current:
        lines.append(current)
    return lines


def fit_title(draw, text, max_width, max_lines, start_size, min_size):
    """Shrink until the title fits the box. A title that overflows its tile is
    the most common way a generated thumbnail looks broken."""
    size = start_size
    while size > min_size:
        font = load_font("bold", size)
        lines = wrap_to_width(draw, text, font, max_width)
        if len(lines) <= max_lines:
            return font, lines
        size -= 2
    font = load_font("bold", min_size)
    lines = wrap_to_width(draw, text, font, max_width)
    return font, lines[:max_lines]


def hex_to_rgb(value, default=(255, 255, 255)):
    value = (value or "").strip().lstrip("#").lstrip("0x")
    if len(value) == 3:
        value = "".join(c * 2 for c in value)
    if len(value) != 6:
        return default
    try:
        return tuple(int(value[i:i + 2], 16) for i in (0, 2, 4))
    except ValueError:
        return default


def compose(frame_path, dest, title, label):
    from PIL import Image, ImageDraw, ImageFilter

    width = cfg_int("GF_THUMB_W", 1280)
    height = cfg_int("GF_THUMB_H", 720)
    accent = hex_to_rgb(cfg("GF_THUMB_ACCENT", "#F5A524"))
    text_rgb = hex_to_rgb(cfg("GF_THUMB_TEXT", "#FFFFFF"))
    scrim_rgb = hex_to_rgb(cfg("GF_THUMB_SCRIM", "#0A0B0D"), (10, 11, 13))
    scrim_strength = cfg_float("GF_THUMB_SCRIM_STRENGTH", 0.92)
    margin = cfg_int("GF_THUMB_MARGIN", 64)
    blur = cfg_float("GF_THUMB_BLUR", 0.0)

    base = Image.open(frame_path).convert("RGB")
    # Cover the tile rather than squashing the frame into it.
    scale = max(width / base.width, height / base.height)
    base = base.resize((max(1, int(base.width * scale)),
                        max(1, int(base.height * scale))), Image.LANCZOS)
    left = (base.width - width) // 2
    top = (base.height - height) // 2
    base = base.crop((left, top, left + width, top + height))
    if blur > 0:
        base = base.filter(ImageFilter.GaussianBlur(blur))

    # A gradient scrim, heaviest at the bottom where the text sits. A flat
    # overlay would wash out the screenshot the tile is supposed to show.
    scrim = Image.new("RGBA", (width, height), scrim_rgb + (0,))
    sd = ImageDraw.Draw(scrim)
    for y in range(height):
        t = y / float(height - 1)
        alpha = int(255 * scrim_strength * (t ** 2.1))
        sd.line([(0, y), (width, y)], fill=scrim_rgb + (alpha,))
    base = Image.alpha_composite(base.convert("RGBA"), scrim)
    draw = ImageDraw.Draw(base)

    box_width = width - margin * 2
    logo_path = os.path.join(os.path.dirname(dest), os.pardir, "assets", "logo.png")
    if os.path.exists(logo_path):
        logo = Image.open(logo_path).convert("RGBA")
        target_h = cfg_int("GF_THUMB_LOGO_H", 44)
        ratio = target_h / float(logo.height)
        logo = logo.resize((max(1, int(logo.width * ratio)), target_h), Image.LANCZOS)
        base.alpha_composite(logo, (width - margin - logo.width, margin))

    y = height - margin

    title_font, lines = fit_title(
        draw, title, box_width,
        cfg_int("GF_THUMB_TITLE_LINES", 3),
        cfg_int("GF_THUMB_TITLE_SIZE", 76),
        cfg_int("GF_THUMB_TITLE_MIN_SIZE", 40))
    line_gap = int(title_font.size * 1.16) if hasattr(title_font, "size") else 40
    y -= line_gap * len(lines)
    title_top = y
    for line in lines:
        draw.text((margin, y), line, font=title_font, fill=text_rgb)
        y += line_gap

    if label:
        label_font = load_font("regular", cfg_int("GF_THUMB_LABEL_SIZE", 24))
        tracking = cfg_float("GF_THUMB_LABEL_TRACKING", 2.4)
        label_y = title_top - cfg_int("GF_THUMB_LABEL_GAP", 26) - label_font.size
        rule_w = cfg_int("GF_THUMB_RULE_W", 56)
        rule_y = label_y - cfg_int("GF_THUMB_RULE_GAP", 22)
        draw.rectangle([margin, rule_y, margin + rule_w,
                        rule_y + cfg_int("GF_THUMB_RULE_H", 4)], fill=accent)
        draw_tracked(draw, (margin, label_y), label.upper(), label_font,
                     accent, tracking)

    base.convert("RGB").save(dest, "JPEG", quality=cfg_int("GF_THUMB_QUALITY", 88),
                             optimize=True, progressive=True)
    return dest


def build(slug, at=None, title=None, label=None):
    try:
        import PIL  # noqa: F401
    except ImportError:
        die("Pillow is not installed.\n  pip install Pillow")

    man = Manifest(slug)
    video = os.path.join(man.dir, "out", "final.mp4")
    if not os.path.exists(video):
        die("no built video at %s. Run composite.py %s first." % (video, slug))

    row = next((r for r in registry.load() if r["slug"] == slug), {})
    title = title or row.get("title") or slug.replace("-", " ").title()
    label = label if label is not None else row.get("module", "")

    frame = os.path.join(man.dir, "work", "thumb-frame.jpg")
    grab_frame(video, frame, at if at is not None else cfg_float("GF_THUMB_AT", 0.35))
    dest = os.path.join(man.dir, "out", "thumbnail.jpg")
    compose(frame, dest, title, label)
    man.mark("thumbnail", output="out/thumbnail.jpg", title=title, label=label)
    log("wrote out/thumbnail.jpg  %r / %r" % (label, title))
    return dest


def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("slug")
    ap.add_argument("--at", type=float,
                    help="where to grab the frame, 0 to 1 through the video")
    ap.add_argument("--title", help="override the registry title")
    ap.add_argument("--label", help="override the module label")
    ap.add_argument("--force", action="store_true")
    args = ap.parse_args()

    man = Manifest(args.slug)
    if man.done("thumbnail") and not args.force:
        log("thumbnail already written, skipping. --force to redo.")
        return
    build(args.slug, args.at, args.title, args.label)


if __name__ == "__main__":
    main()
