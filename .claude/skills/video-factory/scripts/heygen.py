#!/usr/bin/env python3
"""Step 4: have the cloned avatar perform each line.

    heygen.py avatars                 list avatar ids on the account
    heygen.py voices [--search ben]   list voice ids
    heygen.py render <slug> [--force] [--allow-flagged] [--dry-run]

Reads  video/jobs/<slug>/work/scripts.json
Writes video/jobs/<slug>/work/avatar/seg_000.mp4 ...

Every finished render is recorded in the manifest with its HeyGen video id, so
re-running only pays for beats that are actually missing. That matters: a
re-run that silently re-renders forty beats is a real bill.

By default this refuses to render while any beat is still marked needs_human.
Rendering an unreviewed script is how a wrong menu name ends up in front of a
client, and the render is the expensive half of the pipeline. --allow-flagged
overrides it when you have read the lines and know what you are doing.
"""

import argparse
import os
import sys
import time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import (  # noqa: E402
    Manifest, cfg, cfg_int, die, download, http_json, log, probe_duration,
    read_json,
)

API = "https://api.heygen.com"
TERMINAL_OK = {"completed"}
TERMINAL_BAD = {"failed"}


def headers():
    return {"X-Api-Key": cfg("HEYGEN_API_KEY", required=True)}


def list_avatars():
    data = http_json("%s/v2/avatars" % API, headers=headers()).get("data") or {}
    rows = (data.get("avatars") or []) + (data.get("talking_photos") or [])
    if not rows:
        log("no avatars on this account yet")
        return
    for a in rows:
        aid = a.get("avatar_id") or a.get("talking_photo_id")
        name = a.get("avatar_name") or a.get("talking_photo_name") or "(unnamed)"
        print("%-40s %s" % (aid, name))


def list_voices(search=None):
    data = http_json("%s/v2/voices" % API, headers=headers()).get("data") or {}
    for v in data.get("voices") or []:
        name = v.get("name", "")
        if search and search.lower() not in name.lower():
            continue
        print("%-40s %-28s %s" % (v.get("voice_id"), name, v.get("language", "")))


def submit(script):
    """Queue one beat. Returns the HeyGen video id."""
    payload = {
        "video_inputs": [{
            "character": {
                "type": "avatar",
                "avatar_id": cfg("GF_HEYGEN_AVATAR_ID", required=True),
                "avatar_style": cfg("GF_HEYGEN_AVATAR_STYLE", "normal"),
            },
            "voice": {
                "type": "text",
                "input_text": script,
                "voice_id": cfg("GF_HEYGEN_VOICE_ID", required=True),
                "speed": float(cfg("GF_HEYGEN_VOICE_SPEED", "1.0")),
            },
            "background": {
                "type": "color",
                "value": cfg("GF_AVATAR_BG", "#101114"),
            },
        }],
        "dimension": {
            "width": cfg_int("GF_AVATAR_W", 720),
            "height": cfg_int("GF_AVATAR_H", 720),
        },
    }
    res = http_json("%s/v2/video/generate" % API, method="POST",
                    headers=headers(), payload=payload)
    if res.get("error"):
        die("HeyGen rejected the render: %s" % res["error"])
    vid = (res.get("data") or {}).get("video_id")
    if not vid:
        die("HeyGen returned no video_id: %s" % res)
    return vid


def status(video_id):
    res = http_json("%s/v1/video_status.get?video_id=%s" % (API, video_id),
                    headers=headers())
    return res.get("data") or {}


def render(slug, force=False, allow_flagged=False, dry_run=False):
    man = Manifest(slug)
    spath = os.path.join(man.dir, "work", "scripts.json")
    if not os.path.exists(spath):
        die("no scripts yet. Run rewrite.py %s first." % slug)

    lines = read_json(spath)["lines"]
    flagged = [ln["i"] for ln in lines if ln.get("needs_human")]
    if flagged and not allow_flagged:
        die("beats %s are still marked needs_human.\n"
            "Fix them in work/scripts.json, or pass --allow-flagged if you have "
            "read them and they are fine." % ", ".join(str(i) for i in flagged))

    empty = [ln["i"] for ln in lines if not ln.get("script", "").strip()]
    if empty:
        die("beats %s have no script to speak." % ", ".join(str(i) for i in empty))

    rendered = {} if force else dict(man.get("renders", {}))
    avatar_dir = os.path.join(man.dir, "work", "avatar")
    todo = []
    for ln in lines:
        dest = os.path.join(avatar_dir, "seg_%03d.mp4" % ln["i"])
        done = str(ln["i"]) in rendered and os.path.exists(dest)
        if not done:
            todo.append(ln)

    words = sum(len(ln["script"].split()) for ln in todo)
    log("%d of %d beats need rendering, about %.1f minutes of speech"
        % (len(todo), len(lines), words / 150.0))
    if dry_run:
        for ln in todo:
            log("  beat %-3d %2d words  %s" % (ln["i"], len(ln["script"].split()),
                                               ln["script"][:60]))
        return
    if not todo:
        log("nothing to render")
        man.mark("render", count=len(lines))
        return

    concurrency = cfg_int("GF_HEYGEN_CONCURRENCY", 2)
    poll = cfg_int("GF_HEYGEN_POLL_SECONDS", 20)
    timeout = cfg_int("GF_HEYGEN_TIMEOUT_SECONDS", 1800)

    pending = {}   # video_id -> line
    queue = list(todo)
    started = time.time()

    while queue or pending:
        while queue and len(pending) < concurrency:
            ln = queue.pop(0)
            vid = submit(ln["script"])
            pending[vid] = ln
            log("queued beat %d as %s" % (ln["i"], vid))

        time.sleep(poll)

        for vid in list(pending):
            ln = pending[vid]
            info = status(vid)
            state = info.get("status")
            if state in TERMINAL_OK:
                url = info.get("video_url")
                if not url:
                    die("beat %d finished with no download url" % ln["i"])
                dest = os.path.join(avatar_dir, "seg_%03d.mp4" % ln["i"])
                download(url, dest)
                dur = probe_duration(dest)
                rendered[str(ln["i"])] = {
                    "video_id": vid,
                    "file": os.path.relpath(dest, man.dir).replace(os.sep, "/"),
                    "duration": round(dur, 3),
                }
                man.set("renders", rendered)
                log("beat %d done, %.1fs of speech over %.1fs of footage"
                    % (ln["i"], dur, ln["clip_duration"]))
                del pending[vid]
            elif state in TERMINAL_BAD:
                die("beat %d failed at HeyGen: %s"
                    % (ln["i"], info.get("error") or info))

        if time.time() - started > timeout:
            die("gave up after %d seconds with %d renders still pending. "
                "Re-run to resume: finished beats are not re-rendered."
                % (timeout, len(pending)))

    man.set("renders", rendered)
    man.mark("render", count=len(rendered))

    over = [(int(i), r["duration"]) for i, r in rendered.items()]
    log("rendered %d beats, %.1f minutes of narration total"
        % (len(over), sum(d for _, d in over) / 60))


def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="cmd", required=True)
    sub.add_parser("avatars")
    pv = sub.add_parser("voices")
    pv.add_argument("--search")
    pr = sub.add_parser("render")
    pr.add_argument("slug")
    pr.add_argument("--force", action="store_true", help="re-render every beat")
    pr.add_argument("--allow-flagged", action="store_true")
    pr.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    if args.cmd == "avatars":
        list_avatars()
    elif args.cmd == "voices":
        list_voices(args.search)
    else:
        render(args.slug, args.force, args.allow_flagged, args.dry_run)


if __name__ == "__main__":
    main()
