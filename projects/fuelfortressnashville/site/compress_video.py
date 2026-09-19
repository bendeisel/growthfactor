#!/usr/bin/env python3
"""Compress a video for use as a web background. No ffmpeg install needed.

    python3 compress_video.py 0308-2.mp4

Writes hero.mp4 beside it, plus hero-poster.jpg. Scales to 1920 wide, strips
audio (a background video is always muted anyway), and moves the index to the
front so playback starts before the file finishes downloading.
"""
import os, subprocess, sys

def ffmpeg():
    try:
        import imageio_ffmpeg
    except ImportError:
        print("fetching ffmpeg (one time)...")
        subprocess.run([sys.executable, "-m", "pip", "install", "--quiet", "imageio-ffmpeg"], check=True)
        import imageio_ffmpeg
    return imageio_ffmpeg.get_ffmpeg_exe()

def main(src, crf="26", width="1920"):
    ff = ffmpeg()
    out = os.path.join(os.path.dirname(os.path.abspath(src)), "hero.mp4")
    poster = os.path.join(os.path.dirname(os.path.abspath(src)), "hero-poster.jpg")
    before = os.path.getsize(src)
    print("compressing %s (%.1f MB)..." % (os.path.basename(src), before / 1048576))
    subprocess.run([ff, "-y", "-i", src,
        "-vf", "scale='min(%s,iw)':-2" % width, "-an",
        "-c:v", "libx264", "-preset", "slow", "-crf", crf,
        "-pix_fmt", "yuv420p", "-movflags", "+faststart", out], check=True, capture_output=True)
    subprocess.run([ff, "-y", "-ss", "1", "-i", out, "-frames:v", "1", "-q:v", "3", poster],
                   check=True, capture_output=True)
    after = os.path.getsize(out)
    print("hero.mp4        %.1f MB  (%.0f%% smaller)" % (after / 1048576, 100 * (1 - after / before)))
    print("hero-poster.jpg %.0f KB" % (os.path.getsize(poster) / 1024))
    print("\nUpload both to wp-content/uploads/2026/03/ and tell me, I'll point the hero at them.")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    main(*sys.argv[1:4])
