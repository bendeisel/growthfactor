# 04.4 Opportunity value

**Module:** 04 Opportunities
**Video:** ~5 min
**Needs first:** 04.2
**You finish with:** a pipeline that shows money instead of headcount

## Why this matters

A pipeline with no values tells you there are 23 people in it. So what.

A pipeline with values tells you there is $38,000 of annual membership in
play, that $14,000 of it is sitting at the Showed stage, and that the ads you
turned on last month produced $9,000 of it.

That is a different conversation, and it is the one that decides whether you
spend more on ads or less.

## Set the value to annual, not the trial

The mistake almost everybody makes: setting the opportunity value to the
trial price, or to one month.

Set it to **what the membership is worth in a year.** If your month to month
is $149, the value is $1,788.

Two reasons:

1. It is the truth. That is what winning this deal is worth.
2. It changes behaviour. Nobody chases a $149 card very hard. People chase a
   $1,788 card.

If you want to be conservative, use your actual average member lifespan
instead of a full year. If members stay nine months on average, use nine
months. What matters is being consistent, so the numbers compare over time.

## Steps

1. Work out the value for each program you sell.

   | Program | Monthly | Annual value |
   |---------|---------|-------------|
   | Adult membership | $149 | $1,788 |
   | Kids membership | $99 | $1,188 |
   | Family | $249 | $2,988 |
   | PT package | Varies | Use the package price |

2. Open your `Gym Sales` pipeline settings and check whether a default
   opportunity value is set.

   [SHOT 04.4-01]

3. Set a sensible default, usually your most common membership. Cards created
   automatically will carry it.

4. For the workflow that creates opportunities, set the value based on
   `program_interest` where you can, so a kids enquiry does not get counted at
   the adult rate.

   [SHOT 04.4-02]

5. Correct individual cards by hand when you know better.

## Do not gold plate this

The value does not need to be exact. It needs to be roughly right and
consistently applied.

An hour spent building perfect value logic per program is an hour that would
be better spent on your knowledge base. Set a sensible default, split kids
from adults, move on.

## What this unlocks

Once values are on, module 11 can show you:

- Pipeline value by stage. Where the money is sitting.
- Revenue by lead source. Which channel produces money, not just leads.
- Won revenue by month.
- Average deal size, which tells you whether you are attracting the right
  people.

None of that works without values, which is why this five minute lesson
matters more than it looks.

[SHOT 04.4-03]

## Test it

1. Open your board.
2. Check the total value shown at the top of each column.
3. Does the total for Showed look roughly like what you would expect if
   everyone in it joined?
4. If it looks wildly wrong, find the cards with a zero or default value.

## Checklist

- [ ] Values are annual, not monthly, not the trial price
- [ ] Default value set on the pipeline
- [ ] Kids and adult enquiries get different values
- [ ] Column totals look believable
- [ ] I have not spent more than twenty minutes on this

## When it goes wrong

**Every card is the same value.** The default is applying and nothing is
differentiating. Fine to start with, improve when you care.

**Cards with zero value.** They were created before the default was set, or by
a workflow that does not set one. Bulk edit them, or accept the gap and move
on.

**Totals look absurd.** Somebody set a monthly value on some cards and an
annual value on others. Pick one, fix the odd ones out.

## Shot list

| Shot | Screen | Capture | Highlight | Blur |
|------|--------|---------|-----------|------|
| 04.4-01 | Pipeline settings, default value | The value field | The field | Nothing |
| 04.4-02 | A workflow setting opportunity value conditionally | The condition branch | The branch on program_interest | Nothing |
| 04.4-03 | Board with column totals visible | The totals row | The Showed column total | Exact figures if sensitive |

## Video script

**Hook.** Your pipeline says 23 people. Useless. It should say thirty eight
thousand dollars, and fourteen of it is sitting at one stage.

**Beats.**
1. On screen: a board with no values. Then the same board with values. The
   comparison does the teaching.
2. On screen: talk to camera. Annual, not monthly. Say the behaviour argument:
   nobody chases a $149 card.
3. On screen: set the default value, then the conditional split for kids.
4. On screen: talk to camera. Do not gold plate it. Twenty minutes, then move
   on.

**Go do.** Set your default value now. Then look at your Showed column total
and ask yourself if it looks right.

## Verify on screen

- Whether a pipeline-level default opportunity value exists in the current
  release, or whether value must be set per workflow.
- Whether column totals display by default on the board view.
