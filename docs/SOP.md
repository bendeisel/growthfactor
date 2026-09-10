# Growth Factor SOP: which tool, when

Ben's working procedure for the skills and plugins in this repo. Open it,
find your situation, type the thing.

Windows. Paths and shortcuts below assume Git Bash for anything with a `/`.

---

## The one rule

**Say the job, not the tool.**

Every skill here has trigger wording built in. "Redesign Spiders Boxing" routes
to `site-redesign` on its own. "The cards feel empty" routes to `house-style`.
You do not have to remember command names, and reaching for the wrong one by
name is how you get a generic build.

Slash commands exist for the ones that should never fire on their own. Those
are marked below.

---

## Job to tool

### Client website work

| The job | What to say | What runs |
|---|---|---|
| Client has a site, wants it redone | "redesign their site" | `site-redesign` |
| Client has no site | "build them a site from nothing" | `site-new` |
| Client wants to look like another site | "make it like competitor.com but our brand" | `site-match` |
| Build is ready to show the client | "put this on preview" | `site-preview` |
| Client approved it | "the client approved it, put it live" | `site-ship` |
| Build looks off and you cannot say why | "this looks unfinished" | `polish` |
| Any gym, MMA, BJJ, boxing, CrossFit job | just describe it | `bmfg-gym-sites` loads too |

Nothing to memorise. These are already tuned.

### Before handover

| The job | What to type |
|---|---|
| Security pass on a built site | `/claude-security` |
| Craft audit before go-live | "polish this before handover" |
| Review a PR or a diff | `/code-review` |

Run the security pass on `projects/<slug>/site` **before** `site-ship`, not
after. Finding an exposed form endpoint on a live client domain is a different
conversation than finding it on preview.

### Research and competitor work

| The job | What to say |
|---|---|
| Pull a competitor page into clean markdown | "scrape competitor.com" |
| Find a page on a big site | "map the site, find their pricing page" |
| Grab a whole docs section | "crawl everything under /docs" |
| Watch a competitor page for changes | "monitor their pricing page" |

All Firecrawl. Needs a key from firecrawl.dev in your env once.

Public pages only. If a job needs LinkedIn or Instagram data, that is a paid
licensed scraper, not this. Ask me and I will price it.

### Interface and design decisions

| The job | What to say |
|---|---|
| Any client site design | describe it, `house-style` loads |
| A non-client UI, tool, or console | "build a UI for X" loads `frontend-design` |

`house-style` is the law for client work. `frontend-design` is for everything
else we build, and it fights the same battle: interfaces that do not read as
templated defaults.

### Non-website builds (agents, GHL automations, tooling)

This is the only place Spec Kit belongs. See the section below.

---

## The website pipeline already is a spec kit

Worth knowing so you do not reach for the wrong thing.

Spec Kit's whole pitch is: write the spec before any code, then build in stages
you can check. `site-factory` already does that, tuned to websites:

| Spec Kit calls it | You already have |
|---|---|
| constitution | `house-style`, the design law |
| spec | `intake.md` plus the locked `kernel.json` |
| plan | the `site-factory` build pipeline |
| tasks | the sitemap and page list |
| implement | the three build routines |
| review gate | `site-preview`, client approves |
| ship | `site-ship` |

**Never run Spec Kit on a client site build.** Two pipelines competing for the
same job is worse than one good one, and the one you have is tuned to the work.

---

## Spec Kit: for software, not sites

Installed and gated. The ten `speckit-*` skills will not fire on their own, so
they cannot hijack a site build. You have to type them.

Use it when the thing you are building is actually software: a GHL automation,
an AI agent, a new skill for this repo, a script that has to be right.

The chain, in order:

```
/speckit-constitution    once per project, the rules that never bend
/speckit-specify         describe what you want in plain English
/speckit-clarify         optional, it asks you up to 5 questions to kill ambiguity
/speckit-plan            how it gets built
/speckit-tasks           ordered task list
/speckit-analyze         optional, checks the three documents agree
/speckit-implement       builds it
```

You cannot skip ahead. That is the point. Each stage reads the one before it.

`/speckit-clarify` is the step that earns its keep. It is the one that catches
"I assumed you meant X" before it costs you a rebuild.

**Do not re-run `specify init` in this repo.** It would overwrite the gating
that keeps those ten skills from auto-firing. If you need to update Spec Kit,
tell me and I will re-apply the gate.

---

## What will stop you, and why

Three hooks run automatically. They are not suggestions, they block the action
and hand back the line numbers.

### Em dashes

Fires on: any file write, and any commit message.

The rule was a sentence in `CLAUDE.md` that had to be remembered. Now it cannot
be forgotten. Rewrite with a comma, a period, or a colon. Do not swap in an en
dash, it catches that too.

### Tired marketing language

Fires on: copy in `site/`, `design/`, `design-pages/`, `cms/`.

Does **not** fire on `projects/<slug>/content/` or `source/`. Those hold the
client's own harvested words under the 99% copy lock, and that lock is a
decision already made.

The list lives at `.claude/hooks/banned-words.txt`. Plain text, one per line.
Add and remove freely, it is the whole configuration.

If a client is genuinely named something on the list, put `banned-words: off`
anywhere in the file and it passes.

### Credentials

Fires on: reading, editing, or printing `config.env` or any `.env`.

`HOSTINGER_API_TOKEN` can delete live client websites. It never goes in a
transcript. Running `hostinger.sh` still works normally, it sources the file
itself.

If you genuinely need to see the token, open it outside Claude.

---

## Ponytail

Set to `lite` for this repo. At lite it builds what you asked and mentions a
simpler option in one line. You decide.

| Situation | What to type |
|---|---|
| Building or polishing a site | leave it, or `/ponytail off` |
| Writing Python or shell tooling | `/ponytail full` |
| It is arguing with a design choice | `/ponytail off` |

Design is where you deliberately spend. A code minimalism rule reads craft as
waste, so turn it off rather than argue with it.

Its own benchmark: 22% fewer tokens, 20% lower cost. The 54% figure going
around is lines of code, not usage.

---

## Maintenance

### After a session that taught you something

```
/revise-claude-md
```

Folds what the session learned back into `CLAUDE.md`. This is the memory that
matters, because it lives in git and survives everything. Do this instead of
re-explaining the same thing next month.

### When you catch yourself repeating a correction

```
/hookify
```

If you have told Claude the same thing twice, it should be a hook, not a
sentence. Hookify writes it. Candidates already on the list: no build ships
without a meta description, no page ships with a placeholder image path.

### After a big change to how the repo works

Ask for Claude Code automation recommendations. It reads the repo as it is that
day, so the answer moves as the repo moves.

### Looking for something new

Ask in chat: "is there a plugin for local SEO audits". Search covers 2,574
plugins across both official directories. Do not write a skill from scratch
before checking.

Shortlisted and not installed, say the word: `build-with-wordpress`,
`local-seo-audit-system`, `claude-seo`, `ads-agent`,
`geo-generative-engine-optimisation`.

---

## New machine setup

Hooks and skills are in git, so they arrive with the clone. Plugins install per
machine. Run these once:

```bash
claude plugin marketplace add anthropics/claude-plugins-official
claude plugin marketplace add anthropics/claude-plugins-community

claude plugin install claude-code-setup@claude-plugins-official
claude plugin install claude-security@claude-plugins-official
claude plugin install claude-md-management@claude-plugins-official
claude plugin install code-review@claude-plugins-official
claude plugin install frontend-design@claude-plugins-official
claude plugin install hookify@claude-plugins-official
claude plugin install firecrawl@claude-community
claude plugin install ponytail@claude-community
```

Then the Hostinger config, once:

```bash
cp .claude/skills/site-factory/config.example.env \
   .claude/skills/site-factory/config.env
# fill in HOSTINGER_API_TOKEN and the preview host, then
.claude/skills/site-factory/scripts/hostinger.sh subdomain-add
```

Firecrawl needs its key in your environment before first use.

Hooks need Python on PATH. `py.sh` finds `python3`, `python` or `py`, whichever
you have. If none is there the hooks exit quietly rather than blocking you, so
a missing Python fails silent, not loud. Worth checking `python --version`
works in Git Bash.

---

## What is deliberately not installed

So you do not go looking.

| Tool | Why not |
|---|---|
| OmniRoute | Sends client code to third party free providers that mostly train on it |
| Agent Reach | Gets past LinkedIn and Instagram access controls, risks the agency accounts |
| claude-mem | Stores outside the repo, so it starts empty every web session |
| Obsidian skills | Need a vault. Tell me if you have one and I will wire it up |

Full reasoning for all ten reviewed plugins is in
`docs/claude-code-plugins.md`.
