#!/usr/bin/env bash
# Growth Factor <-> Hostinger API. Endpoints verified against Hostinger's
# OpenAPI spec; see references/hostinger-api.md.
#
#   ./hostinger.sh websites                        list websites
#   ./hostinger.sh username <domain>               resolve the hosting account
#   ./hostinger.sh subdomains <domain>             list subdomains
#   ./hostinger.sh subdomain-add                   create the preview host (once)
#   ./hostinger.sh upload <domain> <file> <dest>   TUS upload into public_html
#   ./hostinger.sh files <domain> [path]           list remote files
#   ./hostinger.sh deploy-archive <domain> <path>  DESTRUCTIVE full-site deploy
#   ./hostinger.sh cache-clear <domain>
#
# Plain curl on purpose: no install step, and legible failures. An official
# CLI, SDKs and an MCP server exist and hit the same endpoints.

set -euo pipefail

API="https://developers.hostinger.com"
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# shellcheck disable=SC1091
[ -f "$HERE/../config.env" ] && . "$HERE/../config.env"

: "${HOSTINGER_API_TOKEN:?set HOSTINGER_API_TOKEN in config.env (copy config.example.env)}"

die() { printf 'error: %s\n' "$*" >&2; exit 1; }
note() { printf '%s\n' "$*" >&2; }

# JSON via python3 rather than jq: python3 is always here, jq may not be.
jget() { python3 -c 'import json,sys;
d=json.load(sys.stdin)
for k in sys.argv[1:]:
    d = d[int(k)] if isinstance(d, list) else d.get(k, "")
print(d if not isinstance(d,(dict,list)) else json.dumps(d))' "$@"; }

api() {
  local method="$1" path="$2" body="${3:-}"
  local args=(-sS -X "$method" "${API}${path}"
    -H "Authorization: Bearer ${HOSTINGER_API_TOKEN}"
    -H "Accept: application/json")
  [ -n "$body" ] && args+=(-H "Content-Type: application/json" -d "$body")
  local out code
  out="$(curl "${args[@]}" -w '\n%{http_code}')" || die "curl failed on $method $path"
  code="${out##*$'\n'}"
  out="${out%$'\n'*}"
  case "$code" in
    2*) printf '%s' "$out" ;;
    401|403) die "HTTP $code — token rejected or lacks scope. Response: $out" ;;
    429) die "HTTP 429 — rate limited. Wait and retry; do not loop." ;;
    *) die "HTTP $code on $method $path. Response: $out" ;;
  esac
}

resolve_username() {
  local domain="$1"
  api GET "/api/hosting/v1/websites?per_page=100" | python3 -c '
import json,sys
d=json.load(sys.stdin); want=sys.argv[1]
for w in d.get("data",[]):
    if w.get("domain")==want:
        u=w.get("username") or ""
        if not u:
            sys.exit("error: website %s has no username (type=%s) — not a "
                     "CloudLinux site, so file upload does not apply"
                     % (want, w.get("website_type")))
        print(u); break
else:
    sys.exit("error: no website %r on this account. Run `hostinger.sh websites`." % want)
' "$domain"
}

cmd_websites() {
  api GET "/api/hosting/v1/websites?per_page=100" | python3 -c '
import json,sys
d=json.load(sys.stdin); rows=d.get("data",[])
if not rows: print("no websites"); raise SystemExit
w=max(len(r.get("domain") or "") for r in rows)
print("%-*s  %-13s  %-11s  %s" % (w,"DOMAIN","USERNAME","TYPE","ENABLED"))
for r in rows:
    print("%-*s  %-13s  %-11s  %s" % (w, r.get("domain") or "",
          r.get("username") or "-", r.get("website_type") or "-",
          r.get("is_enabled")))'
}

cmd_username() { resolve_username "${1:?usage: username <domain>}"; }

cmd_subdomains() {
  local d="${1:?usage: subdomains <domain>}" u
  u="$(resolve_username "$d")"
  api GET "/api/hosting/v1/accounts/${u}/websites/${d}/subdomains"
  echo
}

cmd_subdomain_add() {
  : "${GF_PREVIEW_DOMAIN:?set GF_PREVIEW_DOMAIN in config.env}"
  : "${GF_PREVIEW_SUBDOMAIN:?set GF_PREVIEW_SUBDOMAIN in config.env}"
  : "${GF_PREVIEW_DIR:?set GF_PREVIEW_DIR in config.env}"
  local u; u="$(resolve_username "$GF_PREVIEW_DOMAIN")"
  note "creating ${GF_PREVIEW_SUBDOMAIN}.${GF_PREVIEW_DOMAIN} -> ${GF_PREVIEW_DIR}/"
  api POST "/api/hosting/v1/accounts/${u}/websites/${GF_PREVIEW_DOMAIN}/subdomains" \
    "$(python3 -c 'import json,sys;print(json.dumps({
        "subdomain": sys.argv[1], "directory": sys.argv[2],
        "is_using_public_directory": False}))' \
        "$GF_PREVIEW_SUBDOMAIN" "$GF_PREVIEW_DIR")"
  echo
  note "done. SSL may take a few minutes to issue."
}

# upload <domain> <local-file> <dest-relative-to-public_html>
cmd_upload() {
  local domain="${1:?usage: upload <domain> <file> <dest>}"
  local file="${2:?missing local file}"
  local dest="${3:?missing destination path}"
  [ -f "$file" ] || die "no such file: $file"

  local u; u="$(resolve_username "$domain")"
  local creds url auth rest size
  creds="$(api POST "/api/hosting/v1/files/upload-urls" \
    "$(python3 -c 'import json,sys;print(json.dumps({"username":sys.argv[1],"domain":sys.argv[2]}))' \
       "$u" "$domain")")"
  url="$(printf '%s' "$creds" | jget url)"
  auth="$(printf '%s' "$creds" | jget auth_key)"
  rest="$(printf '%s' "$creds" | jget rest_auth_key)"
  [ -n "$url" ] || die "no upload url returned: $creds"
  url="${url%/}"
  size="$(stat -c%s "$file" 2>/dev/null || stat -f%z "$file")"

  local target="${url}/${dest}?override=true"

  # 1. create the upload
  local code
  code="$(curl -sS -o /dev/null -w '%{http_code}' -X POST "$target" \
    -H "X-Auth: ${auth}" -H "X-Auth-Rest: ${rest}" \
    -H "Tus-Resumable: 1.0.0" \
    -H "Upload-Length: ${size}" -H "Upload-Offset: 0")"
  [ "$code" = "201" ] || die "create upload for ${dest} returned HTTP ${code} (wanted 201)"

  # 2. send the bytes, then verify the server agrees on the length. A partial
  #    upload that still answers 204 is the worst outcome available, so this
  #    check is not optional.
  local hdrs offset
  hdrs="$(mktemp)"
  code="$(curl -sS -o /dev/null -D "$hdrs" -w '%{http_code}' -X PATCH "$target" \
    -H "X-Auth: ${auth}" -H "X-Auth-Rest: ${rest}" \
    -H "Tus-Resumable: 1.0.0" \
    -H "Content-Type: application/offset+octet-stream" \
    -H "Upload-Offset: 0" \
    --data-binary "@${file}")"
  offset="$(tr -d '\r' < "$hdrs" | awk -F': ' 'tolower($1)=="upload-offset"{print $2}' | tail -1)"
  rm -f "$hdrs"
  [ "$code" = "204" ] || die "upload of ${dest} returned HTTP ${code} (wanted 204)"
  if [ -n "$offset" ] && [ "$offset" != "$size" ]; then
    die "upload of ${dest} incomplete: server has ${offset} of ${size} bytes"
  fi
  printf '  uploaded %s (%s bytes)\n' "$dest" "$size"
}

cmd_files() {
  local d="${1:?usage: files <domain> [path]}" p="${2:-}" u
  u="$(resolve_username "$d")"
  api GET "/api/hosting/v1/accounts/${u}/domains/${d}/files?path=${p}"
  echo
}

cmd_cache_clear() {
  local d="${1:?usage: cache-clear <domain>}" u
  u="$(resolve_username "$d")"
  api DELETE "/api/hosting/v1/accounts/${u}/websites/${d}/cache/clear"
  echo
}

# DESTRUCTIVE: replaces the entire contents of the website.
cmd_deploy_archive() {
  local domain="${1:?usage: deploy-archive <domain> <archive-path-in-public_html>}"
  local archive="${2:?missing archive path}"

  if [ -n "${GF_PREVIEW_DOMAIN:-}" ] && [ "$domain" = "$GF_PREVIEW_DOMAIN" ]; then
    die "refusing to deploy to the preview website (${domain}).
This endpoint replaces a whole website, which would delete every client
preview at once. Previews are uploaded file by file — use deploy_preview.sh."
  fi

  note "WARNING: this REPLACES all contents of ${domain}. It cannot be undone."
  if [ "${GF_YES:-}" != "1" ]; then
    if [ -t 0 ]; then
      read -r -p "Type the domain to confirm: " typed
      [ "$typed" = "$domain" ] || die "confirmation did not match; nothing deployed"
    else
      die "refusing to deploy unattended. Re-run with GF_YES=1 if this is intended."
    fi
  fi

  local u; u="$(resolve_username "$domain")"
  api POST "/api/hosting/v1/accounts/${u}/websites/${domain}/deploy" \
    "$(python3 -c 'import json,sys;print(json.dumps({"archive_path":sys.argv[1]}))' "$archive")"
  echo
}

case "${1:-}" in
  websites)       shift; cmd_websites "$@" ;;
  username)       shift; cmd_username "$@" ;;
  subdomains)     shift; cmd_subdomains "$@" ;;
  subdomain-add)  shift; cmd_subdomain_add "$@" ;;
  upload)         shift; cmd_upload "$@" ;;
  files)          shift; cmd_files "$@" ;;
  cache-clear)    shift; cmd_cache_clear "$@" ;;
  deploy-archive) shift; cmd_deploy_archive "$@" ;;
  *) sed -n '2,20p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'; exit 1 ;;
esac
