# 09.7 Agent 5: Review

**Module:** 09 Your Agents
**Video:** ~9 min
**Needs first:** 09.2, 01.5
**You finish with:** a steady flow of Google reviews, and bad experiences
reaching you before they reach the internet

## Why this matters

Local search for gyms is won on review count and recency. A worse gym with 40
recent reviews outranks a better gym with 9 old ones.

Every owner knows they should ask. Almost none of them do it consistently,
because asking feels awkward and it never becomes a habit.

This agent asks every time, at the right moment, and it never gets awkward
about it.

## The gate, and the legal line

The agent asks **how it went** before it sends a Google link. Happy people get
the link. Unhappy people get a human.

That is legitimate and it is good service.

**What is not legitimate**, and what this agent must never do:

- Offer anything in exchange for a positive review
- Only ask people you expect to be happy, while formally suppressing the rest
- Refuse to give the link to somebody who wants to leave a negative review

The rule this agent follows: **everybody gets asked, anybody can leave a
public review if they want to, and unhappy people get a human first.**

If somebody says they want to leave a public review after a bad experience,
the agent gives them the link and flags it to you so you know it is coming and
can respond publicly.

Plenty of gym owners have been sold a "review gating" funnel that crosses this
line. Google can and does remove reviews from businesses caught doing it. Do
not.

[SHOT 09.7-01]

## How it works

### Message 1 asks how it is going, not for a review

> `Hey Marcus, you have been in three weeks now. How is the boxing going, be
> honest.`

Specific to what they do. Asks for honesty. Not a review request.

### Then it sorts the answer into three

**Positive.** Thanks them, asks whether they would put that in a Google
review, gives one honest sentence about why it matters, sends
`{{custom_values.google_review_link}}`.

One reminder at day 3 if they said yes and did not do it. **One.** Nagging a
happy member for a review makes them less happy.

**Mixed.** Something good, something not. Thanks them for the honest part,
asks one question about the problem, does not send the link, escalates with
the specific issue.

**Negative.** Does not defend, does not explain, does not send a link.
Acknowledges in one sentence, says the owner will contact them personally,
escalates immediately with `staff-handling`.

[SHOT 09.7-02]

## When it fires

By workflow. See 06.3.

| Moment | Why |
|--------|-----|
| 3 days after `first_visit_done` | The honeymoon window |
| 30 days after `membership_start` | They have a real opinion now |
| After a milestone: a grading, a first competition, a goal hit | Peak emotion, best reviews |
| After a positive reply to any agent | Free signal, act on it |

Never fires on `billing-hold`, `do-not-contact`, or an open complaint. Never
twice on the same person within six months.

## The martial arts advantage

If you run gradings, fire this after every single one.

Somebody who just got a new belt is at the most positive moment they will have
all year, in front of their family, with photos. A review request that evening
converts better than anything else you will ever send.

Set it up and you will out-review every other gym in town within a year.

## The link matters more than the message

Use the direct write-a-review link, not your Google Business Profile URL. See
01.5.

Every extra tap costs you reviews. Test it on your own phone: it should open
straight to the star rating.

[SHOT 09.7-03]

## The prompt

Full text: `assets/agent-prompts/05-review-agent.md`.

## What you should edit

1. **The moments.** Which milestones matter is gym-specific. Gradings for
   martial arts, first competition, a weight or strength goal.
2. **The opening question.** It should sound like you.
3. **Where the link points.** Google first. Only add Facebook if you actually
   get traffic there.

## Responding to reviews

Separate from this agent but part of the same job.

Respond to every review, good and bad, within a day or two. Reviews AI can
draft responses, and drafting is all you should let it do. Read and edit
before posting, because a canned reply to a heartfelt review is worse than no
reply.

For a negative review: acknowledge, do not argue, take it offline, and never
mention anything private about the member.

## Test it with these ten

1. Reply `yeah loving it`. Must ask for the review and send the link.
2. Reply `it's fine`. Ambiguous. Should probe, not assume.
3. Reply `classes are great but the changing rooms are disgusting`. Mixed.
   Must escalate, no link.
4. Reply `honestly I'm thinking of quitting`. Must escalate, no defending.
5. Reply `I'm going to leave a review alright, a bad one`. Must not withhold
   the link, must flag to you.
6. Reply `what do I get for it`. Must not offer anything.
7. No reply. One nudge, then silence.
8. Fire on someone with `billing-hold`. Nothing sends.
9. Fire twice on the same contact. Second must not send.
10. Reply `sure, what should I write`. Must not write it for them.

Tests 5 and 6 are the legal ones. Run them.

## Checklist

- [ ] Google review link is the direct write link, tested on a phone
- [ ] Review moments configured, including gradings if applicable
- [ ] Opening question sounds like me
- [ ] Never offers anything in exchange, tested
- [ ] Gives the link even to somebody unhappy, tested
- [ ] `billing-hold` blocks it, tested
- [ ] Not twice within six months
- [ ] I respond to reviews within two days

## When it goes wrong

**Nobody leaves a review even after saying yes.** The link. Test it on a
phone, logged out.

**A member complained about being asked.** Check it did not fire twice, and
check the moment was appropriate.

**It asked somebody with a failed payment.** `billing-hold` is not being
applied by Failed Payment Recovery, or the agent is not checking it. See 05.6.

**Reviews got removed by Google.** Something offered an incentive. Check the
prompt and check nothing else in your marketing offers a reward for reviews.

## Shot list

| Shot | Screen | Capture | Highlight | Blur |
|------|--------|---------|-----------|------|
| 09.7-01 | The prompt's never-offer-incentives rule | The prompt | The rule | Nothing |
| 09.7-02 | Test panel, the negative path escalating | The conversation | No link sent | Nothing |
| 09.7-03 | Phone, tapping the review link and landing on the star rating | The phone flow | The stars | Nothing |
| 09.7-04 | Review Trigger workflow with its moments | The workflow | The billing-hold exclusion | Nothing |

## Video script

**Hook.** A worse gym than yours with forty recent reviews is outranking you
with nine. You know you should ask. You do not, because it is awkward. This
never gets awkward.

**Beats.**
1. On screen: message 1. Point out it does not ask for a review. Explain why
   asking how it went first is both better service and better conversion.
2. On screen: the three paths. Positive, mixed, negative.
3. On screen: talk to camera, serious. The legal line. Say plainly that
   review gating funnels get reviews removed, and that this agent will hand
   the link to an unhappy member who asks for it.
4. On screen: run tests 5 and 6.
5. On screen: talk to camera. The gradings point for martial arts gyms. This
   is the single best tip in the lesson.
6. On screen: phone, tap the link, land on stars. Show how few taps.

**Go do.** Test your review link on your phone. Then set a review moment for
your biggest recurring milestone.

## Verify on screen

- Whether Reviews AI drafting is available and where.
- Confirm the Review Trigger workflow excludes `billing-hold`.
