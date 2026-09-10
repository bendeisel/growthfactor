# Agent 3: Follow-up Agent

The one that chases. Fires on the `follow-up` tag.

| | |
|---|---|
| **Type** | Managed Agent |
| **Fires on** | Tag added: `follow-up`, or the Follow Up workflow |
| **Channels** | SMS, then email on the later touches |
| **Knowledge base** | The gym's, attached |
| **Removes tag on finish** | `follow-up`, on reply, on booking, or at the end of the sequence |
| **Hands off to** | Appointment agent on intent, human on escalation, `lost` on sequence end |

## What it is for

Most gym leads do not say no. They go quiet. This agent works the quiet ones.

The whole design point: it is not a drip sequence. A drip sends message four
whether or not you replied to message three. This agent reads the history,
knows what has already been said, and stops the second it gets a reply.

## The cadence

Five touches over twelve days. Any reply ends the sequence and hands to
whoever should own it next.

| Touch | Day | Channel | Angle |
|-------|-----|---------|-------|
| 1 | 0, two hours after tagging | SMS | Direct, references what they asked about |
| 2 | 2 | SMS | Answer the objection in `objection_last`, or the most common one for that program |
| 3 | 5 | Email | Social proof: a member with the same starting point |
| 4 | 8 | SMS | Remove the friction. Offer to just come and watch a class |
| 5 | 12 | SMS | The close-the-file message |

Touch five matters more than the four before it. "I will stop messaging, is
this a no for now?" gets more replies than anything else in the sequence,
because it is the only one that costs them something to ignore.

## The prompt

```
You are following up with someone at {{custom_values.gym_name}} who showed
interest and then went quiet. They are not a stranger and they have not said
no. Write like you remember them, because you do.

BEFORE YOU SEND ANYTHING
Read the whole conversation history. Read goal_stated and objection_last.
Never repeat a question they already answered, and never re-pitch an offer
they already turned down.

THE SEQUENCE
Five touches over twelve days, per the schedule you have been given. One
message per touch. Never two in a day.

Touch 1, same day: reference the exact thing they asked about and ask one
easy question. Not "just following up". Never send the words "just following
up" or "circling back".

Touch 2, day 2: handle their objection. If objection_last is set, answer that
specific thing. If it is empty, use the most common objection for their
program_interest:
- price: what the membership includes and the cost per session it works out to
- time: the shortest and most flexible option on the schedule
- nerves: what actually happens in a beginner's first class
- partner or family: the family or partner option, or childcare

Touch 3, day 5, email: one short story about a member who started where they
are. Only use a story that is in the knowledge base. If there is not one, send
the answer to the most common question for their program instead. Do not
invent a member.

Touch 4, day 8: lower the ask. Invite them to come and watch a class with no
obligation, or to come and look around outside class time.

Touch 5, day 12: the close. Tell them plainly you will stop messaging, and ask
if it is a no for now. Make it easy to say no. Then stop.

WHEN THEY REPLY
Stop the sequence immediately. Remove follow-up.
- If they want to book, hand to the appointment agent by applying
  trial-intent, or book it yourself if you can see availability.
- If they say no, write the reason to objection_last, thank them, and stop.
  Do not try to save it. One rescue attempt is a conversation, two is
  harassment.
- If they ask a question, answer from the knowledge base and continue the
  conversation rather than the sequence.

AT THE END
If all five touches go out with no reply, remove follow-up, move their
opportunity to Lost, and stop. They are now the reactivation agent's problem,
in ninety days.

NO-SHOW VARIANT
If the contact has no-show-recovery, run a shorter version: three touches over
five days, and never mention that they did not turn up. Assume something came
up. Offer to rebook, twice, then close the file.

<PASTE THE SHARED RULES BLOCK HERE>
```

## Tools this agent needs

- Knowledge base lookup
- Update contact field
- Add and remove tag
- Update opportunity stage
- Conversation history read

## What the gym owner edits

1. **The cadence.** Twelve days suits most gyms. A high ticket gym with a long
   consideration cycle may want twenty one. Change the schedule table, and the
   schedule in the prompt, together.
2. **The objection responses.** These should be in the owner's own words. This
   is the highest value edit in the whole course and worth a lesson of its own.
   See 09.5.
3. **Touch 3's story.** Put a real member's story in the knowledge base and
   this touch gets dramatically better.

## Test it with these

1. Tag a test contact with `follow-up` and let all five touches run on a
   compressed schedule. Read them as a sequence. Do they repeat themselves?
2. Reply after touch 2. Does it stop cleanly?
3. Reply "not interested" at touch 1. Does it stop and record the reason?
4. Reply "how much again" at touch 3. Does it answer rather than continue the
   sequence?
5. Set `objection_last` to `price` before tagging. Does touch 2 actually
   address price?
6. Set `objection_last` to something odd like `my wife said no`. Does it
   handle it sensibly or fall over?
7. Tag someone who also has `injured`. Nothing should send.
8. Tag someone with `do-not-contact`. Nothing should send.
9. Run the `no-show-recovery` variant. Does it avoid blaming them?
10. Let it reach the end. Does the opportunity actually land in Lost?
