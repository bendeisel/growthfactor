# 06.6 Reading the history when something misfires

**Module:** 06 Automations
**Video:** ~6 min
**Needs first:** 06.1, 06.3
**You finish with:** the ability to answer "why did that happen?" yourself

## Why this matters

Something odd happens. A member gets a message they should not have. A lead
gets nothing. You need to know why, and you need to know without waiting for
us.

Everything is logged. Two places to look.

## Place 1: the contact's activity

Start here, always. It is faster and it answers most questions.

1. Open the contact.
2. Find the activity or history panel.

   [SHOT 06.6-01]

3. Read it backwards from now.

You see, in order: every message sent and received, every tag added and
removed and by what, every workflow entered and exited, every appointment,
every payment, every field change.

That log answers most questions on its own. "Why did they get a follow-up
message?" Because at 09:14 the Cold Lead Sweep workflow applied `follow-up`.
Now you know where to look.

## Place 2: the workflow's own history

For questions about the workflow rather than the contact.

1. Open the workflow.
2. Open its history, executions or logs.

   [SHOT 06.6-02]

3. You see every contact that entered, when, which path they took, and where
   they are now.

Useful for: "did this run at all today", "how many people are sitting at that
wait step", "did everyone take the wrong branch".

## The five questions, and where to answer them

### "Why did they get that message?"

Contact activity. Find the message, look at what happened immediately before
it. It will be a tag or a workflow entry.

### "Why did they get nothing?"

In order:

1. Is the workflow published?
2. Did the contact enter it? Check workflow history.
3. If they entered, which branch did they take?
4. Did they hit a blocking tag check and exit?
5. Are they sitting at a wait step right now?

Number 5 catches a lot of "nothing happened" reports where actually
everything is fine and the wait is just longer than the person expected.

### "Why did they get it twice?"

Contact activity. Look for the same tag being applied twice, or two workflows
both sending. See the double-sequence warning in 06.3.

### "Why did it go out at 3am?"

Time zone in 01.1, or a missing quiet hours wait in 06.4.

### "Why did the agent not respond?"

Check the tag landed first, then go to 09.13. Agents have their own logs.

[SHOT 06.6-03]

## What to do before contacting us

Have these ready and we can fix it in one message instead of five:

1. The contact's name or ID
2. What you expected to happen
3. What actually happened
4. The relevant bit of the activity log
5. Which workflow you think is involved

Doing that yourself usually finds the answer before you finish typing.

## The weekly scan

Once a week, ten minutes.

1. Open your three most active workflows.
2. Look at how many contacts entered in the last seven days.
3. Look for anything sitting at a wait step much longer than expected.
4. Look for a branch nobody ever takes, which usually means a condition is
   wrong.

Point 4 is worth the whole exercise. A branch that never fires is a piece of
your system that quietly does nothing.

## Checklist

- [ ] I know where the contact activity log is
- [ ] I know where workflow history is
- [ ] I can answer the five questions
- [ ] I check whether a workflow is published before anything else
- [ ] I know what to have ready before asking us
- [ ] Weekly scan is in my routine

## When it goes wrong

**The activity log is enormous.** Filter it, or scan for tag events only,
since tags are what drive everything.

**Workflow history is empty.** Either it has not run, or it is not published.

**The log shows the right thing but the member says otherwise.** Check the
actual message content in Conversations, not just the log entry. Sometimes a
message sent is not the message you thought was configured.

## Shot list

| Shot | Screen | Capture | Highlight | Blur |
|------|--------|---------|-----------|------|
| 06.6-01 | Contact activity log | The log | A tag applied by a workflow | Name, number, content |
| 06.6-02 | Workflow history view | The execution list | A contact's path | Names |
| 06.6-03 | A contact sitting at a wait step | The step detail | The contact count and next run time | Names |
| 06.6-04 | A branch with zero contacts ever | The canvas | The unused branch | Nothing |

## Video script

**Hook.** Something weird happened. Before you message us, here is how to find
out why yourself, in about ninety seconds.

**Beats.**
1. On screen: a contact activity log. Read it backwards out loud. Model the
   skill.
2. On screen: workflow history. When to use this instead.
3. On screen: the five questions. Answer one of them live on a real contact.
4. On screen: talk to camera. What to have ready before messaging us, and
   that gathering it usually solves it.
5. On screen: the weekly scan, especially the branch nobody takes.

**Go do.** Open any contact who has been through a sequence and read their
activity log backwards. Make sure you can explain every line.

## Verify on screen

- What the activity panel is called and where it sits on a contact record.
- Whether workflow history shows the branch taken per contact.
- Whether contacts currently in a wait step are visible from the canvas.
