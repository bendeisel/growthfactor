#!/usr/bin/env bash
# Publish a build to preview.<domain>/<slug>/ for client approval.
#
#   ./deploy_preview.sh <slug> <shell.html> [--assets <dir>]
#
# Splits the shell into noindex production pages, then uploads them file by
# file into <GF_PREVIEW_DIR>/<slug>/ on the preview website.
#
# This script CANNOT deploy an archive. The full-site deploy endpoint replaces
# a whole website, and one such call against the preview host would delete
# every client preview at once. File-by-file upload is the point, not a
# limitation.

set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck disable=SC1091
[ -f "$HERE/../config.env" ] && . "$HERE/../config.env"

die() { printf 'error: %s\n' "$*" >&2; exit 1; }

SLUG="${1:-}"; SHELL_HTML="${2:-}"; shift 2 || true
ASSETS=""
while [ $# -gt 0 ]; do
  case "$1" in
    --assets) ASSETS="${2:?--assets needs a directory}"; shift 2 ;;
    *) die "unknown option: $1" ;;
  esac
done

[ -n "$SLUG" ] && [ -n "$SHELL_HTML" ] || die "usage: deploy_preview.sh <slug> <shell.html> [--assets <dir>]"
[ -f "$SHELL_HTML" ] || die "no such file: $SHELL_HTML"
printf '%s' "$SLUG" | grep -Eq '^[a-z0-9]+(-[a-z0-9]+)*$' \
  || die "slug '$SLUG' must be lowercase a-z0-9 with dashes"

: "${GF_PREVIEW_DOMAIN:?set GF_PREVIEW_DOMAIN in config.env}"
: "${GF_PREVIEW_DIR:?set GF_PREVIEW_DIR in config.env}"
: "${GF_PREVIEW_HOST:?set GF_PREVIEW_HOST in config.env}"

BUILD="$(mktemp -d)"
trap 'rm -rf "$BUILD"' EXIT

echo "==> splitting $SHELL_HTML (noindex)"
python3 "$HERE/split_pages.py" "$SHELL_HTML" -o "$BUILD" --noindex

if [ -n "$ASSETS" ]; then
  [ -d "$ASSETS" ] || die "no such assets directory: $ASSETS"
  echo "==> adding assets from $ASSETS"
  cp -r "$ASSETS" "$BUILD/"
fi

# A preview must never be crawlable: it is a byte-identical copy of the
# client's site on a domain we own, so it competes with their real site.
# split_pages.py --noindex writes both the meta tag and this file; the check
# is here because a missing robots.txt is silent and an indexed preview is not.
[ -f "$BUILD/robots.txt" ] || die "expected a robots.txt from --noindex; refusing to publish a crawlable preview"
grep -q 'Disallow: /' "$BUILD/robots.txt" || die "robots.txt is not disallow-all; refusing to publish"

echo "==> uploading to ${GF_PREVIEW_DIR}/${SLUG}/ on ${GF_PREVIEW_DOMAIN}"
COUNT=0
while IFS= read -r -d '' f; do
  REL="${f#"$BUILD"/}"
  "$HERE/hostinger.sh" upload "$GF_PREVIEW_DOMAIN" "$f" "${GF_PREVIEW_DIR}/${SLUG}/${REL}"
  COUNT=$((COUNT + 1))
done < <(find "$BUILD" -type f -print0)

URL="https://${GF_PREVIEW_HOST}/${SLUG}/"
echo "==> ${COUNT} file(s) live at ${URL}"

if python3 "$HERE/registry.py" get "$SLUG" >/dev/null 2>&1; then
  python3 "$HERE/registry.py" set "$SLUG" --status preview --preview "$URL"
else
  echo "note: no registry row for '$SLUG' — add one so the build is findable:" >&2
  echo "  python3 $HERE/registry.py add --client '<name>' --slug $SLUG --preview $URL --status preview" >&2
fi

echo
echo "Send the client: ${URL}"
