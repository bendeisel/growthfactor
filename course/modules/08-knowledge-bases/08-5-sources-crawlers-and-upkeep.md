# 08.5 Sources, crawlers and keeping it current

**Module:** 08 Knowledge Bases
**Video:** ~8 min
**Needs first:** 08.2
**You finish with:** the right source types in the right places, and a habit
that keeps the whole thing accurate

## Why this matters

A knowledge base is not a project you finish. Your schedule changes, prices go
up, a coach leaves, you add a program.

A stale knowledge base is worse than a thin one, because a thin one says "let
me check" and a stale one confidently tells somebody last year's price.

## The source types

[SHOT 08.5-01]

| Type | Use for | Do not use for |
|------|---------|---------------|
| **Rich Text** | Prose sections: who you are, policies, rules | Schedules, prices |
| **Table** | Schedule, pricing, anything looked up precisely | Narrative |
| **FAQ** | One question, one answer | Long explanations |
| **File Upload** | Waiver, handbook, price sheet, program guide | Anything that changes weekly |
| **Web Crawler** | Your own site, as backup | Your primary source of truth |
| **Web Search** | Broad context | Anything about your gym specifically |

## The crawler, and the trap

The crawler indexes pages from a URL you give it. Point it at your own site
and it picks up a lot of content quickly.

That is genuinely useful for coverage, and it is where most bad answers come
from.

**The trap:** your site has an old page. A 2024 pricing page you forgot to
delete, a class schedule from before you changed times, an offer that ended.
The crawler indexes all of it, and the agent now has two answers and picks the
wrong one.

Rules:

1. Crawl your site **after** you have written the manual sections, not
   instead of them.
2. Crawl specific pages, not the whole site, where you can.
3. Before crawling, click through your own site and delete or update anything
   out of date. Do this properly, it takes twenty minutes and it prevents the
   most common failure in this module.
4. When you change a price on your site, re-crawl.

[SHOT 08.5-02]

## Order of priority

If two sources disagree, you want the agent using the right one. Build in this
order and keep the manual sections richer than the crawl.

1. Tables for schedule and pricing. Most authoritative.
2. Rich Text for policies and rules.
3. FAQ for common questions.
4. Files for reference documents.
5. Crawler last, for coverage on things you did not think to write.

## The maintenance habit

### When something changes, same day

| Change | Update |
|--------|--------|
| Price change | Pricing table, then re-crawl your site |
| Schedule change | Schedule table |
| New program | Programs section, FAQ, schedule |
| Coach leaves or joins | Coaches section |
| New offer | The offer section and `trial_offer` custom value, 01.5 |
| Policy change | Policies section, and section 10 if it affects what the agent may say |

### Monthly, fifteen minutes

1. Open the **Needs a human** smart list from 02.2.
2. Read `ai_escalation_reason` across the escalations from the last month.
3. Look for the same question appearing more than twice.
4. Each repeat is a knowledge base gap. Write the answer into the FAQ.

**This is the best maintenance signal you have.** Your members are telling you
exactly what your knowledge base is missing, one escalation at a time. Most
gyms never look.

[SHOT 08.5-03]

### Quarterly

1. Read your whole knowledge base top to bottom. It takes twenty minutes.
2. Fix anything out of date.
3. Re-crawl your site.
4. Run the ten question test from 08.2.

## Attaching the knowledge base to an agent

The base does nothing until an agent uses it.

1. Open the agent.
2. Confirm the knowledge base is attached, and that the knowledge base tool is
   available to it.

   [SHOT 08.5-04]

3. All six of your agents should reference the same base. One base, six
   agents. Do not build a separate base per agent, it triples your
   maintenance and they drift apart.

## Test it

After any change:

1. Ask the agent the question your change relates to.
2. Confirm the new answer comes back, not the old one.

Indexing is not always instant. If the old answer persists, wait a few minutes
and ask again before assuming it did not save.

## Checklist

- [ ] Right source type for each section
- [ ] Site cleaned of outdated pages before crawling
- [ ] Crawler added last, as backup
- [ ] One knowledge base, attached to all six agents
- [ ] Same-day updates when something changes
- [ ] Monthly escalation review in my calendar
- [ ] Quarterly full read in my calendar

## When it goes wrong

**The agent gives an old price.** Almost always the crawler serving an
outdated page. Find the page, fix or delete it, re-crawl.

**The agent contradicts itself between conversations.** Two sources disagree.
Find both, delete one.

**Changes are not taking effect.** Indexing delay, or the source did not save.
Wait, then check the source directly.

**Escalations keep repeating on the same question.** You have not written the
answer down yet. That is the monthly habit, and it is the whole point of it.

## Shot list

| Shot | Screen | Capture | Highlight | Blur |
|------|--------|---------|-----------|------|
| 08.5-01 | Add source, the type selector | The type options | Table and Web Crawler | Nothing |
| 08.5-02 | Web crawler configuration | The URL and settings | The URL field | Nothing |
| 08.5-03 | Needs a human list showing repeated escalation reasons | The list | Two identical reasons | Names |
| 08.5-04 | An agent's knowledge base attachment | The agent config | The attached KB | Nothing |

## Video script

**Hook.** A stale knowledge base is worse than a thin one. A thin one says
"let me check". A stale one confidently quotes last year's price.

**Beats.**
1. On screen: the source types table. Fast.
2. On screen: the crawler trap. Find a real outdated page on a demo gym site,
   crawl it, show the agent quoting the wrong price. That demo is the lesson.
3. On screen: clean the site, re-crawl, ask again, correct answer.
4. On screen: the escalation review. Open Needs a human, read three reasons,
   spot a repeat, write the FAQ entry live. This is the habit that keeps it
   alive.
5. On screen: the attachment check across agents.

**Go do.** Click through your own website and find one page that is out of
date. There will be one. Fix it before you crawl.

## Verify on screen

- Exact source type names and whether Web Search is available on our plan.
- Whether the crawler can be pointed at specific pages or only a whole domain.
- Re-index timing after an edit.
- Where the knowledge base is attached on a Managed Agent.
