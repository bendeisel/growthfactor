# Unit Economics & Capacity

The original blueprint has no numbers behind the price. Without these you can't tell whether $1,500 is a good deal or a slow bleed, and you can't size the outbound machine. Everything here is a model — replace `[ASSUMPTION]` values with actuals as they land and the conclusions update themselves.

---

## 1. Cost to deliver one Core account

Monthly, steady state (post-onboarding).

| Line | Hours/mo | Loaded rate | Cost |
|---|---|---|---|
| Ads management (build, monitor, optimize, creative rotation) | 4.0 | $65 | $260 |
| SEO / content / GBP | 1.5 | $65 | $98 |
| Site maintenance + included change requests | 2.0 | $65 | $130 |
| Reporting + monthly client call | 1.5 | $85 | $128 |
| Account admin, QA, escalations | 1.0 | $65 | $65 |
| **Labor subtotal** | **10.0** | | **$681** |
| Software allocation (hosting, SEO tools, call tracking, reporting, CRM, data) | | | $120 |
| **Total delivery cost** | | | **~$800** |

**Gross margin: ~$700/mo per account, ~47%.** `[ASSUMPTION]` $65 loaded hourly = ~$100K fully-burdened annual cost for a delivery generalist, or a contractor rate.

> **Read this number carefully.** 47% is workable but thin for an agency (healthy is 55–65%). Two levers move it: cut hours through templating (the Growth Factor site system already does this — extend it to campaign structures and reporting), or raise price. **The hours are the lever, not the price**, until proof assets exist.

### One-time onboarding cost

| Line | Hours | Cost |
|---|---|---|
| Discovery, access collection, kickoff | 3 | $195 |
| Site build on the system template | 12 | $780 |
| Tracking install + QA (GA4, GTM, conversions, call tracking) | 3 | $195 |
| Campaign build + audience construction | 5 | $325 |
| **Total onboarding** | **23** | **~$1,495** |

**This is the number that determines everything.** One month of fee is consumed entirely by onboarding.

## 2. Payback, LTV, and the CAC ceiling

```
Gross margin per account         $700 / mo
Onboarding cost                  $1,495  (one-time)
Months to recover onboarding     2.1
```

`[ASSUMPTION]` **Average tenure: 14 months.** Rationale: 6-month term, industry SMB agency churn ~5–8%/mo after term expiry. Track this from day one; it is the most important number in this document and the one we currently know least about.

```
Gross profit over life   14 × $700           = $9,800
Less onboarding          − $1,495            = $8,305   ← contribution per client
```

**CAC ceiling:** at a 3:1 LTV:CAC ratio, **max sustainable CAC = ~$2,700.** At 4:1 (safer while cash is tight): **~$2,000.**

That's a genuinely large budget per client, and it's the single most useful output of this model — it means paid acquisition, teardown videos, and outbound labor are all affordable if they work. It also means a 5-hour manual teardown video for a high-value prospect is *cheap*, not indulgent.

**Sensitivity — tenure is the whole ballgame:**

| Avg tenure | Contribution/client | Max CAC @ 3:1 |
|---|---|---|
| 7 mo (term only, everyone leaves) | $3,405 | $1,135 |
| 10 mo | $5,505 | $1,835 |
| 14 mo `[baseline]` | $8,305 | $2,768 |
| 24 mo | $15,305 | $5,102 |

Retention buys acquisition budget. A month of tenure is worth more than a month of prospecting. Budget accordingly: the reporting call in the delivery cost above is not overhead, it's retention spend.

## 3. Capacity — the constraint nobody put in the original plan

At **10 hours/mo per Core account**, and ~120 productive delivery hours/mo per full-time person:

| Delivery headcount | Max active accounts | MRR at capacity |
|---|---|---|
| 1 (founder splitting time, ~60h delivery) | 6 | $9,000 |
| 1 full-time | 12 | $18,000 |
| 2 | 24 | $36,000 |
| 3 + 1 account manager | 40 | $60,000 |

**Onboarding is a separate spike.** 23 hours each. Three new clients in one month = 69 hours — over half a person — on top of servicing existing accounts. **Cap new sales at 4/mo per delivery FTE** or delivery quality collapses in month two, churn spikes, and the tenure assumption above breaks.

> **Do not sell past capacity.** The fastest way to kill this business is a great month of sales followed by three months of bad delivery. Waitlist and start-date scheduling are legitimate sales tools — "our next onboarding slot is the 15th" is scarcity we actually have.

## 4. Break-even

`[ASSUMPTION]` fixed monthly overhead $6,500 (one founder draw at reduced rate, software base, insurance, misc).

```
Break-even accounts = 6,500 / 700 = 9.3 → 10 active Core accounts
```

**Ten accounts is the first real milestone.** Every account past ten contributes $700/mo to profit and acquisition. Before ten, keep acquisition costs near zero — outbound labor and founder time, not paid media.

## 5. Blended mix

Not every client takes Core. Planning mix and blended contribution:

| Tier | Price | Est. mix | Delivery cost | Margin | Weighted margin |
|---|---|---|---|---|---|
| Core | $1,500 | 65% | $800 | $700 | $455 |
| Ads Engine | $1,000 | 20% | $520 | $480 | $96 |
| Site & Search | $500 | 15% | $290 | $210 | $32 |
| **Blended** | **$1,205** | | | | **$583** |

Add-on attach `[ASSUMPTION]` 25% of accounts at $500/mo average, ~80% margin → **+$100/account/mo blended**, taking blended contribution to ~$683.

**Implication:** the add-on line is nearly as valuable as a tier upgrade and costs almost nothing to sell. The CRM/follow-up automation add-on in particular sells itself the moment reporting shows leads delivered but not called. Build the reporting to surface exactly that.

## 6. The numbers to actually track

If only five numbers get tracked, these five:

1. **Average tenure / monthly logo churn** — sets CAC ceiling, drives everything
2. **Delivery hours per account** — the margin lever; if it drifts past 12, margin is gone
3. **Fully-loaded CAC** (all sales + marketing cost ÷ new clients) — must stay under $2,000
4. **Onboarding time-to-live** (signature → site live + ads running) — leading indicator of both churn and cash
5. **Add-on attach rate** — cheapest revenue available

Instrumentation spec in `04-ops/18-kpi-dashboard.md`.
