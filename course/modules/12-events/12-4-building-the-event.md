# 12.4 Building the event

**Module:** 12 Events (Labs beta)
**Video:** ~10 min
**Needs first:** 12.3
**You finish with:** a live event page selling tickets

## Why this matters

The doing lesson. Follow it with your account open and a real event in mind.

Events is in Labs, so exact field names may move.

## Steps

1. Open **Events** and create a new event.

   [SHOT 12.4-01]

2. **Name.** Say what it is and who it is for. `Kids BJJ Camp, ages 7 to 12,
   half term` beats `Summer Camp 2026`.

3. **Type.** Ticketed or RSVP, from 12.2. In person, online or hybrid.

4. **Date, time, and duration.** Include arrival time if it differs from the
   start.

5. **Location.** Your address. If it is somewhere else, be explicit, because
   people assume the gym.

6. **Description.** See below.

7. **Schedule and speakers**, if it is a multi-part event. A seminar with two
   sessions and a break should show that.

   [SHOT 12.4-02]

8. **Tickets.** Price, capacity, and separate member and non-member types if
   you are doing that.

9. **Registration fields.** See below.

10. **Publish.**

## Writing the description

Four things, in this order. Most event descriptions do one of them.

**1. Who it is for, and who it is not.**

> `For anyone training BJJ six months or more. If you are brand new, come to
> the fundamentals class instead, this one moves fast.`

**2. What actually happens.**

> `Two hours. Ninety minutes of guard passing, thirty minutes of rounds. Break
> in the middle.`

**3. What to bring.**

> `Gi, mouthguard, water. No gi needed for the last thirty minutes if you
> prefer.`

**4. The practical detail.**

> `Doors at 9:30, starts at 10. Park round the back. Kids welcome to watch
> from the seating area.`

That fourth block is what reduces day-of confusion, and it is the one always
left out.

## Registration fields

Same discipline as everywhere else. Ask for the minimum.

| Field | Always |
|-------|--------|
| First name | Yes |
| Last name | Yes |
| Email | Yes |
| Phone | Yes. This is how you follow up |

Then, per event type:

| Event | Extra field |
|-------|------------|
| Any | `Are you currently training with us?` Maps to identifying non-members |
| Kids | Child's name and age |
| Seminar | Experience level or rank |
| Comp | Weight and division |

**"Are you currently training with us?" is the important one** for any event
you hope acquires members. It tells the follow-up automation in 12.6 which
attendees are prospects rather than existing members.

[SHOT 12.4-03]

## The event page

The public page carries your branding rather than a marketplace's. Check it
on a phone before you promote it, because most people will open it on a
phone from a text you sent.

Check:

- Does it read well at phone width
- Is the price obvious
- Is the date and time obvious
- Does the register button work

[SHOT 12.4-04]

## Test it before promoting

1. Open the public page on your phone.
2. Register yourself, paying if it is a paid event, or in test mode.
3. Confirm the contact is created or updated in your CRM.
4. Confirm the payment landed.
5. Confirm you appear on the attendee list.
6. Confirm the confirmation email or text arrived.
7. Refund yourself.

Do all seven. Discovering on the morning of the event that confirmations never
sent is a bad morning.

## Checklist

- [ ] Name says what it is and who for
- [ ] Type and capacity correct
- [ ] Description covers who it is for, what happens, what to bring, practical
      detail
- [ ] Registration asks the minimum, plus "are you training with us"
- [ ] Page checked on a phone
- [ ] Registered myself end to end and refunded
- [ ] Confirmation received

## When it goes wrong

**Registrations not creating contacts.** Stop promoting and tell us. This is
the whole reason to use Events rather than Eventbrite.

**Payment fails on the page.** Check Stripe from 05.1, and check you are not
in test mode.

**Page looks wrong on mobile.** Screenshot it and send it to us. Beta.

## Shot list

| Shot | Screen | Capture | Highlight | Blur |
|------|--------|---------|-----------|------|
| 12.4-01 | Create event screen | The form | Type selector | Nothing |
| 12.4-02 | Schedule and speakers config | The schedule builder | A two part session | Nothing |
| 12.4-03 | Registration fields | The field list | The are-you-training question | Nothing |
| 12.4-04 | The public event page on a phone | The mobile page | The register button | Nothing |
| 12.4-05 | Attendee list after a test registration | The list | The test row | Names |

## Video script

**Hook.** Ten minutes and you will have an event page selling tickets, with
your branding, and every attendee landing in your CRM.

**Beats.**
1. On screen: create the event. Name, type, date, location. Steady.
2. On screen: write the description live. Four blocks, out loud. Emphasise the
   practical detail block, the one everybody forgets.
3. On screen: registration fields. Add the are-you-training question and
   explain what 12.6 does with it.
4. On screen: the public page, on an actual phone, held up.
5. On screen: register yourself, pay, and show the contact appearing in the
   CRM. That moment is the whole argument for using Events.

**Go do.** Build your next real event, then register yourself on your phone
and check the contact appeared.

## Verify on screen

- Exact field names and whether schedule and speakers exist in the beta.
- Whether registration fields map to CRM custom fields.
- Whether the event page is customisable beyond branding.
