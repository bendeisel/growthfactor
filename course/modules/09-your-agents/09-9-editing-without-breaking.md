# 09.9 Editing an agent without breaking it

**Module:** 09 Your Agents
**Video:** ~9 min
**Needs first:** 09.3 to 09.8
**You finish with:** the confidence to change your agents, and the rules that
keep it safe

## Why this matters

An agent that sounds like your gym is worth far more than one that is safely
untouched.

But most of what people want to change should be changed somewhere else, and
knowing which is which is the whole skill.

## Where to make a change

Before you touch a prompt, check this table. Nine out of ten changes belong
somewhere else.

| You want to change | Change it in |
|--------------------|-------------|
| What the agent knows: prices, schedule, policies | Knowledge base, module 08 |
| The trial offer | `trial_offer` custom value, 01.5 |
| Which calendar it books | The agent prompt, or the calendar itself |
| When an agent fires | The workflow, 06.3 |
| Quiet hours | `quiet_hours` custom value |
| The gym name, address, review link | Custom values |
| How it answers a specific question | Knowledge base FAQ |
| Its tone and personality | The prompt |
| Its sequence timing | The prompt |
| What it refuses to do | The prompt, and section 10 of the KB |

**If the answer is a fact about your gym, it goes in the knowledge base.** If
it is about behaviour, it goes in the prompt.

[SHOT 09.9-01]

## Anatomy of a prompt

Open one and you will find the same shape every time.

1. **Who you are and what this is for.** One paragraph.
2. **The job.** Numbered.
3. **The specific behaviour.** How to open, what to ask, what to write to
   which field.
4. **What you do not do.** The refusals.
5. **The shared rules block.** Safety, escalation, tag discipline, style.

[SHOT 09.9-02]

## The shared rules block

Every agent carries an identical copy. It handles blocking tags, quiet hours,
escalation, tag discipline and style.

**It is repeated in each agent rather than shared on purpose**, so that
editing one agent cannot silently remove the safety rules from all six.

If you change it, change it in all six in the same sitting. Realistically:
do not change it. Ask us.

Full text: `assets/agent-prompts/00-shared-rules.md`.

## The five rules of editing

### 1. One change at a time

Change one thing, test, publish. Then the next.

Change five things and something gets worse, you will not know which one.

### 2. Add rather than rewrite

If you want it warmer, add a line saying so. Do not rewrite the whole prompt
in your own voice.

The prompts are structured deliberately. A full rewrite loses structure you
did not know was doing something.

### 3. Be specific, not adjectival

Bad:

> `Be more friendly and conversational.`

Good:

> `Open with their first name. Use contractions. Never open with "Thank you
> for reaching out". If they use casual language or lowercase, match it.`

An agent cannot act on "friendlier". It can act on "use contractions".

### 4. Never delete the shared rules block

Not the escalation rules, not the blocking tag checks, not the never-claim-to-
be-human line.

If you think you need to, that is a conversation with us.

### 5. Test before you publish

Every time. See 09.10.

## The five edits worth making

Ranked by return.

1. **The four objection responses in the follow-up agent.** 09.5. The single
   highest value edit in the course.
2. **The confirmation content in the appointment agent.** 09.4. Directly
   moves your show rate.
3. **The greeting in the voice agent.** 09.8. First impression on the phone.
4. **The opening question in the review agent.** 09.7. Should sound like you.
5. **Two specific times versus a booking link**, across the navigator and
   appointment agents.

Do those five and your agents stop sounding like anyone else's.

## Making an edit

1. Open the agent.
2. Find the section you want. Do not scroll past it into the shared rules.
3. Make one change.
4. **Save as draft.** Do not publish yet.
5. Test in the test panel. See 09.10.
6. If it is right, publish.
7. If it is wrong, roll back or edit again.

   [SHOT 09.9-03]

## Rollback

Every publish is a version. If an edit made things worse, roll back.

Knowing this is what should make you willing to experiment. The cost of a bad
edit is a rollback, not a disaster.

## What to bring us instead of editing

- Anything involving the shared rules block
- Adding a new tool an agent does not have
- Changing which tag an agent listens for
- Building a seventh agent
- Anything you have tried twice and cannot get right

That last one especially. Twenty minutes of frustration is worth one message
to us.

## Checklist

- [ ] I check the where-to-change table before touching a prompt
- [ ] I change one thing at a time
- [ ] I add lines rather than rewriting
- [ ] I write specific instructions, not adjectives
- [ ] I have never touched the shared rules block
- [ ] I test as a draft before publishing
- [ ] I know I can roll back

## When it goes wrong

**The agent got worse after an edit.** Roll back. Then make a smaller change.

**It ignores my instruction.** Usually too vague. Rewrite it as a specific
behaviour. Or it contradicts something else in the prompt, so search for the
contradiction.

**It stopped escalating.** Something removed part of the shared rules block.
Restore it from `assets/agent-prompts/00-shared-rules.md`.

**Changes are not taking effect.** Saved as draft and not published.

## Shot list

| Shot | Screen | Capture | Highlight | Blur |
|------|--------|---------|-----------|------|
| 09.9-01 | The where-to-change decision in practice: a KB edit fixing an answer | Split view | The KB edit and the improved answer | Nothing |
| 09.9-02 | A prompt scrolled to show its five parts | The prompt | The section boundaries | Nothing |
| 09.9-03 | Draft state, test panel open, then publish | The flow | The draft indicator | Nothing |
| 09.9-04 | Version history with a rollback | The versions | The rollback control | Nothing |

## Video script

**Hook.** Nine out of ten things you want to change about your agents should
not be changed in the agent. Here is how to tell.

**Beats.**
1. On screen: the where-to-change table. Then demonstrate: a bad answer,
   fixed in the knowledge base rather than the prompt.
2. On screen: a prompt, its five parts. Point at the shared rules block and
   say plainly: leave that alone.
3. On screen: the adjective versus specific instruction. Type "be more
   friendly", show the weak result. Then type the specific version, show the
   difference. This is the teaching moment.
4. On screen: make one of the five worthwhile edits live. The follow-up
   objection response is the best one to film.
5. On screen: draft, test, publish, and show rollback existing.

**Go do.** Make edit number 1 from the list: rewrite the four objection
responses in the follow-up agent. Test it before publishing.

## Verify on screen

- Whether draft and publish states are clearly indicated.
- Whether rollback is available to a sub-account user.
