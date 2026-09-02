# Growth Factor — working notes for Claude

## Operator environment (read this before giving any command)

- **Ben is on Windows. PC only. There is no Mac in this business.**
  Never give `brew` instructions. Use PowerShell, WinGet, or npm.
  Windows paths, not `~/`: user config is `%USERPROFILE%\.claude.json` and
  `%USERPROFILE%\.claude\`; project MCP config is `.mcp.json`.
- Password manager: **Dashlane, Omnix Password Management** plan (the $8/user
  vault SKU — not Omnix Credential Protection, which is a separate monitoring
  product he does not need for offboarding).
- Identity: Google Workspace (`@growth-factor.ai`).
- Hosting: Hostinger. Client sites are static, deployed per the house-style
  delivery pipeline.
- Client gym software seen so far: Glofox (API key is issued by them and
  cannot be self-rotated).

## Hard facts established about Dashlane (verified, do not re-derive)

- The Dashlane **public API is read-only**. So is the official MCP server
  (`dcli team mcp`), which serves **audit logs only**.
- There is **no** API, CLI, or MCP path to: remove a member, revoke sharing,
  edit a collection, or write a vault item. Not tier-gated — it does not exist.
  Revocation is Admin Console clicks, by a human, always.
- `dcli` business commands (`members`, `audit-logs`, `dwi`, `reports`, `mcp`)
  authenticate with an exported token (`DASHLANE_ENROLLED_TEAM_DEVICE_KEYS`)
  and are **not** device-bound. Personal-vault commands **are** device-bound.
- SCIM is on the Omnix plan but **not supported with Google Workspace**
  (Entra, Okta, Ping, JumpCloud, Duo only). Confidential SSO with Google
  Workspace **is** supported — that is the practical one-action cutoff.
- Developer Access (Admin Console → Integrations) lists every CLI credential
  created org-wide and revokes them. Tokens are prefixed `DASH_EDWSA_`.

## Offboarding kill switch

See `offboarding/README.md`. Design principle: revoke access, never delete
accounts. Identity provider goes **last**. Rotation is scoped by what a person
could *see*, not what they were assigned.

## Network policy in Claude Code web sessions

This repo's web sessions run behind a restricted egress proxy. Verified from a
session on 2026-08-27:

- Reachable: `admin.googleapis.com`, `oauth2.googleapis.com`, `api.github.com`
- Blocked: all of `dashlane.com`, `api.hostinger.com`, `api.zapier.com`

So Google Workspace and GitHub automation can run in a web session; anything
Dashlane, Hostinger, or Zapier must run on Ben's Windows machine (or the
environment's network policy needs widening).
