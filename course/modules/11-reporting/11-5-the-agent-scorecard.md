# 11.5 The agent scorecard

**Module:** 11 Reporting and Attribution
**Video:** ~6 min
**Needs first:** 11.2, 09.13
**You finish with:** knowing what each agent is actually producing

## Why this matters

You have six agents. You should know which are earning their keep.

Not out of suspicion. Because knowing which agent produces what tells you
where to spend your improvement time, and because it is genuinely satisfying
to see what the reactivation agent recovered last month.

## What to measure per agent

| Metric | What it tells you |
|--------|------------------|
| Conversations started | Volume |
| Bookings made | The main output for 1, 2, 4, 6 |
| Reviews generated | The main output for 5 |
| Replies received | Whether people engage or ignore |
| Escalation rate | Whether the KB supports it |
| Average messages per conversation | Efficiency, and cost |

[SHOT 11.5-01]

## What good looks like

| Agent | Main metric | Healthy |
|-------|------------|---------|
| 1 Navigator | Bookings from inbound messages | Steady, tracks your message volume |
| 2 Appointment | Booked rate from form leads | 40 to 60% |
| 3 Follow-up | Reply rate across the sequence | 15 to 30% |
| 4 Reactivation | Bookings from lapsed and lost | 5 to 15% of those contacted |
| 5 Review | Reviews left per ask | 20 to 40% of positives |
| 6 Voice | Calls answered, and bookings from them | Answer rate over 90% of unanswered calls |

Reactivation at 10% sounds low. It is not. Ten percent of a dead list is
found money that did not exist before.

## Average messages per conversation

Worth watching, for two reasons.

**Cost.** Conversation AI bills per response. An agent averaging six messages
costs twice one averaging three. See 07.5.

**Quality.** More messages is usually worse, not better. An agent that books
somebody in three messages is doing better than one taking eight.

If this number climbs after you edit a prompt, the edit made the agent
chattier. Look at what you changed.

## Building it

Some of this comes from the reporting widgets. Some has to be derived from
the fields the agents write.

1. Use `ai_last_agent` to attribute conversations and bookings to an agent.
   See 02.1.
2. Use `ai_escalated` for escalation rate.
3. Build a smart list per agent if the widgets do not cover it, and read the
   counts.

   [SHOT 11.5-02]

This is the least polished part of the reporting, so do not spend an hour
building a perfect scorecard. Rough numbers monthly are enough to spot a
problem.

## The monthly review

Ten minutes, once a month.

1. Which agent produced the most bookings?
2. Which has the highest escalation rate? That one needs knowledge base work.
3. Has anything changed since last month?
4. Which agent would benefit most from thirty minutes of editing?

Question 4 is the point of the whole exercise. Spend your improvement time on
the agent where it will do most.

## What the numbers will not tell you

Read conversations too. See 09.13.

An agent can have great numbers and still sound wrong. It can be booking
people while being slightly rude, slightly robotic, or slightly pushy, and
the numbers will look fine for months while your reputation quietly does not.

Numbers tell you what happened. Reading tells you how it felt.

## Checklist

- [ ] I know roughly what each agent produces monthly
- [ ] I check escalation rate per agent
- [ ] I watch average messages per conversation
- [ ] Monthly ten minute review
- [ ] I read conversations as well as numbers

## When it goes wrong

**An agent shows zero.** Paused, or its trigger is not firing. Check the
workflow. See 06.3.

**Escalation rate high on one agent only.** That agent's part of the
knowledge base is thin. See 08.5.

**Messages per conversation climbing.** A prompt edit. Check what changed.

**Great numbers, member complaints.** Read the conversations. The numbers were
never going to tell you.

## Shot list

| Shot | Screen | Capture | Highlight | Blur |
|------|--------|---------|-----------|------|
| 11.5-01 | Per agent stats, however they are surfaced | The figures | Bookings per agent | Figures |
| 11.5-02 | A smart list built on ai_last_agent | The filter | The field | Names |
| 11.5-03 | A month on month agent comparison | The comparison | The changed number | Figures |

## Video script

**Hook.** Six agents. Which one is actually earning its keep? And more
usefully, which one would pay you back most for half an hour of your time?

**Beats.**
1. On screen: the per agent metrics table.
2. On screen: what good looks like. Dwell on reactivation at ten percent and
   say plainly that ten percent of a dead list is found money.
3. On screen: average messages per conversation. Tie it to cost and to
   quality.
4. On screen: build a rough scorecard with smart lists. Say out loud: do not
   spend an hour on this.
5. On screen: talk to camera. Numbers tell you what happened, reading tells
   you how it felt. End on that.

**Go do.** Work out how many bookings each agent produced last month. Rough is
fine. Then pick the one you will spend thirty minutes improving.

## Verify on screen

- Whether native per-agent reporting exists in the current release.
- Whether `ai_last_agent` is reliably populated by all six agents.
