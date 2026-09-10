# 03.2 The intro calendar

**Module:** 03 Calendars
**Video:** ~9 min
**Needs first:** 03.1
**You finish with:** the calendar your appointment agent books into, configured
properly

## Why this matters

This calendar is where your money comes from. Every lead the agents work ends
up here or nowhere.

It is also the most common source of "the AI is broken" complaints, and it
almost never is. The agent said there was nothing available because the
calendar said there was nothing available.

## Steps

1. **Calendars > Calendar Settings**, then create a calendar, or open the
   `Free Intro Session` calendar the snapshot installed.

   [SHOT 03.2-01]

2. **Name.** What a member should read. `Free Intro Session`.

3. **Description.** One or two sentences that appear on the booking page. Say
   what actually happens, since this reduces no-shows.

   > `A 30 minute session with one of our coaches. We will talk about what you
   > want to get out of training, show you around, and get you on the mat.
   > Wear something you can move in.`

4. **Type:** Round Robin.

5. **Team members.** Add every coach who can take an intro. Set distribution
   to optimise for availability rather than equal distribution, so the agent
   always has slots to offer.

   [SHOT 03.2-02]

6. **Duration.** 30 minutes suits most gyms. Long enough to matter, short
   enough that a coach will actually do it between classes.

7. **Slot interval.** Match it to the duration, or use 30 minutes. Do not set
   a 15 minute interval on a 30 minute session unless you want overlapping
   awkwardness.

8. Save, then continue to availability in 03.4.

## The fields on the booking form

This is the part people rush and then regret, because these fields are what
the agents read.

1. Open the calendar's form or booking widget settings.

   [SHOT 03.2-03]

2. Required: **first name, last name, phone, email**. All four. Phone matters
   most, everything downstream is SMS.

3. Add a field mapped to `program_interest`. A dropdown, not free text, so it
   can be filtered and so the agent gets a clean value.

4. Add a field mapped to `participant_is_child`. Checkbox: "This is for my
   child".

5. Add one open question mapped to `goal_stated`: **"What made you look into
   training right now?"**

   That question is the highest value field on the form. Do not cut it to
   shorten the form. Its answer feeds every follow-up message the member ever
   gets, and it is the difference between a nudge that lands and one that
   reads like spam. See 02.1.

6. **Consent.** A checkbox next to the phone field, with wording that says
   they agree to be contacted by text, that message rates apply, and that they
   can reply STOP. This is what your A2P reviewer looks for. See 01.2.

   [SHOT 03.2-04]

## Confirmation page and what happens next

1. Set the confirmation to show what happens next, not just "thanks".
2. Include the address, what to bring, and how long it takes.

The confirmation page matters less than the confirmation text, which the
appointment agent sends. See 09.4. But get both right.

## Notifications

1. Turn on the notification to the assigned coach when a booking comes in.
2. Turn on the notification to you, at least while you are learning what the
   agents do. Turn yours off later when you trust it.

## Test it

Do all four. This is a calendar that will handle your actual leads.

1. Open the booking link in a private window, as a member would.
2. Book a slot with your own details.
3. Confirm the contact was created with `program_interest` and `goal_stated`
   populated.
4. Confirm you got the coach notification.
5. Confirm the appointment appears on the coach's calendar.
6. Cancel it and confirm the slot frees up.

[SHOT 03.2-05]

## Checklist

- [ ] Round robin, with every intro-capable coach on it
- [ ] Duration and interval sensible
- [ ] Description says what actually happens
- [ ] Form captures phone, `program_interest`, `participant_is_child`, `goal_stated`
- [ ] Consent checkbox present with STOP wording
- [ ] Coach notification on
- [ ] Booked a real test through the public link and checked the contact record

## When it goes wrong

**The agent says nothing is available.** It is availability, not the agent.
Go to 03.4.

**Bookings come in with no program interest.** The form field is not mapped to
the custom field. Check the mapping, not the field.

**The contact is created but the agent does nothing.** The appointment agent
fires on Form Submitted. A calendar booking is not always the same event as a
form submission. Check 06.3 for how the booking is wired to the agent, and
test end to end rather than assuming.

## Shot list

| Shot | Screen | Capture | Highlight | Blur |
|------|--------|---------|-----------|------|
| 03.2-01 | Calendar settings, general tab | Name, description, type | Type set to Round Robin | Nothing |
| 03.2-02 | Team members tab | The coach list and distribution | Distribution setting | Coach names |
| 03.2-03 | Form fields configuration | The field list | The custom field mappings | Nothing |
| 03.2-04 | Consent checkbox on the booking form, member view | The phone field and checkbox | The consent wording | Nothing |
| 03.2-05 | Contact record after a test booking | Custom fields populated | `goal_stated` with a real answer | Name, number |

## Video script

**Hook.** Nine out of ten times somebody tells me their AI booking agent is
broken, the agent is fine. The calendar had no availability. Here is how to
build the calendar so that never happens.

**Beats.**
1. On screen: create the calendar. Name, description, round robin, coaches.
   Steady pace.
2. On screen: the description field. Write a real one on camera. Say it
   reduces no-shows.
3. On screen: form fields. Slow right down. Add the `goal_stated` question and
   explain what it does downstream. Reference the follow-up example from 02.1.
4. On screen: consent checkbox. Tie it back to A2P.
5. On screen: private window, book a real slot, then cut to the contact record
   showing the fields populated. End to end, on camera.

**Go do.** Book your own intro through the public link and check the contact
record. If `goal_stated` is empty, fix the form before you do anything else.

## Verify on screen

- Exact tab names in calendar settings in the current release.
- Whether custom field mapping happens on the calendar form or in a separate
  form builder.
- Whether a calendar booking fires the Form Submitted trigger, which the
  appointment agent depends on. **This is the single most important thing to
  confirm in this module.**
