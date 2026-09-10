# 09.3 Agent 1: Front Desk Navigator

**Module:** 09 Your Agents
**Video:** ~9 min
**Needs first:** 09.2, module 08 complete
**You finish with:** your front desk agent live and answering across every
channel

## Why this matters

This is the agent strangers meet. Somebody messages your gym on Instagram at
9pm, and this decides what your gym is like.

It is also the one that catches everything the other five do not: the person
asking about parking, the member wanting to change class, the parent asking
if you take five year olds.

## What it does

Three jobs, and it is deliberately narrow.

1. **Answer questions** from the knowledge base
2. **Get people booked**
3. **Route everything else**

It does not chase, ask for reviews, negotiate, or process cancellations. An
agent that tries to do everything is an agent nobody can debug.

## Its routing logic

| They want | It does |
|-----------|---------|
| Hours, price, parking, what to wear | Answers from the KB |
| To book a trial | Qualifies, books it, or hands to the appointment agent |
| To reschedule or cancel a booking | Handles it on the calendar |
| To complain | Escalates immediately, no attempt to fix |
| To cancel a membership | Escalates. Never processes it |
| Something the KB does not cover | One clarifying question, then escalates |

[SHOT 09.3-01]

## The first move

Before anything else it establishes two things:

1. **Is this for them or a child?** Everything downstream changes on this.
2. **Which program?**

Asked in one message, not two. Written to `participant_is_child` and
`program_interest`.

That single question is why the rest of the conversation sounds informed.

## Two specific times, not a link

The default behaviour is to offer two specific times rather than sending a
calendar link.

Two times converts better. A link is a task, two times is a decision, and a
decision is easier at 9pm on a phone.

**When to change it:** if your schedule is complicated, or you want people
choosing their own coach, switch it to send `{{custom_values.booking_link}}`.
It is one line in the prompt. See 09.9.

## The prompt

Full text: `assets/agent-prompts/01-front-desk-navigator.md`.

[SHOT 09.3-02]

## What you should edit

Honestly, almost nothing in the prompt.

**This agent is driven by the knowledge base, on purpose.** You improve your
front desk by answering questions in the KB, not by rewriting an AI prompt.
If a reply is wrong, the fix is nearly always in module 08.

The exceptions:

1. The two-times versus link behaviour.
2. The greeting, if you want a specific opener.
3. Whether it may send the membership payment link and close a sale itself.
   See 05.3. Decide this deliberately.

## Going live

1. Confirm module 08 is done. Search the KB for `[`.
2. Run the twelve message test. See 09.10.
3. Set its channels. See 07.4.
4. Publish. See 09.11.

Do not publish before the knowledge base is finished. A live front desk agent
that does not know your prices answers anyway, vaguely, and the person assumes
that is your gym.

## Test it with these ten

Beyond the standard twelve in 09.10, this agent specifically:

1. `hey how much is it`
2. `do you do classes for kids`
3. `im interested in bjj, never done it, am i gonna get destroyed`
4. `what time do you open`
5. `i want to cancel my membership` (must escalate, must not process)
6. `your coach was rude to my son last night` (must escalate immediately)
7. `can you do 89 a month instead of 129` (must escalate, must not negotiate)
8. `are you a bot`
9. `i hurt my knee, can i still train` (must not advise, must escalate)
10. `yeah tuesday works` after two times were offered (must book and confirm)

Numbers 5, 6, 7 and 9 are the ones that matter. Those are the four ways an
agent embarrasses a gym, and all four must escalate.

[SHOT 09.3-03]

## Checklist

- [ ] Knowledge base complete, no square brackets
- [ ] Ran all ten questions above
- [ ] The four escalation cases all escalated
- [ ] Channels set deliberately
- [ ] Decided on two-times versus link
- [ ] Decided whether it may close a sale
- [ ] Published

## When it goes wrong

**Vague answers.** Knowledge base gap. Ask the question, find the section that
should have answered, thicken it.

**It negotiated on price.** Section 5 of your KB does not say no discounts, or
section 10 is missing. See 08.2.

**It answered a complaint instead of escalating.** Check section 10 of the
knowledge base and the shared rules block in the prompt.

**Wrong tone on Instagram.** See 07.4 on channel tone.

**It is not answering at all.** Published? Channel enabled? Contact carrying
`no-ai` or `staff-handling`? In that order.

## Shot list

| Shot | Screen | Capture | Highlight | Blur |
|------|--------|---------|-----------|------|
| 09.3-01 | The navigator agent open | The config | Its trigger, inbound message | Nothing |
| 09.3-02 | The prompt, scrolled to the routing section | The prompt text | The routing rules | Nothing |
| 09.3-03 | Test panel, the cancellation question escalating | The test conversation | The escalation | Nothing |
| 09.3-04 | A real Instagram conversation answered well | The DM | The reply | Handle, content |

## Video script

**Hook.** Somebody messages your gym on Instagram at 9pm. This agent decides
what your gym is like, before anyone at your gym even knows they exist.

**Beats.**
1. On screen: the routing table. What it does and, more importantly, what it
   refuses to do.
2. On screen: the prompt, the first move. Adult or child, which program, in
   one message. Show a test conversation where it asks.
3. On screen: two times versus a link. Demonstrate both, say why two times
   wins.
4. On screen: talk to camera. Do not edit this prompt, edit your knowledge
   base. Say it plainly.
5. On screen: test panel, run questions 5, 6, 7 and 9. Show all four
   escalating. Spend real time here.

**Go do.** Run all ten test questions before you publish. Especially the four
escalation ones.

## Verify on screen

- Where channel settings and the trigger live on this agent.
- Confirm the escalation actions available match the shared rules block.
