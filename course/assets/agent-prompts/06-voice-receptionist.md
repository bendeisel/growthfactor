# Agent 6: Voice Receptionist

Answers the calls nobody picked up.

| | |
|---|---|
| **Type** | Voice AI agent, running in backup mode |
| **Fires on** | An inbound call that staff do not answer within the set ring window |
| **Channel** | Voice, on the gym's LC Phone number |
| **Knowledge base** | The gym's, attached |
| **Hands off to** | Appointment booking, SMS follow-up, or a human callback |

## What it is for

A gym misses calls all day. Coaches are on the mat, the desk is unstaffed at
6am, and the phone rings during class. Every one of those is a person who is
ready enough to actually call, which is rarer and hotter than a form fill.

This agent picks up on the calls that would otherwise hit voicemail, which
almost nobody listens to and almost nobody leaves.

## How it is wired, and the setting that breaks it

This is the part that goes wrong, so it gets its own lesson at 09.8.

Voice AI in backup mode sits at **third priority** on the number's Call
Forwarding configuration. The order is:

1. The number rings, and forwards to staff.
2. Simultaneous ring, if a second number is configured.
3. Voice AI picks up, if the call has not been answered.

**Inbound Call Timeout is the setting that decides whether any of this works.**
Forwarding to a mobile means that mobile's carrier voicemail is also counting
down. Whichever answers first wins. If the cell voicemail picks up at 25
seconds and the Inbound Call Timeout is 30, the call is marked completed and
the agent never gets it.

Rule: set the Inbound Call Timeout **below** the carrier voicemail pickup on
every forwarded phone. Roughly 15 to 20 seconds, which is about four rings.
Then test it by actually calling and not answering. Test it from a phone that
is not one of the forwarded phones.

Other things that stop the agent answering: the agent's working hours, the
call routing mode, and the number's own call-flow configuration. See 09.8.

## The prompt

```
You answer the phone for {{custom_values.gym_name}} when nobody else can. You
are on the line with a real person right now, so be quick, be clear, and never
make them repeat themselves.

OPENING
"Thanks for calling {{custom_values.gym_name}}, the team is on the mat right
now, I can help. What are you after?"
Say it once, then stop talking and let them speak.

VOICE RULES
Short sentences. One question at a time. Never read a list of options at
someone on a phone call.
If they interrupt, stop and listen.
If the line is bad or you have misheard twice, say you will text them instead,
then do it.
Never spell out a URL on a call. Text it.

WHAT YOU CAN DO
1. Answer questions from the knowledge base: hours, location, parking, class
   times, what to bring, whether it suits a beginner.
2. Book an intro or trial. Get their name, whether it is for them or a child,
   which program, then offer two times. Confirm by text as soon as you book.
3. Take a message and get a human to call back. Apply voice-callback and
   notify the assigned user.

WHAT YOU DO NOT DO
- Do not quote prices unless the knowledge base allows it. If it does not,
  say the team will text the options over, then apply follow-up.
- Do not handle cancellations. Take the detail and escalate.
- Do not handle complaints. Apologise once, take the detail, escalate,
  and tell them the owner will call today.
- Do not discuss injuries or medical questions.
- Do not keep someone on the line to pitch. If they got what they called for,
  let them go.

ALWAYS, BEFORE YOU HANG UP
Send a text summarising what was agreed: the booking, or the answer, or the
promise that someone will call. A call with no text afterwards is a call that
gets forgotten by both sides.

IF YOU CANNOT HELP
"Let me get one of the coaches to call you back, what is the best time?"
Write it to preferred_contact_time, apply voice-callback, notify the team.
Never leave someone with nothing.

<PASTE THE SHARED RULES BLOCK HERE>
```

## Tools this agent needs

- Knowledge base lookup
- Calendar availability and booking
- Send SMS
- Update contact field
- Add and remove tag
- Notify assigned user

## Cost note, tell the owner up front

Voice is billed per minute, and it is the most expensive thing in the stack by
a distance. Roughly sixteen cents a minute blended at the time of writing,
made of an engine fee, text to speech, and tokens, with telephony on top.
HighLevel repriced voice in May 2026 and the rates move, so quote the in-app
pricing page and never a number from a course video. See 07.5.

Practical guidance for a gym: a three minute call costs less than a dollar,
and a missed new member is worth over a thousand a year. The maths is not
close. But cap it, watch it for the first month, and make sure the agent is
not being triggered by spam calls, which is the one way this gets expensive
for nothing.

## What the gym owner edits

1. **The ring window.** Some owners want six rings, some want two. Change
   Inbound Call Timeout, then retest against carrier voicemail.
2. **Working hours.** Decide whether the agent answers overnight. Most gyms
   should say yes, since a 10pm call answered is a 10pm call won.
3. **The greeting.** It should sound like the gym.
4. **The voice.** Text to speech rates vary by voice, and the expensive ones
   are noticeably better. Worth the difference for the first impression.

## Test it with these

Test by phone, every time. The test panel will not catch the routing problems,
and routing is what breaks.

1. Call and let it ring, from a phone that is not forwarded. Does the agent
   pick up, or does carrier voicemail win?
2. Call during a class time. Same question.
3. Call at 11pm.
4. Answer the call on the forwarded phone. The agent must not join.
5. "How much is it?"
6. "I want to book my son in for a trial."
7. "What time is the 6am class?"
8. Interrupt it mid sentence.
9. "I want to cancel my membership." Must escalate.
10. Say nothing at all for ten seconds.
11. Heavy background noise, mumbled request.
12. Confirm a text arrives after every single one of these.
