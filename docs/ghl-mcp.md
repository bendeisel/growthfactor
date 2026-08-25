# GoHighLevel over MCP — what it actually gives us

Growth Factor runs client CRM in GoHighLevel. This document covers connecting
GHL to Claude via HighLevel's official MCP server: what that unlocks, what it
provably cannot do, and why we use it instead of GHL's built-in Ask AI.

Read the ceiling section before scoping any work that assumes Claude can build
things inside GHL. It mostly can't, and finding that out mid-project is
expensive.

## The connection

HighLevel hosts the server. There is nothing to install, no local process, no
wrapper to maintain.

```
Endpoint    https://services.leadconnectorhq.com/mcp/
Transport   MCP over HTTP
Auth        Authorization: Bearer pit-<token>
Location    locationId header — optional
```

The token is a **Private Integration Token**, created per agency or per
sub-account under **Settings → Private Integrations** in GHL. It is not the old
v1 API key and not an OAuth app; PITs exist specifically for this kind of
first-party integration and carry only the scopes you tick at creation.

`locationId` used to be a required header, which forced one connection per
sub-account — ten clients meant ten connectors. It is now optional: authorize
the sub-accounts once, then name the client in the prompt and switch between
them inside a single conversation. If you want hard separation between clients
instead (worth it when a mistake would be visible to the client), keep a
per-project MCP config and one PIT each.

Anything speaking MCP over HTTP with custom headers can connect — Cowork,
Claude Code, Cursor. In Cowork it goes in as a custom connector: the endpoint
URL above plus the `Authorization` header. Confirm the current click-path in
Cowork's connector settings; the values it needs are the two lines above.

## What we get

Scope-gated — a narrow PIT yields a smaller tool list than this. Tools are named
`<area>_<action>`.

| Area | Read | Write |
|---|---|---|
| Contacts | search, get, tasks | create, update, upsert, add/remove tags |
| Conversations | search, read messages | send a message |
| Opportunities | search, get, pipelines | update |
| Calendars | list, events, appointment notes | edit calendars, edit events |
| Locations | location, custom fields | — |
| Funnel redirects | list | create, update, delete |
| Payments | orders, transactions | — |
| Forms | list, submissions | upload files only |
| Social | posts, connected accounts | create/edit posts |
| Email templates | list | create, update, delete |
| Blogs | authors, categories | create post, update post, slug check |

The honest read: this is an **operations** surface. Segment and enrich contacts,
work conversations, move opportunities through pipelines, manage calendars,
author blog and email content. That is genuinely most of the day-to-day.

## The ceiling — no workflows, no funnels, no prospecting

**You cannot build automations, funnels, forms, or prospecting reports through
this.** Not a scope problem and not an MCP gap — HighLevel's v2 platform API has
no write endpoints for them, and MCP can only expose what the API has.

Verified against HighLevel's published OpenAPI specs
([gohighlevel/api-v2-docs](https://github.com/gohighlevel/api-v2-docs)), not
secondhand write-ups:

| Surface | Every documented endpoint |
|---|---|
| Workflows | `GET /workflows/` — that is the entire spec |
| Funnels | `GET /funnels/funnel/list`, `GET /funnels/page`, `GET /funnels/page/count` |
| Funnel redirects | full CRUD — POST / PATCH / DELETE / list |
| Forms | `GET /forms/`, `GET /forms/submissions`, `POST /forms/upload-custom-files` |
| Prospecting | none — no spec exists |

So Claude can list what automations and funnels exist, but cannot author a
workflow, edit a step, change funnel page content, or build a form. The
automation architecture is built in the UI by a human; Claude operates it.
Funnel redirects are the one genuine write here and are handy for campaign URL
management.

### Triggering a workflow — the useful exception

There is no endpoint to invoke a workflow, but contacts can be enrolled in one:

```
POST   /contacts/{contactId}/workflow/{workflowId}
DELETE /contacts/{contactId}/workflow/{workflowId}
POST   /contacts/{contactId}/campaigns/{campaignId}
DELETE /contacts/{contactId}/campaigns/{campaignId}
```

Enrolling a contact starts that workflow for that contact, which covers most of
what "trigger a workflow" usually means in practice. Build the automation by
hand, then drive enrollment programmatically.

### Prospecting is UI-only

The Prospecting Tool and its audit reports have no API. The scopes exist —
`prospecting.readonly`, `prospecting.write`, `prospecting/auditReport.write`,
`prospecting/reports.readonly` — but they appear only in the user-permission
enumeration in `users.json`, and no endpoint in any spec references them. They
control what a staff user can open in the UI, not API access. Generating audit
reports for outbound stays a manual job in GHL.

### On third-party servers

Third-party GHL MCP servers advertising workflow, funnel, and prospecting tools
— one claims 520+ tools — wrap the same public API documented above. Where they
claim writes the API does not have, they are either driving the UI unofficially
or overstating. We use the official endpoint.

## Why not Ask AI

GHL ships its own in-app assistant. We prefer MCP, and the reason is structural
rather than a bet on which model happens to be behind Ask AI this quarter:

- **We choose the model.** With MCP the CRM is a tool surface and the model is
  ours, so we get current-generation reasoning and it improves as we upgrade,
  independent of HighLevel's roadmap.
- **It carries our context.** In Cowork or Claude Code the assistant already
  has the house-style skill, the client's brand kernel, the project folder, and
  the shipped-site log. Ask AI sees the CRM and nothing else, so it cannot write
  a blog post that sounds like the client or reconcile a contact list against
  work we actually delivered.
- **It composes.** GHL is one connector among several. Pulling a contact list,
  cross-referencing a project folder, and drafting the follow-up is one task,
  not three tools and a copy-paste.

Ask AI is fine for a quick in-app lookup while you are already in GHL. It is not
the surface to build on.

## Token hygiene

A PIT with conversation-send plus contact-write can message real clients. Treat
it accordingly:

- Scope to the job. Reporting and audit work needs read scopes only — do not
  attach send-message to a token that exists to pull numbers.
- One token per client where a mistake would be client-visible; the blast radius
  of a mis-scoped shared token is every account it authorizes.
- Tokens are secrets. They belong in the connector config or a local
  `.mcp.json`, never in this repo, a project folder, or a commit.
- Revoke in Settings → Private Integrations when a client engagement ends. The
  token outlives the project otherwise.

## Provenance

The endpoint tables in "The ceiling" are read directly from HighLevel's
published OpenAPI specs (`gohighlevel/api-v2-docs`) and are exact. The MCP tool
table in "What we get" is compiled from HighLevel's MCP documentation, which is
unreachable from some of our sandboxed environments — treat tool-name specifics
as indicative and confirm against the live tool list your client reports after
connecting.
