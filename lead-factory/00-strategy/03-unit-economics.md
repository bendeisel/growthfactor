# Unit Economics & Capacity

The original blueprint has no numbers behind the price. Without these you can't tell whether $1,500 is a good deal or a slow bleed, and you can't size the outbound machine. Everything here is a model — replace `[ASSUMPTION]` values with actuals as they land and the conclusions update themselves.

> **Two delivery models are shown throughout.** *Traditional* is conventional agency delivery. *AI-assisted* is the production model documented in [`04-ops/20-ai-delivery-stack.md`](../04-ops/20-ai-delivery-stack.md), which is the operating assumption. Traditional is kept as the conservative floor — if AI-assisted delivery underperforms in practice, the business still works on the traditional numbers, just more slowly.

---

## 1. Cost to deliver one Core account

Monthly, steady state (post-onboarding).

| Line | Traditional hrs | AI-assisted hrs | Loaded rate | AI-assisted cost |
|---|---|---|---|---|
| Ads management (build, monitor, optimize, creative rotation) | 4.0 | 2.5 | $65 | $163 |
| SEO / content / GBP | 1.5 | 0.75 | $65 | $49 |
| Site maintenance + included change requests | 2.0 | 1.5 | $65 | $98 |
| Reporting + monthly client call | 1.5 | 1.25 | $85 | $106 |
| Account admin, QA, escalations | 1.0 | 0.75 | $65 | $49 |
| **Labor subtotal** | **10.0** | **6.75** | | **$465** |
| Software allocation (hosting, SEO tools, call tracking, reporting, CRM, data, AI tooling) | | | | $110 |
| **Total delivery cost** | | | | **~$575** |

**Gross margin: ~$925/mo per account, ~62%** (traditional: $700, 47%). `[ASSUMPTION]` $65 loaded hourly = ~$100K fully-burdened annual cost for a delivery generalist, or a contractor rate.

> 62% is a healthy agency margin. The traditional model's 47% was workable but thin, and the lever on it was always hours rather than price. **The freed hours only become margin if they're deliberately reallocated** — see [`20-ai-delivery-stack.md §5`](../04-ops/20-ai-delivery-stack.md). Track hours per account monthly; drift back toward 10 means the compression was theoretical.

### One-time onboarding cost

| Line | Traditional hrs | AI-assisted hrs | AI-assisted cost |
|---|---|---|---|
| Discovery, access collection, kickoff | 3 | 3.0 | $195 |
| Site build on the system template | 12 | 3.5 | $228 |
| Tracking install + QA (GA4, GTM, conversions, call tracking) | 3 | 2.5 | $163 |
| Campaign build + audience construction | 5 | 2.0 | $130 |
| **Total onboarding** | **23** | **11.0** | **~$715** |

**This is the number that determines everything**, and it's where AI-assisted delivery pays off most. Note that discovery and access collection do not compress at all — they're client-gated, which is why [access friction becomes the critical path](../04-ops/20-ai-delivery-stack.md#8-where-the-constraint-moves) once build time collapses.

## 2. Payback, LTV, and the CAC ceiling

```
Gross margin per account         $925 / mo      (traditional: $700)
Onboarding cost                  $715 one-time  (traditional: $1,495)
Months to recover onboarding     0.8            (traditional: 2.1)
```

**Onboarding pays back inside the first month.** This is the most valuable single effect of AI-assisted delivery — more than the margin improvement — because it means cash stops constraining growth rate. Under the traditional model, every new client consumed two months of their own fee before contributing anything.

`[ASSUMPTION]` **Average tenure: 14 months.** Rationale: 6-month term, industry SMB agency churn ~5–8%/mo after term expiry. Track this from day one; it is the most important number in this document and the one we currently know least about.

```
Gross profit over life   14 × $925           = $12,950
Less onboarding          − $715              = $12,235   ← contribution per client
```

**CAC ceiling:** at a 3:1 LTV:CAC ratio, **max sustainable CAC = ~$4,000.** At 4:1 (safer while cash is tight): **~$3,000.**

That is a large budget per client and it changes which acquisition plays are rational. A one-hour manual teardown video, an in-person Ring 1 close, a 10% partner commission — all comfortably affordable rather than indulgent. The `04-funnel-math.md §4` channel plan targets a blended CAC near $700, which leaves substantial headroom to buy growth if the offer converts.

**Sensitivity — tenure is still the whole ballgame:**

| Avg tenure | Contribution/client | Max CAC @ 3:1 |
|---|---|---|
| 7 mo (term only, everyone leaves) | $5,760 | $1,920 |
| 10 mo | $8,535 | $2,845 |
| 14 mo `[baseline]` | $12,235 | $4,078 |
| 24 mo | $21,485 | $7,162 |

Note that even the pessimistic 7-month case now clears the traditional model's baseline CAC ceiling. **Faster, cheaper onboarding makes the business substantially more robust to churn** — which matters, because churn is the number we know least about.

Retention buys acquisition budget. A month of tenure is worth more than a month of prospecting. Budget accordingly: the reporting call in the delivery cost above is not overhead, it's retention spend.

## 3. Capacity — the constraint nobody put in the original plan

**Correction to an earlier version of this model.** It stated 12 active accounts per FTE *and* a cap of 4 new clients/month per FTE. Those were inconsistent — 12 accounts × 10h consumed all 120 available hours, leaving nothing for 92 hours of onboarding. Capacity is a single constraint covering both, not two independent limits:

```
6.75 × (active accounts) + 11 × (new clients this month) ≤ 120 hrs/FTE/mo
```

| New clients/mo | Max active accounts | MRR at that point |
|---|---|---|
| 0 (steady state) | **17** | $25,500 |
| 2 | 14 | $21,000 |
| 3 | 12 | $18,000 |
| **4** | **10** | **$15,000** |
| 5 | 9 | $13,500 |

Founder splitting time at ~60 delivery hrs/mo: **5 active accounts while onboarding 2/month.**

**Read this as a growth-rate constraint, not a headcount constraint.** One person can hold 17 accounts *or* grow at 4–5/month, not both at once. On the traditional model the same arithmetic allowed roughly 3 active accounts while onboarding 4/month — which is to say, growth at that rate simply wasn't possible solo.

> **Do not sell past capacity.** The fastest way to kill this business is a great month of sales followed by three months of bad delivery. Waitlist and start-date scheduling are legitimate sales tools — "our next onboarding slot is the 15th" is scarcity we actually have.

**Hiring trigger:** active accounts + (new clients/month × 1.6) exceeds ~15 for two consecutive months.

## 4. Break-even

`[ASSUMPTION]` fixed monthly overhead $6,500 (one founder draw at reduced rate, software base, insurance, misc).

```
Break-even accounts = 6,500 / 925 = 7.0 → 8 active Core accounts
                      (traditional model: 10)
```

**Eight accounts is the first real milestone**, and it's reachable solo — it sits inside the single-FTE capacity envelope even while onboarding 3–4/month. Every account past eight contributes $925/mo to profit and acquisition. Before eight, keep acquisition costs near zero — outbound labor and founder time, not paid media.

## 5. Blended mix

Not every client takes Core. Planning mix and blended contribution:

| Tier | Price | Est. mix | Delivery cost | Margin | Weighted margin |
|---|---|---|---|---|---|
| Core | $1,500 | 65% | $575 | $925 | $601 |
| Ads Engine | $1,000 | 20% | $375 | $625 | $125 |
| Site & Search | $500 | 15% | $215 | $285 | $43 |
| **Blended** | **$1,205** | | | | **$769** |

Add-on attach `[ASSUMPTION]` 25% of accounts at $500/mo average, ~85% margin → **+$106/account/mo blended**, taking blended contribution to ~$875.

Note that **Site & Search becomes meaningfully profitable** under AI-assisted delivery (57% margin vs. 42%). That tier was marginal on traditional numbers and is now a legitimate product rather than a fallback — worth remembering when a prospect's budget genuinely can't support Core.

**Implication:** the add-on line is nearly as valuable as a tier upgrade and costs almost nothing to sell. The CRM/follow-up automation add-on in particular sells itself the moment reporting shows leads delivered but not called. Build the reporting to surface exactly that.

## 6. The numbers to actually track

If only five numbers get tracked, these five:

1. **Average tenure / monthly logo churn** — sets CAC ceiling, drives everything
2. **Delivery hours per account** — the margin lever; if it drifts past 12, margin is gone
3. **Fully-loaded CAC** (all sales + marketing cost ÷ new clients) — must stay under $2,000
4. **Onboarding time-to-live** (signature → site live + ads running) — leading indicator of both churn and cash
5. **Add-on attach rate** — cheapest revenue available

Instrumentation spec in `04-ops/18-kpi-dashboard.md`.
