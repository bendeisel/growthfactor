# 03.3 Class and group calendars

**Module:** 03 Calendars
**Video:** ~6 min
**Needs first:** 03.1
**You finish with:** a class calendar for group intros, open mats and seminars

## Why this matters

Some gyms do not do one to one intros. They put a new person into a beginners
class on Tuesday at 6, with four other new people. That is cheaper on coach
time and it is often a better first experience, because nobody feels singled
out.

A class calendar handles that. Many people, one slot, up to a capacity.

## When to use class instead of round robin

| Use class when | Use round robin when |
|----------------|---------------------|
| Your intro is a group session | Your intro is one to one |
| You run a fixed beginners class | Intros happen whenever a coach is free |
| Open mats, seminars, belt tests, workshops | Personal training, assessments |

Plenty of gyms use both: round robin for adults who want a chat first, class
for kids trials where a group is less intimidating.

## Steps

1. Create a calendar, type **Class**.

   [SHOT 03.3-01]

2. Name it as a member would read it. `Beginners Class, Tuesday 6pm`.

3. **Capacity.** How many people can book one slot. Set it to what the mat
   genuinely holds for beginners, not the theoretical maximum. A beginners
   class with twelve strangers in it is worse than one with five.

   [SHOT 03.3-02]

4. **Recurring slots.** Set the specific days and times the class runs. This
   is different from round robin, where you set general availability. Here you
   are declaring "Tuesdays at 6pm" as an actual event.

5. **Assign the coach** who runs it.

6. Form fields: same as 03.2. Phone, `program_interest`,
   `participant_is_child`, `goal_stated`, and consent.

## Capacity, and what happens when it fills

When a class is full it stops appearing as available, and the appointment
agent will offer a different slot instead. That is correct behaviour.

What you should decide: do you want a waitlist? If your beginners class fills
regularly, that is a good problem and worth handling properly. Ask us to wire
a waitlist workflow, because it needs a tag and an automation rather than a
calendar setting.

## Kids classes

If you run kids trials as a group, this is the calendar type for it.

Two things to get right:

1. **Age bracket in the calendar name.** `Kids Trial, 7 to 9, Wednesday 5pm`.
   Parents book the wrong class constantly when the name does not say the age.
2. **Capacity lower than you think.** New kids need attention. Four is often
   better than eight.

## Open mats and seminars

The same calendar type works for anything with a fixed time and a headcount.

For one-off events with tickets and payment, look at module 12 and Events
instead. A class calendar is for the recurring stuff, Events is for the
seminar with a guest instructor and a ticket price.

## Test it

1. Book the class through the public link.
2. Book it again with different details. Confirm both bookings sit on the same
   slot.
3. Fill it to capacity and confirm the slot disappears from the booking page.
4. Cancel one and confirm the slot reappears.

Step 3 catches capacity misconfiguration, which is the main thing that goes
wrong here.

## Checklist

- [ ] Class calendar created for any group intro
- [ ] Capacity set to what actually works, not the maximum
- [ ] Recurring times match the real schedule
- [ ] Age bracket in the name for kids classes
- [ ] Same form fields as the intro calendar
- [ ] Tested to capacity and confirmed the slot closes

## When it goes wrong

**People book a class that is not running.** The recurring slots do not match
your real schedule, or a holiday was not blocked. See 03.4.

**Two people booked and only one shows on the calendar.** Check capacity is
above one. A class calendar with capacity 1 behaves like a personal calendar
and confuses everybody.

**The agent keeps offering a full class.** Refresh the calendar and confirm
capacity is enforced. If it persists, tell us, that is a wiring problem.

## Shot list

| Shot | Screen | Capture | Highlight | Blur |
|------|--------|---------|-----------|------|
| 03.3-01 | Create calendar, type Class selected | The type selector | Class | Nothing |
| 03.3-02 | Class calendar settings, capacity field | The capacity setting | The number field | Nothing |
| 03.3-03 | Member view, class booking page with spots remaining | The booking page | The remaining spots indicator | Nothing |
| 03.3-04 | The same page when full | The full state | The unavailable message | Nothing |

## Video script

**Hook.** If your intro is a group class rather than a one to one, round robin
is the wrong calendar and it will fight you.

**Beats.**
1. On screen: talk to camera. When class beats round robin. Thirty seconds.
2. On screen: build one. Capacity, recurring slots, coach.
3. On screen: talk to camera. Capacity honesty. A beginners class with twelve
   strangers is worse than one with five.
4. On screen: kids class naming. Show a badly named one and a well named one.
5. On screen: book to capacity, watch the slot close.

**Go do.** If you run group intros, build the class calendar now and book it
twice yourself.

## Verify on screen

- Whether the type is called Class, Group, or Class Booking in the current
  release.
- Whether capacity and recurring slot configuration sit on the same tab.
- Whether a waitlist option now exists natively, since the lesson says it
  does not.
