# The stack, by repo

Forty open-source repos across the seven things Growth Factor actually sells.
Every entry was checked against its live GitHub page on **8 September 2026**:
stars, license, archive status, and last commit. Nothing here is from memory.

Ranking is "what would we actually run for a client", not star count. Where a
repo is popular but thin, or official but stale, it says so.

**Verification key:** stars and last-commit dates are as of 8 Sep 2026. A repo
flagged `STALE` has not been touched in over a year. A repo flagged `EARLY` has
real code but a short history, so treat it as a component to read, not a
dependency to bet a client on.

---

## 1. Website dev (Astro, HTML, 21st.dev)

| # | Repo | Stars | License | Last commit | Why it earns the slot |
|---|------|-------|---------|-------------|----------------------|
| 1 | [withastro/astro](https://github.com/withastro/astro) | 62.4k | MIT | 5 Sep 2026 | The framework already under Fighters Boxing. Ships zero JS by default, which is the whole reason our pages score. |
| 2 | [serafimcloud/21st](https://github.com/serafimcloud/21st) | 5.4k | MIT | active | The registry itself, open source. Worth having locally so we can read a block's source instead of guessing at it from the site. |
| 3 | [tailwindlabs/tailwindcss](https://github.com/tailwindlabs/tailwindcss) | 97.5k | MIT | active | Every 21st block assumes it. Non-negotiable if we lift components. |
| 4 | [motiondivision/motion](https://github.com/motiondivision/motion) | 33.5k | MIT | active | Formerly Framer Motion. Matters for us specifically: it drives animation from JS, not CSS keyframes, which is the failure mode BMFG already documents on Ben's machine. |
| 5 | [alpinejs/alpine](https://github.com/alpinejs/alpine) | 31.9k | MIT | active | Interactivity inside plain HTML with no build step. Fits the artboard-to-Hostinger path where React is overkill. |

**Notes**

- [shadcn-ui/ui](https://github.com/shadcn-ui/ui) (123.4k, MIT) is the base layer
  under every 21st component. Not in the five because our gym builds ship static
  HTML, but the moment we lift a 21st block we are in shadcn conventions.
- [21st-dev/magic-mcp](https://github.com/21st-dev/magic-mcp) (5.8k, ISC) is
  **deprecated**. It now runs as a compatibility proxy to the unified 21st MCP.
  If a config anywhere still points at magic-mcp, repoint it.

---

## 2. SEO

| # | Repo | Stars | License | Last commit | Why it earns the slot |
|---|------|-------|---------|-------------|----------------------|
| 1 | [GoogleChrome/lighthouse](https://github.com/GoogleChrome/lighthouse) | 30.7k | Apache-2.0 | active | The scoring engine everything else wraps. Run it in CI and a regression cannot reach a client. |
| 2 | [harlan-zw/unlighthouse](https://github.com/harlan-zw/unlighthouse) | 4.8k | MIT | 14 Aug 2026 | Lighthouse across an entire site with smart sampling, one command, real UI. This is the audit deliverable, not a single-page score. |
| 3 | [stjudewashere/seonaut](https://github.com/stjudewashere/seonaut) | 779 | MIT | 23 May 2026 | Self-hosted technical crawl: canonicals, hreflang, redirect chains, duplicate titles. The Screaming Frog job without the seat licence. |
| 4 | [sitespeedio/sitespeed.io](https://github.com/sitespeedio/sitespeed.io) | 5.0k | MIT | active | Real-browser performance monitored over time. Turns "the site got slower" into a graph with a date on it. |
| 5 | [Yoast/wordpress-seo](https://github.com/Yoast/wordpress-seo) | 2.0k | GPL | active | The WordPress half of the book. Reading the source beats guessing at what the plugin is emitting on a client install. |

---

## 3. AI search (GEO / AEO)

Honest state of this category: it is eighteen months old and mostly marketing.
Two tools are real, two crawlers do the heavy lifting underneath, and one
tracker is promising but young.

| # | Repo | Stars | License | Last commit | Why it earns the slot |
|---|------|-------|---------|-------------|----------------------|
| 1 | [Auriti-Labs/geo-optimizer-skill](https://github.com/Auriti-Labs/geo-optimizer-skill) | 776 | MIT | 4 Sep 2026 | The most complete one running. Audits a site for AI-answer visibility, emits robots rules, llms.txt, JSON-LD. Ships as CLI, Python lib, MCP server and an Astro integration, which is exactly our stack. |
| 2 | [AnswerDotAI/llms-txt](https://github.com/AnswerDotAI/llms-txt) | 2.6k | Apache-2.0 | active | The spec itself. Read it once, then every client site gets a correct llms.txt instead of a copied one. |
| 3 | [firecrawl/firecrawl](https://github.com/firecrawl/firecrawl) | 177.9k | AGPL-3.0 | active | Scrape and search at scale. This is how you actually measure AI visibility: pull the answers, diff the citations. Note AGPL before embedding it in anything we sell. |
| 4 | [unclecode/crawl4ai](https://github.com/unclecode/crawl4ai) | 82k | Apache-2.0 | 31 Aug 2026 | Same job, permissive licence. Clean markdown out of any page, which is what feeds a citation tracker or a RAG index. |
| 5 | [ai-search-guru/getcito](https://github.com/ai-search-guru/getcito-worlds-first-open-source-aio-aeo-or-geo-tool) | 406 | MIT | 27 Aug 2026 | `EARLY` Prompt tracking and citation analysis across ChatGPT, Perplexity, Gemini and AI Overviews, self-hosted. Only 41 commits and it is a fork of Elmo, so read it before trusting it. The architecture is worth copying either way. |

**Skipped:** [Advance-Labs/aeo-toolkit](https://github.com/Advance-Labs/aeo-toolkit)
presents well and has 868 tests, but it sits at **1 star**. No adoption, no
outside eyes. Watch it, do not deploy it.

---

## 4. Ads

| # | Repo | Stars | License | Last commit | Why it earns the slot |
|---|------|-------|---------|-------------|----------------------|
| 1 | [googleads/google-ads-python](https://github.com/googleads/google-ads-python) | 745 | Apache-2.0 | 26 Aug 2026 | Google's own client. Everything else in this category is downstream of it. |
| 2 | [google/ads-api-report-fetcher](https://github.com/google/ads-api-report-fetcher) | 64 | Apache-2.0 | 31 Aug 2026 | gaarf. Write a GAQL query, point it at BigQuery or CSV, done. This is the piece that kills hand-built reporting scripts, and it is Google's. Low stars, high leverage. |
| 3 | [Opteo/google-ads-api](https://github.com/Opteo/google-ads-api) | 339 | MIT | active, on API v23 | Unofficial Node client, and the better ergonomics if the automation lives in JS rather than Python. |
| 4 | [facebook/facebook-python-business-sdk](https://github.com/facebook/facebook-python-business-sdk) | 1.6k | Meta Platform License | 4 Sep 2026 | The Meta side. Note it is Meta's own licence, not MIT. |
| 5 | [BingAds/BingAds-Python-SDK](https://github.com/BingAds/BingAds-Python-SDK) | 128 | MIT | 31 Jul 2026 | Microsoft Ads. Small category, cheap clicks, almost no agency competition. |

---

## 5. AI bot building (chat, voice, managed)

| # | Repo | Stars | License | Last commit | Why it earns the slot |
|---|------|-------|---------|-------------|----------------------|
| 1 | [pipecat-ai/pipecat](https://github.com/pipecat-ai/pipecat) | 15.3k | BSD-2-Clause | active | The strongest open voice framework right now. Python-first STT to LLM to TTS pipelines, huge integration list, near-daily commits. |
| 2 | [livekit/agents](https://github.com/livekit/agents) | 14.1k | Apache-2.0 | active | Wins on telephony. Native SIP and phone numbers through LiveKit's own stack, so a gym's missed-call-text-back agent answers a real phone line. |
| 3 | [chatwoot/chatwoot](https://github.com/chatwoot/chatwoot) | 36.6k | MIT | active | The "managed" half. Omni-channel inbox with human handoff, self-hosted. A bot without a handoff path is a liability. |
| 4 | [TEN-framework/ten-framework](https://github.com/TEN-framework/ten-framework) | 11.1k | Apache-2.0 | active | Real-time conversational voice, strong on interruption handling and low latency. The one to benchmark Pipecat against. |
| 5 | [baptisteArno/typebot.io](https://github.com/baptisteArno/typebot.io) | 10.3k | AGPL-3.0 / FSL | active | Self-hosted visual chat flows. Fastest path to a qualifying bot on a client site when a full agent is overkill. Check the licence before white-labelling. |

**GHL bonus:** none of the five are GHL-native. The bridge is section 6:
run the agent here, write contacts, conversations and opportunities into
HighLevel over the official SDK or the MCP server.

---

## 6. GHL: building, maintenance, managing

The weakest category on GitHub by a distance. Almost everything is a solo
MCP server with a big README and a short commit log. Ranked by what will still
work in six months.

| # | Repo | Stars | License | Last commit | Why it earns the slot |
|---|------|-------|---------|-------------|----------------------|
| 1 | [GoHighLevel/highlevel-api-sdk](https://github.com/GoHighLevel/highlevel-api-sdk) | 29 | MIT | 3 Sep 2026 | **Official**, TypeScript, and committed to five days ago. Typed wrapper over the public API with auth and error handling built in. Low stars because almost nobody knows it exists. Start here. |
| 2 | [n8n-io/n8n](https://github.com/n8n-io/n8n) | 203.7k | Sustainable Use License | active | Ships a first-party HighLevel node with both v1 and v2 API versions in tree. Already in Ben's stack, so GHL automation that does not belong in a workflow builder can live here instead. |
| 3 | [basicmachines-co/open-ghl-mcp](https://github.com/basicmachines-co/open-ghl-mcp) | 51 | AGPL-3.0 | 8 Jul 2026 | The best-maintained community MCP server: API v2, proper OAuth, CI, type checking. AGPL, so keep it as a tool you run, not code you ship to a client. |
| 4 | [GoHighLevel/ghl-marketplace-app-template](https://github.com/GoHighLevel/ghl-marketplace-app-template) | 88 | MIT | 25 Jun 2025 | `STALE` **Official** Express plus Vue template covering the OAuth flow, webhooks and SSO decryption. Fourteen months untouched, so expect to fix the API calls. Still the fastest read of how marketplace auth actually works. |
| 5 | [mastanley13/GoHighLevel-MCP](https://github.com/mastanley13/GoHighLevel-MCP) | 197 | ISC | 6 Jul 2025 | `STALE` The most-starred community GHL MCP, 269 tools across 19 categories, and its own README calls it foundational rather than production-ready. Fourteen months untouched. Mine it for tool definitions, do not run it. |

**Alternates:** [MusheAbdulHakim/gohighlevel-php-sdk](https://github.com/MusheAbdulHakim/gohighlevel-php-sdk)
(16 stars, MIT, 157 commits, PSR-18, PHP 8.1+) is the one to reach for when the
work is inside a WordPress plugin. [M2KDevelopments/gohighlevel](https://github.com/M2KDevelopments/gohighlevel)
(15 stars, MIT) is a lighter Node wrapper.

**Skipped:** [maxtron777/awesome-gohighlevel](https://github.com/maxtron777/awesome-gohighlevel)
is 2 commits and 1 star. It is a link list, not a resource.

---

## 7. Reporting: ads, SEO, AI search, heat maps, websites

Ten repos. Read it as three layers: pull the data, store and model it, put a
face on it. Sections 2 through 4 are the sources that feed this.

### Dashboards and BI

| # | Repo | Stars | License | Why it earns the slot |
|---|------|-------|---------|----------------------|
| 1 | [metabase/metabase](https://github.com/metabase/metabase) | 49.1k | AGPL-3.0 + commercial | The client-facing default. Someone who cannot write SQL can still answer their own question, which cuts the "can you send me the numbers" emails to zero. |
| 2 | [evidence-dev/evidence](https://github.com/evidence-dev/evidence) | 6.9k | MIT | BI as code: SQL plus markdown compiles to a static site. Version-controlled monthly client reports that deploy exactly like our websites do. |
| 3 | [apache/superset](https://github.com/apache/superset) | 74.7k | Apache-2.0 | Heavier than Metabase, more chart types, better at multi-tenant. The answer when one dashboard has to serve thirty client logins. |
| 4 | [lightdash/lightdash](https://github.com/lightdash/lightdash) | 6.1k | see LICENSE | dbt-native. Metrics defined once in the model layer instead of redefined in every chart, which is how "clicks" stops meaning three things. |
| 5 | [grafana/grafana](https://github.com/grafana/grafana) | 76.7k | AGPL-3.0 | Time series and alerting. Use it for uptime, Core Web Vitals and spend-pacing alarms rather than for client-facing reports. |

### Pipeline

| # | Repo | Stars | License | Why it earns the slot |
|---|------|-------|---------|----------------------|
| 6 | [airbytehq/airbyte](https://github.com/airbytehq/airbyte) | 22k | MIT + ELv2 | 600+ connectors, including certified Google Ads (GAQL custom queries supported) and Facebook Marketing sources. This is the layer that stops us writing one more API script per client. |

### Behaviour, heat maps and websites

| # | Repo | Stars | License | Why it earns the slot |
|---|------|-------|---------|----------------------|
| 7 | [PostHog/posthog](https://github.com/PostHog/posthog) | 39.7k | MIT (`ee` dir proprietary) | The only one on this list with real heat maps **and** session replay **and** funnels in one self-hostable box. If you pick one behaviour tool, pick this. |
| 8 | [openreplay/openreplay](https://github.com/openreplay/openreplay) | 12.8k | see LICENSE | Session replay and co-browsing, self-hosted, roughly a thirty-minute Docker Compose install. Better replay fidelity than PostHog; co-browsing is genuinely useful on a support call. |
| 9 | [matomo-org/matomo](https://github.com/matomo-org/matomo) | 21.8k | GPL-3.0 | The GA4 replacement clients ask for by name. Heads-up: **heat maps and session recording are a paid plugin**, around €149/year, not GPL core. Budget it or use PostHog. |
| 10 | [umami-software/umami](https://github.com/umami-software/umami) | 38.7k | MIT | Cookieless, tiny script, one page of numbers a gym owner will actually read. Put this on every client site as the baseline, then add PostHog where behaviour matters. |

**Heat maps, straight answer:** there is no good standalone open-source heat map
library. [pa7/heatmap.js](https://github.com/pa7/heatmap.js) (6.4k, MIT) is the
canonical one and its maintainer says in the README that he is one person with
very little time. [rrweb-io/rrweb](https://github.com/rrweb-io/rrweb) (20.1k,
MIT) is the recording engine underneath most replay products and is the right
building block if we ever build our own. For client work, take the heat maps
from PostHog and stop there.

---

## What this changes

1. **GHL is the gap, and the fix is free.** We should be on
   `GoHighLevel/highlevel-api-sdk`, official and committed to last week, rather
   than any community MCP server. The two most-starred community options are
   both fourteen months stale.
2. **gaarf is the ads reporting shortcut.** 64 stars, written by Google, turns
   GAQL into BigQuery tables. It replaces the reporting scripts before we write
   them.
3. **AI search tooling is not mature enough to resell as a product yet.**
   geo-optimizer-skill is good enough to run as an audit today. Building a
   tracked, recurring AI-visibility report means writing it ourselves on top of
   crawl4ai.
4. **One artifact-shaped opportunity:** Evidence compiles SQL plus markdown into
   a static site. Our delivery pipeline already ships static sites to Hostinger.
   Client reporting could ride the exact same path as client websites.
