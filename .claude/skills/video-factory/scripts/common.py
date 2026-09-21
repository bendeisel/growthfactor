#!/usr/bin/env python3
"""Shared plumbing for the video factory.

Config loading, job directories, the manifest that makes every step
resumable, and thin ffmpeg/ffprobe wrappers.

Import this, do not run it. Stdlib only, so nothing here needs a virtualenv.

The manifest is the whole reason a re-run is cheap. Renders cost money and
transcription costs minutes, so every step writes what it produced into
manifest.json and skips itself on the next run unless --force is passed.
"""

import json
import os
import shutil
import subprocess
import sys
import tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
SKILL = os.path.abspath(os.path.join(HERE, os.pardir))
REPO = os.path.abspath(os.path.join(SKILL, os.pardir, os.pardir, os.pardir))
JOBS = os.path.join(REPO, "video", "jobs")

_CONFIG = None

# Environment variables this pipeline will adopt. GF_ is our own settings,
# GHL_ is everything aimed at GoHighLevel.
ENV_PREFIXES = ("GF_", "GHL_")
THIRD_PARTY_KEYS = ("HEYGEN_API_KEY", "ANTHROPIC_API_KEY", "OPENAI_API_KEY")


def log(msg):
    print(msg, file=sys.stderr, flush=True)


def die(msg, code=1):
    print("error: %s" % msg, file=sys.stderr, flush=True)
    sys.exit(code)


def load_config():
    """config.env, then the real environment on top so a shell export wins."""
    global _CONFIG
    if _CONFIG is not None:
        return _CONFIG
    values = {}
    path = os.path.join(SKILL, "config.env")
    if os.path.exists(path):
        with open(path, encoding="utf-8") as fh:
            for line in fh:
                line = line.strip()
                if not line or line.startswith("#") or "=" not in line:
                    continue
                key, _, val = line.partition("=")
                values[key.strip()] = val.strip().strip('"').strip("'")
    # Anything namespaced to this pipeline, plus the third-party keys, which
    # have names we do not get to choose. Miss a prefix here and an exported
    # variable is silently ignored, which looks exactly like a missing key.
    values.update({k: v for k, v in os.environ.items()
                   if k.startswith(ENV_PREFIXES)})
    for k in THIRD_PARTY_KEYS:
        if os.environ.get(k):
            values[k] = os.environ[k]
    _CONFIG = values
    return _CONFIG


def cfg(key, default=None, required=False):
    val = load_config().get(key) or default
    if required and not val:
        die("%s is not set. Copy config.example.env to config.env and fill it in." % key)
    return val


def cfg_float(key, default):
    try:
        return float(cfg(key, default))
    except (TypeError, ValueError):
        return float(default)


def cfg_int(key, default):
    try:
        return int(float(cfg(key, default)))
    except (TypeError, ValueError):
        return int(default)


def job_dir(slug, create=True):
    path = os.path.join(JOBS, slug)
    if create:
        for sub in ("work", "work/avatar", "work/clips", "out"):
            os.makedirs(os.path.join(path, sub), exist_ok=True)
    return path


class Manifest(object):
    """Job state on disk. Every step reads it, writes it, and leaves enough
    behind that the next run can skip work already paid for."""

    def __init__(self, slug):
        self.slug = slug
        self.dir = job_dir(slug)
        self.path = os.path.join(self.dir, "manifest.json")
        self.data = {"slug": slug, "steps": {}}
        if os.path.exists(self.path):
            with open(self.path, encoding="utf-8") as fh:
                self.data = json.load(fh)
        self.data.setdefault("steps", {})

    def save(self):
        tmp = self.path + ".tmp"
        with open(tmp, "w", encoding="utf-8") as fh:
            json.dump(self.data, fh, indent=2, ensure_ascii=False)
            fh.write("\n")
        os.replace(tmp, self.path)

    def done(self, step):
        return bool(self.data["steps"].get(step, {}).get("ok"))

    def mark(self, step, **info):
        info["ok"] = True
        self.data["steps"][step] = info
        self.save()

    def clear(self, step):
        self.data["steps"].pop(step, None)
        self.save()

    def get(self, key, default=None):
        return self.data.get(key, default)

    def set(self, key, value):
        self.data[key] = value
        self.save()


def read_json(path):
    with open(path, encoding="utf-8") as fh:
        return json.load(fh)


def write_json(path, obj):
    tmp = path + ".tmp"
    with open(tmp, "w", encoding="utf-8") as fh:
        json.dump(obj, fh, indent=2, ensure_ascii=False)
        fh.write("\n")
    os.replace(tmp, path)


def require_binary(name):
    found = shutil.which(name)
    if not found:
        die("%s is not on PATH. See the skill's Setup section." % name)
    return found


def run(cmd, quiet=True):
    """Run a command, raise with the tail of stderr on failure.

    ffmpeg writes a wall of banner text to stderr on every invocation, so
    only the last lines are worth showing when something breaks.
    """
    proc = subprocess.run(
        cmd,
        stdout=subprocess.PIPE if quiet else None,
        stderr=subprocess.PIPE if quiet else None,
        text=True,
    )
    if proc.returncode != 0:
        tail = ""
        if quiet and proc.stderr:
            tail = "\n".join(proc.stderr.strip().splitlines()[-12:])
        die("%s failed (exit %d)\n%s" % (cmd[0], proc.returncode, tail))
    return proc.stdout or ""


def probe_duration(path):
    require_binary("ffprobe")
    out = run([
        "ffprobe", "-v", "error",
        "-show_entries", "format=duration",
        "-of", "default=noprint_wrappers=1:nokey=1",
        path,
    ])
    try:
        return float(out.strip())
    except ValueError:
        die("could not read a duration from %s" % path)


def probe_size(path):
    require_binary("ffprobe")
    out = run([
        "ffprobe", "-v", "error",
        "-select_streams", "v:0",
        "-show_entries", "stream=width,height",
        "-of", "csv=p=0:s=x",
        path,
    ]).strip()
    try:
        w, h = out.split("x")[:2]
        return int(w), int(h)
    except ValueError:
        die("could not read a frame size from %s" % path)


def http_json(url, method="GET", headers=None, payload=None, timeout=120):
    """One JSON request. urllib rather than requests so there is no install
    step for anyone picking this up on a fresh machine."""
    import urllib.error
    import urllib.request

    data = None
    headers = dict(headers or {})
    if payload is not None:
        data = json.dumps(payload).encode("utf-8")
        headers.setdefault("Content-Type", "application/json")
    headers.setdefault("Accept", "application/json")
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            body = resp.read().decode("utf-8")
    except urllib.error.HTTPError as exc:
        body = exc.read().decode("utf-8", "replace")
        die("HTTP %s on %s %s\n%s" % (exc.code, method, url, body[:2000]))
    except urllib.error.URLError as exc:
        die("could not reach %s: %s" % (url, exc.reason))
    try:
        return json.loads(body)
    except ValueError:
        die("non-JSON response from %s:\n%s" % (url, body[:500]))


def download(url, dest, timeout=600):
    import urllib.request
    tmp = dest + ".part"
    with urllib.request.urlopen(url, timeout=timeout) as resp, open(tmp, "wb") as fh:
        shutil.copyfileobj(resp, fh)
    os.replace(tmp, dest)
    return dest


def fmt_ts(seconds):
    m, s = divmod(float(seconds), 60)
    h, m = divmod(int(m), 60)
    return "%d:%02d:%05.2f" % (h, m, s)


def multipart_to_file(fields, files, dest):
    """Write a multipart/form-data body to disk and return (path, content_type).

    On disk rather than in memory on purpose: a finished walkthrough is
    routinely a few hundred megabytes, and building that body as a bytes
    object means holding the whole video in RAM twice.

    `fields` is a list of (name, value). `files` is a list of
    (field_name, filename, path_on_disk).
    """
    import uuid
    boundary = "----gf%s" % uuid.uuid4().hex
    crlf = b"\r\n"
    with open(dest, "wb") as out:
        for name, value in fields:
            out.write(("--%s" % boundary).encode() + crlf)
            out.write(('Content-Disposition: form-data; name="%s"' % name).encode() + crlf)
            out.write(crlf)
            out.write(str(value).encode() + crlf)
        for name, filename, path in files:
            out.write(("--%s" % boundary).encode() + crlf)
            out.write((
                'Content-Disposition: form-data; name="%s"; filename="%s"'
                % (name, filename)).encode() + crlf)
            out.write(("Content-Type: %s" % guess_type(filename)).encode() + crlf)
            out.write(crlf)
            with open(path, "rb") as fh:
                shutil.copyfileobj(fh, out, 1024 * 1024)
            out.write(crlf)
        out.write(("--%s--" % boundary).encode() + crlf)
    return dest, "multipart/form-data; boundary=%s" % boundary


def guess_type(filename):
    import mimetypes
    return mimetypes.guess_type(filename)[0] or "application/octet-stream"


def post_multipart(url, hdrs, fields, files, timeout=3600, error_hints=None):
    """POST a multipart body that is streamed from disk, and parse the JSON.

    The one multipart implementation in this codebase. Both the transcription
    upload and the media upload go through it, so there is a single place
    where a boundary bug or a header mistake can live.

    `error_hints` maps an HTTP status to a sentence worth more than the raw
    body, e.g. {401: "the token lacks medias.write"}.
    """
    import urllib.error
    import urllib.request

    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".multipart")
    tmp.close()
    try:
        body_path, content_type = multipart_to_file(fields, files, tmp.name)
        size = os.path.getsize(body_path)
        with open(body_path, "rb") as body:
            req = urllib.request.Request(url, data=body, method="POST")
            for key, value in (hdrs or {}).items():
                req.add_header(key, value)
            req.add_header("Content-Type", content_type)
            req.add_header("Content-Length", str(size))
            try:
                with urllib.request.urlopen(req, timeout=timeout) as resp:
                    raw = resp.read().decode("utf-8")
            except urllib.error.HTTPError as exc:
                detail = exc.read().decode("utf-8", "replace")[:1500]
                hint = (error_hints or {}).get(exc.code)
                die("HTTP %s posting to %s%s\n%s"
                    % (exc.code, url, "\n" + hint if hint else "", detail))
            except urllib.error.URLError as exc:
                die("could not reach %s: %s" % (url, exc.reason))
    finally:
        if os.path.exists(tmp.name):
            os.unlink(tmp.name)
    try:
        return json.loads(raw)
    except ValueError:
        die("non-JSON response from %s:\n%s" % (url, raw[:500]))
