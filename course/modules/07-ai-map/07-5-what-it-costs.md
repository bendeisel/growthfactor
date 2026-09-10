# 07.5 What it costs

**Module:** 07 The AI Map
**Video:** ~8 min
**Needs first:** 01.6
**You finish with:** knowing what your agents cost to run, and how to keep it
that way

## Why this matters

Owners either ignore AI cost until a bill surprises them, or they are so
nervous about it that they never turn anything on. Both are avoidable with
twenty minutes of understanding.

**Read this alongside the in-app pricing page, not instead of it.** HighLevel
repriced Voice AI in May 2026 and rates move. Anything in a course, including
this one, is out of date the moment the platform changes. Screen beats
lesson, always.

## The three billing models

You are on one of these.

| Model | How it works | Suits |
|-------|-------------|-------|
| **Pay per use** | Nothing monthly. You pay for each response and each minute | Low volume, or just starting |
| **AI Employee Growth** | A flat monthly fee per enabled sub-account | Steady volume |
| **AI Employee Unlimited** | A higher flat monthly fee per enabled sub-account | Heavy use, especially voice |

Note **per sub-account**. That matters to us at the agency level and it is why
we watch which of your locations have AI enabled.

## What the meters actually measure

### Conversation AI responses

Charged **per response generated**, not per word or per conversation. A
one-word reply and a four-sentence reply cost the same.

That means a chatty agent that sends three short messages costs three times a
concise one that sends a single good message. Another reason the prompts tell
agents to be brief.

### Voice AI, per minute

Three components stacked, and telephony on top.

| Component | What it is |
|-----------|-----------|
| Engine fee | The base per-minute rate |
| Text to speech | Varies substantially by voice. The good voices cost more |
| LLM tokens | The thinking |
| Telephony | Billed separately, the actual phone call |

HighLevel publishes a blended figure of roughly sixteen cents a minute. Your
real number depends heavily on which voice you picked.

**The voice choice is a real cost decision.** A premium voice can be several
times the rate of a basic one. For a gym's first impression on the phone, it
is usually worth it, but know that you are choosing.

### SMS, email, calls

Cents and fractions of cents. Not where your money goes.

## Real numbers for a real gym

A gym with 100 new leads a month.

| Item | Volume | Rough cost |
|------|--------|-----------|
| Agent text responses | 100 leads, 8 responses each = 800 | Tens of dollars |
| Voice calls answered | 40 missed calls, 3 min each = 120 min | Under $25 |
| SMS delivery | ~1,500 messages | Under $15 |
| Email | ~600 | Pennies |

Under a hundred dollars a month for a system that answers every lead in under
a minute, twenty four hours a day.

One member at $149 a month covers it in the first two weeks. The maths is not
close. But that is only true while nothing is misconfigured, which brings us
to the next section.

## The three ways this actually gets expensive

### 1. Spam calls answered by voice

Robocalls hit your number, the voice agent picks up, and you pay per minute to
talk to a machine.

**Check in week one.** Look at your call log for short calls from numbers that
never became contacts. Fix per 09.8.

### 2. A looping workflow

A workflow that re-triggers itself, generating agent responses continuously.
Guardrails prevent this. See 06.4.

Symptom: usage climbing steadily with no matching increase in leads.

### 3. An agent that will not stop talking

An agent with a poorly edited prompt can send four messages where one would
do. Costs four times as much and converts worse.

If you edit a prompt and usage jumps, look at the prompt first.

[SHOT 07.5-01]

## Watching usage

1. Open the usage breakdown in billing.

   [SHOT 07.5-02]

2. Look at the split by product. Voice should be a minority unless you get a
   lot of calls.

3. Compare month to month. What you want is usage rising roughly in line with
   leads. Usage rising while leads are flat means something is wrong.

Weekly for the first month, then monthly.

## When to change plan

Ask us to review if:

- Pay per use is consistently costing more than the flat monthly rate
- You are on a flat plan and barely using it
- Your call volume changes significantly

We will tell you when you cross the line rather than letting you overpay. That
is the point of you being on our agency.

## Checklist

- [ ] I know which billing model I am on
- [ ] I know voice is the expensive component
- [ ] I know the voice choice affects cost
- [ ] Auto recharge is on, from 01.6
- [ ] I checked my call log for spam calls in week one
- [ ] Weekly usage check for month one, then monthly
- [ ] I know to check the in-app pricing page, not this lesson

## When it goes wrong

**Bill much higher than expected.** In order: spam calls, a looping workflow,
a chatty prompt. Check the usage split by product first, it tells you which.

**Agents stopped talking.** Wallet hit zero. See 01.6.

**Voice costs more than the blended figure suggests.** Your voice choice.
Check the text to speech rate for the voice you selected.

## Shot list

| Shot | Screen | Capture | Highlight | Blur |
|------|--------|---------|-----------|------|
| 07.5-01 | Usage breakdown by product | The split | The Voice AI line | Amounts |
| 07.5-02 | Usage trend over several months | The chart | The trend line | Amounts |
| 07.5-03 | The in-app AI pricing page | The current rates | The voice rates | Nothing |
| 07.5-04 | Call log with suspected spam calls | The log | Short calls with no contact created | Numbers |

## Video script

**Hook.** Your agents cost roughly a hundred dollars a month to run, and one
new member covers that in two weeks. Unless one of three things goes wrong,
and then it does not.

**Beats.**
1. On screen: the in-app pricing page. Say clearly: this page, not this video.
   Set that expectation before any numbers.
2. On screen: the three billing models.
3. On screen: talk to camera with the real gym maths. Let the comparison to
   one member land.
4. On screen: the three expensive failure modes. Spend most of the time here,
   it is the actionable part. Show the call log check.
5. On screen: the usage breakdown, and the rule that usage should track leads.

**Go do.** Open your usage breakdown and your call log. If you see short calls
from numbers that never became contacts, tell us this week.

## Verify on screen

- Current AI plan names and prices.
- Current Voice AI component rates and the text to speech range by voice.
- Whether the usage breakdown splits by product as described.
