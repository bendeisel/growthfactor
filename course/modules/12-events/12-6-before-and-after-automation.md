# 12.6 Before and after automation

**Module:** 12 Events (Labs beta)
**Video:** ~8 min
**Needs first:** 12.5, module 06
**You finish with:** attendees turning into members instead of into a list
nobody opens

## Why this matters

This is the reason to run events inside your CRM rather than on Eventbrite.

An attendee is a person who gave up a Saturday morning to be in your gym.
That is a stronger signal than any lead form. And in most gyms, nothing
happens afterwards.

## Before the event

### Confirmation, immediately

What they bought, when, where, what to bring, what time to arrive. Same
principle as the appointment confirmation in 09.4, and it does the same job:
it decides your show rate.

### Reminders

| When | Channel | Content |
|------|---------|---------|
| 1 week before | Email | What to expect, what to bring |
| 2 days before | SMS | Short. Time and address |
| Morning of | SMS | Very short. Address and parking |

The morning-of text matters more for events than for appointments, because
events are usually at unusual times and people forget the start time.

[SHOT 12.6-01]

### The pre-event ask

In the one week reminder, one question:

> `Anything you want us to cover, or anything we should know?`

Two reasons. Coaches get useful information, and a reply is engagement, which
makes them more likely to turn up.

## After the event

Where the value is, and where nobody bothers.

**Split attendees into three groups** using the "are you currently training
with us" field from 12.4, and the check-in status from 12.5.

### Group 1: non-members who attended

**The most valuable list your gym will produce all year.**

They came to your gym, met your coaches, saw the place, and are not members.

| When | What |
|------|------|
| Same day, evening | Thanks, one photo, and one specific line about the event |
| Day 2 | The offer. A trial, or a joining offer, with two specific times |
| Day 5 | If no reply, apply `follow-up` and let the agent take it. See 09.5 |

**Same day matters.** They are still feeling it. Wait a week and it is a
memory.

[SHOT 12.6-02]

### Group 2: members who attended

**Job: retention.**

| When | What |
|------|------|
| Same day | Thanks, photos, well done |
| Day 3 | Tell them what is next. The next event, or the next step in their training |

Members who come to events stay far longer than members who do not. So the
follow-up is not a sale, it is an invitation to the next one.

**Fire the review agent** at anyone who attended a grading or a comp. Peak
positive moment. See 09.7 and 12.3.

### Group 3: registered and did not turn up

Do not ignore them, and do not scold them. Same principle as no-shows in
09.5.

| When | What |
|------|------|
| Next day | "Sorry we missed you, everything ok?" Nothing else |
| If they paid | Offer a credit against the next one |

A paid no-show has a reason. Asking is worth more than the ticket price.

## Building it

One workflow, three branches.

1. Trigger on event ended, or on a date, depending on what the beta supports.
2. Branch on member versus non-member, and on attended versus no-show.
3. Different sequence per branch.
4. Guardrails, per 06.4.

If the beta does not yet expose an event-ended trigger, use a scheduled
workflow the day after, filtered to that event's attendees. Ask us to wire it
for your first event and you will be able to copy it after that.

[SHOT 12.6-03]

## Photos

The single most effective thing in the whole follow-up.

1. Someone takes photos during the event. Give a coach the job.
2. Post them that evening, tagging nobody but inviting people to tag
   themselves.
3. Include one in the same day follow-up message.

Photos do three jobs at once: they make the follow-up personal, they get
shared by attendees onto their own feeds, and they become your creative for
promoting the next one. See 10.2.

## Measuring it

Two weeks after, count:

| Number | |
|--------|--|
| Attendees | |
| Non-member attendees | |
| Non-members who booked a trial | |
| Non-members who joined | |
| Ticket revenue minus costs | |

That tells you what the event was actually worth, against the job you decided
it was doing in 12.3.

## Checklist

- [ ] Confirmation with what to bring and arrival time
- [ ] Three reminders, including morning of
- [ ] Pre-event question asked
- [ ] Attendees split into three groups
- [ ] Non-members contacted the same evening
- [ ] Non-members get an offer on day 2
- [ ] Members told what is next
- [ ] No-shows asked if everything is ok
- [ ] Review agent fired after gradings and comps
- [ ] Photos taken, posted and used in follow-up
- [ ] Counted the result two weeks later

## When it goes wrong

**Non-members went cold.** You waited too long. Same day, always.

**Follow-up went to members as if they were prospects.** The
are-you-training field was not captured or not used to branch. See 12.4.

**No photos.** Nobody was given the job. Give one coach the job in advance,
by name.

**No trigger for event ended.** Beta. Use a scheduled workflow instead and
ask us.

## Shot list

| Shot | Screen | Capture | Highlight | Blur |
|------|--------|---------|-----------|------|
| 12.6-01 | The reminder sequence in a workflow | The canvas | The morning-of send | Nothing |
| 12.6-02 | Phone, the same day non-member follow-up with a photo | The message | The photo and the specific line | Number |
| 12.6-03 | The three branch post-event workflow | The canvas | The member versus non-member branch | Nothing |
| 12.6-04 | The two week measurement, filled in | The numbers | Non-members who joined | Real figures |

## Video script

**Hook.** Somebody gave up their Saturday morning to be in your gym and they
are not a member. That is a stronger signal than any lead form you will ever
buy. In most gyms, nothing happens next.

**Beats.**
1. On screen: the before sequence. Quick, it mirrors 09.4.
2. On screen: the pre-event question. Small, effective, ten seconds.
3. On screen: the three groups. Slow down here. Group 1 is the lesson.
4. On screen: write the same day non-member message live, with a photo in it.
   Read it out loud.
5. On screen: talk to camera. Same day, not next week. Say why: they are still
   feeling it.
6. On screen: the three branch workflow.
7. On screen: the photos point. Three jobs at once, including creative for the
   next event.
8. On screen: the two week count.

**Go do.** Before your next event, give one coach the job of taking photos, by
name. Then write the same day non-member message in advance so it is ready.

## Verify on screen

- Whether an event-ended trigger exists in the beta.
- Whether attendance status is available to workflows.
- Whether registration field answers reach workflow conditions.
