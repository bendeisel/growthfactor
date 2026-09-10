# 01.6 Wallet, billing and AI usage

**Module:** 01 The Spine
**Video:** ~6 min
**Needs first:** nothing
**You finish with:** auto recharge on, and knowing what your agents cost to run

## Why this matters

Your agents spend money every time they speak. Not much, but continuously.
That money comes out of a wallet balance, and when the wallet hits zero,
everything stops.

Not gracefully. Mid conversation. A lead asks a question, the agent does not
answer, and you find out three days later when you wonder why bookings dropped.

## Turn on auto recharge, now

1. Open the billing area for your sub-account.

   [SHOT 01.6-01]

2. Add a card.

3. Turn on **auto recharge**.

4. Set the threshold and the recharge amount. For a typical gym doing a few
   hundred conversations a month: recharge `$50` when the balance drops below
   `$20`.

   [SHOT 01.6-02]

Do this before you do anything else in this lesson. Everything after here is
understanding, this bit is protection.

## What costs what

Approximate, and it moves. The in-app pricing page is the truth, not this
table, not a video, not a course.

| Thing | Roughly | Notes |
|-------|---------|-------|
| Outbound SMS | Fractions of a cent per segment | A long text is several segments |
| Inbound SMS | Similar | |
| Phone call | Per minute | Cheap |
| Email | Tiny | Effectively free at gym volumes |
| Conversation AI response | A few cents per response | Per response, not per word |
| Voice AI | Per minute, and it is the big one | Engine fee, text to speech, and tokens, plus telephony separately |

**Voice AI is the one to watch.** HighLevel repriced it in May 2026. The
blended figure they publish is around sixteen cents a minute, made up of an
engine fee, a text to speech rate that varies a lot by which voice you choose,
and token usage. Telephony is billed on top.

## What that means for a real gym

Some honest maths, because the numbers sound scarier in the abstract.

A gym doing 100 leads a month, where each lead gets maybe 8 agent messages
across the appointment and follow-up agents, is 800 AI responses. At a few
cents each, that is tens of dollars, not hundreds.

Add 40 missed calls answered by the voice agent at 3 minutes each. That is 120
minutes, and at roughly sixteen cents a minute it is under twenty dollars.

One new member is worth over a thousand a year. The maths is not close. But
watch it in month one anyway, because the failure mode is not gradual, it is a
single thing misconfigured that burns money fast.

## The one way this gets expensive for nothing

Spam calls. If your voice agent picks up robocalls and talks to them, you pay
per minute to have a conversation with a machine.

Check your call logs in week one. If you see short calls from numbers that
never become contacts, that is what is happening. The fix is in 09.8.

## The AI plan

You are on one of three billing models for AI, and which one depends on what
we set up for you.

| Model | How it works | Suits |
|-------|-------------|-------|
| Pay per use | Nothing monthly, pay for what you use | Low volume, or starting out |
| AI Employee Growth | A flat monthly per sub-account | Steady volume |
| AI Employee Unlimited | A higher flat monthly per sub-account | Heavy use, especially voice |

If your usage is climbing, ask us to check whether you should move. The flat
plans stop being expensive and start being cheap at a certain volume, and we
will tell you when you cross it rather than letting you overpay.

## Watch it in month one

1. Check the wallet weekly for the first month.
2. Look at what is actually consuming it. If voice is dominant and your call
   volume is not, you have a spam problem.
3. After a month you will know your normal, and you can stop watching.

[SHOT 01.6-03]

## Checklist

- [ ] Card on file
- [ ] Auto recharge on
- [ ] Threshold and amount set
- [ ] I know voice is the expensive one
- [ ] Calendar reminder to check usage weekly for four weeks

## When it goes wrong

**Agents stopped mid conversation.** Wallet hit zero. Top up, then turn on
auto recharge so it cannot happen twice.

**Bill much higher than expected.** Almost always voice. Look at call
duration and call count in the logs before assuming anything else.

**Auto recharge firing constantly.** Either your volume grew, which is good,
or something is looping. Check 06.4 for workflow guardrails.

## Shot list

| Shot | Screen | Capture | Highlight | Blur |
|------|--------|---------|-----------|------|
| 01.6-01 | Sub-account billing, wallet | Balance and controls | Nothing | Balance, card |
| 01.6-02 | Auto recharge settings | Threshold and amount fields | The toggle | Amounts if sensitive |
| 01.6-03 | Usage breakdown by product | The usage list | The voice AI line | Figures |

## Video script

**Hook.** When your wallet hits zero, your agents stop talking mid
conversation. Nobody tells you. You find out from the booking numbers three
days later.

**Beats.**
1. On screen: billing. Add card, turn on auto recharge, set the threshold.
   Do it live, it takes ninety seconds.
2. On screen: the cost table. Say plainly that the in-app page is the truth
   and this video is not.
3. On screen: talk to camera. The real maths for a 100 lead gym. This is the
   part that stops people being afraid of the technology.
4. On screen: call logs. The spam call trap. Tell them to check in week one.

**Go do.** Turn on auto recharge before the next lesson. Then put a weekly
reminder in your phone for four weeks to check usage.

## Verify on screen

- Whether the member sees a wallet at all under our rebilling setup, or
  whether we absorb it. This changes the entire lesson, confirm first.
- Current AI plan names and prices in-app.
- Exact nav path for the usage breakdown.
