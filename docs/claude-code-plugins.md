<!-- banned-words: off -->

# Claude Code plugins, checked

Two YouTube videos, five plugins each. Every one was looked up before
anything was installed, because four of the ten are not what the videos say
they are.

Round one transcript and round two transcript are both at the bottom.

Last updated 2026-09-10.

---

# Round one

---

## 1. Claude Code Setup

**The claim:** official Anthropic plugin, scans your codebase and recommends
the hooks, skills and subagents that fit it, strips the rest.

**Reality:** accurate. It is `claude-code-setup` in Anthropic's own
marketplace. One skill, `claude-automation-recommender`, read only. It
analyses and reports, it never writes files itself.

**Verdict:** installed.

```
claude plugin install claude-code-setup@claude-plugins-official
```

Already run against this repo. Everything under `.claude/hooks/` and
`.claude/settings.json` came out of that pass.

---

## 2. OmniRoute

**The claim:** unlimited Claude Code usage by routing to 300 plus free AI
providers, auto failover when you hit your limit, 1.6 billion free tokens a
month.

**Reality:** it is a local proxy that presents an Anthropic shaped API on
`localhost:20128` and forwards your prompts to whichever provider it picks.
The token figure is the sum of every free tier across every provider added
together, not something one account gets.

**Verdict:** not installed. Three reasons, in order of how much they matter
to us:

1. Every prompt leaves Anthropic. That means client site code, Hostinger
   config and anything sitting in context goes to whichever free endpoint
   the router lands on. Most free tiers train on what you send them. We
   handle client credentials, so this is a hard no on client work.
2. The output quality is whatever model answered, and you do not choose it.
   A site build that silently finishes on a weak free model is worse than
   one that waits.
3. There are at least four near identical forks of the repo on GitHub
   (`diegosouzapw`, `marcpadz`, `brwarashidpour`, `linhvk`) with the same
   README. For a tool that holds provider API keys, that pattern is worth
   being slow about.

**If you still want it:** run it only on throwaway repos, never on anything
under `projects/`. It installs on your own Windows machine, not in a Claude
Code web session, so it would not have worked from here anyway.

---

## 3. Find Skills

**The claim:** tell it what you are building, it searches 100,000 skills and
installs the right ones.

**Reality:** there are several tools with this name. `fockus/claude-skill-find-skill`
indexes about 4,800 skills across 14 sources. `findskills.org` claims 94,000
by counting every skill shaped file on GitHub, most of which are forks and
abandoned experiments.

**Verdict:** did not install a third party one, because Claude Code now does
this natively and better. Both official directories are wired up:

| Marketplace | Plugins | Screening |
|---|---|---|
| `claude-plugins-official` | 292 | Anthropic managed |
| `claude-community` | 2,282 | Anthropic automated validation and safety screening |

Run `/plugin` and use the Discover tab, or just ask in chat: "is there a
plugin for local SEO audits". Search runs across both directories.

Worth knowing, given what we actually do:

- `build-with-wordpress` (official) themes, plugins, commerce, deployment
- `local-seo-audit-system` (community) 21 phase local audit, GBP included
- `claude-seo` (community) site audit, 11 parallel subagents, 0 to 100 score
- `ads-agent` and `adspirer-ads-agent` (community) Google and Meta campaigns
- `geo-generative-engine-optimisation` (community) AI search visibility

None of these are installed. Say the word and they go on.

---

## 4. Strix

**The claim:** attacks your vibe coded app like a real hacker and finds what
you left behind.

**Reality:** real and good. `usestrix/strix` runs an offensive toolkit inside
a Kali Docker sandbox: intercepting proxy, browser exploitation, a shell,
recon. It needs Docker running, which a Claude Code web session does not
have.

**Verdict:** installed Anthropic's `claude-security` instead, which does the
static half of the same job with no Docker and no container to babysit.
Seven subagents, every finding challenged by a verifier before it reaches
you, so the false positive rate is low.

```
claude plugin install claude-security@claude-plugins-official
```

Use it with `/claude-security`. Point it at a `projects/<slug>/site` build
before handover.

Strix is still the better tool for hitting a **running** site rather than
source. Install it on your Windows machine with Docker Desktop when we want
a live pentest:

```
npx skills add usestrix/strix
```

---

## 5. Agent Reach

**The claim:** scrape anything, including gated platforms like LinkedIn,
Instagram, X and Reddit, without paying for an API key.

**Reality:** real, `Panniantong/Agent-Reach`, routes 17 platforms through
no key scrapers. The catch is in the pitch. "Gated" means those platforms
deliberately blocked this, and the way around it is a scraper pretending to
be a logged in browser. That gets accounts restricted, and for LinkedIn it
is a straight terms of service breach. Doing it from an account that carries
the agency name is a bad trade for a lead list.

**Verdict:** installed `firecrawl` instead. Public pages, clean markdown out,
free tier, no ban risk, and it is the right tool for the competitor teardowns
that feed `site-match` and `site-redesign` anyway.

```
claude plugin install firecrawl@claude-community
```

Needs a key from firecrawl.dev before first use.

**If you specifically need social platform data**, the licensed route is
`brightdata-plugin` or `apify-scraper`, both in the community directory.
They pay the platforms, so nothing of ours gets banned. They cost money.

---

# Round two

---

## 6. Ponytail

**The claim:** cuts your usage by over 50% without losing any accuracy at all.

**Reality:** real, and its own README says the video's number is wrong. It is
a decision ladder run before any code is written: does this need to exist, is
it already in the codebase, does the stdlib do it, is it one line.

The project's own agentic benchmark, 12 tasks on a FastAPI and React repo:

| Measure | Change |
|---|---|
| Lines of code | 54% fewer |
| Tokens | 22% fewer |
| Cost | 20% lower |
| Wall clock | 27% faster |

The 54% is lines of code. The video quoted it as token usage. Actual token
saving is 22%, and an independent 80 task benchmark put the cost saving
nearer 10%. The README also warns that a reasoning model can end up
**costing more**, because it spends thinking tokens deliberating over whether
to write the code at all.

**Verdict:** installed, but turned down. It defaults to `full` and injects
itself on SessionStart, SubagentStart and every prompt, which puts it in
direct conflict with `house-style` and `polish`. Those two exist to add craft
that a minimalism rule reads as unnecessary. A hero animation is exactly the
kind of thing "no unrequested abstractions" argues away.

`.claude/settings.json` now pins it:

```json
"env": { "PONYTAIL_DEFAULT_MODE": "lite" }
```

At `lite` it makes a suggestion after the fact instead of silently choosing
the smaller thing. Four levels exist: `off`, `lite`, `full`, `ultra`.

- Building or polishing a site: leave it at `lite`, or `/ponytail off`.
- Working on the Python and shell tooling under `.claude/skills/*/scripts/`:
  `/ponytail full` is genuinely useful there.

Global config, if you want a different default on your own machine, is
`%APPDATA%\ponytail\config.json`.

---

## 7. Code Review

**The claim:** five AI agents scan your code in parallel and catch bugs before
you ship.

**Reality:** accurate, and it is an Anthropic plugin sitting in the official
marketplace, which the video did not mention.

**Verdict:** installed.

```
claude plugin install code-review@claude-plugins-official
```

The part that matters is not the parallel agents, it is the confidence
scoring that filters false positives before they reach you. A reviewer that
cries wolf gets ignored inside a week.

Run `/code-review` on a diff or a PR number.

---

## 8. Claude Mem

**The claim:** memory across every session, so you never re-explain your
project or files again.

**Reality:** real and very popular. Captures what Claude does, compresses it,
injects it back into later sessions. Local SQLite plus a vector index.

**Verdict:** not installed. Two reasons, both about how you actually work:

1. **It cannot persist here.** It stores in `~/.claude-mem/`, outside the
   repo. Claude Code web sessions run in a container that gets reclaimed when
   the session ends, so on the web it would start empty every time. It only
   pays off on your Windows machine.
2. **Check the observer setting before trusting it with client work.** It
   offers hosted sync through cmem.ai and can be pointed at OpenRouter or
   Gemini keys. The docs are vague about what the default observer does, and
   the thing it is capturing is every session you run against client sites.

**What was installed instead:** `claude-md-management`, Anthropic's own.

```
claude plugin install claude-md-management@claude-plugins-official
```

It audits `CLAUDE.md` and folds session learnings back into it. That is
memory that lives in git, survives a reclaimed container, works on the web
and on Windows, and can be read and corrected by a human. This repo already
half does this: `kernel.json`, `sites.csv` and `shipped-log.csv` are project
memory. This makes the habit deliberate.

If you want claude-mem on Windows anyway, install it there and check the
observer setting first.

---

## 9. The Obsidian skill

**The claim:** turns Claude Code into a second brain, linking every file and
function across your codebase.

**Reality:** the second half of that sentence is wrong. Obsidian skills
manage a **notes vault**. They do not index your functions or link your code.
The video has described a code intelligence tool and named a note taking one.

There are also at least fifteen competing Obsidian plugins in the community
directory, all doing roughly the same thing at different quality.

**Verdict:** not installed, because it needs a vault and I do not know
whether you have one.

If you do have an Obsidian vault, say so and I will wire up
`obsidian-vault-for-claude-code`, which archives sessions into an
inspectable, git versioned wiki. That is the one whose value survives
contact with an agency workflow: client decisions and the reasons behind
them, searchable a year later.

If you want the thing the video actually described, code intelligence across
your files and functions, that is a language server. The official marketplace
has them per language (`typescript-lsp`, `pyright-lsp` and so on). Your repo
is mostly HTML and CSS, so there is not much for one to do yet.

---

## 10. The official Anthropic pack

**The claim:** a curated set of the most useful skills, coding, front end and
quality of life.

**Reality:** you already have most of it. The `anthropics/skills` bundle,
docx, pptx, xlsx, pdf, canvas-design, skill-creator, theme-factory,
web-artifacts-builder, is loaded into your sessions already. Nothing to
install.

What the video missed is that Anthropic publishes **40** plugins in the
official marketplace, not one pack. Three of them earn their place here.

**Verdict:** installed three.

```
claude plugin install frontend-design@claude-plugins-official
claude plugin install hookify@claude-plugins-official
claude plugin install claude-md-management@claude-plugins-official
```

- **`frontend-design`** builds interfaces that avoid generic AI aesthetics.
  That is the same fight `house-style` picks, from the other direction, and
  it is the single most relevant thing in the whole marketplace to what we
  sell.
- **`hookify`** writes hooks from plain rules. Every "always do X" that
  currently lives in `CLAUDE.md` as a sentence can become one. The banned
  words hook below is the first.
- **`claude-md-management`** covers the memory problem, per item 8.

---

## What is installed now

```
claude-code-setup@claude-plugins-official        recommends automations
claude-security@claude-plugins-official          vulnerability scanning
claude-md-management@claude-plugins-official     project memory in git
code-review@claude-plugins-official              multi agent PR review
frontend-design@claude-plugins-official          non generic interfaces
hookify@claude-plugins-official                  rules into hooks
firecrawl@claude-community                       scraping, needs a key
ponytail@claude-community                        code minimalism, at lite
```

Marketplaces: `claude-plugins-official` (292), `claude-community` (2,282).

Plugins install per machine. The hooks and settings below are committed, so
they follow the repo. Anyone else cloning it runs the eight commands above.

---

## Automations built here

### `.claude/hooks/no_em_dash.py`

The house rule was a sentence Claude had to remember. Now it is enforced on
every Write and Edit to a text file, and on `git commit` messages, which were
the gap. Reports line numbers so they get fixed on the spot.

### `.claude/hooks/banned_words.py` and `banned-words.txt`

Built with `hookify` in mind, after round one flagged it as the obvious next
one. Catches tired marketing language in copy: your list (premier, elite,
unleash, step into, start your journey) plus the phrases that mark a page as
machine written.

Three things make it safe to leave on:

- **It skips the harvest.** `projects/<slug>/content/` and `source/` hold the
  client's own words under the 99% copy lock. Flagging those would be arguing
  with a decision already made. It only checks `site/`, `design/`,
  `design-pages/` and `cms/`, where the words are ours.
- **It reads copy, not markup.** `class="elite-card"` does not trip it.
- **Any file can opt out** with the marker `banned-words: off`, which is how
  a client genuinely called Elite Something gets through.

The word list is a plain text file. Add and remove freely, it is the whole
configuration.

An audit across the repo found 175 lines carrying these words. Every one is
in the harvest, so the hook stays quiet on all of them. Most common: world
class (111), elite (28), premier (11), unleash (11).

### `.claude/hooks/guard_secrets.py`

`config.env` holds `HOSTINGER_API_TOKEN`, which can delete live client sites.
Blocks Read, Edit and Write against it and any `.env`, blocks Bash commands
that would print one into the transcript, blocks `rm`, `mv` and `truncate`.
Running `hostinger.sh` is unaffected, it sources the file itself.

### `.claude/hooks/py.sh`

Finds `python3`, `python` or `py`, whichever exists, so the hooks run on
Windows Git Bash and on Linux. Exits quietly if none is found, so a missing
interpreter never stalls a session.

### `.claude/settings.json`

Wires all three hooks, pins ponytail to `lite`, denies reads of every `.env`,
and pre approves the read only git commands and the four skill scripts so
they stop asking permission mid build.

---

## How to get more out of this

- **Hooks beat instructions.** Two rules from `CLAUDE.md` are now code that
  cannot be forgotten. `hookify` turns the rest into more. Candidates: no
  build ships without a meta description, no page ships with a placeholder
  image path, every kernel change gets logged.
- **Security scan before handover, not after.** `/claude-security` on the
  built site directory, as a step inside `site-ship`.
- **Feed `claude-md-management` after a hard session.** It writes what was
  learned back into `CLAUDE.md`, which is memory that survives everything.
- **Ponytail off during design work.** It is a code minimalism rule and
  design is where you deliberately spend.
- **Run the recommender again after the next big change.** It reads the repo
  as it is that day, so its answer moves as the repo moves.
- **Search the 2,574 plugins before writing a skill from scratch.** Ask in
  chat, or `/plugin` and use Discover.

---
## Round one transcript

> If you're using Claude Code, then you need to install these five AI plugins
> and skills right now. The first is Claude Code setup. It's an official
> plugin from Anthropic that scans your entire codebase and recommends the
> best hooks, skills, and sub-agents that fit your project, as well as removes
> all of the unnecessary stuff. The second is called Omni route. This gives
> Claude Code almost unlimited usage by connecting it to over 300 free AI
> providers. So, the moment your usage limit runs out, it'll automatically
> switch you to the next best model, giving you up to 1.6 billion free tokens
> every single month. The third is find skills. You just tell it what you're
> building and it'll go and search its whole library of 100,000 skills to find
> the ones most applicable for you. It'll then go and install them and set
> them up. The fourth is Strix, which attacks your Vibe Coded app just like a
> real hacker to find any security vulnerabilities left behind by you. And
> finally, Agent Reach, which lets you scrape anything off the internet, even
> gated platforms like LinkedIn, Instagram, X, and Reddit without paying for a
> single API key. It's free down below, just check the pinned comment.

## Round two transcript

> If you're new to Claude Code, then here are the top five plugins you'll need
> in order to crush it. The first is Ponytail, which optimizes your Claude Code
> output, cutting down your usage by over 50% without losing any accuracy at
> all. The second is Code Review, where five AI agents will scan your code in
> parallel and catch the bugs and errors before any of your app actually goes
> out. The third is Claude Mem. It gives Claude memory across every session, so
> it'll remember your project and files so that you haven't to re-explain a
> thing ever. The fourth is the Obsidian skill, that basically turns your
> Claude Code into a second brain, linking every file and function across your
> codebase, so nothing will ever slip through the cracks. And the fifth is the
> official pack from Anthropic themselves, which is a great starting point as a
> curated set of the most useful skills that you can plug into Claude Code at
> any time, covering coding, front end, and other general quality of life
> improvements. So, if you want to try all these, just comment Claude down
> below and I'll send them to you directly.
