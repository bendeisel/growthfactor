# Hostinger API — verified recipes

Everything here was read out of Hostinger's own OpenAPI spec
(`https://raw.githubusercontent.com/hostinger/api/main/openapi.json`, 291
endpoints) rather than from memory. When something behaves unexpectedly,
re-pull that spec and diff it before assuming the API changed.

- **Base URL:** `https://developers.hostinger.com`
- **Auth:** `Authorization: Bearer $HOSTINGER_API_TOKEN` on every request.
  Token comes from hPanel. The API is officially beta; treat schema drift as
  possible.
- **Official tooling exists** — a `hostinger` CLI, SDKs for PHP/Python/TypeScript,
  Terraform and Ansible providers, and a Hostinger MCP server. The scripts here
  use plain `curl` deliberately: no install step, nothing to keep in sync, and
  the failure messages stay legible. If the MCP server is connected in a
  session, using it instead is fine — the endpoints are identical.

## The four endpoints that matter

### 1. List websites — find the account username

```
GET /api/hosting/v1/websites
```

Returns `data[]` of `{domain, username, order_id, root_directory, website_type,
vhost_type, is_enabled, parent_domain, ...}` plus `meta` pagination.

`username` (like `u123456789`) is the hosting account, and almost every other
call needs it. Never hardcode it — read it from here, keyed on the domain.

### 2. Get an upload URL

```
POST /api/hosting/v1/files/upload-urls
{"username": "u123456789", "domain": "example.com"}
```

Returns:

```json
{"url": "https://srv12345-files.hstgr.io/", "auth_key": "...", "rest_auth_key": "..."}
```

Uploads land relative to that website's `public_html`. The relative path may
include subdirectories (`previews/spidersboxing/index.html`), which is the
whole basis of the preview scheme.

### 3. Upload a file — TUS 1.0.0, two calls

Send `X-Auth: {auth_key}` and `X-Auth-Rest: {rest_auth_key}` on every request.

```bash
FILE=app.zip
SIZE=$(stat -c%s "$FILE")          # -f%z on macOS

# Create the upload -> 201 Created
curl -i -X POST "${URL}/${DEST}?override=true" \
  -H "X-Auth: ${AUTH}" -H "X-Auth-Rest: ${REST}" \
  -H "Tus-Resumable: 1.0.0" \
  -H "Upload-Length: ${SIZE}" -H "Upload-Offset: 0"

# Send the bytes -> 204 No Content, response Upload-Offset == SIZE
curl -i -X PATCH "${URL}/${DEST}?override=true" \
  -H "X-Auth: ${AUTH}" -H "X-Auth-Rest: ${REST}" \
  -H "Tus-Resumable: 1.0.0" \
  -H "Content-Type: application/offset+octet-stream" \
  -H "Upload-Offset: 0" \
  --data-binary "@${FILE}"
```

Being TUS, it resumes: on a partial upload, re-`PATCH` with `Upload-Offset` set
to what the last response reported. `deploy_preview.sh` verifies the returned
offset equals the file size and fails loudly if it does not, because a
half-uploaded page that still returns HTTP 204 is the worst outcome available.

### 4. Deploy a static archive — DESTRUCTIVE

```
POST /api/hosting/v1/accounts/{username}/websites/{domain}/deploy
{"archive_path": "uploads/archive.zip"}
```

The spec's own words: *"this overwrites the website's existing contents and
cannot be undone."* Upload the zip first (call 3), then point this at it.

Static sites only. Node.js apps use `nodejs/builds`; WordPress uses
`wordpress/import`.

**This is the endpoint that dictates the preview architecture.** It wipes a
whole website, not a directory, so a preview stored in the same website as a
production site dies the first time that site ships. See
`preview-hosting.md`.

## Subdomains

```
POST /api/hosting/v1/accounts/{username}/websites/{domain}/subdomains
{"subdomain": "preview", "directory": "previews", "is_using_public_directory": false}
GET    .../subdomains
DELETE .../subdomains/{subdomain}
```

Needed exactly once, to create the `preview` host. Per-client previews are
directories underneath it, not subdomains — a subdomain per client would mean
a DNS record and an SSL certificate per prospect.

## Also available, worth knowing

- `GET /api/hosting/v1/accounts/{username}/domains/{domain}/files` — list
  files; handy for confirming an upload landed where intended.
- `POST /api/hosting/v1/websites` — create a website
  (`{domain, order_id, datacenter_code}`); `datacenter_code` is required only
  for the first website on a plan. Takes minutes; poll the list endpoint.
- `DELETE /api/hosting/v1/websites/{domain}` — deletes a website. No script
  here calls it and none should.
- `GET|PUT|DELETE /api/dns/v1/zones/{domain}`, plus
  `POST /api/dns/v1/zones/{domain}/validate` and DNS snapshots with restore —
  validate before writing, and note that snapshots make DNS mistakes
  recoverable.
- `GET|POST /api/hosting/v1/accounts/{username}/websites/{domain}/redirects`
  — for the old-URL redirect map on a redesign that changes paths.
- `PATCH .../php/version`, `.../cache/clear` — clear cache after a deploy if a
  change does not show up.
- `POST /api/hosting/v1/domains/free-subdomains` — a free subdomain, useful for
  a demo with no domain yet.
- Agency plans have a parallel `/api/agency-hosting/v1/...` tree keyed on
  `website_uid` instead of `username`+`domain`, including
  `files/import-archive` and per-site provisioning. If the account moves to
  Agency, the scripts need that path, not this one.

## Rate limits and failure

The spec does not publish a limit, so the scripts serialize uploads and stop on
the first hard failure instead of hammering. Treat 429 as real and back off.
Nothing here retries a *deploy* automatically — a repeated destructive call is
worse than a failed one.
