#!/usr/bin/env python3
"""Shared plumbing for the Growth Factor ad and measurement CLIs.

Config loading, the Google access token cache, HTTP with legible failures,
the write gate, and table output. Stdlib only, so there is no install step
and nothing to keep in sync.

Why Python here when site-factory uses bash and curl: the payloads on this
side are real JSON documents (GAQL result sets, GA4 report bodies, Meta
insights with nested action arrays) rather than the flat responses the
Hostinger endpoints return. The same rationale that made bash right there,
legible failures and no dependencies, makes Python stdlib right here.
"""

import json
import os
import re
import ssl
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
SKILL_DIR = os.path.abspath(os.path.join(HERE, os.pardir))
CONFIG_PATH = os.path.join(SKILL_DIR, "config.env")
EXAMPLE_PATH = os.path.join(SKILL_DIR, "config.example.env")

# Exit codes, so a caller can tell a refusal from a failure.
EXIT_CONFIG = 1
EXIT_API = 2
EXIT_REFUSED = 3

GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"

# Every scope the one Google refresh token needs to cover. Ads, Tag Manager,
# Search Console and Analytics on a single token: the whole point of the
# agency-owned credential model.
GOOGLE_SCOPES = [
    "https://www.googleapis.com/auth/adwords",
    "https://www.googleapis.com/auth/tagmanager.readonly",
    "https://www.googleapis.com/auth/tagmanager.edit.containers",
    "https://www.googleapis.com/auth/tagmanager.edit.containerversions",
    "https://www.googleapis.com/auth/tagmanager.publish",
    "https://www.googleapis.com/auth/webmasters",
    "https://www.googleapis.com/auth/analytics.readonly",
    "https://www.googleapis.com/auth/analytics.edit",
]


def die(msg, code=EXIT_CONFIG):
    sys.stderr.write("error: %s\n" % msg)
    raise SystemExit(code)


def note(msg):
    sys.stderr.write("%s\n" % msg)


# --------------------------------------------------------------------------
# Config
# --------------------------------------------------------------------------

_config = None


def config():
    """Read config.env once. Real environment variables win, so a one-off
    override does not mean editing the file."""
    global _config
    if _config is not None:
        return _config
    conf = {}
    if os.path.exists(CONFIG_PATH):
        with open(CONFIG_PATH, encoding="utf-8") as fh:
            for line in fh:
                line = line.strip()
                if not line or line.startswith("#") or "=" not in line:
                    continue
                k, v = line.split("=", 1)
                conf[k.strip()] = v.strip().strip('"').strip("'")
    for k in list(conf) + [
        "GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "GOOGLE_REFRESH_TOKEN",
        "GOOGLE_ADS_DEVELOPER_TOKEN", "GOOGLE_ADS_LOGIN_CUSTOMER_ID",
        "GOOGLE_ADS_API_VERSION", "META_APP_ID", "META_APP_SECRET",
        "META_SYSTEM_USER_TOKEN", "META_BUSINESS_ID", "META_API_VERSION",
    ]:
        if os.environ.get(k):
            conf[k] = os.environ[k]
    _config = conf
    return conf


def need(key, why):
    """Fetch a required config value or refuse. Never guess at a customer ID
    or an API version: a wrong guess here reads real client accounts."""
    val = config().get(key, "")
    if not val:
        hint = "cp %s %s" % (
            os.path.relpath(EXAMPLE_PATH, os.getcwd()),
            os.path.relpath(CONFIG_PATH, os.getcwd()),
        )
        die("%s is not set in config.env. %s\n       (%s, then fill it in)"
            % (key, why, hint))
    return val


def has(key):
    return bool(config().get(key, ""))


# --------------------------------------------------------------------------
# HTTP
# --------------------------------------------------------------------------

def request(method, url, headers=None, body=None, timeout=90):
    """One HTTP call. Returns parsed JSON. Maps the failures that actually
    happen on these APIs onto messages that say what to do about them."""
    data = None
    headers = dict(headers or {})
    if body is not None:
        if isinstance(body, (dict, list)):
            data = json.dumps(body).encode("utf-8")
            headers.setdefault("Content-Type", "application/json")
        else:
            data = body.encode("utf-8") if isinstance(body, str) else body
    headers.setdefault("Accept", "application/json")
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    ctx = ssl.create_default_context()
    try:
        with urllib.request.urlopen(req, timeout=timeout, context=ctx) as resp:
            raw = resp.read().decode("utf-8", "replace")
    except urllib.error.HTTPError as exc:
        raw = exc.read().decode("utf-8", "replace")
        _raise_api_error(exc.code, method, url, raw)
    except urllib.error.URLError as exc:
        die("cannot reach %s: %s" % (urllib.parse.urlsplit(url).netloc, exc.reason),
            EXIT_API)
    if not raw.strip():
        return {}
    try:
        return json.loads(raw)
    except ValueError:
        die("%s %s returned non-JSON: %s" % (method, url, raw[:400]), EXIT_API)


def _raise_api_error(code, method, url, raw):
    host = urllib.parse.urlsplit(url).netloc
    detail = raw[:1200]
    oauth_hint = ""

    # An error handler that throws is worse than the error it was handed, so
    # every shape below is treated as untrusted. Three real shapes exist:
    #   Google APIs   {"error": {"message": ..., "details": [...]}}
    #   Google OAuth  {"error": "invalid_grant", "error_description": ...}
    #                 <- note: "error" is a STRING here, not an object
    #   Meta Graph    {"error": {"message": ..., "error_user_msg": ...}}
    try:
        parsed = json.loads(raw)
        if isinstance(parsed, list) and parsed:
            parsed = parsed[0]
        if isinstance(parsed, dict):
            err = parsed.get("error", parsed)
            if isinstance(err, str):
                # OAuth form. The description carries the actionable part.
                msg = " ".join(x for x in [err, parsed.get("error_description")] if x)
                if err == "invalid_grant":
                    oauth_hint = (
                        "\n       invalid_grant means the refresh token is dead, "
                        "not that the request was malformed. Causes: the Google "
                        "password changed, access was revoked, or the OAuth "
                        "consent screen is still in Testing (which expires "
                        "tokens after 7 days). Re-mint it: "
                        "python3 scripts/google_oauth_setup.py")
            elif isinstance(err, dict):
                msg = err.get("message") or err.get("error_user_msg") or ""
                # Google Ads packs the useful part into errors[].message.
                details = err.get("details")
                for sub in (details if isinstance(details, list) else []):
                    if not isinstance(sub, dict):
                        continue
                    errs = sub.get("errors")
                    for e in (errs if isinstance(errs, list) else []):
                        if isinstance(e, dict) and e.get("message"):
                            msg = "%s | %s" % (msg, e["message"]) if msg else e["message"]
            else:
                msg = ""
            if msg:
                detail = msg
    except (ValueError, AttributeError, TypeError):
        pass  # keep the raw body; a mangled parse must not mask the failure

    if oauth_hint:
        die("HTTP %d on %s %s\n       %s%s" % (code, method, url, detail, oauth_hint),
            EXIT_CONFIG)
    if code in (401, 403):
        extra = ""
        if "googleads" in host:
            extra = ("\n       Usual causes: the refresh token is missing the "
                     "adwords scope, GOOGLE_ADS_LOGIN_CUSTOMER_ID is not the "
                     "MCC that manages this account, or the developer token "
                     "has no access to it.")
        elif "graph.facebook" in host:
            extra = ("\n       Usual causes: the system user is not assigned "
                     "to this ad account, or the token is missing ads_read.")
        elif "tagmanager" in host or "analytics" in host or "searchconsole" in host:
            extra = ("\n       Usual cause: the refresh token predates a scope "
                     "you now need. Re-mint it: "
                     "python3 scripts/google_oauth_setup.py")
        die("HTTP %d on %s %s\n       %s%s" % (code, method, url, detail, extra),
            EXIT_API)
    if code == 404:
        die("HTTP 404 on %s %s\n       %s" % (method, url, detail), EXIT_API)
    if code == 429:
        die("HTTP 429 rate limited by %s. Wait and retry; do not loop.\n       %s"
            % (host, detail), EXIT_API)
    die("HTTP %d on %s %s\n       %s" % (code, method, url, detail), EXIT_API)


# --------------------------------------------------------------------------
# Google access tokens
# --------------------------------------------------------------------------

def _token_cache_path():
    import hashlib
    key = hashlib.sha256(
        (config().get("GOOGLE_REFRESH_TOKEN", "") or "none").encode()
    ).hexdigest()[:16]
    base = os.environ.get("TMPDIR") or os.environ.get("TEMP") or "/tmp"
    return os.path.join(base, "gf-google-token-%s.json" % key)


def google_token():
    """A live Google access token, cached on disk until a minute before it
    expires. Without the cache every subcommand would mint a new one and the
    OAuth endpoint would start rate limiting on a busy reporting run."""
    path = _token_cache_path()
    try:
        with open(path, encoding="utf-8") as fh:
            cached = json.load(fh)
        if cached.get("expires_at", 0) > time.time() + 60:
            return cached["access_token"]
    except (OSError, ValueError, KeyError):
        pass

    payload = urllib.parse.urlencode({
        "client_id": need("GOOGLE_CLIENT_ID", "needed to refresh a Google token"),
        "client_secret": need("GOOGLE_CLIENT_SECRET", "needed to refresh a Google token"),
        "refresh_token": need(
            "GOOGLE_REFRESH_TOKEN",
            "needed for every Google call. Mint it with "
            "python3 scripts/google_oauth_setup.py"),
        "grant_type": "refresh_token",
    })
    got = request("POST", GOOGLE_TOKEN_URL,
                  headers={"Content-Type": "application/x-www-form-urlencoded"},
                  body=payload)
    if "access_token" not in got:
        die("Google refused the refresh token: %s" % json.dumps(got)[:400], EXIT_API)
    try:
        fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
        with os.fdopen(fd, "w", encoding="utf-8") as fh:
            json.dump({"access_token": got["access_token"],
                       "expires_at": time.time() + int(got.get("expires_in", 3600))}, fh)
    except OSError:
        pass  # a token that cannot be cached still works, just slower
    return got["access_token"]


def google_headers(extra=None):
    h = {"Authorization": "Bearer %s" % google_token()}
    h.update(extra or {})
    return h


# --------------------------------------------------------------------------
# Meta
# --------------------------------------------------------------------------

def meta_version():
    return config().get("META_API_VERSION") or "v26.0"


def meta_get(path, params=None):
    params = dict(params or {})
    params["access_token"] = need(
        "META_SYSTEM_USER_TOKEN",
        "needed for every Meta call. See references/auth-setup.md")
    url = "https://graph.facebook.com/%s/%s?%s" % (
        meta_version(), path.lstrip("/"), urllib.parse.urlencode(params))
    return request("GET", url)


def meta_post(path, params):
    token = need("META_SYSTEM_USER_TOKEN", "needed for every Meta call")
    url = "https://graph.facebook.com/%s/%s" % (meta_version(), path.lstrip("/"))
    body = urllib.parse.urlencode(dict(params, access_token=token))
    return request("POST", url,
                   headers={"Content-Type": "application/x-www-form-urlencoded"},
                   body=body)


def meta_paged(path, params=None, limit_pages=25):
    """Follow Meta's cursor paging. Capped, because an unbounded follow on a
    large account is how a reporting run turns into a rate limit."""
    params = dict(params or {})
    params["access_token"] = need("META_SYSTEM_USER_TOKEN", "needed for every Meta call")
    url = "https://graph.facebook.com/%s/%s?%s" % (
        meta_version(), path.lstrip("/"), urllib.parse.urlencode(params))
    rows, pages = [], 0
    while url and pages < limit_pages:
        got = request("GET", url)
        rows.extend(got.get("data") or [])
        url = (got.get("paging") or {}).get("next")
        pages += 1
    if url:
        note("note: stopped after %d pages; more data remains" % limit_pages)
    return rows


# --------------------------------------------------------------------------
# The write gate
# --------------------------------------------------------------------------

def gate(confirmed, what, payload=None):
    """Every mutating subcommand runs through here.

    Reads are open. Writes print exactly what they would send and exit 3
    unless --confirm was passed. This is the whole safety model: an agent
    loop that reasons its way into pausing a client's campaigns still cannot
    do it without a human having typed --confirm on that command.
    """
    if confirmed:
        return True
    note("REFUSED: %s" % what)
    if payload is not None:
        note("Would send:")
        note(json.dumps(payload, indent=2))
    note("")
    note("Nothing was changed. Re-run the same command with --confirm to do it.")
    raise SystemExit(EXIT_REFUSED)


# --------------------------------------------------------------------------
# Output
# --------------------------------------------------------------------------

def out(rows, columns=None, as_json=False, empty="no rows"):
    """Print rows as an aligned table, or raw JSON for piping onward."""
    if as_json:
        print(json.dumps(rows, indent=2, default=str))
        return
    if not rows:
        note(empty)
        return
    if isinstance(rows, dict):
        rows = [rows]
    columns = columns or list(rows[0].keys())
    widths = [len(c) for c in columns]
    text = []
    for row in rows:
        cells = ["" if row.get(c) is None else str(row.get(c)) for c in columns]
        widths = [max(w, len(c)) for w, c in zip(widths, cells)]
        text.append(cells)
    fmt = "  ".join("{:<%d}" % w for w in widths)
    print(fmt.format(*columns).rstrip())
    print(fmt.format(*["-" * w for w in widths]).rstrip())
    for cells in text:
        print(fmt.format(*cells).rstrip())


def money(micros):
    """Google Ads reports money in micros. Six zeros is a real reporting bug
    when it goes unconverted, so it is converted in exactly one place."""
    try:
        return round(int(micros) / 1_000_000, 2)
    except (TypeError, ValueError):
        return 0.0


def snake_to_camel(name):
    parts = name.split("_")
    return parts[0] + "".join(p.title() for p in parts[1:])


def dig(obj, dotted):
    """Read 'metrics.cost_micros' out of a Google Ads REST response.

    GAQL is written in snake_case but the REST response comes back in
    camelCase, so the field you asked for is not the key you get. Every
    lookup goes through here rather than through hand-written camelCase,
    which is the mistake that makes half a report silently read as zero.
    """
    cur = obj
    for part in dotted.split("."):
        if not isinstance(cur, dict):
            return None
        if part in cur:
            cur = cur[part]
        else:
            camel = snake_to_camel(part)
            if camel not in cur:
                return None
            cur = cur[camel]
    return cur


def json_parent():
    """A parent parser carrying --json, so the flag works on both sides of the
    subcommand.

    argparse does not share a top-level flag with subparsers, so `report
    acme --json` is a usage error unless every subparser also defines it.
    Defining it twice normally breaks the other way, the subparser default
    overwriting a top-level --json with False, which SUPPRESS prevents.
    """
    import argparse
    parent = argparse.ArgumentParser(add_help=False)
    parent.add_argument("--json", action="store_true",
                        default=argparse.SUPPRESS, help="raw JSON output")
    return parent


DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")


def check_date(value, label):
    if value and not DATE_RE.match(value):
        die("%s must look like 2026-09-01, got %r" % (label, value))
    return value


def date_range(days):
    """A closed date range ending yesterday. Today is excluded on purpose:
    every one of these platforms is still counting today, so including it
    makes a report look like a drop."""
    import datetime
    end = datetime.date.today() - datetime.timedelta(days=1)
    start = end - datetime.timedelta(days=max(int(days), 1) - 1)
    return start.isoformat(), end.isoformat()
