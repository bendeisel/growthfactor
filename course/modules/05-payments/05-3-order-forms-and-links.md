# 05.3 Order forms and payment links

**Module:** 05 Payments
**Video:** ~7 min
**Needs first:** 05.2
**You finish with:** a checkout you can send to anyone, and a challenge offer
that sells itself

## Why this matters

Your agents get people interested. At some point somebody has to pay, and the
gap between "yes I want to join" and money leaving their account is where
gyms lose people.

Two tools close that gap:

- **Payment link.** A URL. Send it in a text, done in thirty seconds.
- **Order form.** A proper checkout page inside a funnel, for offers you
  actively market.

## Payment links, for speed

Use these constantly. They are the answer to "can you send me something to
sign up".

1. **Payments > Payment Links**, create new.

   [SHOT 05.3-01]

2. Pick the product and price.

3. Name it for yourself, not the member.

4. Copy the URL.

5. Text it.

That is it. Make one for each of your main memberships and keep them
somewhere you can grab them fast. Put them in custom values if you send them
often, so agents can use them too.

### The one your agents should have

Create a payment link for your most common membership and store it as a custom
value: `membership_link`. Then the front desk agent can send it when somebody
says they are ready to join, without you being involved.

Be deliberate about whether you want that. Some gyms want every join to go
through a human conversation. Both are valid, but decide rather than drift.

## Order forms, for offers you market

An order form lives in a funnel. Use it when you are running a specific offer
with ads behind it: the six week challenge, the new year intake, the summer
kids camp.

1. Open **Sites > Funnels** and create or open a funnel.

2. Add a step and choose the order form element.

   [SHOT 05.3-02]

3. Select your product and price.

4. Build the page around it. What they get, what it costs, what happens next.

5. **Add an order bump** if you have something sensible: gloves and wraps with
   a boxing challenge, a gi with a BJJ intake. An order bump on the right
   offer adds real revenue for no extra traffic.

   [SHOT 05.3-03]

6. Configure what happens after payment: a thank you page, and a workflow that
   tags them and starts onboarding.

## What must happen after payment

This is the part people forget, and it is the difference between a sale and a
member.

Wire a workflow to fire on successful payment that:

1. Applies the `member` tag
2. Removes `lead`
3. Sets `membership_type` and `membership_start`
4. Moves the opportunity to **Joined**
5. Sends a welcome message with what to do next
6. Books or prompts their first session

See 06.3. Without this, somebody pays and then hears nothing, which is the
worst possible first experience of your gym.

[SHOT 05.3-04]

## Keep the checkout short

Every field you add costs you conversions.

For a membership: name, email, phone, card. That is enough. Emergency contact,
medical history, waiver, all of that can happen at the gym on their first
visit or in a follow-up form. Do not put your waiver in the checkout.

## Test it

1. In test mode, buy your own membership through the payment link.
2. Confirm the subscription was created.
3. Confirm the post-payment workflow ran: tag applied, card moved, welcome
   message sent.
4. Repeat through the order form.
5. Switch to live, buy something for a dollar, refund it.

## Checklist

- [ ] Payment links created for main memberships
- [ ] Membership link stored as a custom value, if agents should send it
- [ ] Order form built for any actively marketed offer
- [ ] Post-payment workflow tested end to end
- [ ] Checkout has four fields, not twelve
- [ ] Tested in test mode and once live

## When it goes wrong

**Payment goes through but nothing happens.** The post-payment workflow is not
published, or it is listening for the wrong trigger. Check published first.

**People abandon the checkout.** Too many fields, or the price is a surprise
because the page above it was vague.

**The link stops working.** Product or price was archived. Links reference the
price, so archiving a price breaks every link using it.

## Shot list

| Shot | Screen | Capture | Highlight | Blur |
|------|--------|---------|-----------|------|
| 05.3-01 | Payment Links, create | The form | Product selector | Nothing |
| 05.3-02 | Funnel builder, order form element | The element on the page | The product selection | Nothing |
| 05.3-03 | Order bump configuration | The bump settings | The bump product | Nothing |
| 05.3-04 | Post-payment workflow | The workflow canvas | The tag and stage actions | Nothing |
| 05.3-05 | Checkout as a member sees it, mobile | The mobile checkout | The four fields | Nothing |

## Video script

**Hook.** Somebody says yes. What happens in the next sixty seconds decides
whether they are a member or a maybe.

**Beats.**
1. On screen: create a payment link. Thirty seconds, start to finish. Then
   text it to a phone and show it arriving.
2. On screen: talk to camera. The custom value question. Should your agent be
   able to close? Make them decide.
3. On screen: order form in a funnel, with an order bump.
4. On screen: the post-payment workflow. Emphasise this is what turns a
   payment into a member.
5. On screen: buy it in test mode, then show the tag, the card move and the
   welcome text.

**Go do.** Create a payment link for your main membership and text it to
yourself. Buy it in test mode and confirm the welcome message arrives.

## Verify on screen

- Whether payment links are their own menu item in the current release.
- Order bump availability by provider.
- Which trigger fires on successful payment, since the whole post-payment
  workflow depends on naming it correctly.
