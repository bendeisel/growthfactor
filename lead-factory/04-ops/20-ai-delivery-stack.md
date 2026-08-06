# AI-Assisted Delivery

The economics in `00-strategy/03-unit-economics.md` were originally modeled on traditional agency delivery. This file documents the AI-assisted production model, what it actually compresses, and — more importantly — what it doesn't.

**The headline:** AI collapses *production* hours. It barely touches *coordination* hours, and it should not touch *judgment* or *relationship* hours. That distinction determines the real capacity ceiling, and it's where most "we'll just use AI" agency plans go wrong.

---

## 1. What compresses, and by how much

`[ASSUMPTION]` — replace with measured times after the first three builds.

### Onboarding: 23h → ~11h

| Task | Traditional | AI-assisted | Compression | Why |
|---|---|---|---|---|
| Discovery, access collection, kickoff | 3.0 | 3.0 | **0%** | Client-gated. Waiting on a human to find their registrar login is not an AI problem |
| Site build | 12.0 | 3.5 | **71%** | Structure, page copy, service pages, schema, meta — generated against the template system, human directs and edits |
| Tracking install + QA | 3.0 | 2.5 | 17% | Config generation helps; **verification stays manual** — see §4 |
| Campaign build | 5.0 | 2.0 | 60% | Keyword expansion, negative lists, ad copy variants, audience definitions |
| **Total** | **23.0** | **11.0** | **52%** | |

### Steady state: 10h → ~7h/month

| Task | Traditional | AI-assisted | Why it doesn't go lower |
|---|---|---|---|
| Ads management | 4.0 | 2.5 | Search-term analysis and creative variants compress. **Budget and bid decisions don't** — that's judgment against a client's actual capacity to take work |
| SEO / content / GBP | 1.5 | 0.75 | Content generation is the clearest win in the stack |
| Site maintenance + change requests | 2.0 | 1.5 | Requests are small and specific; the overhead is communication, not execution |
| Reporting + monthly call | 1.5 | 1.25 | Report *generation* automates. **The call does not, and must not** — see §4 |
| Admin, QA, escalations | 1.0 | 0.75 | |
| **Total** | **10.0** | **6.75** | |

## 2. What this does to the business

| | Traditional | AI-assisted |
|---|---|---|
| Delivery cost / account / mo | $800 | **$575** |
| Gross margin | $700 (47%) | **$925 (62%)** |
| Onboarding cost | $1,495 | **$715** |
| Onboarding payback | 2.1 months | **0.8 months** |
| Contribution per client (14mo) | $8,305 | **$12,235** |
| **Max CAC @ 3:1** | $2,768 | **~$4,000** |
| Break-even accounts | 10 | **8** |

Three consequences worth acting on:

1. **Onboarding pays back inside the first month.** Cash stops being the constraint on growth rate. This is the single most valuable effect — more than the margin improvement.
2. **The CAC ceiling rises to ~$4,000.** That's a large acquisition budget per client and it makes expensive-but-effective plays (manual teardown videos, in-person Ring 1 meetings, partner commissions) obviously affordable rather than indulgent.
3. **62% margin is a real agency margin**, not a thin one. What to do with it is a strategic choice — see §5.

## 3. The capacity math, corrected

**First, an error in the original model worth naming.** `03-unit-economics.md` stated 12 accounts per FTE *and* a cap of 4 new clients/month per FTE. Those were inconsistent: 12 accounts × 10h = 120h, which consumed the entire month and left nothing for the 92 hours of onboarding. The cap was right in spirit and wrong in arithmetic.

Correct constraint, at 120 productive hours/month per FTE:

```
7 × (active accounts) + 11 × (new clients this month) ≤ 120
```

| New clients/mo | Max active accounts | MRR at that point |
|---|---|---|
| 0 (steady state) | **17** | $25,500 |
| 2 | 14 | $21,000 |
| 3 | 12 | $18,000 |
| **4** | **10** | **$15,000** |
| 5 | 9 | $13,500 |

**Read that table as a growth-rate constraint, not a headcount constraint.** One person can hold 17 accounts *or* grow fast, not both simultaneously. The traditional-model version of this table topped out at 2–3 active accounts while onboarding 4/month — genuinely unworkable. AI-assisted makes 4/month plus a 10-account book a real single-person operation.

**Revised hiring trigger:** when active accounts + (new/month × 1.6) exceeds ~15 for two consecutive months. Earlier than the traditional model implied, because growth is now the thing that consumes capacity rather than maintenance.

## 4. Where AI does not go

This list matters more than the compression table. Every item here is somewhere the hours look cuttable and cutting them costs more than it saves.

| Never automate | Why |
|---|---|
| **The monthly client call** | This is not reporting, it's retention. At 14-month assumed tenure, a month of retention is worth more than a month of prospecting (`03-unit-economics.md §2`). The call *is* the product, relationally |
| **Conversion tracking verification** | Broken tracking fails silently. You find out at day 30 when the report is empty and the client's confidence is gone. Always click the form, always place the call, always confirm the event fired |
| **Lead quality review** | The client marks bad leads; a human reads the pattern. This is the feedback loop that makes targeting improve |
| **Budget and bid decisions** | Requires knowing whether the client can actually handle more volume this month. A model can't know their crew is out sick |
| **Anything written to a prospect or client in first person** | If it reads as generated, we've disproven our own pitch. Sequences in `09-email-sequences.md` are templates a human sends, not autonomous output |
| **Guarantee evaluation** | Contractual. Human judgment against a written definition |
| **The kickoff call's two diagnostic questions** | "What happens to a 4pm Friday lead?" tells you whether the account will succeed. It has to be heard, not collected |

**The general rule:** automate production, never automate the parts where being wrong is invisible or where the client is buying a relationship.

## 5. What to do with the margin — recommendation

62% margin creates a genuine choice. Three options:

| Option | Effect | Verdict |
|---|---|---|
| **Cut price to $1,000–1,200** | Higher volume, more competitive | **No.** We're already the cheap option against $2,500 agencies. Cutting price into a market where the binding constraint is *belief* buys nothing — see `01-positioning.md §6` |
| **Take the margin, fund acquisition** | Higher CAC ceiling, faster growth | **Yes — primary.** The $4,000 ceiling makes teardown videos, in-person Ring 1 closes, and 10% partner commissions all obviously worth it |
| **Reinvest into per-client quality** | Better retention, better proof | **Yes — secondary.** Spend some of the freed hours on the differentiation risk in §6 |

**Do not let the freed hours quietly become fewer hours.** The margin only materializes if the time goes somewhere deliberate. Track hours per account monthly (`18-kpi-dashboard.md §1`) — if they drift back toward 10, the compression was theoretical.

## 6. The differentiation risk

**If every client site is generated from one template with the same process, they become substitutable — and worse, they compete with each other.** Five HVAC sites in Middle Tennessee built the same way are five sites fighting for the same local SERP with the same structure. Google's local results are explicitly comparative.

This is a real risk and it's the price of the speed. Mitigations, in order of importance:

1. **Category + county exclusivity**, already committed to in `15-objection-handling.md`. Honor it in the agreement — it solves the direct-competition case entirely and is a sales asset besides.
2. **Real content is the differentiator, not layout.** Their actual photos, their actual reviews, their actual service area quirks, their actual pricing. Generated structure + real substance ranks and converts. Generated structure + generated substance is a template with extra steps.
3. **Vary genuinely, not cosmetically.** Different service-page architectures for different business models, not the same site with a different accent color.
4. **Spend some of the freed hours here.** This is the best use of the §5 secondary reinvestment.

## 7. Imagery — where I'd draw a hard line

Generated imagery is the right tool for some things here and the wrong tool for the ones people reach for first.

**Fine to generate or edit:**
- Ad creative backgrounds, abstract elements, gradients, textures
- Icons, illustrative diagrams, process graphics
- Device mockups and layout compositions
- Background cleanup, color correction, cropping, retouching on **real** photos
- Our own marketing assets (the signal report design, landing page graphics)

**Never generate:**
- Photos presented as the client's crew, trucks, office, or completed work
- Faces attached to testimonials or reviews
- Before/after imagery of work that wasn't done
- Anything in a healthcare context — Meta prohibits before/after outright, and fabricated medical imagery is a category of its own

The line is simple: **generated imagery may illustrate, never testify.** A roofing company's website showing an AI-generated roof it never installed is deceptive advertising regardless of intent, and it's exactly the kind of thing that surfaces in a review or a complaint at the worst possible moment. It also violates our own guardrails in `01-positioning.md §7`.

**The practical answer is better anyway.** Real photos of the actual business outperform both stock and generated imagery for local trust — visibly so. Build a capture checklist into onboarding:

```
PHOTO CHECKLIST — 30 minutes on your phone, no photographer needed

□ 3 shots of your crew (working, not posed)
□ Your truck / van with the wrap visible
□ Storefront or office exterior
□ 5 completed jobs — wide shot + one detail each
□ Owner headshot, outdoors, natural light
□ Anything with your logo on it

Shoot horizontal. Good light beats a good camera. Send them
however's easiest — text is fine.
```

Sent day 0 with the access checklist (`17-onboarding-and-delivery.md §2`). It costs the client half an hour and it's worth more than anything we could generate.

## 8. Where the constraint moves

The most useful output of this analysis: **once build time collapses, client access becomes the entire critical path.**

Onboarding is 11 hours of our work spread across a calendar that is mostly waiting — for registrar logins, for Meta Business Manager partner acceptance, for photos, for content approval. `17-onboarding-and-delivery.md` already flags access as the #1 cause of delayed launches. Under AI-assisted delivery it isn't the #1 cause, it's effectively the *only* cause.

**Which means the highest-value operational investment is no longer build speed — it's access-collection friction:**

- One-click access request links (Google Ads, GA4, Search Console, GBP, Meta partner) rather than written instructions
- A screen-share slot offered at booking specifically for collecting access live — 15 minutes on a call beats four days of email
- Day-2 phone call if anything is outstanding, not a day-3 email
- Photo checklist sent day 0 alongside access, not later when it's blocking

**Revised time-to-live target: 10–12 days** (from 24). That's a genuine sales asset — *"live in under two weeks"* is a real differentiator against agencies quoting 6–8 weeks, and it shortens time-to-value, which is a churn lever. Update `17 §1` milestones accordingly once the first three builds have measured actuals.

**Do not compress the expectation-setting.** The kickoff call stays 45 minutes even if the build takes three days. A client who is live in ten days but doesn't understand the ad learning period will still panic in week two.

## 9. Open items

1. **Measure the first three builds honestly** — actual hours per stage, not estimated. Every number in §1 is a hypothesis.
2. **Decide the tooling stack explicitly** and write it down here, including which steps are human-reviewed before anything goes live.
3. **Set the review gate:** nothing reaches a client-visible URL without a human having read every word on it. This is the control that keeps the quality risk in §6 from becoming a reputation problem.
