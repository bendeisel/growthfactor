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
| Payments | orders, transactions | — |
| Forms | list | — |
| Social | posts, connected accounts | create/edit posts |
| Email templates | list | create, update, delete |
| Blogs | authors, categories | create post, update post, slug check |

The honest read: this is an **operations** surface. Segment and enrich contacts,
work conversations, move opportunities through pipelines, manage calendars,
author blog and email content. That is genuinely most of the day-to-day.

## The ceiling — no workflows, no funnels

**You cannot build automations or funnels through this.** Not a scope problem,
not an MCP gap — HighLevel's v2 platform API has no write endpoints for
workflows, funnel page content, or forms. The funnels API exposes two calls,
list funnels and list pages. The builders are UI-only surfaces, and exposing
them is still an open request on HighLevel's own ideas portal.

So Claude can tell you what automations exist and enrol a contact into a
workflow you built by hand, but it cannot author the workflow, edit a step,
change a funnel page, or create a form. Plan client work accordingly: the
automation architecture is built in the UI by a human, and Claude operates it.

Third-party GHL MCP servers advertising workflow and funnel tools — one claims
520+ tools — wrap the same public API. Where they claim writes the API does not
have, they are either driving the UI unofficially or overstating. We use the
official endpoint.

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
