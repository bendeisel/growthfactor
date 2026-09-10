# 05.1 Connecting Stripe, and what works where

**Module:** 05 Payments
**Video:** ~6 min
**Needs first:** 01.1
**You finish with:** a connected payment provider and a clear idea of what it
can and cannot do

## Why this matters

Everything in this module needs a payment provider connected. Nothing works
before this.

More importantly: not every payment feature works with every provider, and
finding that out after you have built your checkout is annoying. Five minutes
of understanding first.

## Which provider

**Stripe** is the default answer for a US gym. It covers the widest set of
features: order forms, invoices, subscriptions, payment links, text2pay,
documents with a payment step, and Tap to Pay.

Other providers exist and work for some surfaces. Square in particular
supports Tap to Pay on iPhone and is worth considering if your gym already
runs Square at the counter for retail.

The rule: check what works where before you commit, because provider coverage
by product area is not uniform and it changes.

[SHOT 05.1-01]

## Steps

1. Open **Payments > Integrations**.

   [SHOT 05.1-02]

2. Choose Stripe and click connect.

3. You are sent to Stripe. Log in, or create an account.

4. If creating one, you will need: your EIN, business details, and a bank
   account. Same legal name as 01.1, because mismatches cause verification
   delays here too.

5. Authorise the connection and come back.

6. Confirm it shows as connected, and confirm whether it is in **live** or
   **test** mode.

   [SHOT 05.1-03]

## Test mode, and using it properly

Test mode lets you run the whole flow with fake cards and no real money.

Use it for everything in 05.2 and 05.3 while you build. Stripe's test card is
`4242 4242 4242 4242` with any future expiry and any CVC.

Then switch to live and **run one real transaction of one dollar to
yourself**, and refund it. Test mode confirms the flow. Only a live
transaction confirms the money actually arrives in your bank.

## What lives where

Worth knowing so you go to the right place later.

| Thing | Where |
|-------|-------|
| Products and prices | Payments > Products |
| One off payment links | Payments > Payment Links |
| Invoices and estimates | Payments > Invoices |
| Subscriptions | Payments > Subscriptions |
| Transactions and refunds | Payments > Transactions |
| Provider connection | Payments > Integrations |
| POS and Tap to Pay | The mobile app |

## Fees

Stripe takes its cut. Standard card processing, roughly 2.9% plus 30 cents in
the US, and that is Stripe's fee, not ours and not HighLevel's.

For a gym running $20,000 a month in memberships, that is around $600. Worth
knowing so it does not surprise you, and worth remembering when somebody
offers to save you 0.3%, because switching processors is a genuine
disruption and 0.3% of $20,000 is $60.

## Checklist

- [ ] Provider connected
- [ ] I know whether I am in test or live mode
- [ ] Business details on Stripe match my EIN letter
- [ ] Bank account added and verified
- [ ] Ran one real dollar transaction and refunded it

## When it goes wrong

**Connection drops.** Usually a Stripe-side verification issue. Log in to
Stripe directly and look for outstanding requirements.

**Payments succeed but do not appear in HighLevel.** Check you connected the
same Stripe account you are testing against, and that you are not mixing test
and live.

**Money not arriving.** Stripe payouts are on a schedule, often two days.
Check your payout schedule in Stripe before assuming anything is broken.

## Shot list

| Shot | Screen | Capture | Highlight | Blur |
|------|--------|---------|-----------|------|
| 05.1-01 | Provider support by product area, docs page | The coverage table | The Stripe column | Nothing |
| 05.1-02 | Payments > Integrations | The provider list | Stripe connect button | Nothing |
| 05.1-03 | Connected state, test/live indicator | The status | The mode indicator | Account details |
| 05.1-04 | Stripe dashboard, payout schedule | The schedule | The payout timing | Balances |

## Video script

**Hook.** Nothing in this module works until this is connected, and one
setting on this screen decides whether the money you take is real.

**Beats.**
1. On screen: talk to camera. Stripe as the default for a US gym, thirty
   seconds.
2. On screen: Integrations, connect flow. Steady.
3. On screen: the test and live toggle. Explain the test card, then say the
   thing about running one real dollar.
4. On screen: the fee reality. Quick, honest, then move on.

**Go do.** Connect Stripe, then run one real dollar transaction to yourself
and refund it.

## Verify on screen

- Current provider list and which support which product areas.
- Exact nav path for Integrations.
- Whether test mode is per provider or account wide.
