#!/usr/bin/env python3
"""Prepare client media for the site.

    python3 prep_assets.py <folder-or-zip>

Images: matched to their slot by filename, downsampled, saved as progressive JPEG
plus WebP. Video: scaled to 1920 wide, H.264, muted, faststart, with a poster frame.
Nothing is overwritten in place; everything lands in img/ and video/.
"""
import os, re, shutil, subprocess, sys, zipfile
from PIL import Image, ImageOps

HERE = os.path.dirname(os.path.abspath(__file__))
IMG, VID = os.path.join(HERE, "img"), os.path.join(HERE, "video")

# The March 9 2026 Nashville shoot, in the order the gallery expects.
GALLERY_ORDER = ["143028","143128","143220","143406","143424",
                 "143528","143602","143710","143916","144014"]
WIDTHS = {"gallery": 1600, "hero-poster": 1920, "sauna": 1600,
          "equip": 1600, "phero": 2000}

def slugify(name):
    stem = os.path.splitext(os.path.basename(name))[0].lower()
    stem = re.sub(r"[^a-z0-9]+", "-", stem).strip("-")
    stem = re.sub(r"-(scaled|photo|v3)\b", "", stem)
    return re.sub(r"-+", "-", stem)[:52].strip("-") or "asset"

def target_for(name):
    low = name.lower()
    m = re.search(r"dji_mimo_20260309_(\d{6})", low)
    if m and m.group(1) in GALLERY_ORDER:
        return "gallery-%02d" % (GALLERY_ORDER.index(m.group(1)) + 1), "gallery"
    for key, slot in [("sauna","sauna"), ("arsenal","equip-arsenal"),
                      ("atlantis","equip-atlantis"), ("hammer","equip-hammer"),
                      ("rogers","equip-rogers")]:
        if key in low:
            return slot, "equip" if slot.startswith("equip") else "sauna"
    return None, None

def do_image(src, stem, kind, subdir=""):
    im = ImageOps.exif_transpose(Image.open(src)).convert("RGB")
    w = WIDTHS.get(kind, 1600)
    if im.width > w:
        im = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
    out_dir = os.path.join(IMG, subdir) if subdir else IMG
    os.makedirs(out_dir, exist_ok=True)
    jpg = os.path.join(out_dir, stem + ".jpg")
    im.save(jpg, "JPEG", quality=82, optimize=True, progressive=True)
    im.save(os.path.join(out_dir, stem + ".webp"), "WEBP", quality=80, method=6)
    return jpg, im.size, os.path.getsize(jpg)

def do_video(src, stem="hero"):
    import imageio_ffmpeg
    ff = imageio_ffmpeg.get_ffmpeg_exe()
    out = os.path.join(VID, stem + ".mp4")
    subprocess.run([ff, "-y", "-i", src,
        "-vf", "scale='min(1920,iw)':-2", "-an",
        "-c:v", "libx264", "-preset", "slow", "-crf", "26",
        "-pix_fmt", "yuv420p", "-movflags", "+faststart", out],
        check=True, capture_output=True)
    poster = os.path.join(IMG, stem + "-poster.jpg")
    subprocess.run([ff, "-y", "-ss", "1", "-i", out, "-frames:v", "1", poster],
        check=True, capture_output=True)
    im = ImageOps.exif_transpose(Image.open(poster)).convert("RGB")
    im.save(poster, "JPEG", quality=82, optimize=True, progressive=True)
    return out, os.path.getsize(out)

def main(srcdir):
    os.makedirs(IMG, exist_ok=True); os.makedirs(VID, exist_ok=True)
    if srcdir.lower().endswith(".zip"):
        dest = srcdir + "-unzipped"
        zipfile.ZipFile(srcdir).extractall(dest)
        srcdir = dest
    files = [os.path.join(dp, f) for dp, _, fs in os.walk(srcdir) for f in fs]
    done, extra, skipped = [], [], []
    for f in sorted(files):
        ext = os.path.splitext(f)[1].lower()
        base = os.path.basename(f)
        try:
            if ext in (".jpg",".jpeg",".png",".webp",".heic"):
                if "-150x150" in base or re.search(r"-\d{2,4}x\d{2,4}\.", base):
                    continue  # WordPress thumbnail variant, not an original
                stem, kind = target_for(base)
                if stem:
                    p, size, nbytes = do_image(f, stem, kind)
                    done.append("%-30s -> img/%-26s %sx%s %5.0f KB" % (base[:30], stem+".jpg", size[0], size[1], nbytes/1024))
                else:
                    stem = slugify(base)
                    p, size, nbytes = do_image(f, stem, "gallery", "library")
                    extra.append("%-30s -> img/library/%-18s %sx%s %5.0f KB" % (base[:30], stem+".jpg", size[0], size[1], nbytes/1024))
            elif ext in (".mp4",".mov",".m4v"):
                stem = "hero" if base.startswith("0308-2") else slugify(base)
                p, nbytes = do_video(f, stem)
                line = "%-30s -> video/%-24s %.1f MB" % (base[:30], stem+".mp4", nbytes/1048576)
                (done if stem == "hero" else extra).append(line)
            else:
                skipped.append(base)
        except Exception as e:
            skipped.append("%s (%s)" % (base, e))
    print("SLOTS FILLED:")
    for d in done: print("  " + d)
    if not done: print("  none")
    if extra:
        print("\nALSO PREPARED (no slot yet, sitting in img/library/ ready to assign):")
        for e in extra: print("  " + e)
    if skipped:
        print("\nNOT USABLE:")
        for k in skipped[:20]: print("  " + k)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    main(sys.argv[1])
