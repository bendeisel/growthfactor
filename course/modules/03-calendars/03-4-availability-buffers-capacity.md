# 03.4 Availability, buffers and capacity

**Module:** 03 Calendars
**Video:** ~7 min
**Needs first:** 03.2
**You finish with:** availability that reflects reality, so the agent stops
offering slots nobody can actually take

## Why this matters

This is the lesson that decides whether your appointment agent works.

The agent offers two specific times. It gets those times from here. Set
availability wrong and one of three things happens:

1. **Too little availability.** The agent tells hot leads there is nothing
   free. You lose them.
2. **Too much availability.** People book at 2pm on a Tuesday when the gym is
   empty, and nobody is there to meet them.
3. **No buffers.** A coach finishes a class at 7 and has an intro at 7. They
   arrive sweaty and late, and the intro goes badly.

## The settings, and what each actually controls

[SHOT 03.4-01]

| Setting | What it does | Sensible for a gym |
|---------|-------------|-------------------|
| **Weekly availability** | The hours you accept bookings | Match staffed hours, not opening hours |
| **Slot duration** | Length of the appointment | 30 min |
| **Slot interval** | How often a slot starts | 30 min, matching duration |
| **Buffer before** | Gap before the appointment | 0 to 15 min |
| **Buffer after** | Gap after | 15 min. Non-negotiable if intros happen around classes |
| **Minimum notice** | How soon someone can book | 2 to 4 hours |
| **Date range** | How far ahead bookings open | 30 days |
| **Max per day** | Cap on bookings in a day | 4 to 6 intros |

## Availability should match staffed hours

Not opening hours. If you are a 24 hour gym, nobody is there at 3am to run an
intro, and an intro booked into an unstaffed hour is a wasted lead and a bad
first impression.

Set availability to the windows when a coach is genuinely free and present.

[SHOT 03.4-02]

## Minimum notice: the trade-off

This is a real trade-off and worth thinking about rather than defaulting.

- **Short notice, 1 to 2 hours.** Catches the person who is ready right now.
  Highest conversion. Risks a coach being ambushed.
- **Long notice, 24 hours.** Coaches can plan. Loses the hottest leads, who
  cool off overnight.

For most gyms, **2 to 4 hours** is right. It catches same-day intent and gives
the coach a heads up. If your coaches complain, the answer is usually the
notification setting in 03.2, not a longer notice period.

## Buffers, and the class problem

The specific gym failure: coach finishes teaching at 7:00, intro booked at
7:00. Buffer after on the class does not help, because the class is not on
this calendar.

Two fixes:

1. **Block the class times out of your intro availability.** If the 6pm class
   runs to 7, do not offer intro slots at 6, 6:30 or 7.
2. **Connect the coach's Google Calendar** so their real commitments block
   automatically. Best fix, do this one.

### Connecting a coach calendar

1. That coach logs in and connects their Google or Outlook calendar in their
   profile settings.
2. Set it to check for conflicts.
3. Their existing events now block intro slots automatically.

   [SHOT 03.4-03]

Worth pushing your coaches to do. It removes an entire category of problem.

## Blocking holidays and closures

1. Add date-specific overrides for closures: public holidays, the week you
   shut between Christmas and new year, seminar weekends.

   [SHOT 03.4-04]

2. Do this at the start of the year, in one sitting.

An intro booked on a day you are closed is a person who drives to a locked
door, and they will not book again.

## Max bookings per day

Cap it. Four to six intros a day is plenty, and it protects your coaches from
a week where an ad campaign works too well and they spend three days doing
nothing but intros.

## Test it

1. Open the booking page in a private window.
2. Look at the next seven days. Are the slots ones you would genuinely want
   somebody walking in for?
3. Try to book something an hour from now. Confirm minimum notice blocks it.
4. Try to book on a date you blocked. Confirm it is not offered.
5. Book two back to back and check the buffer is respected.

Step 2 is the real test. Look at it as an owner and ask whether you would want
a stranger arriving at each of those times.

## Checklist

- [ ] Availability matches staffed hours, not opening hours
- [ ] Class times blocked out of intro availability
- [ ] Coach calendars connected for conflict checking
- [ ] Buffer after set to at least 15 minutes
- [ ] Minimum notice 2 to 4 hours
- [ ] Holidays and closures blocked for the year
- [ ] Max per day capped
- [ ] Looked at the next seven days as a member would

## When it goes wrong

**"The agent says there is nothing available."** Open the public booking page.
If it is empty, the agent is telling the truth. Common causes: availability
set to hours nobody works, minimum notice too long, max per day already hit,
or every coach's connected calendar is full.

**People booking during classes.** Block the class times, and connect coach
calendars.

**A coach got double booked.** Their external calendar is not connected, or
conflict checking is off.

**Slots appear in the wrong time zone.** Business profile time zone. See 01.1.

## Shot list

| Shot | Screen | Capture | Highlight | Blur |
|------|--------|---------|-----------|------|
| 03.4-01 | Calendar availability tab | All the timing settings | Buffer after | Nothing |
| 03.4-02 | Weekly availability grid | The configured hours | A gap where a class runs | Nothing |
| 03.4-03 | Coach profile, connected calendar | The connection status | The conflict check toggle | Coach email |
| 03.4-04 | Date-specific overrides | The blocked dates | A blocked holiday | Nothing |
| 03.4-05 | Public booking page, next seven days | The available slots | Nothing | Nothing |

## Video script

**Hook.** Every time somebody tells me their booking agent is broken, I open
their public booking page and there is nothing on it. The agent was telling
the truth.

**Beats.**
1. On screen: the availability tab. Walk each setting with the gym-sensible
   value.
2. On screen: the weekly grid. Block out class times live, on camera. Say the
   sweaty coach story, it lands.
3. On screen: connecting a coach's Google Calendar. Push this hard, it is the
   best fix available.
4. On screen: holiday overrides. Do a year in one sitting.
5. On screen: the public booking page. Look at it as a member. Ask the
   question out loud: would I want a stranger walking in at each of these
   times?

**Go do.** Open your public booking page and look at the next seven days. Fix
anything you would not want to happen.

## Verify on screen

- Exact setting names for buffers and notice in the current release.
- Where external calendar connection lives now, user profile or calendar
  settings.
- Whether max bookings per day is per calendar or per team member.
