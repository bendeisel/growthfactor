# 05.6 Failed payment recovery

**Module:** 05 Payments
**Video:** ~7 min
**Needs first:** 05.2
**You finish with:** automatic recovery of failed cards, without losing the
member in the process

## Why this matters

This lesson has the fastest payback in the whole course.

Most gyms lose more revenue to failed cards than to members who actively
quit. A card expires, the payment fails, nobody notices for six weeks, and by
then the member has stopped coming anyway because they feel awkward about it.

A card failing is not a member leaving. It is a card failing. Treat it that
way and most of them fix it within a day.

## The numbers

For a gym with 200 members at $149:

- Card failure rates typically run 5 to 8% a month
- That is 10 to 16 failed payments, worth $1,500 to $2,400
- Recover 70% of them and you keep around $1,400 a month
- Do nothing, and a meaningful share of those members quietly churn

That is more than most gyms make from a whole ad campaign.

## The recovery sequence

Four touches over ten days. Friendly, then clear, never threatening.

| When | Channel | Tone |
|------|---------|------|
| Immediately | SMS | Casual. "Card bounced, probably expired" |
| Day 3 | SMS | Direct. Here is the link again |
| Day 6 | Email + SMS | Clear. What happens if it stays unpaid |
| Day 10 | Call task for a human | A person, not an agent |

**Day 10 is a human, deliberately.** By that point either something is wrong
with their card or something is wrong with their relationship to your gym.
Either way, a person needs to find out which.

## Steps

1. Open **Automation** and find the `Failed Payment Recovery` workflow the
   snapshot installed.

   [SHOT 05.6-01]

2. Confirm the trigger is **Payment Failed**.

   [SHOT 05.6-02]

3. Check the first action applies the `billing-hold` tag. That tag stops the
   review agent asking somebody for a five star review while their payment is
   bouncing, which is exactly as bad as it sounds. See 02.3.

4. Check the timings match the table.

5. Rewrite the messages in your own words. Read the tone guidance below first.

6. Confirm the last step creates a task for a human, not another message.

7. Confirm a successful payment removes `billing-hold` and exits the workflow.

   [SHOT 05.6-03]

## Getting the tone right

This is the whole lesson. A payment chase written badly loses the member you
were trying to keep.

**Message 1, immediately:**

> `Hey Sarah, your payment did not go through this morning, usually just an
> expired card. You can update it here: [link]. No rush, nothing changes
> today.`

Casual. Assumes it is a mistake, because it usually is. "Nothing changes
today" removes the panic.

**Message 3, day 6:**

> `Hi Sarah, we still have not been able to take this month's payment. If it
> is easier to sort it in person, just grab me at the gym. Otherwise here is
> the link: [link]`

Clear, still warm, and it gives them a non-digital option, which matters for
the people who are embarrassed.

**What never to send:**

- Anything that reads as a legal threat
- Anything with an amount in all caps
- Anything that implies they are being dishonest
- A message that goes out on the same day their card failed and a reminder for
  class, because the mixed signals feel careless

## The link

Send them somewhere they can update the card themselves. A payment link
against the same product works, or a customer portal link if your setup has
one. Whatever it is, test it on your own phone.

Do not ask somebody to call the gym to read out a card number. It is slow, it
is awkward, and it is bad practice.

## Access, and what happens if they do not pay

Decide this in advance and write it into your knowledge base, so the agents
answer consistently.

Common gym policy: access continues for 14 days after a failed payment, then
pauses until it is resolved. Whatever you choose, say it plainly in message 3
and hold to it.

## Test it

Stripe's test cards include one that fails. Use it.

1. In test mode, set up a subscription with a card that will decline.
2. Confirm the workflow fires.
3. Confirm `billing-hold` is applied.
4. Read all four messages as they arrive.
5. Pay successfully and confirm `billing-hold` is removed and the sequence
   stops.
6. Confirm the review agent will not fire while `billing-hold` is on.

## Checklist

- [ ] Failed Payment Recovery workflow published
- [ ] Trigger is Payment Failed
- [ ] `billing-hold` applied on failure and removed on success
- [ ] Four touches, last one a human task
- [ ] Messages rewritten in my tone
- [ ] Update-card link tested on a phone
- [ ] Access policy decided and written into the knowledge base
- [ ] Tested with a declining card

## When it goes wrong

**Members complain about the tone.** Read your own messages out loud. If you
would not say it to their face at the desk, rewrite it.

**Sequence keeps running after they paid.** The success path is not removing
them. Check the workflow exit condition.

**Review requests going to people with failed payments.** `billing-hold` is
not being applied, or the review agent is not checking for it.

**Recovery rate is low.** Usually the link. Test it on a phone, on mobile
data, logged out.

## Shot list

| Shot | Screen | Capture | Highlight | Blur |
|------|--------|---------|-----------|------|
| 05.6-01 | Failed Payment Recovery workflow | The full canvas | The four touches | Nothing |
| 05.6-02 | The Payment Failed trigger config | The trigger | The trigger type | Nothing |
| 05.6-03 | The exit condition on success | The branch | The billing-hold removal | Nothing |
| 05.6-04 | Phone, message 1 as received | The text | The casual tone | Number |

## Video script

**Hook.** Most gyms lose more money to cards that quietly failed than to
members who actually quit. This is the highest paying twenty minutes in this
entire course.

**Beats.**
1. On screen: the maths. 200 members, 6% failure, what that is worth annually.
   Let the number sit.
2. On screen: the workflow. Walk the four touches.
3. On screen: talk to camera, read message 1 out loud, then read a bad version
   out loud. The contrast is the teaching.
4. On screen: the `billing-hold` tag and why the review agent must respect it.
   The "five star review while your card is bouncing" line lands well.
5. On screen: test with a declining card, watch it fire.

**Go do.** Read the four messages in your workflow out loud. Rewrite any you
would not say to a member's face.

## Verify on screen

- Exact trigger name for a failed payment.
- Whether a customer-facing card update portal exists, and its link format.
- Confirm the snapshot ships this workflow with the `billing-hold` logic.
