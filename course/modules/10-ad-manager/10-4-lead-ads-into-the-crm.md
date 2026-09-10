# 10.4 Lead ads straight into the CRM

**Module:** 10 Ad Manager
**Video:** ~7 min
**Needs first:** 10.3, 09.4
**You finish with:** a tested path from ad click to agent reply, timed

## Why this matters

This is the whole point of running ads inside your CRM.

Somebody taps your ad, fills the form, and thirty seconds later they get a
text offering them two times. They are still holding the phone.

The industry moves in hours. You are moving in seconds. That gap is the
entire advantage and it costs you nothing extra.

## The chain

```
  Meta lead form submitted
          |
   lands in HighLevel as a contact, seconds
          |
   New Lead Intake workflow: opportunity, source tag, value
          |
   Appointment agent fires on Form Submitted
          |
   Text out, under a minute
          |
   Two times offered, booked, confirmed
```

Any broken link and you are paying for leads that sit there. See 06.3.

[SHOT 10.4-01]

## Test it before you spend

**Do this before the campaign has spent real money.**

1. Put the campaign live with a small budget.
2. Find your own ad. Either wait for it in your feed, or use the ad preview
   with a shareable link on your own phone.
3. **Fill in your own lead form**, with your real number.
4. Start a timer.
5. Wait.

What should happen:

| Time | What |
|------|------|
| Seconds | Contact appears in HighLevel |
| Seconds | Opportunity in New Lead, tagged `source-ads` |
| Under a minute | Text arrives on your phone |
| The text | Uses your name, references what you selected, offers two times |

6. Reply and book. Confirm the confirmation arrives with the address and what
   to bring.

[SHOT 10.4-02]

## If the contact never arrives

In order:

1. **Lead form permission.** The most common cause by far. See 10.1.
2. Is the page connected to the right ad account?
3. Reconnect the integration. These connections expire silently.

Meta also has a lead testing tool that lets you push a test lead through
without spending. Use it if you have access.

## If the contact arrives but no text

1. Is the appointment agent published? See 09.11.
2. Does the agent's Form Submitted trigger include lead ad forms
   specifically? A Meta lead form is not always the same event as a web form,
   and this catches people out.
3. A2P approved? See 01.2.
4. Quiet hours holding it? Check the time you tested.

Number 2 is the one to check carefully. Test with a real lead ad rather than
assuming your web form test covers it.

## If the text arrives but is generic

The custom question is not mapping to `program_interest`. The agent has
nothing specific to reference. See 10.3.

## Speed is the product

Some honest framing for a gym owner.

A lead form lead is lower intent than somebody who searched for you. They
were scrolling, they saw an offer, they tapped. In ninety seconds they will
have forgotten.

Reply in an hour and most are gone. Reply in thirty seconds and you are
talking to somebody who still remembers tapping.

That is the only reason lead form ads work for gyms, and it is why 09.4
exists.

## Tracking the source

`source-ads` is applied by New Lead Intake. That tag is what lets module 11
tell you what your ads actually produced in revenue, not just leads.

Check it is landing. Without it, reporting cannot separate ad leads from walk
ins, and you cannot tell whether the ads are worth it.

[SHOT 10.4-03]

## Checklist

- [ ] Filled in my own lead form from a real ad
- [ ] Contact appeared within seconds
- [ ] `source-ads` tag applied
- [ ] Opportunity created in New Lead with a value
- [ ] Text arrived in under a minute
- [ ] Text referenced what I selected on the form
- [ ] Booked and got a full confirmation
- [ ] Only then increased the budget

## When it goes wrong

**Contacts arrive hours later in a batch.** The integration is polling rather
than receiving instantly. Reconnect, and tell us if it persists.

**Duplicate contacts from repeat submissions.** Duplicate handling in New Lead
Intake. See 06.3.

**Leads with fake phone numbers.** Some lead form volume is junk. Switch to
the higher intent form version. See 10.3.

## Shot list

| Shot | Screen | Capture | Highlight | Blur |
|------|--------|---------|-----------|------|
| 10.4-01 | Contact appearing in HighLevel with source-ads | The record | The tag and timestamp | Name, number |
| 10.4-02 | Phone, the ad, the form, and the text arriving | The sequence | The timestamps | Number |
| 10.4-03 | Contacts filtered by source-ads | The list | The count | Names |

## Video script

**Hook.** Tap the ad, fill the form, and thirty seconds later they get a text
offering two times. They are still holding the phone. Everybody else in your
town replies tomorrow.

**Beats.**
1. On screen: the chain diagram. Fast.
2. On screen: the real test. Fill in your own lead form on a phone, start a
   timer on camera, wait, show the text arriving with the elapsed time. Do
   not cut. The wait is the point and the payoff.
3. On screen: the contact record with `source-ads` and the opportunity.
4. On screen: the troubleshooting order. Lead form permission first, then
   whether the agent's trigger covers lead ad forms.
5. On screen: talk to camera. Speed is the product. Say the ninety seconds
   line.

**Go do.** Fill in your own lead form and time the reply. Do not raise your
budget until that text arrives in under a minute.

## Verify on screen

- Whether a Meta lead ad submission fires the same Form Submitted trigger as
  a web form, and whether lead ad forms must be selected explicitly.
- Whether lead delivery is instant or polled.
