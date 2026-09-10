# 06.2 The Workflow AI Builder

**Module:** 06 Automations
**Video:** ~7 min
**Needs first:** 06.1
**You finish with:** a working automation you built by describing it

## Why this matters

You can now describe an automation in plain language and have it built. No
dragging blocks, no learning a trigger list.

This is genuinely good, and it changes who can build automations in a gym from
"the one person who is good with computers" to anyone.

It is not magic. It builds what you asked for, which is not always what you
meant. So the skill is describing well, then checking the result.

## Steps

1. Open **Automation** and create a new workflow.

2. Choose the AI builder option rather than starting from blank.

   [SHOT 06.2-01]

3. Describe what you want. Then read the next section, because the
   description is the whole job.

4. Watch it build. It shows what it is doing as it goes.

   [SHOT 06.2-02]

5. **Read every block it created.** Use the skill from 06.1.

6. Fix anything wrong.

7. Test on yourself. See 06.5.

8. Publish.

## Describing it well

Bad description:

> `Follow up with leads`

That could mean anything, and you will get something generic.

Good description:

> `When a contact gets the tag gym-seminar-interest, wait 1 hour, then send an
> SMS telling them about the seminar with the payment link. If they have not
> replied after 2 days, send one more SMS. If they still have not replied
> after 5 days, remove the tag and stop. Do not send anything to anyone tagged
> do-not-contact. Do not send between 9pm and 8am.`

Include five things every time:

1. **The trigger.** Exactly what starts it.
2. **The timing.** Waits, in real units.
3. **The messages.** What each one says, or at least what it is about.
4. **The exit.** What stops it, and what happens at the end.
5. **The guardrails.** Who must never receive it, and quiet hours.

Point 5 is the one people leave out, and it is the one that matters most.

## Always check these four things afterwards

Whatever it built, check:

1. **The trigger is what you meant.** "When someone books" could be
   appointment booked or form submitted. They are different.
2. **The quiet hours and blocking tag checks are actually there.** Add them if
   not. See 06.4.
3. **The exit conditions.** Does anything stop this workflow, or will contacts
   sit in it forever?
4. **The messages read like you.** They will be competent and slightly
   generic. Rewrite them.

[SHOT 06.2-03]

## What to use it for, and what not to

**Good for:** anything self-contained. A seminar promotion, a birthday
message, a new member onboarding sequence, a lapsed member alert to staff.

**Not for:** touching the agent wiring in 06.3. Those workflows have specific
tag behaviour that other things depend on, and asking an AI to rebuild one is
how you break three agents at once.

## Test it

Build this one, exactly, as practice:

> `When a contact is tagged gym-test-workflow, wait 2 minutes, then send them
> an SMS saying "This is a test, ignore me". Then remove the tag and stop. Do
> not send to anyone tagged do-not-contact.`

Then:

1. Read what it built.
2. Tag your `ZZ Test` contact.
3. Confirm the text arrives.
4. Confirm the tag is removed.
5. Add `do-not-contact` to a second test contact, tag it, confirm nothing
   sends.

That last step is the one worth doing, because it teaches you to verify
guardrails rather than trust them.

## Checklist

- [ ] Built one workflow with the AI builder
- [ ] My description included trigger, timing, messages, exit and guardrails
- [ ] I read every block it created
- [ ] I checked the four things
- [ ] I tested it, including the guardrail
- [ ] I know not to point it at the agent wiring

## When it goes wrong

**It built something completely different.** Your description was ambiguous.
Rewrite it more specifically rather than trying to fix the output.

**It missed the guardrails.** Common. Add them by hand. See 06.4.

**It runs forever.** No exit condition. Add one.

**Messages sound like a robot.** They will. Rewrite them, that is your job not
the AI's.

## Shot list

| Shot | Screen | Capture | Highlight | Blur |
|------|--------|---------|-----------|------|
| 06.2-01 | New workflow, AI builder option | The choice screen | The AI option | Nothing |
| 06.2-02 | The builder working, streaming its steps | The build in progress | The step list | Nothing |
| 06.2-03 | The finished workflow, with a missing guardrail circled | The canvas | Where the tag check should be | Nothing |
| 06.2-04 | The same workflow after adding the guardrail | The canvas | The added condition | Nothing |

## Video script

**Hook.** You can now build an automation by typing a sentence. The catch is
that it builds exactly what you said, which is not always what you meant.

**Beats.**
1. On screen: type the bad description, `follow up with leads`. Show the
   generic result. Do not skip this, the contrast is the lesson.
2. On screen: type the good description. Show the difference.
3. On screen: the five things to always include. Dwell on guardrails.
4. On screen: read the output block by block, find something wrong, fix it.
5. On screen: test it on a phone, then test the do-not-contact case.

**Go do.** Build the test workflow exactly as written in the lesson, and run
both test cases.

## Verify on screen

- Where the AI builder is entered from in the current release.
- Whether it now adds quiet hours and tag checks by default, since this lesson
  assumes it does not.
