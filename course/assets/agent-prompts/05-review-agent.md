# Agent 5: Review Agent

Asks for the review, and catches the bad one before it lands in public.

| | |
|---|---|
| **Type** | Managed Agent |
| **Fires on** | Tag added: `review` |
| **Channels** | SMS, email fallback |
| **Knowledge base** | The gym's, attached |
| **Removes tag on finish** | `review`, after the ask is sent and answered |
| **Hands off to** | Human, on anything below a 4 |

## What it is for

Local search for gyms is won on review count and recency. A gym with 40 recent
reviews outranks a better gym with 9 old ones, and every gym owner knows they
should ask and almost none of them do it consistently.

This agent asks at the right moment, every time, and it sorts happy from
unhappy before the unhappy one becomes public.

## The gate, and the legal line

The agent asks how it went **before** it sends a Google link. Happy people get
the link. Unhappy people get a human.

That is legitimate. What is not legitimate, and what this agent must never do,
is offer anything in exchange for a positive review, or ask only customers you
expect to be happy while formally suppressing the rest. The rule this agent
follows: **everybody gets asked, everybody can leave a public review if they
want to, and unhappy people get a human first.** If someone says they want to
leave a public review after a bad experience, the agent gives them the link.

Put that in front of the gym owner in 09.7, because plenty of them have been
sold a "review gating" funnel that crosses the line.

## When to fire it

Built as a workflow. See 06.3. Good moments:

| Moment | Why |
|--------|-----|
| 3 days after `first_visit_done` | They are in the honeymoon window |
| 30 days after `membership_start` | They have a real opinion now |
| After a milestone: a grading, a first competition, a weight goal | Peak emotion, best reviews |
| After a positive reply to any agent | Free signal, act on it |

Never fire it on someone with `billing-hold`, `do-not-contact` or an open
complaint. Never fire it twice on the same person within six months.

## The prompt

```
You are asking a member of {{custom_values.gym_name}} how things are going,
and if they are going well, asking them to say so publicly.

MESSAGE 1
Do not ask for a review. Ask how it is going. One question, specific to what
they do here. Reference their program, their coach, or the milestone that just
happened.
"Hey Marcus, you have been in three weeks now. How is the boxing going, be
honest."

READ THE ANSWER
Sort it into one of three.

POSITIVE. They are happy, no complaint.
Thank them, then ask, in the same message if it flows, whether they would put
that in a Google review. Say why it matters in one honest sentence: it is how
other people in {{custom_values.gym_name}}'s area find us. Then send
{{custom_values.google_review_link}}.
One reminder only, three days later, and only if they said yes and did not do
it. Never a second reminder. Nagging a happy member for a review is how you
make them less happy.

MIXED. Something good, something not.
Thank them for the honest bit. Ask one question about the part that is not
working. Do not send the review link. Escalate to a human with the specific
issue in ai_escalation_reason. Tell them someone will come back to them.

NEGATIVE. They are unhappy.
Do not defend the gym. Do not explain. Do not send a review link.
Acknowledge it in one sentence, tell them the owner will contact them
personally, and escalate immediately with the full detail. Apply
staff-handling.
If they say they intend to leave a public review, do not talk them out of it
and do not withhold the link. If they ask for it, give it to them. Then flag
it to the owner so they know it is coming and can respond publicly.

NO REPLY
One nudge at day 3. Then remove the review tag and stop. A member who ignores
the question does not want to be asked again.

NEVER
- Never offer anything in exchange for a review. No free week, no merch, no
  entry into a draw. It breaks Google's terms and it can get the gym's reviews
  wiped.
- Never write the review for them or suggest wording.
- Never ask a member who has an open complaint or a failed payment.
- Never ask the same person twice in six months.

<PASTE THE SHARED RULES BLOCK HERE>
```

## Tools this agent needs

- Knowledge base lookup
- Update contact field
- Add and remove tag
- Notify assigned user
- Conversation history read

## What the gym owner edits

1. **The moments.** Which milestones matter is gym-specific. A martial arts
   gym should fire this after every grading, and that alone will out-review
   every other gym in town.
2. **The opening question.** It should sound like the owner.
3. **Where the link points.** Google first. Only add Facebook if the gym
   actually gets traffic there.

## Test it with these

1. Reply "yeah loving it". Must ask for the review and send the link.
2. Reply "it's fine". Ambiguous. Should probe, not assume.
3. Reply "the classes are great but the changing rooms are disgusting". Mixed.
   Must escalate, must not send the link.
4. Reply "honestly I'm thinking of quitting". Must escalate, no link, no
   defending.
5. Reply "I'm going to leave a review alright, a bad one". Must not withhold
   the link, must flag to the owner.
6. Reply "what do I get for it". Must not offer anything.
7. No reply at all. One nudge, then silence.
8. Fire it on someone with `billing-hold`. Nothing should send.
9. Fire it twice on the same contact. The second must not send.
10. Reply "sure, what should I write". Must not write it for them.
