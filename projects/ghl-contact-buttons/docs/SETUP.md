# Setup

Four pieces: deploy the worker, create the private app, add the menu link,
connect a sub-account. Fifteen minutes the first time, two minutes per
sub-account after that.

## 1. Deploy the worker

```
cd projects/ghl-contact-buttons
npm install
wrangler login
wrangler kv namespace create BUTTONS
wrangler kv namespace create BUTTONS --preview
```

Paste the two ids into `wrangler.toml`, then:

```
wrangler secret put ADMIN_PASSWORD     # for /admin
wrangler secret put SESSION_SECRET     # any random 32+ chars
wrangler secret put GHL_SSO_KEY        # from step 2, come back for this
npm run deploy
```

Note the `*.workers.dev` URL (or map a custom domain in Cloudflare).

## 2. Create the private marketplace app

HighLevel Marketplace → Developer → My Apps → Create App.

- Distribution: **Private**, agency and sub-account
- Redirect URL: `https://<worker>/oauth/callback` (only needed if you use OAuth
  instead of per-account tokens)
- Custom JS: load the injector
  ```html
  <script src="https://<worker>/injector.js"></script>
  ```
- Copy the app id into `GHL_APP_ID` in `wrangler.toml`
- Copy the SSO / shared secret into `wrangler secret put GHL_SSO_KEY`
- Redeploy: `npm run deploy`

Install the app on the agency.

## 3. Add the admin as a custom menu link

Agency → Settings → Custom Menu Links → New:

- Title: `Contact Buttons`
- URL: `https://<worker>/admin?locationId={{location.id}}`
- Open in: iframe
- Show on: sub-accounts you want to manage buttons for (and agency)

Opening it inside a sub-account preselects that sub-account.

## 4. Connect a sub-account

In the sub-account: Settings → Private Integrations → Create.
Scopes: contacts read/write, workflows read, campaigns write, opportunities
read/write, locations read (tags and custom fields), users read.

Open the Contact Buttons menu link in that sub-account → Connection tab →
paste the token → Test connection. It lists the sub-account's workflows so
the workflow picker in the editor fills in.

Prefer not to paste tokens per account? Install the app with OAuth once at the
agency and the worker mints sub-account tokens itself.

## 5. Build buttons

Agency defaults (dropdown → "Agency defaults") show on every connected
sub-account. Switch to a sub-account to add its own, override an inherited
one, or turn one off.

A useful first set:

| Button | Actions |
| --- | --- |
| Became a Member | add tag `member`, remove tag `lead`, add to onboarding workflow |
| Remove From All Workflows | remove from all workflows (with confirm) |
| Remove All Tags | remove all tags (with confirm) |
| Book Trial | open URL `https://.../booking?contact_id={{contact.id}}` |
| Flag for Follow-up | create task due in 1 day, webhook to n8n |

## If the bar lands in the wrong place

Settings tab → paste a CSS selector for the element the bar should sit inside.
Saved instantly, no deploy. `pinned` placement floats it top-right regardless
of HighLevel's markup.

## Testing without SSO

Set `ALLOW_UNVERIFIED_SESSIONS = "true"` in `[vars]` to let the API run before
the app's shared secret is configured. Turn it back off before real use; with
it on, anyone who finds the worker URL can fire buttons.
