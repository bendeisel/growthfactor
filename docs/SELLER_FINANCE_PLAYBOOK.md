# Seller finance playbook

How the scoring works, and how to work the lists it produces.

## Who actually carries paper

A seller carries a note when they want the income or the tax treatment more than
they want a lump sum, and when there is no loan payoff forcing a cash sale. In
practice that means:

**Free and clear, or close to it.** This is the single biggest factor. A seller with
a mortgage has to pay it off at closing, so there is nothing left to carry. A seller
who owns outright can carry the whole thing. Worth up to 43 points.

**Long tenure.** Someone who bought in 1987 has no payment, a low basis, and often
an appetite for spreading the capital gain over years instead of taking it in one
tax year. Worth up to 15 points.

**Absentee, especially out of state.** A landlord two states away with a tenant
problem and a management company taking a cut is a tired landlord. They want the
income without the asset. That is exactly what a note is. Worth up to 16 points.

**No deadline.** Terms take time to negotiate. An auction in three weeks removes
that time. The absence of a cash forcing event is worth 8 points, and its presence
is called out in the reasons.

**Held in trust.** Trusts are often already structured for passive income and the
trustee is frequently open to a payment stream. Worth 8 points, slightly more than
an individual owner.

Soft distress helps and hard distress hurts. A code violation or a tax bill creates
a reason to talk this month. A foreclosure sale date creates a reason to need cash.

## Reading the output

```bash
npm run gf -- show <lead-id>
```

The `why this scored` block is the whole argument for the lead, in plain language.
Read it before you call. It is also carried into the CSV as `lead_reasons`, so it
lands in GHL with the contact.

Check `equity_basis` before you trust an equity number:

- `measured` a real loan balance was published. Trust it.
- `estimated_from_tenure` modelled from the purchase loan and elapsed time. Good
  enough to sort a list. Verify before you quote.
- `unknown` no sale history or no value. The lead may still be fine, you just do not
  know the equity yet.

## The four lists worth working

### 1. Free and clear absentee owners with a fresh soft signal

The core seller finance list, and the least competed, because a subscription will
not assemble it for you.

```bash
npm run gf -- leads --strategy seller_finance --min-score 55 --sort overall
```

Angle: you are not a distressed buyer knocking on a distressed door. You are an
investor offering to take a management headache off their hands and pay them monthly
for it. Lead with the note, not with a lowball.

### 2. Estates and heirs

```bash
npm run gf -- leads --json | grep -i '"ownerType": "estate"'
npm run gf -- leads --event probate
```

These come free from the owner name on the assessor roll. Heirs frequently want
speed and simplicity over price, and they are often several people who need to
agree. Terms can beat cash here, because a note splits cleanly among heirs.

Move carefully and be a human being. Someone died.

### 3. Pre foreclosure with real equity

```bash
npm run gf -- leads --event pre_foreclosure --sort equity
```

Equity above roughly 40 percent with a filing on the docket is the classic save,
where there is room to pay off or short the loan and still have a deal.

Below that the strategy flips to `subject_to`, and that is not a consolation prize.
Curing the arrears on a loan that already exists costs a fraction of buying the
house, so a leveraged seller facing a sale date is frequently the cheapest deal
available. What kills these is the calendar, not the structure: inside about two
weeks there is no time to reach the owner, get written authorization, obtain a
reinstatement figure from the servicer and record anything, and the strategy flips
again to `cash_wholesale`.

On the due on sale objection: it is a right the lender holds, not an event. Servicers
rarely exercise it while the payments keep arriving. If the risk still bothers you,
the workaround is structural rather than legal, and it is the next list.

### 4. Lake places held a long time

```bash
npm run gf -- leads --market old-hickory-waterfront --sort water
npm run gf -- leads --market old-hickory-waterfront --min-score 55
```

Old Hickory Lake waterfront held for thirty years by an out of state owner is close
to the ideal terms lead. The basis is tiny, the capital gain is large enough that
spreading it matters, there is usually no loan to pay off, and the property is a
second home rather than a residence, so the emotional attachment is to the summers
rather than to the house.

Lead with the tax treatment. An installment sale spreads the gain instead of
realizing all of it in one year, and that argument lands harder on a lake place
bought in 1990 than on anything else in the database.

### 5. Leveraged landlords, worked as a lease option

```bash
npm run gf -- leads --strategy lease_option --min-score 40
```

A tired landlord who bought recently has no equity to sell you and nothing to carry.
Under a plain buy or carry framing that lead is dead, and it used to score as
`unclear` here, which was a mistake.

These will sit near the bottom of the default list, because the blended score leans
on seller finance fit and thin equity scores badly on it. That is not the score
disagreeing with the strategy, it is the score answering a different question. Filter
by strategy rather than sorting by score for this list.

The play is control rather than ownership. A lease with an option to buy leaves the
deed and the existing loan exactly where they are, which means there is no transfer
for a due on sale clause to catch and no lender consent to obtain. You take over the
management, the rent covers the payment, and the option locks your price.

`gf show` prints the terms: an option fee, monthly rent, a strike price, the share of
each rent payment credited against the purchase, and what is left to finance at
exercise. Defaults are in `config/offer.json` under `leaseOption` and they are
placeholders like the rest.

The pitch is not "I want to buy your house." It is "I will take the tenant calls and
the vacancy risk off your hands, cover the payment every month, and buy it outright
inside three years." For an out of state owner paying a management company eight
percent to still get woken up about a water heater, that is the whole sale.

Watch the rent against the payment. If the existing payment plus taxes and insurance
runs above the market rent, the deal does not work no matter how motivated the owner
is, and that is a check no free data source can do for you.

### 6. Bank owned and auction

```bash
npm run gf -- leads --strategy cash_wholesale --sort distress
```

These rank low on the blended score by design, because there is no seller to
negotiate terms with. Price is the only lever. Work this list separately.

## A note on structure

Nothing here is legal advice, and none of these structures is a form you fill in
yourself. Lease options, land contracts and wrap notes are enforced or gutted by
state law and by exactly how the paperwork reads, and Tennessee has its own rules
about them. Have a real estate attorney draft the templates once, then reuse them.
The pipeline's job is to tell you which conversation to have, not to paper it.

## Tags that arrive in GHL

The CSV export sets tags so you can build workflows without touching custom fields:

`gf-lead`, `gf-seller-finance`, `gf-subject-to`, `gf-cash-wholesale`,
`gf-novation`, `gf-lease-option`, `gf-grade-a` through `gf-grade-f`, `gf-free-and-clear`,
`gf-absentee`, `gf-out-of-state`, plus one per distress type such as
`gf-pre-foreclosure` or `gf-code-violation`.

A reasonable first setup: one mail sequence for `gf-seller-finance` plus
`gf-free-and-clear`, a separate one for `gf-absentee` without free and clear, and
leave `gf-cash-wholesale` out of mail entirely since those are listed properties.

## Mail goes to the mailing address

The CSV puts the **owner mailing address** in `address1`, not the property address,
because for an absentee owner the property address reaches a tenant or an empty
house. The property address rides along in `property_address`.

The mailing address block is all or nothing on purpose. If the county published no
mailing zip, the zip is left blank rather than filled with the property zip, because
a Nashville zip on a Tampa post office box does not deliver.

## The offer numbers are placeholders

`gf show` prints a cash maximum offer and a seller finance structure. Both come from
`config/offer.json`, which ships with round numbers that are not your numbers:

```json
{
  "maoPercentOfArv": 0.7,
  "repairPerSqft": 25,
  "assignmentFee": 10000,
  "sellerFinance": {
    "pricePercentOfArv": 0.95,
    "downPercent": 0.1,
    "ratePercent": 5,
    "amortYears": 30,
    "balloonYears": 7
  }
}
```

The seller finance price sits near ARV on purpose. Terms buy price: if you are
getting a low rate, a small down payment and a long runway, you can pay closer to
retail and still have the deal work. That trade is the whole strategy, and where you
set it is your call, not a default's.

ARV comes from the published assessor value times `arvMultiplier`. Assessments lag
the market and lag differently in every county. Check the multiplier against a few
recent sales you already know before trusting any figure downstream.
