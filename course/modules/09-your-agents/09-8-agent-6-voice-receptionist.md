# 09.8 Agent 6: Voice Receptionist

**Module:** 09 Your Agents
**Video:** ~12 min
**Needs first:** 09.2, module 08 complete
**You finish with:** a voice agent that actually picks up the calls you miss

## Why this matters

Your gym misses calls all day. Coaches are on the mat, the desk is unstaffed
at 6am, the phone rings during class.

Every one of those is somebody who was ready enough to actually call, which is
rarer and hotter than a form fill. Most of them do not leave a voicemail and
most of them do not call back. They call the next gym.

## The setting that decides whether any of this works

Read this section twice. It is the reason most voice agents never answer a
single call.

**Voice AI in backup mode is third priority** on the number's call
configuration:

1. The number rings, forwarding to staff
2. Simultaneous ring, if a second number is set
3. Voice AI picks up, if nobody answered

**Inbound Call Timeout is what decides whether step 3 ever happens.**

Here is the problem. You forward to your mobile. Your mobile's carrier
voicemail is also counting down. Whichever answers first wins.

If your carrier voicemail picks up at 25 seconds and Inbound Call Timeout is
set to 30, the call goes to your voicemail, HighLevel marks the call
**completed**, and the agent never gets it.

[SHOT 09.8-01]

### The rule

Set Inbound Call Timeout **below** the carrier voicemail pickup on every
forwarded phone. Around **15 to 20 seconds**, which is roughly four rings.

Then test it by calling and not answering, from a phone that is not one of the
forwarded numbers.

### Other things that stop it answering

- The agent's working hours
- Call routing mode on the number
- Forwarding configuration
- The number's own call flow

If it does not answer, work through all of these before assuming the agent is
broken. The agent is almost never the problem. See 07.2 on the two-place
configuration split.

## Setting it up

1. Open the voice agent in **AI Agents**.

   [SHOT 09.8-02]

2. Confirm the knowledge base is attached.

3. Set the greeting. It should sound like your gym.

   > `Thanks for calling Nashville MMA, the team is on the mat right now, I
   > can help. What are you after?`

4. Choose the voice. See the cost note below.

5. Set working hours. Most gyms should let it answer around the clock, since a
   10pm call answered is a 10pm call won.

6. Now go to **Settings > Phone Numbers**, open your number, and configure
   call forwarding, priority and **Inbound Call Timeout**.

   [SHOT 09.8-03]

7. Test by calling.

## What it can do

1. Answer questions from the knowledge base
2. Book an intro
3. Take a message and get a human to call back, applying `voice-callback`

## What it must not do

- Quote prices, unless your KB allows it
- Handle cancellations
- Handle complaints beyond apologising and escalating
- Discuss injuries
- Keep somebody on the line to pitch once they have what they called for

## Voice rules that matter

Different from text, and the prompt handles them, but know why:

- **Short sentences.** One question at a time.
- **Never read a list of options at somebody on a phone.**
- **Never spell out a URL.** Text it instead.
- **If it mishears twice, switch to text.**
- **Always send a text summary before hanging up.** A call with no text
  afterwards gets forgotten by both sides.

## The cost, and telling the owner straight

Voice is the most expensive thing in your stack. Roughly sixteen cents a
minute blended, made of an engine fee, text to speech that varies a lot by
voice, and tokens, with telephony on top. HighLevel repriced it in May 2026,
so check in-app. See 07.5.

A three minute call costs under a dollar. A missed new member is worth over a
thousand a year. The maths is not close.

**But cap it and watch it in month one**, because of the next section.

## Spam calls, the one way this wastes money

Robocalls hit your number, the agent picks up, and you pay per minute to talk
to a machine.

Check your call log in week one. Look for short calls from numbers that never
became contacts.

Fixes, in order:

1. Turn on any spam filtering available on the number.
2. Set the agent to end a call quickly when there is no human response.
3. Restrict the agent's working hours if the spam is concentrated overnight.

[SHOT 09.8-04]

## The prompt

Full text: `assets/agent-prompts/06-voice-receptionist.md`.

## What you should edit

1. **The ring window.** Inbound Call Timeout. Retest against carrier voicemail
   every time you change it.
2. **Working hours.**
3. **The greeting.**
4. **The voice.** The expensive ones are noticeably better and this is your
   first impression on the phone. Usually worth it.

## Test it by phone, twelve times

The test panel will not catch routing problems, and routing is what breaks.

1. Call and let it ring, from a phone that is not forwarded. Agent or carrier
   voicemail?
2. Call during a class time.
3. Call at 11pm.
4. Answer on the forwarded phone. The agent must not join.
5. `How much is it?`
6. `I want to book my son in for a trial.`
7. `What time is the 6am class?`
8. Interrupt it mid sentence.
9. `I want to cancel my membership.` Must escalate.
10. Say nothing for ten seconds.
11. Heavy background noise, mumbled request.
12. Confirm a text arrives after every single one.

Test 1 is the whole lesson. If carrier voicemail wins, nothing else matters.

## Checklist

- [ ] Knowledge base attached
- [ ] Greeting sounds like my gym
- [ ] Voice chosen deliberately, knowing the cost
- [ ] Working hours set
- [ ] Inbound Call Timeout below carrier voicemail pickup
- [ ] Tested by calling from an unforwarded phone and not answering
- [ ] Agent does not join when a human answers
- [ ] Text summary arrives after every call
- [ ] Call log checked for spam in week one
- [ ] All twelve tests run

## When it goes wrong

**It never answers.** In order: Inbound Call Timeout versus carrier
voicemail, working hours, call routing mode, forwarding config, published
state.

**It answers when a human already picked up.** Priority order on the number.

**It talks over people.** Interruption handling in the agent config.

**No text summary.** The SMS tool is not attached, or A2P is not approved.
See 01.2.

**Bill is high.** Spam calls. Check the log.

## Shot list

| Shot | Screen | Capture | Highlight | Blur |
|------|--------|---------|-----------|------|
| 09.8-01 | The call forwarding tab showing Voice AI at third priority | The priority list | Voice AI position and Inbound Call Timeout | Numbers |
| 09.8-02 | The voice agent config | Greeting and voice selector | The voice options | Nothing |
| 09.8-03 | Inbound Call Timeout set to 18 seconds | The setting | The value | Numbers |
| 09.8-04 | Call log with suspected spam calls | The log | Short calls, no contact created | Numbers |
| 09.8-05 | Phone, the summary text after a call | The text | The summary | Number |

## Video script

**Hook.** Most voice agents never answer a single call, and the agent is
almost never the reason. It is one timeout setting fighting your mobile
carrier's voicemail. Let me show you.

**Beats.**
1. On screen: the call forwarding tab. Draw the race: HighLevel counting down,
   the carrier counting down, whoever wins takes the call. Spend real time
   here, it is the lesson.
2. On screen: set Inbound Call Timeout to 18. Then call the gym on camera from
   an unforwarded phone, let it ring, agent picks up. That shot is the proof.
3. On screen: the agent config. Greeting, voice, hours.
4. On screen: talk to camera. Voice rules. Never spell a URL, always text a
   summary.
5. On screen: cost. Honest, quick, then the spam call check with a real log.
6. On screen: run tests 4, 9 and 12 by phone.

**Go do.** Call your own gym from a phone that is not forwarded and do not
answer. If carrier voicemail picks up, fix Inbound Call Timeout before
anything else.

## Verify on screen

- Exact label and location of Inbound Call Timeout.
- Confirm Voice AI backup mode is third priority in the current release.
- Available voices and their relative cost.
- Whether spam filtering is available on LC Phone numbers.
