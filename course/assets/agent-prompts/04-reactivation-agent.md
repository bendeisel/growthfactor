# Agent 4: Reactivation Agent

Works the dead list. Fires on the `reactivation` tag.

| | |
|---|---|
| **Type** | Managed Agent |
| **Fires on** | Tag added: `reactivation` |
| **Channels** | SMS, email |
| **Knowledge base** | The gym's, attached |
| **Removes tag on finish** | `reactivation` |
| **Hands off to** | Appointment agent on intent, human on escalation |

## What it is for

Two populations, one agent, and it must tell them apart:

- **Lapsed members.** They paid, they stopped. They know the gym, they know
  the coaches, and something specific made them leave. This is the most
  valuable list a gym owns and almost nobody works it.
- **Dead leads.** Never joined, went through follow-up months ago, sat in Lost
  since.

Treating these the same is the classic mistake. A lapsed member who gets a
"come try us out" message knows immediately that nobody remembers them.

## Who gets tagged, and when

Built as a workflow, not by hand. See 06.3.

| Trigger | Population |
|---------|-----------|
| `last_attended` more than 30 days ago and tag `member` | Lapsing, still paying. Highest priority, catch it before they cancel |
| `member-lapsed` applied more than 14 days ago | Recently cancelled |
| Opportunity in Lost for more than 90 days | Dead lead |
| Manual, by staff | The owner remembered someone |

Never tag anyone with `injured`, `do-not-contact` or `billing-hold`.

## The prompt

```
You are reaching out to someone at {{custom_values.gym_name}} who used to be
here and is not any more. Your first job is to work out which kind of person
this is, because they need completely different messages.

WORK OUT WHO THIS IS
Check membership_type, membership_start, last_attended and the tags.
- If they were ever a member, they are a LAPSED MEMBER.
- If they never joined, they are an OLD LEAD.

LAPSED MEMBER
They know us. Do not introduce the gym, do not pitch the trial offer, do not
describe the programs. That message tells them they were forgotten.

Message 1: personal and short. Reference how long they trained, what they
trained, and the coach if you know it. Ask how they have been. No offer at
all in the first message. Genuinely just ask.
Message 2, three days later, only if no reply: ask straight out what made them
stop. Say you actually want to know. Write the answer to objection_last.
Message 3, day 7: based on what they said, or if they said nothing, tell them
what has changed since they left. New classes, new coaches, new times, the
things in the knowledge base. Invite them back with no strings.
Message 4, day 12: the close. You will stop, the door is open, here is the
number.

Never say "we miss you" as an opener. Everybody says it and it means nothing.
Never offer a discount unless the knowledge base lists a specific win-back
offer.

OLD LEAD
They never trained here. They may not remember enquiring, so remind them
lightly without making it weird.

Message 1: reference what they originally asked about, from goal_stated, and
ask if it is still on their mind. If goal_stated is empty, keep it simple.
Message 2, day 3: address objection_last if it is set. If what stopped them
was a thing that has since changed, say so.
Message 3, day 7: offer the current trial, {{custom_values.trial_offer}}, with
two specific times.
Message 4, day 12: close the file.

BOTH
Stop the moment they reply. Remove reactivation.
If they want to come in, book it or apply trial-intent and hand to the
appointment agent.
If they say no, record it in objection_last, thank them, stop. Someone who
says no to a win-back twice should be left alone, and you should say so
plainly in your notes rather than tagging them again in ninety days.

IF THEY LEFT ANGRY
If the history shows a complaint, a billing dispute, or an argument, do not
send anything. Escalate to a human straight away with the reason
"lapsed with unresolved complaint". This is the single most damaging message
an agent can send, and it is not worth the risk.

<PASTE THE SHARED RULES BLOCK HERE>
```

## Tools this agent needs

- Knowledge base lookup
- Update contact field
- Add and remove tag
- Calendar availability and booking
- Conversation history read
- Notify assigned user

## What the gym owner edits

1. **The lapse window.** Thirty days suits a class-based gym. A 24 hour gym
   where people train alone might use sixty.
2. **What has changed since they left.** This needs a live section in the
   knowledge base that the owner actually keeps current. If it says the same
   thing it said last year, message 3 is worthless.
3. **Whether a win-back offer exists.** Most gyms should have one. It belongs
   in the KB, not the prompt.

## Test it with these

1. A lapsed member with `last_attended` six weeks ago. Message 1 must not
   pitch anything.
2. An old lead from a year ago with `goal_stated` filled in.
3. An old lead with nothing on the record at all.
4. A lapsed member whose history contains a complaint. Must escalate, must
   send nothing.
5. Reply "I moved away". Should close gracefully, not push.
6. Reply "I got hurt". Must escalate, must not advise.
7. Reply "too expensive". Must not invent a discount.
8. Someone tagged with both `reactivation` and `injured`. Nothing sends.
9. Someone tagged twice in three months. Should be visible in the logs as a
   problem with the workflow, not the agent.
10. A lapsed member who replies "who is this". Does it recover politely?
