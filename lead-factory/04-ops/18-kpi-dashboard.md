# KPI Dashboard & Instrumentation

The original plan has no measurement layer, which means none of its assumptions could ever be proven wrong. This spec fixes that.

**Design rule: every metric here has an owner, a cadence, and a threshold that triggers a specific action.** A number nobody acts on is decoration.

---

## 1. The five numbers

If everything else gets dropped in a busy month, these survive. Each maps to a specific failure mode.

| # | Metric | Target | Fails if | Where it's argued |
|---|---|---|---|---|
| 1 | **Monthly logo churn** | < 5% | > 8% for 2 months | `00-strategy/03-unit-economics.md §2` — sets the CAC ceiling |
| 2 | **Delivery hours per account** | ≤ 6.75 | > 9 | §3 — the margin lever. **The number most likely to silently drift** |
| 3 | **Fully-loaded CAC** | < $3,000 | > $4,000 | §2 — the 3:1 ratio |
| 4 | **Time-to-live** (signed → ads running) | < 12 days | > 25 | `04-ops/17` — leading churn indicator. Now gated by client access, not build |
| 5 | **New clients / month** | 5 (or 2–3 solo) | < 60% of target for 2 months | `00-strategy/04-funnel-math.md` |

**Churn is first for a reason.** It sets the CAC ceiling, which sets the acquisition budget, which sets everything else. It is also the number we currently know least about — the 14-month tenure figure is a guess, and until there's real data every downstream projection carries that uncertainty.

**Metric 2 is the one that decays quietly.** AI-assisted delivery is worth ~$225/account/month in margin only if the freed hours stay freed. Nobody notices an account creeping from 7 to 9 hours; everyone notices the margin six months later. Log hours per account monthly, per account, without exception.

## 2. Weekly scorecard — reviewed Monday, 30 minutes

### Top of funnel
| Metric | Target | Alert |
|---|---|---|
| New records scored | 800/wk | < 500 → segment volume gap (`01-data/06 §3`) |
| Band A+B records | 200/wk | < 120 → widen targeting |
| Emails sent | 4,000/wk | Under → check mailbox health first, not copy |
| Delivery rate | > 97% | **< 95% → pause and audit today** |
| Reply rate | 4–6% | < 2% → targeting or E1 opener |
| Positive reply share | > 30% | < 20% → offer/ICP mismatch |
| Complaint rate | < 0.1% | **> 0.3% → stop that domain today** |
| Dials | 250/wk/rep | |
| Connect rate | > 12% | < 8% → data quality or caller ID |

### Middle
| Metric | Target | Alert |
|---|---|---|
| Meetings booked | 12/wk | |
| Show rate | > 70% | < 60% → confirmation sequence broken |
| Discovery → proposal | > 50% | < 35% → qualifying too loosely upstream |
| Proposals sent | 6/wk | |
| Teardowns recorded | 8/wk | |

### Bottom
| Metric | Target | Alert |
|---|---|---|
| Proposal → close | > 45% | **> 70% → price is too low** |
| New clients | 1.25/wk | |
| New MRR | $1,500/wk | |
| Avg deal size | ≥ $1,205 | Falling → tier mix drifting down |
| Discount rate | < 20% of deals | > 20% → price or proof problem, not a rep problem |

**On close rate above 70%:** this reads as a win and isn't. It means we're leaving money on the table and probably attracting the wrong end of the market. Raise price, don't celebrate.

## 3. Monthly business review

**Revenue:** MRR (new / expansion / churned / net) · ARR run rate · blended deal size · tier mix vs. plan (65/20/15) · add-on attach rate.

**Efficiency:** CAC by channel · CAC payback in months · LTV:CAC · gross margin per account · delivery hours per account.

**Client health:** active count vs. capacity · avg tenure · NPS or a one-question equivalent · accounts hitting their guarantee number · accounts on a churn watchlist.

**Channel attribution** — platform-reported *and* self-reported side by side, because they will disagree and the gap is itself information:

| Channel | Leads | Meetings | Clients | Cost | CAC |
|---|---|---|---|---|---|
| Cold email | | | | | |
| Outbound calling | | | | | |
| Google Search | | | | | |
| Meta | | | | | |
| Referral / partner | | | | | |
| Organic / direct | | | | | |
| Reactivation | | | | | |

**The expected finding** `[ASSUMPTION]`: referral CAC will come in at a fraction of everything else, and outbound will look expensive per client but be the only channel that scales on demand. Both facts should be acted on — fund referral aggressively, keep outbound as the volume dial.

## 4. Cohort tracking

Group clients by signing month and track forward. This is how you find out whether the 14-month tenure assumption is real, and it's the only way to see improvement in onboarding actually show up.

| Cohort | Clients | M1 | M3 | M6 | M9 | M12 | M18 | Cum. gross profit |
|---|---|---|---|---|---|---|---|---|
| 2026-09 | | | | | | | | |
| 2026-10 | | | | | | | | |

**Read cohorts, not aggregate churn.** Aggregate churn hides the thing you need to see: whether *recent* cohorts retain better than early ones. If the September cohort is at 60% by month 6 and the December cohort is at 85%, onboarding improvements are working — and that's invisible in a blended number.

## 5. Client-facing metrics

Different from internal ones. What the client sees monthly (`04-ops/17 §6`):

**Primary:** booked jobs from marketing · cost per booked job · qualified leads · cost per qualified lead.
**Secondary:** total spend (fee + media) · lead-to-booked rate · **leads not responded to within 1 business day** · calls, forms, chats by source · organic rankings for tracked terms · site conversion rate.

**Never lead a client report with impressions, clicks, or CTR.** Those are inputs. Leading with them signals that the outputs aren't good, and clients read that signal accurately.

## 6. Instrumentation

**Systems of record** — one each, no exceptions:

| Domain | System |
|---|---|
| Prospects, deals, activity | CRM |
| Sending, sequences, deliverability | Outbound tool |
| Client site + ad performance | GA4 + platform APIs → reporting tool |
| Calls | Call tracking, per-account numbers, DNI |
| Delivery hours | Time tracking, per account, **actually used** |
| Finance | Accounting / billing |

**Required tracking events**

*Prospect side:* record created (with segment, score, band) · sequence started · email delivered / replied / bounced / complained / unsubscribed · call attempted / connected / outcome · page visited (UTM captured) · form submitted · meeting booked / held / no-show · proposal sent / viewed · won / lost with reason.

*Client side:* form submit · call start & duration · chat start · conversion by source with UTM · booked-job close-loop (**client-reported — ask every month**).

**The three that always get skipped and always matter most:**

1. **`self_reported_source`** — asked on every discovery call, required CRM field. Platform attribution grades its own homework; the human answer is the only independent check we have.
2. **Delivery hours per account** — the entire margin model rests on this and nobody enjoys tracking it. Without it, the first sign of a margin problem is a cash problem.
3. **Loss reason codes** — the only input that improves scoring, targeting, and copy. A loss without a reason code is a loss we pay for twice.

## 7. Review cadence

| Cadence | Who | Duration | Output |
|---|---|---|---|
| Daily | Rep | 10 min | SLA breaches, replies, today's calls |
| Weekly Mon | Team | 30 min | Scorecard, stuck deals, **one change** |
| Monthly | Founder | 90 min | Business review, cohorts, channel CAC, pricing check |
| Quarterly | Founder | Half day | Scoring recalibration, vendor review, pricing decision, capacity/hiring |

**Weekly produces exactly one change.** A meeting that generates six changes generates zero, because nothing gets implemented and nothing gets measured cleanly.

## 8. Build order

Don't build a dashboard before there's data to put in it. Instrumentation in the order it becomes useful:

1. **Week 1** — CRM with required fields + UTM capture. Everything else reads from this.
2. **Week 2** — outbound tool metrics (deliverability is the earliest failure mode, so it needs the earliest visibility)
3. **Week 4** — weekly scorecard, manual in a spreadsheet. **Manual is correct here** — automating a metric you haven't yet decided you'll act on is wasted work.
4. **Month 2** — client reporting automation (the first client's day-30 report forces this)
5. **Month 3** — cohort tracking, channel CAC
6. **Month 6** — scoring recalibration against real closed-won data (`01-data/07 §6`)

The temptation is to build the dashboard first because it's the enjoyable part. Resist it. **The first 90 days need one spreadsheet and honest inputs**, not a data warehouse.
