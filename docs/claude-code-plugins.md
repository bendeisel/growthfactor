# Claude Code plugins: the five from the video, checked

Source: a YouTube video recommending five Claude Code plugins. Transcript is
at the bottom. Each one below was looked up before anything was installed,
because two of the five are not what the video says they are.

Status as of 2026-09-09.

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

## What is installed now

```
claude-code-setup@claude-plugins-official     1.0.0   enabled
claude-security@claude-plugins-official       0.11.0  enabled
firecrawl@claude-community                    1.0.9   enabled
```

Marketplaces configured: `claude-plugins-official`, `claude-community`.

---

## Automations built from the Claude Code Setup pass

`claude-code-setup` only recommends. These were built from its output.

### `.claude/hooks/no_em_dash.py`

The house rule says no em dashes, ever. It was a rule Claude had to remember.
Now it is enforced.

- After any Write or Edit to a text file, the file is scanned. An em dash, or
  an en dash with spaces around it, sends the line numbers back so they get
  fixed on the spot.
- Before any Bash command containing `git commit`, the message is scanned too,
  because commit messages were the gap.
- Skips `.claude/hooks/`, binaries and images.

### `.claude/hooks/guard_secrets.py`

`config.env` holds `HOSTINGER_API_TOKEN`, and that token can delete live
client websites.

- Blocks Read, Edit and Write against `config.env` and any `.env` file.
- Blocks Bash commands that would print one into the transcript, so the token
  never lands in a conversation log.
- Blocks `rm`, `mv` and `truncate` against them.
- Running `hostinger.sh` still works. It sources the file itself, and that
  never crosses into the transcript.

### `.claude/settings.json`

Wires up both hooks, denies reads of every `.env`, and pre approves the
read only git commands and the four skill scripts so they stop asking
permission mid build.

### `.claude/hooks/py.sh`

Finds `python3`, `python` or `py`, whichever exists. Windows Git Bash and
Linux both work. If no Python is found it exits quietly rather than blocking
the session.

---

## How to get more out of this

- **Run the recommender again after the next big change.** Just ask for
  Claude Code automation recommendations. It reads whatever the repo looks
  like at that moment, so its answer changes as the repo does.
- **Security scan before handover, not after.** `/claude-security` on the
  built site directory, as a step in `site-ship`, catches exposed keys in
  inline JS and form endpoints posting somewhere unintended.
- **Hooks beat instructions.** Every rule currently living in `CLAUDE.md` as
  a sentence is a candidate. Anything checkable by a script belongs in a
  hook, where it cannot be forgotten. Obvious next ones: banned marketing
  words (premier, elite, unleash, step into, start your journey) checked on
  write, and a check that no build ships without a meta description.
- **Search before building.** 2,574 plugins across the two directories. Ask
  before writing a skill from scratch.
- **Plugins are per machine, not in the repo.** The three above are installed
  for this user. The hooks and settings are committed, so they follow the
  repo. Anyone else cloning it needs the three install commands above.

---

## Transcript

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
