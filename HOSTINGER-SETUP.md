# Connecting Claude to Hostinger

One-time setup so Claude can upload files, deploy builds, and switch which
domain a site is live on, all through Hostinger's API. Do this once for the
whole agency account, not once per client.

This does not make Claude an editor on Hostinger itself. Read
[How editing actually works](#how-editing-actually-works) below before
assuming otherwise; it changes how you'd think about step 3 in your ask.

## What you get at the end

- **Upload**: Claude can push a client's built site to Hostinger without you
  touching a file manager.
- **Change domains**: Claude can deploy the same build to whichever domain
  you point it at, so a site goes from a Growth Factor preview link to the
  client's own domain with one command, once that domain is already hosted
  on your Hostinger account.
- **Edit**: Claude edits the *source* (the build in this repo) and
  redeploys. It does not hand-edit files that already live on Hostinger. See
  below for why that's a rule and not a limitation you're stuck with.

## Step 1: Generate an API token

1. Log into hPanel (Hostinger's control panel), on Windows in your regular
   browser.
2. Go to **API** in the account menu, then generate a new token.
3. Copy it immediately. Hostinger shows it once.

Treat this token like a password to your whole hosting account. Anyone who
has it can upload to, or delete, anything hosted there.

## Step 2: Give it to Claude

In this repo:

```
copy .claude\skills\site-factory\config.example.env .claude\skills\site-factory\config.env
```

Open `config.env` in Notepad and fill in:

```
HOSTINGER_API_TOKEN=<the token from Step 1>
GF_PREVIEW_DOMAIN=growth-factor.ai
GF_PREVIEW_HOST=preview.growth-factor.ai
GF_PREVIEW_SUBDOMAIN=preview
GF_PREVIEW_DIR=previews
```

`config.env` is in `.gitignore`. It never gets committed, never shows up in
a pull request, and never leaves whatever machine or session it's typed
into. If you're working with Claude across more than one computer or
session, you'll need to repeat this step on each one; the token itself is
the same value everywhere.

`GF_PREVIEW_DOMAIN` should be a domain in your Hostinger account that hosts
**nothing else**. Hostinger's deploy call replaces a website's entire
contents, so a preview sharing space with a real site would get wiped out
the first time that other site ships. `growth-factor.ai` above is a
placeholder: use whatever domain you've set aside for this.

## Step 3: Create the preview subdomain (once, ever)

```
.claude\skills\site-factory\scripts\hostinger.sh subdomain-add
```

This creates `preview.<your domain>`, pointed at a `previews/` folder. Every
client build after this lands in its own folder under there:
`preview.growth-factor.ai/fightersboxing/`, `preview.growth-factor.ai/spidersboxing/`,
and so on. You only run this once. SSL can take a few minutes to issue
after it's created; if the subdomain doesn't load right away, that's why.

Check it worked:

```
.claude\skills\site-factory\scripts\hostinger.sh subdomains growth-factor.ai
```

## Getting a build from here to live: the path you described

You asked for get it live in Hostinger, hook it to the Growth Factor preview
site, get the team's approval, make edits, then go live. That's exactly the
three-step pipeline this setup unlocks, in order:

**1. Preview** (get it live on Hostinger, hooked to the Growth Factor preview site)

```
python3 .claude/skills/site-factory/scripts/split_pages.py \
  projects/fightersboxing/site.html -o /tmp/fb-preview --noindex
.claude/skills/site-factory/scripts/deploy_preview.sh fightersboxing /tmp/fb-preview
```

Or, once these scripts are wired to run for you directly: "put Fighters
Boxing on preview." Either way, this uploads the built pages to
`preview.growth-factor.ai/fightersboxing/` and marks it `noindex` so Google
never indexes it as a duplicate of the real site. That link is what the team
opens to review.

**2. Team review and edits**

The team reviews the preview link, and any changes go back into the
source, not into files on the server. See the note below on why. Once
changes are made, re-run the same preview step above. It redeploys to the
same URL, so nothing you've already shared goes stale.

**3. Ship** (go live)

Once the team approves it:

```
.claude/skills/site-factory/scripts/deploy_production.sh \
  fightersboxing projects/fightersboxing/site.html fightersnashville.com
```

This splits the build for production (real, indexable pages, a sitemap,
canonical links, no noindex), zips it, uploads it, and calls Hostinger's
deploy endpoint for that domain. The preview link keeps working afterward;
shipping to production doesn't touch it, because it's a separate website on
Hostinger. Whatever comes after `deploy_production.sh` is the domain the
site goes live on, so this is also the "change domains" part of your ask:
point the same build at a different domain by running it again with that
domain in place of the last one.

**This one needs something from you first**: for Fighters Boxing
specifically, the production domain is currently assumed to be
`fightersnashville.com` because that's what the Astro project's config
already pointed at, but it's never been confirmed with the client. Confirm
the real domain before running this step for real, and confirm that
domain is already added as a website in your Hostinger account (`hostinger.sh
websites` lists what's there). If the domain lives at a different registrar
and isn't pointed at Hostinger yet, that's a DNS change at the registrar
(pointing nameservers or an A record at Hostinger) done once, in hPanel or
at the registrar, before the first `deploy_production.sh` run for that
domain; nothing here automates that part.

## How editing actually works

This is the part of your ask worth flagging before it causes confusion
later: none of this makes Hostinger itself an editing surface, on purpose.

```
projects/<slug>/site.html     the only source of truth, in git
        │
        ├──> artifact          what you and the team review
        ├──> preview           deploy_preview.sh output
        └──> production        deploy_production.sh output
```

A production deploy replaces the *entire* website. If someone edited a file
by hand directly on Hostinger, the next `deploy_production.sh` run silently
throws that edit away, and there'd be nothing in git to show it ever
existed. So the rule is: change `site.html` (or ask Claude to), then
re-run the preview or production step. It's the same amount of work as a
hand-edit would have been, and it's the only version of an edit that
survives the next deploy.

## Safety notes

- The deploy endpoint (used by both preview and production, differently)
  cannot be undone. `deploy_production.sh` asks you to type the domain name
  back to confirm before it runs, unless it's being run unattended.
- `deploy_preview.sh` never touches the deploy endpoint at all; it uploads
  files one at a time, so it can't wipe out other clients' previews even by
  mistake.
- `deploy_production.sh` refuses outright to run against your preview
  domain, so a typo can't wipe every client's preview at once.
- If a live change doesn't show up after deploying, clear Hostinger's cache:
  `.claude\skills\site-factory\scripts\hostinger.sh cache-clear <domain>`.
