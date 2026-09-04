# Coaching baseline, measured 2026-09-03

Pulled live from AdKit (Meta), workspace `Gym Funnel Ads`, window 2026-08-04 to
2026-09-02. This is the "before" row for the coaching program. Re-pull it on the
same day each month and put the diff in front of the member.

## The three paying gyms

| Gym | 30d spend | Leads | Blended CPL | Live campaigns | Dormant |
|---|---|---|---|---|---|
| Nashville MMA Training Camp | $1,502.81 | 126 | $11.93 | 3 | 13 |
| Fighters Boxing Gym | $1,303.21 | 107 | $12.18 | 3 | 2 |
| Furst Place MMA | $295.18 | 46 | **$6.42** | 1 | 0 |
| **Total** | **$3,101.20** | **279** | **$11.12** | **7** | **15** |

## Every live campaign, cheapest lead first

| Campaign | Gym | Spend | Leads | CPL | Hook rate |
|---|---|---|---|---|---|
| Q3 MMA Super Ad (copy) | Furst Place | $295.18 | 46 | $6.42 | n/a |
| Adult Boxing | Fighters | $255.18 | 29 | $8.80 | 20.99% |
| Jiu-Jitsu Ads | Nashville MMA | $600.73 | 60 | $10.01 | n/a |
| Wrestling Ads | Nashville MMA | $302.94 | 29 | $10.45 | 29.53% |
| $99 Unlimited Deal (July Video) | Fighters | $474.37 | 42 | $11.29 | 16.33% |
| $80/m for a 3 month commitment | Fighters | $573.66 | 36 | $15.94 | 13.99% |
| Kids Martial Arts | Nashville MMA | $599.14 | 37 | $16.19 | 32.87% |

## What the numbers say

**1. The CPL spread is 2.5x inside one agency, one city, one vertical.**
$6.42 at Furst Place against $16.19 on Nashville MMA's Kids campaign. Same
market, same operator, same month. That spread is the entire coaching thesis:
nothing here needs a new channel, it needs the worst campaigns moved toward the
best one.

Worked: Kids Martial Arts bought 37 leads for $599.14. At Furst Place's $6.42
the same 37 leads cost $237.54. That single campaign is leaking **$361.60 a
month**, which is more than the coaching fee.

**2. Hook rate does not explain the bad CPL, so the offer does.**
Kids Martial Arts has the best hook rate on the board at 32.87% and the worst
CPL at $16.19. The creative is stopping the scroll and the offer is not closing
it. Meanwhile Fighters' `$80/m for a 3 month commitment` has the worst hook at
13.99% and the second-worst CPL at $15.94, which is the ordinary case where the
creative genuinely is the problem. Two different diseases, and telling them
apart is a module.

**3. 279 leads a month are already arriving and nobody has timed the response.**
That is 3,348 a year across three gyms at current pace. Speed to lead is the
cheapest available win and it costs zero additional ad spend, which is why the
follow-up bot is module 2 and not module 6.

**4. Fighters gets 107 leads against 45 landing page views.**
Leads exceed site visits, so they are arriving through Meta instant forms and
never touching the website. Worth naming plainly: for these campaigns the site
is not in the ad path at all. Instant-form leads are also lower intent than
form-fill-on-site leads, which raises the value of fast follow-up rather than
lowering it.

**5. 15 of 22 campaigns are dormant.**
Nashville MMA carries 13 campaigns at $0 spend, some dating to
`Muay Thai Ad 9.26.24`, plus `New Years Special`, `Spring Sale`, `Summer Sale`.
Fighters has `$80/m for a 3 month commitment` twice, one dormant and one
spending. Dormant campaigns cost nothing directly and cost real minutes every
time someone opens the account to find the live one.

**6. Messenger is not a channel here.**
17 conversations started across all three gyms at $73 to $573 each. Not worth a
module. Worth turning off.

## Method

`adkit_manage` `entity: results`, `level: campaigns`, `period: last_30d`, per
project. Reach and frequency are Meta estimates. Rows where Meta did not return
enough information to match Ads Manager's Results metric are excluded rather
than inferred from conversion events.

Google Ads is connected on Nashville MMA and Fuel Fortress but was not pulled
for this baseline. Add it before the first monthly review.
