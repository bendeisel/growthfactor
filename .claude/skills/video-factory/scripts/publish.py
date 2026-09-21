#!/usr/bin/env python3
"""Step 8: push the finished videos into GoHighLevel.

    publish.py probe                      check the token and the location
    publish.py media <slug> [--confirm]   upload the video and thumbnail
    publish.py course [--confirm]         build the course and import it
    publish.py payload                    print the course payload, send nothing

Endpoints, verified against HighLevel's published OpenAPI specs rather than
recalled:

    POST https://services.leadconnectorhq.com/medias/upload-file
         multipart: file, name, parentId; or hosted=true with fileUrl
         returns {fileId, url}

    POST https://services.leadconnectorhq.com/courses/courses-exporter/public/import
         {locationId, userId?, products:[{title, description, imageUrl?,
          instructorDetails?, categories:[{title, visibility, thumbnailUrl?,
          posts:[{title, visibility, contentType, description,
                  thumbnailUrl?, bucketVideoUrl?, postMaterials?}]}]}]}

Both take `Version: 2021-07-28` and a Bearer token. A Private Integration
token from the sub-account is the simplest thing that works; it needs the
medias.write and courses.write scopes.

## Nothing is sent without --confirm

Every command that writes to HighLevel dry-runs by default and prints exactly
what it would send, to which location. That is not ceremony. A course import
lands in a live sub-account that clients can see, and it is far easier to read
the payload first than to unpick a half-imported course afterwards.
"""

import argparse
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import registry  # noqa: E402
from common import (  # noqa: E402
    Manifest, cfg, die, http_json, log, post_multipart,
)

# Overridable so the publish path can be exercised against a stand-in server
# without pointing anything at a live sub-account.
API = cfg("GHL_API_BASE", "https://services.leadconnectorhq.com").rstrip("/")
VERSION = "2021-07-28"
# HighLevel's spec text says 25 MB; their docs carve out 500 MB for video.
# Warn at the larger number and name both, so a failure is legible.
SOFT_LIMIT = 500 * 1024 * 1024


def headers(extra=None):
    h = {
        "Authorization": "Bearer %s" % cfg("GHL_API_TOKEN", required=True),
        "Version": VERSION,
        "Accept": "application/json",
    }
    h.update(extra or {})
    return h


def location_id():
    return cfg("GHL_LOCATION_ID", required=True)


def cmd_probe(args):
    loc = location_id()
    url = ("%s/medias/files?altId=%s&altType=location&limit=1" % (API, loc))
    log("checking the token against location %s" % loc)
    res = http_json(url, headers=headers())
    files = (res.get("files") if isinstance(res, dict) else None)
    log("token accepted. Media library reachable%s."
        % ("" if files is None else ", %d file(s) visible" % len(files)))
    return 0


def upload_file(path, name=None, parent_id=None, dry_run=True):
    """One file into the media library. Returns {fileId, url}."""
    if not os.path.exists(path):
        die("no such file: %s" % path)
    size = os.path.getsize(path)
    name = name or os.path.basename(path)
    if size > SOFT_LIMIT:
        die("%s is %.0f MB. HighLevel caps uploads at 25 MB for general files "
            "and 500 MB for video. Shrink it, or host it and use --hosted."
            % (name, size / 1e6))

    if dry_run:
        log("  would upload %-28s %7.1f MB" % (name, size / 1e6))
        return {"fileId": "(dry-run)", "url": "(dry-run)"}

    fields = [("name", name)]
    if parent_id:
        fields.append(("parentId", parent_id))
    log("  uploading %-28s %7.1f MB" % (name, size / 1e6))
    res = post_multipart(
        "%s/medias/upload-file" % API, headers(), fields,
        [("file", name, path)],
        error_hints={
            401: "The token is wrong, expired, or lacks the medias.write scope.",
            413: "HighLevel rejected the file as too large.",
        })
    return _uploaded(res, name)


def upload_hosted(file_url, name, parent_id=None, dry_run=True):
    """Have HighLevel fetch the file itself instead of pushing the bytes.

    Worth using when the build already sits on the preview host: it turns a
    several hundred megabyte upload into one small request, and HighLevel
    pulls from a server that is better at serving files than we are at
    uploading them.
    """
    if dry_run:
        log("  would ask HighLevel to fetch %s" % file_url)
        return {"fileId": "(dry-run)", "url": file_url}
    fields = [("hosted", "true"), ("fileUrl", file_url), ("name", name)]
    if parent_id:
        fields.append(("parentId", parent_id))
    log("  asking HighLevel to fetch %s" % file_url)
    res = post_multipart(
        "%s/medias/upload-file" % API, headers(), fields, [],
        error_hints={
            401: "The token is wrong, expired, or lacks the medias.write scope.",
            422: "HighLevel could not fetch that URL. Is it public?",
        })
    return _uploaded(res, name)


def _uploaded(res, name):
    out = {"fileId": res.get("fileId"), "url": res.get("url")}
    if not out["url"]:
        die("upload of %s returned no url: %s" % (name, res))
    log("  -> %s" % out["url"])
    return out


def cmd_media(args):
    slug = args.slug
    man = Manifest(slug)
    video = os.path.join(man.dir, "out", "final.mp4")
    thumb = os.path.join(man.dir, "out", "thumbnail.jpg")
    if not os.path.exists(video):
        die("no built video for %s" % slug)

    dry = not args.confirm
    if dry:
        log("DRY RUN. Nothing is sent. Add --confirm to upload for real.")
    log("location %s" % location_id())

    parent = cfg("GHL_MEDIA_FOLDER_ID") or None
    uploaded = dict(man.get("ghl", {}))
    if args.hosted:
        uploaded["video"] = upload_hosted(
            args.hosted.rstrip("/") + "/%s.mp4" % slug if args.hosted.endswith("/")
            else args.hosted, "%s.mp4" % slug, parent, dry)
    else:
        uploaded["video"] = upload_file(video, "%s.mp4" % slug, parent, dry)
    if os.path.exists(thumb):
        uploaded["thumbnail"] = upload_file(thumb, "%s.jpg" % slug, parent, dry)
    else:
        log("  no thumbnail. Run thumbnail.py %s first if you want one." % slug)

    if not dry:
        man.set("ghl", uploaded)
        man.mark("publish_media", video=uploaded["video"].get("url"))
        registry_set(slug, "--notes", "media uploaded")
    return 0


def registry_set(slug, *args):
    import subprocess
    subprocess.run([sys.executable,
                    os.path.join(os.path.dirname(os.path.abspath(__file__)),
                                 "registry.py"), "set", slug] + list(args),
                   stdout=subprocess.DEVNULL)


def build_course_payload(loc_id, product_title, product_description, items,
                         user_id=None, image_url=None, instructor=None,
                         visibility="draft"):
    """Turn a list of finished videos into the import payload.

    Pure function so it can be tested without touching the network. Items are
    grouped into categories by their module, in first-seen order, because the
    order categories appear in is the order students see them.
    """
    categories, order = {}, []
    for item in items:
        module = item.get("module") or "Lessons"
        if module not in categories:
            categories[module] = []
            order.append(module)
        post = {
            "title": item["title"],
            "visibility": item.get("visibility", visibility),
            "contentType": "video",
            "description": item.get("description", ""),
        }
        if item.get("video_url"):
            post["bucketVideoUrl"] = item["video_url"]
        if item.get("thumbnail_url"):
            post["thumbnailUrl"] = item["thumbnail_url"]
        if item.get("materials"):
            post["postMaterials"] = item["materials"]
        categories[module].append(post)

    product = {
        "title": product_title,
        "description": product_description,
        "categories": [
            {
                "title": module,
                "visibility": visibility,
                "posts": categories[module],
            }
            for module in order
        ],
    }
    if image_url:
        product["imageUrl"] = image_url
    if instructor:
        product["instructorDetails"] = instructor

    payload = {"locationId": loc_id, "products": [product]}
    if user_id:
        payload["userId"] = user_id
    return payload


def collect_items(only=None):
    """Every video that has been uploaded to the media library, in registry
    order, with the urls the import needs."""
    rows = registry.load()
    if only:
        wanted = {s.strip() for s in only.split(",") if s.strip()}
        rows = [r for r in rows if r["slug"] in wanted]
    items, skipped = [], []
    for row in rows:
        slug = row["slug"]
        man = Manifest(slug)
        ghl = man.get("ghl", {})
        video_url = (ghl.get("video") or {}).get("url")
        if not video_url or video_url == "(dry-run)":
            skipped.append(slug)
            continue
        items.append({
            "slug": slug,
            "title": row.get("title") or slug,
            "module": row.get("module") or "",
            "description": row.get("notes") or "",
            "video_url": video_url,
            "thumbnail_url": (ghl.get("thumbnail") or {}).get("url"),
        })
    return items, skipped


def cmd_course(args):
    items, skipped = collect_items(args.only)
    if not items:
        die("no videos have been uploaded yet. Run publish.py media <slug> "
            "--confirm first.")
    if skipped:
        log("not yet uploaded, leaving out: %s" % ", ".join(skipped))

    payload = build_course_payload(
        location_id(),
        args.title or cfg("GHL_COURSE_TITLE", required=True),
        args.description or cfg("GHL_COURSE_DESCRIPTION", ""),
        items,
        user_id=cfg("GHL_USER_ID") or None,
        image_url=cfg("GHL_COURSE_IMAGE_URL") or None,
        instructor=({"name": cfg("GF_PRESENTER", ""),
                     "description": cfg("GHL_INSTRUCTOR_BIO", "")}
                    if cfg("GHL_INSTRUCTOR_BIO") else None),
        visibility=args.visibility,
    )

    if args.payload_only or not args.confirm:
        if not args.payload_only:
            log("DRY RUN. Nothing is sent. Add --confirm to import for real.\n")
        cats = payload["products"][0]["categories"]
        log("location   %s" % payload["locationId"])
        log("product    %s" % payload["products"][0]["title"])
        log("visibility %s" % args.visibility)
        for cat in cats:
            log("  %-28s %d video(s)" % (cat["title"], len(cat["posts"])))
        print(json.dumps(payload, indent=2))
        return 0

    log("importing %d video(s) into location %s"
        % (sum(len(c["posts"]) for c in payload["products"][0]["categories"]),
           payload["locationId"]))
    res = http_json("%s/courses/courses-exporter/public/import" % API,
                    method="POST",
                    headers=headers({"Content-Type": "application/json"}),
                    payload=payload)
    log("import accepted: %s" % json.dumps(res)[:400])
    for item in items:
        registry_set(item["slug"], "--status", "published")
    return 0


def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="cmd", required=True)

    sub.add_parser("probe").set_defaults(func=cmd_probe)

    m = sub.add_parser("media")
    m.add_argument("slug")
    m.add_argument("--confirm", action="store_true", help="actually upload")
    m.add_argument("--hosted", metavar="URL",
                   help="public URL of the video; HighLevel fetches it instead "
                        "of us pushing the bytes")
    m.set_defaults(func=cmd_media)

    c = sub.add_parser("course")
    c.add_argument("--title")
    c.add_argument("--description")
    c.add_argument("--only", help="comma separated slugs")
    c.add_argument("--visibility", choices=["draft", "published"], default="draft",
                   help="draft by default: import, then look before you publish")
    c.add_argument("--confirm", action="store_true", help="actually import")
    c.set_defaults(func=cmd_course, payload_only=False)

    p = sub.add_parser("payload")
    p.add_argument("--title")
    p.add_argument("--description")
    p.add_argument("--only")
    p.add_argument("--visibility", choices=["draft", "published"], default="draft")
    p.set_defaults(func=cmd_course, confirm=False, payload_only=True)

    args = ap.parse_args()
    sys.exit(args.func(args) or 0)


if __name__ == "__main__":
    main()
