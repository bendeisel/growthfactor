# Funnel Math — Working Backwards From the Goal

The original blueprint describes four stages with no volumes attached. This file answers: *how many people do we have to touch to hit the number, and is that physically possible with the infrastructure we have?*

---

## 1. The target

`[ASSUMPTION]` **Goal: 5 new clients/month**, blended ~$1,205 → **+$6,025 new MRR/month**. At that rate, break-even (8 accounts) lands in month 2 of full operation and $36K MRR arrives around month 8, accounting for churn.

Check it against capacity first, using the combined constraint from `03-unit-economics.md §3` (`6.75 × active + 11 × new ≤ 120 hrs/FTE`):

| Scenario | Delivery hours | Sustainable rate |
|---|---|---|
| Founder solo, split time (~60 hrs) | 60 | **2 new/month** while holding ~5 accounts |
| One full-time delivery person | 120 | **4–5 new/month** while holding ~9–10 accounts |
| Founder + one delivery FTE | ~180 | 5/month with room for the book to grow |

**5 clients/month is achievable with one dedicated delivery person** under AI-assisted delivery — it was not achievable at all under the traditional 23-hour onboarding model, where 5/month consumed 115 of 120 hours before servicing a single existing account. Solo, the honest target remains **2–3/month.** Pick deliberately rather than discovering the constraint in month three.

## 2. Backwards from a signed client

`[ASSUMPTION]` conversion rates, sourced from B2B cold-outbound benchmarks for SMB services. Every one is a hypothesis to replace with our own data by day 60.

| Step | Rate | Why this number |
|---|---|---|
| Signed / proposal sent | 45% | Proposals only go out after a qualified discovery call |
| Proposal / qualified call held | 50% | Some calls disqualify on budget or fit — that's the system working |
| Held / booked | 70% | 30% no-show is normal on cold-sourced meetings; confirmation sequence is what moves this |
| Booked / positive reply | 55% | Not every interested reply is meeting-ready |
| Positive reply / total reply | 35% | The rest are "not now," "not me," and unsubscribes |
| Reply / contact (email, full sequence) | 5.0% | Well-targeted, well-warmed cold B2B email. 8%+ means the list is too small or too warm to scale; under 2% means targeting or copy is broken |

Chained: **contact → signed = 5.0% × 35% × 55% × 70% × 50% × 45% = 0.152%.**

**≈ 660 contacted prospects per signed client.**

| Goal | Contacts/mo needed | New MRR |
|---|---|---|
| 2 clients | 1,320 | $2,410 |
| 3 clients | 1,980 | $3,615 |
| **5 clients** | **3,300** | **$6,025** |
| 8 clients | 5,280 | $9,640 |

## 3. Can we physically send that?

This is the question the original plan never asks, and it's where most outbound programs die.

**Sending capacity math.** Safe cold-email volume is 25–35 sends/inbox/day on a warmed inbox. At 30/day × 21 business days = **630 sends/inbox/month**.

Each prospect gets ~5 touches across a sequence, so 3,300 *contacts* ≈ **16,500 sends/month**.

```
16,500 sends ÷ 630 per inbox = 27 inboxes
```

`[ASSUMPTION]` 3 inboxes per secondary domain → **9 sending domains, 27 mailboxes.** At ~$6/mailbox/mo plus domains, that's roughly **$200–250/mo of infrastructure** — trivial against a ~$3,000 CAC ceiling, but it takes **3–4 weeks of warmup** before any of it can send at volume.

> **This is the critical path item.** Domains and warmup must start in week 1 of the rollout, before copy is finished, before Datamoon is fully configured. Nothing else in the plan can run ahead of it. See `04-ops/19-90-day-rollout.md`.

Scaled down: the **2–3 clients/month** scenario needs ~10,000 sends/mo → **16 mailboxes across 5–6 domains.** Still needs to start in week 1.

## 4. Multi-channel — where the rest comes from

Email alone is fragile (one deliverability incident and the month is gone). Blended plan at the 5-client target:

| Channel | Contacts/mo | Est. → client | Clients/mo | Cost/mo | CAC |
|---|---|---|---|---|---|
| Cold email (all rings) | 2,400 | 0.15% | 3.6 | $250 infra + 20h labor | ~$500 |
| Outbound calling (Ring 1 only, score ≥60) | 250 | 1.2% | 3.0 | 40h labor | ~$870 |
| Paid search — high-intent brand-adjacent terms | ~45 leads | 8% | 3.6 | $2,500 | ~$690 |
| Retargeting (site + matched audiences) | — | — | +15% lift on above | $600 | — |
| Referral / partner (see §6) | — | — | 1.0 | ~$300 | ~$300 |

That over-delivers against 5 to leave room for the assumptions being wrong. **Assume the first version of every rate above is 30–50% optimistic** and plan the month accordingly — the point of the model isn't the forecast, it's knowing which number to go measure first.

**Note the phone line.** 1.2% contact-to-client versus 0.15% for email — **8× more efficient per contact**, and it's the channel the original plan put in Stage 4. Ring 1 phone should be the *first* touch for high-score local prospects, not the last. Its limit is hours, not list size, which is exactly why it should be pointed only at the top of the score distribution.

## 5. Leading indicators — what to watch weekly

Signed clients is a lagging number; by the time it's bad it's been bad for six weeks. Watch these instead, with intervention thresholds:

| Metric | Healthy | Intervene below/above |
|---|---|---|
| Emails delivered / sent | > 97% | < 95% → pause, audit domain reputation immediately |
| Open rate (directional only — Apple MPP inflates it) | 45–65% | < 30% → deliverability problem, not copy |
| Reply rate | 4–6% | < 2% → targeting or opening line |
| Positive reply share | > 30% | < 20% → offer/ICP mismatch, not copy |
| Meeting show rate | > 70% | < 60% → confirmation sequence broken |
| Spam complaint rate | < 0.1% | > 0.3% → **stop sending on that domain today** |
| Connect rate (dials) | > 12% | < 8% → data quality or caller ID reputation |
| Speed-to-lead on inbound | < 5 min | > 30 min → routing broken |

## 6. Channels the original plan omitted entirely

Outbound is the slowest, most expensive way to acquire a local service business, and it's the only channel in the blueprint. These are cheaper and should run in parallel:

1. **Partner/referral loops.** Web designers who don't do ads, ad freelancers who don't build sites, business brokers, fractional CFOs, chambers, BNI. Offer 10% of month 1–6 for referrals. `[ASSUMPTION]` CAC ~$300 — by far the cheapest channel available, and the one that compounds.
2. **Client referral.** One month free for a referral that signs. Ask at the 90-day review, when the guarantee has just been met — the highest-goodwill moment in the relationship.
3. **The signal report as a lead magnet.** "Free in-market demand report for your county and category." Genuinely valuable, uses the asset we already have, and self-qualifies: only someone considering demand generation requests one. Landing page spec in `02-campaigns/13-landing-pages.md`.
4. **Local SEO for ourselves.** We sell local SEO. Ranking for "digital marketing agency Nashville" and its long tail is both a lead source and the most credible proof asset we can own. If we can't rank ourselves, the pitch has a hole in it.
5. **Reactivation.** Every past client, dead lead, and quote that never closed. Free, warm, and usually the fastest wins in month one.
