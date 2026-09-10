# 03.6 Reminders, confirmations and no-shows

**Module:** 03 Calendars
**Video:** ~7 min
**Needs first:** 03.2
**You finish with:** a reminder sequence that cuts no-shows, and no-shows
handed to the right agent

## Why this matters

Gyms lose more intros to no-shows than to rejections. Somebody books on
Tuesday, life happens by Thursday, and nobody follows up because nobody
noticed.

Reminders fix most of it. The rest is what you do afterwards, and that is the
follow-up agent's no-show variant.

## The sequence that works

Four touches. Any fewer and no-shows climb, any more and you are nagging.

| When | Channel | Content |
|------|---------|---------|
| Immediately on booking | SMS | Confirmation. Day, date, time, address, what to bring, who they are meeting |
| 24 hours before | SMS | Reminder, plus one line asking them to reply if they cannot make it |
| 2 hours before | SMS | Short. Address and parking |
| 10 minutes after a no-show | SMS | The recovery message |

The 24 hour one is the workhorse. Asking them to reply if they cannot make it
does two things: it gives them a socially easy way out, and a reply is worth
far more than a silent no-show, because a reply is a conversation you can
rebook.

## Where these are configured

Two places, and knowing which is which saves confusion.

1. **The confirmation** is sent by the appointment agent, because it is a real
   message in a real conversation. See 09.4.
2. **The reminders** are calendar notifications or a workflow.

Use a **workflow** rather than plain calendar notifications, because a
workflow can check tags first. You do not want a reminder going to someone
tagged `do-not-contact`. See 06.3.

## Steps

1. Open the calendar's **Notifications** settings.

   [SHOT 03.6-01]

2. Turn on the coach notification. Leave the member-facing reminders off here
   if you are handling them in a workflow, so you do not send twice.

3. Open **Automation** and find the `Appointment Reminders` workflow the
   snapshot installed.

   [SHOT 03.6-02]

4. Check the timings match the table above.

5. Read the message text and rewrite it in your own words. The default is fine
   and generic. Yours will be better.

6. Confirm the workflow checks for `do-not-contact` before each send. See
   06.4.

## Write the reminders properly

The 24 hour one, as an example.

Bad:

> `Reminder: You have an appointment tomorrow at 6:00 PM.`

Better:

> `Hi Sarah, you are booked in tomorrow at 6pm with Coach Mike. We are at 123
> Example Rd, park round the back. Just reply here if something has come up.`

Specific, human, and gives them an easy out. The easy out is what converts a
no-show into a reschedule.

## No-show handling

1. Somebody does not turn up.
2. Mark them as a no-show on the appointment, or let the appointment trigger
   do it automatically.

   [SHOT 03.6-03]

3. That applies `no-show-recovery`.
4. The follow-up agent picks it up and runs the short variant: three touches
   over five days, never mentioning that they did not show. See 09.5.

### Why the agent never mentions it

Because the reason is almost always ordinary. Work ran over, the kid got sick,
they got nervous. A message that says "we noticed you didn't come" makes
somebody who feels a bit guilty feel worse, and guilt does not get people back
through the door.

The recovery message assumes something came up and offers to rebook. That is
it.

## Marking shows and no-shows

Someone has to do it, and this is the weak link in most gyms.

Options, best first:

1. **A check-in integration** marks it automatically.
2. **The coach marks it** on the mobile app after the session. Two taps.
3. **You clear the list** each morning for yesterday.

Pick one and make it a habit. If nobody marks attendance, `no-show-recovery`
never fires and your reporting in module 11 is fiction.

## Test it

1. Book yourself an intro for two hours from now.
2. Confirm you get the confirmation text immediately.
3. Confirm the 2 hour reminder arrives.
4. Do not attend. Mark it no-show.
5. Confirm `no-show-recovery` gets applied and the recovery message arrives.

Run the whole chain. Testing one link tells you nothing about the chain.

## Checklist

- [ ] Confirmation sends immediately on booking
- [ ] 24 hour and 2 hour reminders configured, in a workflow, not duplicated
      in calendar notifications
- [ ] Reminders check `do-not-contact` first
- [ ] Reminder text rewritten in my own words with an easy out
- [ ] Coach notification on
- [ ] Somebody is responsible for marking shows and no-shows
- [ ] Tested the full chain including the no-show recovery

## When it goes wrong

**Members getting two reminders.** Both the calendar notification and the
workflow are on. Turn off the calendar one.

**No-show recovery never fires.** Nobody is marking no-shows. Go back to the
attendance question and pick an option.

**Reminders going out at the wrong time.** Time zone. See 01.1.

**A reminder went to someone who cancelled.** The workflow does not check
appointment status before sending. Tell us, that is a wiring fix.

## Shot list

| Shot | Screen | Capture | Highlight | Blur |
|------|--------|---------|-----------|------|
| 03.6-01 | Calendar notifications settings | The notification list | Coach notification on, member reminders off | Nothing |
| 03.6-02 | The Appointment Reminders workflow | The workflow canvas | The wait steps and their timings | Nothing |
| 03.6-03 | An appointment being marked no-show | The status selector | The no-show option | Member name |
| 03.6-04 | Phone, the reminder text as received | The message | The easy-out line | Number |

## Video script

**Hook.** Gyms lose more intros to no-shows than to people saying no. Four
messages fix most of it, and the fourth one is the one nobody sends.

**Beats.**
1. On screen: the four touch table.
2. On screen: rewrite the 24 hour reminder live. Read the bad one, then the
   good one. The easy-out line is the teaching point, dwell on it.
3. On screen: the reminder workflow, showing the `do-not-contact` check.
4. On screen: mark a no-show, cut to phone, recovery message arrives. Explain
   why it never mentions the no-show.
5. On screen: talk to camera. Who marks attendance. Make them decide before
   moving on.

**Go do.** Book yourself an intro two hours out and run the whole chain
including the no-show.

## Verify on screen

- Whether appointment status triggers exist for no-show and whether they can
  apply a tag directly.
- Whether the snapshot's Appointment Reminders workflow matches the timings
  in this lesson.
- Exact wording of the appointment status options.
