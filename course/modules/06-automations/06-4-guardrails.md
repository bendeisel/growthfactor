# 06.4 Guardrails

**Module:** 06 Automations
**Video:** ~7 min
**Needs first:** 06.1, 02.3
**You finish with:** knowing every safety check in your account and how to add
one

## Why this matters

An automation that runs correctly 99% of the time and texts a bereaved member
a win-back offer the other 1% is not a good automation.

Guardrails are the checks that stop the 1%. Every workflow in your account has
them. Every workflow you build needs them.

## The five guardrails

### 1. Blocking tag checks

Before any message, check for `do-not-contact`, `no-ai`, `staff-handling`,
and the situational ones. See 02.3.

Implemented as a condition at the top of the workflow, before anything sends.

[SHOT 06.4-01]

### 2. Quiet hours

No messages between the hours in `{{custom_values.quiet_hours}}`.

Implemented as a **wait until a specific time** step rather than a condition.
That way a workflow that fires at 11pm holds the message until 8am, instead of
dropping it.

Holding beats dropping. A dropped message is a lost lead.

### 3. Frequency cap

Nobody receives more than a set number of automated messages in a period. Two
a day and five a week is a reasonable ceiling for a gym.

This matters most when a contact is in more than one sequence at a time, which
happens more than you would think.

### 4. Stop on reply

Any human reply pauses the automated sequence. The most important guardrail
of all, and the one members notice when it is missing.

Nothing annoys somebody more than replying to a text and getting the next
scheduled message anyway.

### 5. Loop protection

A maximum number of times a contact can re-enter the same workflow, and a
minimum gap between entries.

Prevents the classic disaster: workflow A applies a tag that triggers workflow
B, which applies a tag that re-triggers workflow A.

[SHOT 06.4-02]

## Adding a guardrail to a workflow you built

1. Open the workflow.
2. Immediately after the trigger, add an **If/Else** condition.
3. Condition: contact has tag `do-not-contact`, or `no-ai`, or
   `staff-handling`.
4. If yes, end the workflow. Nothing else.
5. If no, continue to the rest.

   [SHOT 06.4-03]

6. Then find your first message step and put a **wait until** before it, set
   to your earliest sending hour.

7. Republish.

Two blocks. Do it on every workflow you ever build.

## Editing a running workflow

Contacts can be sitting inside a workflow at a wait step right now. When you
edit and republish, what happens to them depends on the change:

- **Changing message text:** they get the new text. Safe.
- **Changing wait durations:** unpredictable for contacts already waiting.
- **Adding or removing steps:** contacts in flight can behave oddly.
- **Deleting a branch someone is on:** they can get stuck.

For anything more than a wording change, safest approach:

1. Pause the workflow.
2. Check how many contacts are in flight and where.
3. Make the change.
4. Republish.
5. Watch the next few runs.

Do it at a quiet time, not at 6pm on a Monday.

## What good looks like

Open any workflow in your account and you should see, in this order:

1. Trigger
2. Blocking tag check, exit if blocked
3. Quiet hours handling
4. The actual work
5. A clear exit

If a workflow is missing 2 or 3, add them.

## Test it

The only test that matters is the negative one.

1. Create a second test contact, `ZZ Blocked`, with `do-not-contact`.
2. Put it through every workflow you can trigger by hand.
3. Confirm nothing sends. Not a single message.

Do this every time you build or significantly edit a workflow. It takes two
minutes and it is the check that protects your reputation.

## Checklist

- [ ] I know all five guardrails
- [ ] Every workflow I built has a blocking tag check
- [ ] Every workflow I built handles quiet hours by waiting, not dropping
- [ ] Stop on reply is on wherever a sequence sends more than one message
- [ ] I have a `ZZ Blocked` test contact
- [ ] I test the negative case, not just the happy path

## When it goes wrong

**A member on `do-not-contact` got a message.** Find the workflow, add the
check, then go and apologise properly. Do not send an automated apology.

**Messages at 3am.** Time zone in 01.1, or a workflow with no quiet hours
handling.

**Somebody got six messages in a day.** They are in multiple sequences.
Check their activity to see which, and consider whether the sweeps in 06.3
should exclude contacts already in a sequence.

**A workflow loops.** Pause it immediately. Then look for the tag it applies
being also a trigger for something that triggers it.

## Shot list

| Shot | Screen | Capture | Highlight | Blur |
|------|--------|---------|-----------|------|
| 06.4-01 | A workflow's blocking tag condition | The condition block | The tag list | Nothing |
| 06.4-02 | Loop protection settings | The re-entry config | The max entries setting | Nothing |
| 06.4-03 | Adding an If/Else after a trigger | The canvas mid-edit | The new block | Nothing |
| 06.4-04 | The ZZ Blocked test contact with do-not-contact | The record | The tag | Nothing |

## Video script

**Hook.** An automation that works 99% of the time and sends a win-back offer
to somebody who just lost a parent is not a good automation. These five checks
stop the 1%.

**Beats.**
1. On screen: the five guardrails, with an example of each failing. Real
   examples, they land harder than descriptions.
2. On screen: quiet hours as a wait, not a condition. Explain hold versus
   drop.
3. On screen: add a blocking check to a workflow, live. Two blocks, ninety
   seconds.
4. On screen: talk to camera. Editing a running workflow. Contacts are sitting
   in there right now.
5. On screen: the negative test with ZZ Blocked. Show nothing arriving.

**Go do.** Create your `ZZ Blocked` contact. Then open every workflow you have
built yourself and add the tag check.

## Verify on screen

- Whether frequency capping and loop protection are settings or must be built.
- Exact behaviour of contacts in flight when a workflow is republished.
- Whether a native stop-on-reply setting exists per workflow.
