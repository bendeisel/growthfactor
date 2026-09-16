# Alien Kind

Bob, Kevin and Stewart in one dashboard. Open it on any machine, pick an agent,
pick up the same conversation.

## The three

| Agent | Owns | Mailbox | Colour |
|---|---|---|---|
| **Bob** | The gyms: Nashville MMA Training Camp and Fighters Boxing Gym | ben@nashvillemma.com | Green |
| **Kevin** | Growth Factor agency work | ben@growth-factor.ai | Orange |
| **Stewart** | Personal and side hustles, Grove Investing | grove.investing@gmail.com | Purple |

The addresses come from the linked Google Calendar list, which shows all three
identities. Bob's and Kevin's are certain. **Stewart owning
grove.investing@gmail.com is an assumption**, made because Grove Investing reads
as a side hustle rather than agency or gym work. Correct it in his brief if it
is wrong.

Each agent's brief names its own address and tells it to read and write from
that one only, so mail is scoped the same way everything else is.

Each keeps its own threads, its own memory and its own instructions. They are
created automatically the first time you sign in, then they are ordinary rows
you can rename, re-scope or add to.

**Switching.** The agent lives in the URL, so `#bob`, `#kevin` and `#stewart`
are three independent conversations. Switch in the dropdown to move between them
in one window. The whole page re-tints to whichever one you are talking to, so
you never have to check which window is which.

**Popping out.** The dropdown has "Pop out <name>" and "Pop out all three". A
popped out agent is the same page with the furniture stripped off: no tabs, no
wordmark, just the chat column at 440 by 720. The windows are named, so clicking
Bob twice focuses Bob's window instead of piling up duplicates. Pop out all
three and you have Bob, Kevin and Stewart running side by side on one screen.

**The thread list.** The rail lists conversations the way a chat app does, and
it toggles between **This agent** and **All three**. On all three, every row
carries its owner's dot and name, and clicking another agent's conversation
switches agent and opens that thread in one move. It remembers which view you
left it on.

**What they share.** The house rules, the shared instructions, and anything in
memory filed to all three. So "Ben is on Windows" is known by everyone while
"Fighters Boxing class schedule" belongs to Bob alone. Each agent is also told
the other two exist, so when you ask Kevin something that is Bob's, he says so
instead of guessing.

## The thing that makes them one AI each

A website is a face, not a brain. Hosting a page gets you access from anywhere,
which is the easy half. The half that decides whether you get one AI or a
different one per browser is where the state lives.

Three things sit on the server, and all three have to:

| What | Where it lives | Why it has to be there |
|---|---|---|
| The Anthropic key | Supabase function secrets | A static page calling the API direct ships the key to anyone who opens devtools |
| Threads and messages | Postgres, `messages` table | In `localStorage` your phone and your desktop are two AIs that have never met |
| Memory and instructions | Postgres, read on every call | A rule changed on the phone is in force on the next message sent anywhere |

The page holds nothing but a session token.

## Mobile

There is no separate mobile version and there does not need to be one. It is the
same file at the same URL, laid out for a phone from 320px up. Add it to your
home screen and it opens like an app.

This is the reason to build it as a web page rather than chase a desktop app.
One build covers Windows, Android and iPhone, with nothing to install, no app
store review, and no separate Apple and Android versions to keep in step. The
popped out windows give you the multi window feel on the desktop without any of
that.

## What is here

```
dashboard.html              the whole front end, one file, four views
config.example.js           project URL and anon key, copied to config.js
supabase/schema.sql         six tables, row level security, triggers
supabase/functions/chat/    the model proxy: auth, assemble, stream, persist
```

Four views. **Chat** is the work. **Memory** is what the agent carries between
threads, filed to one agent or to all three. **Instructions** is that agent's own
brief plus the shared ones. **Connections** is what it can reach.

## Model setup

Runs on `claude-opus-5` with adaptive thinking, so it decides per message how
hard to think rather than burning the same budget on "what time is the Tuesday
class" and "restructure this client's funnel".

- **Server side fallbacks are on.** Opus 5 can decline a request outright. With
  `fallbacks: "default"` the API re-runs the same request on a fallback model
  inside the same call instead of handing you a dead turn. Rescues bill at the
  fallback model's rates. Drop the parameter in `index.ts` to see refusals.
- **The system prompt is cached.** Identity, rules and memory sit behind a cache
  breakpoint, so repeat messages on a thread read them at cache rates. The
  readout under the composer shows cached tokens per reply.

The house writing rules, no em dashes, no dated marketing language, Windows
paths, are enforced in the function itself. They do not need repeating in the
Instructions tab.

## Setup

You need a Supabase project and an Anthropic API key.

**1. Database.** Open the Supabase SQL editor, paste `supabase/schema.sql`, run
it. That creates the six tables and locks every row to its owner.

**2. Function secrets.** Supabase dashboard, Edge Functions, Secrets:

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

**4. Local config.**

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

The Connections board reads whatever is in the table. `agent_id` null means all
three can reach it; set it and only that agent can.

```sql
insert into connections (user_id, agent_id, name, kind, status, detail)
values (auth.uid(), null, 'Glofox', 'gym booking', 'live', 'Members and classes');
```

## Design

Light by default and it does not follow the OS, because the OS is not the one
who asked. Dark is there in the toggle if you ever want it.

This does not match the build console, which is deliberate but worth knowing:
the console is the older tech-ticket look, this is rounded and quiet. If the two
should agree, the console is the one to bring forward.

## Still open

**The runtime.** This talks to Claude directly, which covers conversation, memory
and instructions. Anything that *does* something, pushes a WordPress change,
fires an n8n workflow, moves a GHL pipeline, attaches as a tool behind the same
function. Each tool can be scoped per agent, so Bob gets Glofox and Kevin gets
GHL without either reaching into the other's systems.

**Email.** Not built, and the access is not there yet either. Superhuman does
have a working MCP with full read, draft and send, which reverses an earlier
call in this repo that it had no usable write API. But mail access currently
reaches one mailbox, ben@growth-factor.ai, through the Gmail connector. Calendar
reaches all three identities, because calendars share across Google accounts and
mailboxes do not.

So before any agent touches email, two of the three mailboxes need connecting,
either by linking the other accounts to Superhuman's MCP or by connecting them
another way. Then the decision about what an agent may send unattended versus
what it drafts for review. Reading is low risk. Sending on your behalf is not.

**GHL and Glofox.** Not built. Each needs its credentials and the same
unattended versus draft decision.

**Kevin on Wingman.** Kevin currently runs on the home machine. Two ways to join
them, and the right one depends on what Kevin exposes. If Kevin is config,
prompts and memory, he moves in by pasting into the Instructions tab and the
dashboard becomes his home. If Kevin is a running process with tools already
wired up, Wingman keeps him and the dashboard reaches him through a tunnel,
which means Wingman has to stay on and Kevin is down whenever it is.

One constraint to design around: anything that drives apps on the Windows
desktop cannot move to a headless server. Browser and API work moves fine.
Desktop control does not.
