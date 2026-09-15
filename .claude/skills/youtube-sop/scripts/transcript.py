#!/usr/bin/env python3
"""Pull a YouTube transcript without a paid transcript site.

Order of attack:
  1. yt-dlp (python module, then CLI) for metadata + caption track URLs
  2. YouTube's own InnerTube player endpoint as a no-dependency fallback

Usage:
  python transcript.py <url-or-id> [--timestamps] [--json] [--out FILE]

Exit codes: 0 ok, 2 no captions available, 3 fetch failed (network/blocked).
"""

import argparse
import html
import json
import os
import re
import subprocess
import sys
import urllib.error
import urllib.request

UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36"
ID_RE = re.compile(r"^[A-Za-z0-9_-]{11}$")


def video_id(raw):
    raw = raw.strip().strip('"').strip("'")
    if ID_RE.match(raw):
        return raw
    m = re.search(
        r"(?:youtu\.be/|/shorts/|/embed/|/live/|/v/|[?&]v=)([A-Za-z0-9_-]{11})", raw
    )
    if m:
        return m.group(1)
    raise SystemExit(f"Could not find a video ID in: {raw}")


def get(url, data=None, headers=None):
    req = urllib.request.Request(url, data=data, headers={"User-Agent": UA, **(headers or {})})
    with urllib.request.urlopen(req, timeout=45) as r:
        return r.read().decode("utf-8", "replace")


def pick_track(subs, autos):
    """Prefer a human English track, then auto English, then anything."""
    for pool in (subs, autos):
        if not pool:
            continue
        keys = sorted(pool, key=lambda k: (not k.lower().startswith("en"), k))
        for k in keys:
            if k.lower().startswith("en"):
                return k, pool[k]
    for pool in (subs, autos):
        if pool:
            k = sorted(pool)[0]
            return k, pool[k]
    return None, None


def from_ytdlp_module(vid):
    try:
        import yt_dlp  # noqa
    except ImportError:
        return None
    opts = {"skip_download": True, "quiet": True, "no_warnings": True}
    with yt_dlp.YoutubeDL(opts) as ydl:
        info = ydl.extract_info(f"https://www.youtube.com/watch?v={vid}", download=False)
    lang, fmts = pick_track(info.get("subtitles") or {}, info.get("automatic_captions") or {})
    if not fmts:
        return {"meta": meta_from_info(info), "lang": None, "cues": []}
    chosen = next((f for f in fmts if f.get("ext") == "json3"), None) or fmts[-1]
    body = get(chosen["url"])
    cues = parse_json3(body) if chosen.get("ext") == "json3" else parse_any(body)
    return {"meta": meta_from_info(info), "lang": lang, "cues": cues}


def meta_from_info(info):
    return {
        "title": info.get("title") or "",
        "channel": info.get("uploader") or info.get("channel") or "",
        "duration": info.get("duration") or 0,
        "url": info.get("webpage_url") or "",
        "upload_date": info.get("upload_date") or "",
    }


def from_ytdlp_cli(vid):
    exe = None
    for cand in ("yt-dlp", "yt-dlp.exe", "youtube-dl"):
        try:
            subprocess.run([cand, "--version"], capture_output=True, timeout=30, check=True)
            exe = cand
            break
        except Exception:
            continue
    if not exe:
        return None
    out = subprocess.run(
        [exe, "--skip-download", "--dump-single-json", f"https://www.youtube.com/watch?v={vid}"],
        capture_output=True, text=True, timeout=180,
    )
    if out.returncode != 0:
        return None
    info = json.loads(out.stdout)
    lang, fmts = pick_track(info.get("subtitles") or {}, info.get("automatic_captions") or {})
    if not fmts:
        return {"meta": meta_from_info(info), "lang": None, "cues": []}
    chosen = next((f for f in fmts if f.get("ext") == "json3"), None) or fmts[-1]
    body = get(chosen["url"])
    cues = parse_json3(body) if chosen.get("ext") == "json3" else parse_any(body)
    return {"meta": meta_from_info(info), "lang": lang, "cues": cues}


def from_innertube(vid):
    payload = json.dumps({
        "context": {"client": {"clientName": "ANDROID", "clientVersion": "20.10.38",
                               "androidSdkVersion": 30, "hl": "en"}},
        "videoId": vid,
    }).encode()
    raw = get("https://www.youtube.com/youtubei/v1/player", data=payload,
              headers={"Content-Type": "application/json"})
    d = json.loads(raw)
    status = (d.get("playabilityStatus") or {}).get("status")
    if status and status != "OK":
        reason = (d.get("playabilityStatus") or {}).get("reason") or status
        raise RuntimeError(f"YouTube will not serve this video: {reason}")
    vd = d.get("videoDetails") or {}
    meta = {
        "title": vd.get("title", ""),
        "channel": vd.get("author", ""),
        "duration": int(vd.get("lengthSeconds") or 0),
        "url": f"https://www.youtube.com/watch?v={vid}",
        "upload_date": "",
    }
    tracks = ((d.get("captions") or {}).get("playerCaptionsTracklistRenderer") or {}).get("captionTracks") or []
    if not tracks:
        return {"meta": meta, "lang": None, "cues": []}
    track = next((t for t in tracks if (t.get("languageCode") or "").startswith("en")), tracks[0])
    url = track["baseUrl"] + "&fmt=json3"
    return {"meta": meta, "lang": track.get("languageCode"), "cues": parse_json3(get(url))}


def parse_json3(body):
    d = json.loads(body, strict=False)
    cues = []
    for ev in d.get("events") or []:
        segs = ev.get("segs") or []
        text = "".join(s.get("utf8", "") for s in segs).replace("\n", " ").strip()
        if text:
            cues.append({"t": int(ev.get("tStartMs", 0)) // 1000, "text": text})
    return cues


def parse_any(body):
    """Very loose fallback for vtt/srv/ttml bodies."""
    if body.lstrip().startswith("{"):
        return parse_json3(body)
    cues, cur_t = [], 0
    for line in body.splitlines():
        line = line.strip()
        m = re.match(r"(\d+):(\d+):(\d+)[.,](\d+)\s*-->", line)
        if m:
            cur_t = int(m.group(1)) * 3600 + int(m.group(2)) * 60 + int(m.group(3))
            continue
        if not line or line.isdigit() or line.startswith(("WEBVTT", "NOTE", "Kind:", "Language:")):
            continue
        txt = html.unescape(re.sub(r"<[^>]+>", "", line)).strip()
        if txt:
            cues.append({"t": cur_t, "text": txt})
    return cues


def dedupe(cues):
    """Auto-captions repeat the rolling line. Drop cues wholly contained in the last one."""
    out = []
    for c in cues:
        if out and (c["text"] == out[-1]["text"] or c["text"] in out[-1]["text"]):
            continue
        if out and out[-1]["text"] in c["text"]:
            out[-1] = c
            continue
        out.append(c)
    return out


def stamp(sec):
    h, rem = divmod(sec, 3600)
    m, s = divmod(rem, 60)
    return f"{h}:{m:02d}:{s:02d}" if h else f"{m}:{s:02d}"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("video")
    ap.add_argument("--timestamps", action="store_true", help="prefix each line with its time")
    ap.add_argument("--json", action="store_true", help="emit raw json")
    ap.add_argument("--out", help="write to this file instead of stdout")
    a = ap.parse_args()

    vid = video_id(a.video)
    errors = []
    result = None
    for fn in (from_ytdlp_module, from_ytdlp_cli, from_innertube):
        try:
            result = fn(vid)
            if result:
                break
        except Exception as e:
            errors.append(f"{fn.__name__}: {e}")
            result = None

    if result is None:
        sys.stderr.write("Could not reach YouTube.\n" + "\n".join(errors) + "\n")
        sys.exit(3)

    result["cues"] = dedupe(result["cues"])
    if not result["cues"]:
        sys.stderr.write(
            f"No captions on this video ({result['meta'].get('title') or vid}).\n"
            "Options: youtube-transcript.com, or download the audio and transcribe it.\n"
        )
        sys.exit(2)

    m = result["meta"]
    if a.json:
        text = json.dumps(result, indent=2, ensure_ascii=False)
    else:
        lines = [
            f"# {m['title']}",
            f"Channel: {m['channel']}",
            f"Length: {stamp(m['duration'])}" if m["duration"] else "",
            f"URL: {m['url']}",
            f"Captions: {result['lang'] or 'unknown'}",
            "",
        ]
        lines = [l for l in lines if l != ""] + [""]
        if a.timestamps:
            lines += [f"[{stamp(c['t'])}] {c['text']}" for c in result["cues"]]
        else:
            lines.append(" ".join(c["text"] for c in result["cues"]))
        text = "\n".join(lines)

    if a.out:
        os.makedirs(os.path.dirname(os.path.abspath(a.out)), exist_ok=True)
        with open(a.out, "w", encoding="utf-8") as f:
            f.write(text)
        wc = sum(len(c["text"].split()) for c in result["cues"])
        print(f"Saved {wc} words to {a.out}")
        print(f"{m['title']} | {m['channel']} | {stamp(m['duration'])}")
    else:
        sys.stdout.write(text + "\n")


if __name__ == "__main__":
    main()
