# GHL Contact Buttons

Self-hosted action buttons for HighLevel contact pages. Replaces the paid
ghlplugins.com "Contact Buttons" add-on with something we own, and does more
than tag-or-link.

One click on a contact can:

- add or remove tags, or wipe all tags
- add to a workflow, remove from one, or remove from every workflow
- add to / remove from campaigns
- set custom fields, toggle DND
- add a note or create a task
- move an opportunity to a stage
- POST a webhook (n8n, GHL inbound webhook, anything https)
- open a URL with merge fields

Actions chain. One button can tag, drop into a workflow and ping n8n.

The buttons live in an always-on dock that follows the contact in view:

- **Three surfaces**: contact page, conversation, opportunity. Conversation and
  opportunity URLs carry no contact id, so the worker resolves the contact
  through the API rather than scraping HighLevel's markup.
- **Shows who it is attached to**: name, phone or email, and which surface it
  came from. No firing a button on the wrong person.
- **Movable**: drag it anywhere, position remembered per user per sub-account.
  Double-click the handle to reset.
- **Layouts**: row, stacked column, or compact icons. Buttons sharing a group
  collapse into one dropdown. Small size fits more.
- **Self-healing**: route polling plus a heartbeat remount the dock if
  HighLevel rebuilds the page. If the service is unreachable it says so with a
  retry, instead of silently vanishing.

**Automations** are buttons nobody clicks. The private app subscribes to
HighLevel webhooks (OpportunityDelete, OpportunityStatusUpdate, ContactDelete,
InvoicePaid, ...) and the worker runs an action list against that contact.
The obvious one: tag the contact when an opportunity is deleted, so a workflow
can trigger on an event HighLevel has no native trigger for.

## How it fits together

```
HighLevel contact page
  └─ private marketplace app (ours) loads  ──►  worker /injector.js
       └─ draws button bar, asks worker which buttons to show
            └─ click ──► worker /api/run ──► HighLevel API v2 (per sub-account token)

HighLevel custom menu link (iframe) ──► worker /admin   (config UI)
HighLevel app webhooks ──► worker /webhooks/ghl/<token> ──► same action engine
```

- **Agency buttons** are inherited by every sub-account.
- **Sub-account buttons** add to that set, override an agency button in place,
  or switch one off. This covers both "same everywhere" and "per client".
- **Credentials** are a Private Integration Token per sub-account, or an
  agency OAuth install if you would rather not paste tokens.

Why a marketplace app at all? A custom menu link is an iframe from our domain.
The browser will not let it touch the HighLevel page around it, so it can never
draw buttons on the contact header. The only sanctioned way to run script on
that page is a marketplace app's custom JS. A private app is free, agency-only,
and skips the review queue. Its whole job is one `<script>` tag.

## Layout

```
client/injector.js        browser script (real file, inlined at build)
client/admin.html         admin UI (same)
src/index.js              worker routes
src/lib/ghl.js            HighLevel API v2 client
src/lib/actions.js        action executor
src/lib/context.js        which contact is in view (conversation/opportunity lookups)
src/lib/store.js          KV config, credentials, logs
src/lib/sso.js            decrypts exposeSessionDetails payloads
src/lib/session.js        admin cookie
tools/build-client.mjs    inlines client/* into src/generated/*
test/                     node:test suite
docs/SETUP.md             install walkthrough
```

## Develop

```
npm install
npm test          # builds client, runs unit tests
npm run dev       # wrangler dev
npm run deploy
```

Secrets go in with `wrangler secret put` (see `wrangler.toml` comments), never
in the repo.

## Status

Written and unit tested. Not yet pointed at a live HighLevel account. The two
things most likely to need a nudge on first deploy:

1. Route patterns for conversations and opportunities in `client/injector.js`
   (`ROUTES`). Contact detail is certain; the other two are from memory of
   HighLevel's URLs and take a two-line fix if they differ.
2. Endpoint and payload shapes in `src/lib/ghl.js` and `src/lib/context.js`,
   written from the API v2 docs, checked against a real sub-account on first
   run. Both payload shapes we have seen for opportunities are handled.
