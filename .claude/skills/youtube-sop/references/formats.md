# Output formats

Same rules everywhere: no em dashes, no stale marketing words, short lines,
real actions. Header block goes on every format.

```
Source: <title>
Channel: <channel> | Length: <mm:ss> | <url>
Pulled: <date>
```

---

## SOP

```markdown
# SOP: <what this gets done>

**Outcome:** one sentence on what exists when this is finished.
**Time:** rough estimate from the video.
**Needs:** accounts, tools, access, budget, anything with a price.

## Before you start
- [ ] prerequisite
- [ ] prerequisite

## Steps

### 1. <verb-first name>  [4:12]
Do this. Then this. Exact settings, field names, and values from the video.

> Watch out: the mistake the video warns about, if it named one.

### 2. <verb-first name>  [9:30]
...

## Done when
- [ ] the check that proves it worked
- [ ] the check that proves it worked

## Gaps
Things the video skipped or waved past, and what we would need to decide.
```

Steps are numbered and ordered. One action per step. If a step has more than
about six sub-actions, it is two steps.

---

## Summary

```markdown
# <title>

**The claim:** what the video argues, in one line.

## What it actually says
- point, with the specific behind it
- point
- point

## Worth stealing
- the tactic, and where it fits in our work

## Skip
- the filler, the upsell, the part that does not hold up

## Numbers
Any figure, price, benchmark, or timeline the video gave.
```

---

## Checklist

Flat list of do-able items, ordered, no prose. Group under headings only if
the video has real phases. Every item starts with a verb.

---

## Agent spec

For "can we automate this". Read the video as a workflow.

```markdown
# Automation: <name>

**Trigger:** what starts it.
**Steps:** each one as a system action, with the tool that does it.
**Inputs / outputs:** data in, data out, where it lands.
**Human checkpoints:** where a person has to approve.
**Stack:** GHL, n8n, Zapier, Claude, whichever fits.
**Manual for now:** the parts that cannot be automated yet, and why.
```

---

## Content swipe

```markdown
# Swipe: <title>

## Hooks
Five, lifted or adapted from the video. Short. No stale phrasing.

## Structure
How the video is built, beat by beat, so it can be rebuilt on another topic.

## Lines worth keeping
Direct quotes, marked as quotes.

## Our angle
How Growth Factor would run this, and for which client.
```
