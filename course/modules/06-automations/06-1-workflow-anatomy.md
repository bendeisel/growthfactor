# 06.1 Workflow anatomy

**Module:** 06 Automations
**Video:** ~6 min
**Needs first:** module 02
**You finish with:** being able to read any workflow in your account

## Why this matters

You do not need to become an automation builder. You need to be able to open
a workflow, understand what it does, and change one thing without breaking it.

Every workflow, however complicated, is made of four kinds of block.

## The four blocks

[SHOT 06.1-01]

### 1. Trigger

What starts it. Every workflow has at least one, at the top.

Common ones for a gym:

| Trigger | Fires when |
|---------|-----------|
| Contact Created | Anyone new lands in the system |
| Form Submitted | A specific form is filled in |
| Tag Added / Removed | The tag system from 02.3 |
| Appointment Booked / Status Changed | Calendar events, including no-show |
| Payment Received / Payment Failed | Money |
| Review Received | A Google or Facebook review lands |
| Birthday, or Date field | Anniversaries and contract ends |

### 2. Action

Something happens. Send a message, add a tag, update a field, move an
opportunity, create a task, notify a person.

### 3. Wait

Time passes. Either a fixed duration, or until a specific time, or until a
condition is met.

The most useful wait for a gym: **wait until a specific time of day.** It
stops a workflow that fires at 11pm from texting somebody at 11pm.

### 4. Condition, or If/Else

The workflow splits. Contacts go down one branch or another based on a tag, a
field, or something they did.

## Reading a workflow

Top to bottom. A contact enters at the trigger and travels down, taking one
path at each split.

Two things people get wrong when reading one:

1. **A contact sits at a wait step.** They are inside the workflow, paused,
   not finished. That is why editing a running workflow is risky, covered in
   06.4.
2. **Branches do not rejoin unless you make them.** If a branch ends, the
   contact exits the workflow.

## Steps, to read your first one

1. Open **Automation**.

   [SHOT 06.1-02]

2. Open the `Appointment Reminders` workflow from 03.6.

3. Look at the trigger at the top. What starts it?

4. Follow it down. Name each block out loud: trigger, wait, action, wait,
   action.

5. Find the condition and say what it splits on.

6. Do not change anything.

That is the whole skill. Do it with two or three workflows and you can read
any of them.

## Publish versus draft

[SHOT 06.1-03]

A workflow does nothing until it is published. This is the number one cause of
"the automation is not working".

A published workflow with a change saved but not republished runs the old
version. Check the publish state whenever something behaves oddly.

## What not to touch yet

Leave the agent-feeding workflows in 06.3 alone until you have read that
lesson. They are the wiring between your six agents, and a change in the wrong
place stops an agent firing with no error anywhere.

## Checklist

- [ ] I can name the four block types
- [ ] I have read three existing workflows top to bottom
- [ ] I know a contact can be paused at a wait step
- [ ] I know to check published status first

## Shot list

| Shot | Screen | Capture | Highlight | Blur |
|------|--------|---------|-----------|------|
| 06.1-01 | A simple workflow canvas | The whole flow | The four block types | Nothing |
| 06.1-02 | Automation, workflow list | The list with statuses | The published column | Names if sensitive |
| 06.1-03 | The publish control | The header | Draft versus published state | Nothing |
| 06.1-04 | A wait step with contacts currently in it | The step | The contact count | Nothing |

## Video script

**Hook.** You do not need to become an automation person. You need to open one
of these, understand it, and change one thing without breaking it.

**Beats.**
1. On screen: a workflow canvas. Four block types, name each, pointing at
   them.
2. On screen: read the Appointment Reminders workflow top to bottom, out loud.
   Model the skill rather than describing it.
3. On screen: the publish state. Say it is the number one cause of "it is not
   working".
4. On screen: talk to camera. Do not touch the agent workflows yet.

**Go do.** Open three workflows and read them top to bottom. Change nothing.

## Verify on screen

- Exact block type names in the current builder.
- Whether the trigger list matches the table, particularly Review Received and
  Payment Failed.
