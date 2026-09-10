# 05.2 Products and recurring prices

**Module:** 05 Payments
**Video:** ~8 min
**Needs first:** 05.1
**You finish with:** every membership and offer set up as a product, ready to
sell anywhere

## Why this matters

A product is defined once and then used everywhere: on an order form, in an
invoice, in a payment link, at the POS. Change the price once and it changes
in every place.

Get this structure right and selling becomes easy. Get it wrong and you end up
with fourteen slightly different versions of the same membership and no idea
which one people are actually on.

## The rule that makes it a subscription

**Attach a recurring price to a product, and anything selling that product
becomes a subscription.** Order form, invoice, payment link, all of it.

That is the whole mechanism. There is no separate subscription builder.

## What a gym needs

Keep this short. Five to eight products, not thirty.

| Product | Price type | Notes |
|---------|-----------|-------|
| Adult Membership | Recurring monthly | Your main one |
| Kids Membership | Recurring monthly | |
| Family Membership | Recurring monthly | |
| Paid Trial or Challenge | One off | The six week challenge, the paid intro |
| Personal Training, 10 pack | One off | |
| Drop In | One off | For the POS |
| Joining Fee | One off | If you charge one |
| Merch | One off | Optional, only if you sell at the desk |

## Steps

1. Open **Payments > Products** and click to add a product.

   [SHOT 05.2-01]

2. **Name.** What appears on the member's card statement and receipt. Use your
   gym name plus the plan: `Nashville MMA, Adult Membership`. A statement line
   that says only `Adult Membership` generates chargebacks from people who do
   not recognise it.

3. **Description.** What is included. Members read this at checkout.

4. **Image.** Optional, but it lifts conversion on an order form.

5. **Add a price.**

   [SHOT 05.2-02]

   | Field | For a monthly membership |
   |-------|-------------------------|
   | Type | Recurring |
   | Amount | Your monthly price |
   | Interval | Monthly |
   | Trial period | Only if you genuinely give free days before billing |
   | Setup fee | Your joining fee, if you want it collected with the first payment |

6. Save.

7. Repeat for each product.

## Multiple prices on one product

You can attach several prices to one product. Useful for:

- Monthly versus annual on the same membership
- A discounted rate for a 12 month commitment
- Founding member pricing

Do this rather than creating separate products, so your reporting groups them
together as one membership with several price points.

[SHOT 05.2-03]

## Contract length, and being honest about what this does

HighLevel bills the subscription. It does not enforce a contract.

If you sell a 12 month agreement, the subscription will keep charging monthly
and the member can cancel it in the same way as a month to month. The
commitment is legal, in your signed agreement, not technical.

So: keep the paperwork. If contracts matter to your business, use the
documents and signature flow, and treat the subscription as the billing
mechanism rather than the enforcement mechanism.

## Naming for your own sanity

You will look at a transaction list in eight months and need to know what
somebody bought. Names like `Plan A` and `New Offer` will not help.

Include the year in anything promotional: `Six Week Challenge, Spring 2026`.
When you run it again next year, you make a new product and your reporting
can compare the two.

## Test it

1. Create your adult membership product in test mode.
2. Build a quick payment link for it. See 05.3.
3. Pay with the Stripe test card.
4. Confirm a subscription is created, not a one off charge.
5. Confirm the contact record shows the subscription.
6. Cancel the test subscription.

Step 4 is the one that catches the common mistake, which is setting a one off
price by accident.

## Checklist

- [ ] Every membership exists as a product
- [ ] Recurring prices are recurring, confirmed by a test purchase
- [ ] Product names include the gym name for card statements
- [ ] Promotional products include the year
- [ ] I understand HighLevel bills the subscription and does not enforce a contract
- [ ] Fewer than ten products

## When it goes wrong

**A member was charged once instead of monthly.** The price was one off. Fix
the price, and you will need to move existing members onto the correct one.

**Chargebacks from people who say they do not recognise the charge.** The
statement descriptor. Fix the product name and check the descriptor in Stripe
too.

**Two products for the same thing.** Merge them by moving people onto one, and
archive the other rather than deleting, so historic reporting stays intact.

## Shot list

| Shot | Screen | Capture | Highlight | Blur |
|------|--------|---------|-----------|------|
| 05.2-01 | Payments > Products, add product | The product form | Name field | Nothing |
| 05.2-02 | Price configuration | Recurring settings | The Recurring type selector | Nothing |
| 05.2-03 | A product with several prices | The price list | The two price rows | Nothing |
| 05.2-04 | A contact record showing an active subscription | The subscription panel | The renewal date | Name, amount |

## Video script

**Hook.** One setting on this screen decides whether your member pays you once
or every month. People get it wrong and find out in thirty days.

**Beats.**
1. On screen: Products. Build the adult membership from scratch, on camera.
2. On screen: the price step. Slow down on Recurring versus One Time. This is
   the lesson.
3. On screen: naming. Show a bad statement descriptor and explain the
   chargeback.
4. On screen: talk to camera. The contract honesty point. Subscription is
   billing, your agreement is enforcement.
5. On screen: test purchase with the Stripe test card, then show the
   subscription on the contact.

**Go do.** Build your main membership as a product and buy it yourself in test
mode. Confirm it created a subscription.

## Verify on screen

- Exact price type labels: Recurring, Subscription, One Time.
- Whether setup fee and trial period are available on all providers.
- Where the statement descriptor is set, HighLevel or Stripe.
