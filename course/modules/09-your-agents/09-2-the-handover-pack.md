# 09.2 The handover pack

**Module:** 09 Your Agents
**Video:** ~8 min
**Needs first:** 09.1, 06.3
**You finish with:** the complete picture of how your six agents work as one
system

## Why this matters

You do not have six bots. You have one system with six parts, and the parts
pass work to each other.

Understanding the handoffs is what turns "the AI did something weird" into
"the follow-up agent handed to the appointment agent when it should not have,
and here is why".

## The six, and their triggers

[SHOT 09.2-01]

| # | Agent | Fires on | Lesson |
|---|-------|----------|--------|
| 1 | Front Desk Navigator | Inbound message, any channel | 09.3 |
| 2 | Appointment | Form Submitted | 09.4 |
| 3 | Follow-up | Tag `follow-up` | 09.5 |
| 4 | Reactivation | Tag `reactivation` | 09.6 |
| 5 | Review | Tag `review` | 09.7 |
| 6 | Voice Receptionist | Unanswered inbound call | 09.8 |

Two fire directly from an event. Four fire from tags applied by workflows. See
06.3 for the workflow side.

## The handoff map

```
                         SOMEBODY MAKES CONTACT
                                   |
        +--------------------------+--------------------------+
        |                          |                          |
   messages you              fills a form              calls and you
        |                          |                    do not answer
        v                          v                          v
  [1 NAVIGATOR]             [2 APPOINTMENT]              [6 VOICE]
        |                          |                          |
        |  books it, or            | books it, or             | books it, or
        |  hands over              | goes quiet               | texts a summary
        |                          |                          |
        +-------------+------------+--------------+-----------+
                      |                           |
                 BOOKED                      WENT QUIET
                      |                           |
                      |                           v
                      |                    [3 FOLLOW-UP]
                      |                           |
                      |                    no reply in 12 days
                      |                           |
                      v                           v
                 CAME IN                   OPPORTUNITY: LOST
                      |                           |
                      v                    90 days later
              [5 REVIEW]                          |
                                                  v
                                          [4 REACTIVATION]
                                                  |
                                          replies, wants to come in
                                                  |
                                                  v
                                          back to [2 APPOINTMENT]

  ANY AGENT, ANYTHING SENSITIVE  ------------->  YOU
```

## The five handoffs, in detail

### Navigator to appointment

The navigator can book simple things itself. When somebody clearly wants a
trial and needs qualifying, it applies `trial-intent` and the appointment
agent takes it.

### Any agent to follow-up

Somebody engages then goes quiet. The agent applies `follow-up` and stops.
This is the most common handoff in the system.

**The agent that hands off stops talking.** Two agents never work the same
contact at once. See 07.3.

### Follow-up to Lost, and later to reactivation

Twelve days, no reply, opportunity moves to Lost, the follow-up agent removes
its tag and stops. Ninety days later, Dead Lead Sweep applies `reactivation`.

That ninety day gap is deliberate. Working somebody again three weeks after
they ignored five messages is harassment. Three months later, circumstances
have changed.

### Reactivation back to appointment

Somebody comes back. Reactivation hands to appointment for the booking, since
that is what appointment is good at.

### Any agent to you

Escalation. Sets `ai_escalated`, writes `ai_escalation_reason`, applies
`staff-handling`, notifies you, and tells the member a person will come back.
See 09.13.

## What makes the handoffs work

Three fields and the tag dictionary.

| Field | Job |
|-------|-----|
| `ai_last_agent` | Which agent spoke last. Stops overlap, makes logs readable |
| `goal_stated` | Carried between agents. Why reactivation can reference what they said months ago |
| `objection_last` | Carried between agents. Why follow-up touch 2 lands |

Those fields are the memory of the system. Without them each agent starts
from nothing and they all sound like strangers. See 02.1.

[SHOT 09.2-02]

## What is live and what is paused

We hand over with:

| Agent | State on handover |
|-------|------------------|
| 1 Navigator | **Paused** until the knowledge base is filled |
| 2 Appointment | Live |
| 3 Follow-up | Live |
| 4 Reactivation | **Paused** until you confirm your lapse rules |
| 5 Review | Live |
| 6 Voice | **Paused** until knowledge base and call routing are done |

The paused ones talk to strangers in real time, or work through your existing
member list, which are the two highest risk things an agent can do.

Unpausing is 09.11.

## Reading a conversation and knowing which agent spoke

Useful skill for diagnosis.

1. Open the conversation.
2. Check `ai_last_agent` on the contact.
3. Check which firing tags are or were on the contact.
4. Check the activity log for the tag that started it. See 06.6.

## Checklist

- [ ] I have the handoff map
- [ ] I know which two agents fire without a workflow
- [ ] I know the agent that hands off stops talking
- [ ] I know why the reactivation gap is 90 days
- [ ] I know which agents are paused and why
- [ ] I can work out which agent spoke in a given conversation

## Shot list

| Shot | Screen | Capture | Highlight | Blur |
|------|--------|---------|-----------|------|
| 09.2-01 | AI Agents list with statuses | All six | The live and paused states | Nothing |
| 09.2-02 | A contact showing ai_last_agent, goal_stated, objection_last | The fields | All three | Name |
| 09.2-03 | A conversation showing a handoff between two agents | The thread | The point of handoff | Names, content |

## Video script

**Hook.** You do not have six bots. You have one system with six parts, and
this map is the thing that lets you fix it yourself when something looks odd.

**Beats.**
1. On screen: the six and their triggers. Fast, they have seen this in 00.4.
2. On screen: the handoff map. Slowly. This is the lesson. Trace one lead all
   the way through: form, appointment, quiet, follow-up, lost, reactivation.
3. On screen: talk to camera. The agent that hands off stops talking. Say it
   twice.
4. On screen: the three memory fields on a real contact. Explain why
   reactivation can reference something from four months ago.
5. On screen: the agent list, paused ones. Explain the gate.

**Go do.** Trace one real contact through your system and name every agent
that touched them.

## Verify on screen

- Confirm the handover snapshot pauses the agents listed here.
- Whether `ai_last_agent` is actually being written by all six.
