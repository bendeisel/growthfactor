# Alien Kind

A dashboard for the Growth Factor AI. Open it on any machine, sign in, and pick
up the same conversation with the same brain.

## The thing that makes it one AI

A website is a face, not a brain. Hosting a page gets you access from anywhere,
which is the easy half. The half that decides whether you get *one* AI or a
different one per browser is where the state lives.

Three things have to sit on the server, and all three do:

| What | Where it lives | Why it has to be there |
|---|---|---|
| The Anthropic key | Supabase function secrets | A static page calling the API direct ships the key to anyone who opens devtools |
| Threads and messages | Postgres, `messages` table | In `localStorage` your phone and your desktop are two AIs that have never met |
| Memory and instructions | Postgres, read on every call | A rule changed on the phone is in force on the next message sent anywhere |

The page holds nothing but a session token. Every message round trip reads the
shared state fresh, which is why a thread started on the desktop opens on the
phone mid-sentence.

## What is here

```
dashboard.html              the whole front end, one file, four views
config.example.js           project URL and anon key, copied to config.js
supabase/schema.sql         five tables, row level security, triggers
supabase/functions/chat/    the model proxy: auth, state, stream, persist
```

Four views: **Chat** is the work. **Memory** is what Alien Kind carries between
threads. **Instructions** is how it operates. **Connections** is what it can
reach.

## Model setup

Runs on `claude-opus-5` with adaptive thinking, so it decides per message how
hard to think rather than burning the same budget on "what time is the call"
and "restructure this client's funnel".

Two things worth knowing about the call:

- **Server side fallbacks are on.** Opus 5 can decline a request outright. With
  `fallbacks: "default"` the API re-runs the same request on a fallback model
  inside the same call instead of handing you a dead turn. Rescues bill at the
  fallback model's rates. Drop the parameter in `index.ts` if you would rather
  see the refusal.
- **The system prompt is cached.** The house rules and your memory sit behind a
  cache breakpoint, so repeat messages on a thread read them at cache rates.
  The readout under the composer shows cached tokens per reply.

The house writing rules, no em dashes, no dated marketing language, Windows
paths, are baked into the function itself. They do not need repeating in the
Instructions tab.

## Setup

You need a Supabase project and an Anthropic API key.

**1. Database.** Open the Supabase SQL editor, paste `supabase/schema.sql`, run
it. That creates the five tables and locks every row to its owner.

**2. Function secrets.** In the Supabase dashboard, Edge Functions, Secrets:

```
ANTHROPIC_API_KEY   sk-ant-...
DASHBOARD_ORIGIN    https://dash.growth-factor.ai
```

`DASHBOARD_ORIGIN` is the CORS allowlist. Leave it unset while testing and it
falls back to `*`, which is fine on localhost and wrong in production.

**3. Deploy the function.** In PowerShell:

```powershell
cd C:\path\to\growthfactor\projects\alienkind
npx supabase login
npx supabase link --project-ref YOUR-PROJECT-REF
npx supabase functions deploy chat
```

**4. Local config.** Copy the example and fill it in:

```powershell
copy config.example.js config.js
notepad config.js
```

The anon key belongs in the browser. It only grants what row level security
allows, which is your own rows. The Anthropic key never goes in this file.

**5. Run it.**

```powershell
npx serve .
```

Open the address it prints, enter your email, click the link it sends. Opening
`dashboard.html` by double clicking will not work: magic link auth needs a real
origin, not `file://`.

**6. Ship it.** Upload `dashboard.html` and `config.js` to a subdomain on
Hostinger. The page is `noindex` and gated behind auth, but keep it on its own
subdomain rather than under a client domain.

## Adding a connection

The Connections board reads whatever is in the table, so register each service
Alien Kind should reach and have whatever checks it write the status back:

```sql
insert into connections (user_id, name, kind, status, detail)
values (auth.uid(), 'GHL', 'crm', 'live', 'Sub-account: Growth Factor');
```

## Still open

The runtime question. This dashboard talks to Claude directly, which covers
conversation, memory and instructions. If Alien Kind also needs to *do* things,
push a WordPress change, fire an n8n workflow, update a GHL pipeline, those run
as tools behind the same edge function.

One constraint to design around: anything that drives apps on the Windows
desktop cannot move to a headless server. Browser and API work moves fine.
Desktop control does not. That is the one case that forces a hybrid, with the
server holding the always-on agent and the desktop connected only for what
genuinely needs it.
