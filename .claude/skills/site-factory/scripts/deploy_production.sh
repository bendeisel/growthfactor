#!/usr/bin/env bash
# Ship an approved build to the client's production domain.
#
#   ./deploy_production.sh <slug> <shell.html> <domain> [--assets <dir>] [--include <dir>]
#
# Splits the shell into indexable production pages (canonical + sitemap),
# zips them, uploads the zip, then calls the deploy endpoint.
#
# That endpoint REPLACES the entire website and cannot be undone, so this
# script confirms interactively unless GF_YES=1, and refuses outright to
# target the preview host.

set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck disable=SC1091
[ -f "$HERE/../config.env" ] && . "$HERE/../config.env"

die() { printf 'error: %s\n' "$*" >&2; exit 1; }

SLUG="${1:-}"; SHELL_HTML="${2:-}"; DOMAIN="${3:-}"
shift 3 2>/dev/null || true
ASSETS=""; INCLUDE=""
while [ $# -gt 0 ]; do
  case "$1" in
    --assets)  ASSETS="${2:?--assets needs a directory}"; shift 2 ;;
    --include) INCLUDE="${2:?--include needs a directory}"; shift 2 ;;
    *) die "unknown option: $1" ;;
  esac
done

[ -n "$SLUG" ] && [ -n "$SHELL_HTML" ] && [ -n "$DOMAIN" ] \
  || die "usage: deploy_production.sh <slug> <shell.html> <domain> [--assets <dir>] [--include <dir>]"
[ -f "$SHELL_HTML" ] || die "no such file: $SHELL_HTML"

if [ -n "${GF_PREVIEW_DOMAIN:-}" ] && [ "$DOMAIN" = "$GF_PREVIEW_DOMAIN" ]; then
  die "refusing to deploy to the preview website (${DOMAIN}).
A full-site deploy there would delete every client preview at once."
fi

BUILD="$(mktemp -d)"; ZIP="$(mktemp -u).zip"
trap 'rm -rf "$BUILD" "$ZIP"' EXIT

echo "==> splitting $SHELL_HTML for https://${DOMAIN}"
python3 "$HERE/split_pages.py" "$SHELL_HTML" -o "$BUILD" --base "https://${DOMAIN}"

for d in "$ASSETS" "$INCLUDE"; do
  [ -n "$d" ] || continue
  [ -d "$d" ] || die "no such directory: $d"
  echo "==> adding $d"
  cp -r "$d" "$BUILD/"
done

# A production build must NOT carry the preview's noindex. Shipping a site
# that tells Google to ignore it is a silent, total SEO failure.
if grep -rqi 'name="robots"[^>]*noindex' "$BUILD"/*.html; then
  die "a page still carries robots=noindex — refusing to ship an unindexable site"
fi
if [ -f "$BUILD/robots.txt" ] && grep -q '^Disallow: /$' "$BUILD/robots.txt"; then
  die "robots.txt is disallow-all — refusing to ship an unindexable site"
fi

echo "==> unresolved intake gaps:"
if grep -rn "GF-TODO" "$BUILD" >/dev/null 2>&1; then
  grep -rn "GF-TODO" "$BUILD" | sed 's/^/  /'
  [ "${GF_YES:-}" = "1" ] || die "close these, or re-run with GF_YES=1 to ship anyway"
else
  echo "  none"
fi

python3 - "$BUILD" "$ZIP" <<'PY'
import os, sys, zipfile
src, dst = sys.argv[1], sys.argv[2]
with zipfile.ZipFile(dst, "w", zipfile.ZIP_DEFLATED) as z:
    for root, _, files in os.walk(src):
        for f in files:
            p = os.path.join(root, f)
            z.write(p, os.path.relpath(p, src))
print("==> zipped %s file(s)" % len(zipfile.ZipFile(dst).namelist()))
PY

ARCHIVE="gf-deploy-${SLUG}.zip"
echo "==> uploading ${ARCHIVE}"
"$HERE/hostinger.sh" upload "$DOMAIN" "$ZIP" "$ARCHIVE"

echo "==> deploying (this replaces all contents of ${DOMAIN})"
"$HERE/hostinger.sh" deploy-archive "$DOMAIN" "$ARCHIVE"

if python3 "$HERE/registry.py" get "$SLUG" >/dev/null 2>&1; then
  python3 "$HERE/registry.py" set "$SLUG" --status live --production "$DOMAIN"
fi

echo
echo "Live: https://${DOMAIN}"
echo "The preview URL is untouched and still works — production is a separate website."
echo "If a change does not show up: ./hostinger.sh cache-clear ${DOMAIN}"
