# 09.6 Agent 4: Reactivation

**Module:** 09 Your Agents
**Video:** ~10 min
**Needs first:** 09.2, 02.1
**You finish with:** the agent that works your dead list, without embarrassing
you

## Why this matters

The most valuable list a gym owns is the people who already paid them once,
and almost nobody works it.

They know your gym, they know your coaches, they already decided you were
worth money. Winning one back is cheaper than finding a new one by a distance.

This is also the agent with the highest chance of embarrassing you, which is
why it ships paused.

## Two populations, one agent

It must tell them apart, and it does, from `membership_type`,
`membership_start`, `last_attended` and the tags.

| | Lapsed member | Old lead |
|---|--------------|----------|
| Knows your gym | Yes | No |
| Ever paid you | Yes | No |
| Right opener | Personal, no offer | Reminder of what they asked about |
| Wrong opener | "Come try us out" | Assuming they remember you |

**Treating a lapsed member like a lead is the classic mistake.** A message
saying "come and try us out, first class free" to somebody who trained with
you for two years tells them immediately that nobody remembers them.

[SHOT 09.6-01]

## The lapsed member sequence

| Touch | Day | Content |
|-------|-----|---------|
| 1 | 0 | Personal. How long they trained, what they trained, the coach. Ask how they have been. **No offer at all** |
| 2 | 3 | Ask straight out what made them stop. Write to `objection_last` |
| 3 | 7 | What has changed since they left. Invite them back, no strings |
| 4 | 12 | Close the file. Door is open, here is the number |

**Touch 1 has no offer in it.** That is deliberate and owners always want to
change it. A message that just asks how somebody has been gets replies. A
message with an offer in it gets read as marketing and ignored.

The offer can come at touch 3, once they have replied and you know why they
left.

## Banned opener

> `We miss you!`

Everybody says it, it means nothing, and it is transparently automated. The
prompt forbids it.

## The old lead sequence

| Touch | Day | Content |
|-------|-----|---------|
| 1 | 0 | Reference what they originally asked about, from `goal_stated`. Is it still on their mind? |
| 2 | 3 | Address `objection_last`. If the thing that stopped them has changed, say so |
| 3 | 7 | The current trial offer, two specific times |
| 4 | 12 | Close the file |

## The angry ex-member rule

If the history shows a complaint, a billing dispute, or an argument, the agent
**sends nothing** and escalates with the reason "lapsed with unresolved
complaint".

This is the single most damaging message an agent can send. A cheerful win-back
text to somebody who left because of a row about their contract turns a quiet
ex-member into a public review.

Do not remove this rule.

[SHOT 09.6-02]

## Who gets tagged, and when

By workflow, never by hand in bulk. See 06.3.

| Trigger | Population | Priority |
|---------|-----------|----------|
| `last_attended` over 30 days, tag `member` | Lapsing, still paying | Highest. Catch before they cancel |
| `member-lapsed` over 14 days ago | Recently cancelled | High |
| Opportunity in Lost over 90 days | Dead lead | Steady |
| Manual, by you | You remembered someone | Whenever |

Never tagged: `injured`, `do-not-contact`, `billing-hold`.

## The lapsing member case is the best one

A member who has not trained in 30 days but is still paying is about to
cancel and does not know it yet.

A message at that point is not a win-back, it is a save, and saves are far
easier than wins. This is the highest return thing the reactivation agent
does, and it depends entirely on `last_attended` being maintained. See 02.1.

## What has changed since they left

Touch 3 for lapsed members needs a live section in your knowledge base: new
classes, new coaches, new times, the renovation.

**Keep it current.** If it says the same thing it said a year ago, touch 3 is
worthless and slightly sad.

## The prompt

Full text: `assets/agent-prompts/04-reactivation-agent.md`.

## What you should edit

1. **The lapse window.** Thirty days suits a class-based gym. A 24 hour gym
   where people train alone might want sixty.
2. **What has changed.** In the knowledge base, and keep it current.
3. **Whether a win-back offer exists.** Most gyms should have one. It belongs
   in the KB, not the prompt, so the agent can only offer what you approved.

## Test it with these ten

1. Lapsed member, `last_attended` six weeks ago. Touch 1 must not pitch.
2. Old lead from a year ago with `goal_stated` filled in.
3. Old lead with nothing on the record.
4. Lapsed member whose history contains a complaint. Must escalate, send
   nothing.
5. Reply `I moved away`. Should close gracefully.
6. Reply `I got hurt`. Must escalate, must not advise.
7. Reply `too expensive`. Must not invent a discount.
8. Contact with `reactivation` and `injured`. Nothing sends.
9. Same contact tagged twice in three months. Visible as a workflow problem.
10. Lapsed member replies `who is this`. Does it recover politely?

Test 4 is the one to run first. If it does not escalate, do not publish this
agent.

## Checklist

- [ ] It tells lapsed members and old leads apart, tested
- [ ] Touch 1 for lapsed members has no offer
- [ ] "We miss you" is not in there
- [ ] The angry ex-member rule works, tested
- [ ] Lapse window set to suit my gym
- [ ] `last_attended` is genuinely being maintained
- [ ] What has changed is current in the KB
- [ ] Win-back offer, if any, is in the KB
- [ ] Ran all ten tests

## When it goes wrong

**A lapsed member got a "come try us" message.** It classified them as a lead.
Check `membership_type` and `membership_start` are populated on your imported
members. See 02.5.

**It messaged somebody who left angry.** The complaint was not in the
conversation history it could see. Add a `gym-left-unhappy` tag to those
people manually and ask us to exclude it.

**It is messaging people who trained yesterday.** `last_attended` is stale.
This is embarrassing and it is a data problem, not an agent problem.

**Nobody replies.** Touch 1 probably has an offer in it. Take it out.

## Shot list

| Shot | Screen | Capture | Highlight | Blur |
|------|--------|---------|-----------|------|
| 09.6-01 | The prompt showing the two population branches | The prompt | The classification logic | Nothing |
| 09.6-02 | The angry ex-member escalation rule | The prompt | The rule | Nothing |
| 09.6-03 | Test panel, a lapsed member touch 1 with no offer | The message | The absence of a pitch | Nothing |
| 09.6-04 | Lapse Watch workflow and its 30 day condition | The workflow | The condition | Nothing |

## Video script

**Hook.** The most valuable list your gym owns is the people who already paid
you once. Almost nobody works it, and the ones who do usually do it so badly
they would have been better off not bothering.

**Beats.**
1. On screen: the two populations table. Then read a "come try us out" message
   addressed to a two year member. Let it be awkward.
2. On screen: the lapsed sequence. Touch 1 with no offer. Defend that
   decision, owners will push back.
3. On screen: "we miss you" banned. Ten seconds.
4. On screen: the angry ex-member rule. Serious tone. Say this is the one
   message that turns a quiet ex-member into a public review.
5. On screen: the lapsing member case. Frame it as a save, not a win-back, and
   tie it back to `last_attended`.
6. On screen: run test 4 and show it escalating.

**Go do.** Run test 4 before you unpause this agent. If it does not escalate,
tell us.

## Verify on screen

- Whether conversation history from before the import is visible to the agent,
  since the angry ex-member rule depends on it.
- Confirm Lapse Watch and Dead Lead Sweep are both tagging into this agent.
