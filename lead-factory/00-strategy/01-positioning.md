# Positioning & ICP

**Status:** v1 — assumptions flagged inline as `[ASSUMPTION]`. Replace with real data as it lands.

---

## 1. The problem with "targeted"

The source blueprint landed on *targeted* as the differentiating word. That's directionally right and mechanically wrong, for two reasons:

1. **"Targeted" is a claim every agency already makes.** Nobody advertises untargeted ads. The word does no separating work in a prospect's head.
2. **"Powered by Datamoon" makes the moat rentable.** If our positioning names a vendor, any competitor can buy the same vendor and copy the pitch verbatim in a week. Vendors are supply chain, not identity.

The thing that's actually differentiated isn't the data source. It's the **sequence**: we know who is in-market *before* we spend a dollar, so the ad budget only ever touches people already shopping. That's a mechanism, and mechanisms are ownable.

## 2. The positioning statement

> For Nashville-area service businesses doing $500K–$5M a year, Growth Factor builds the two things that actually produce booked jobs — a site that converts and ads pointed only at people already searching — and runs both for one flat monthly fee. We start from in-market signal, so your budget never pays to introduce you to strangers.

**Category:** Not "an agency." **A lead system for service businesses.** Agencies sell effort; systems sell output. Price and scope both defend better inside a system frame.

**Named mechanism:** **In-Market Match** — our process for identifying businesses and buyers actively searching in a category and geography before any spend is committed. Use this name publicly and consistently. Datamoon and any successor vendor stay internal; they are inputs to In-Market Match, never the story.

**One-line version (use on ads, email signature, site hero):**
> Websites and ads that only chase people already looking.

**The promise, ranked:**
1. Booked jobs (the outcome they want)
2. Only spending on in-market buyers (the mechanism that makes it believable)
3. One vendor, one invoice, no finger-pointing between "web guy" and "ads guy" (the operational relief)

Lead with 1. Support with 2. Close residual objections with 3. Never open with 2 — mechanism-first pitches sound like technology sales and invite technology questions.

## 3. ICP — three verticals, not "any niche"

The original plan said "any niche, focus on service businesses." That is not targeting, and it makes every downstream asset generic. Below are three verticals chosen against four filters: **ticket size ≥ $1,500** (one closed job pays a month of fee), **recurring or repeatable demand**, **already ad-aware** (no category education needed), and **local-geo bounded** (our Nashville advantage applies).

### Tier A — Home services, high ticket
HVAC, plumbing, roofing, remodeling/GC, foundation & waterproofing, pool builders, tree service.

- Average job: $4K–$25K. One job returns the annual fee.
- Demand is weather- and failure-driven — search intent is sharp, urgent, and highly detectable.
- Already spend on ads; the conversation is "switch," not "start." Shorter sales cycle.
- **Risk:** the most competitive ad auction of the three. Our answer is intent-first targeting, which is exactly the pitch.

### Tier B — Elective healthcare & personal services
Med spa, cosmetic/implant dentistry, orthodontics, vet specialty, fertility, cosmetic dermatology, physical therapy cash-pay.

- Patient LTV $2K–$15K+. High margin, so ad tolerance is high.
- Notoriously bad websites and slow follow-up — the site half of our bundle does obvious visible work here.
- **Risk:** healthcare advertising restrictions on Meta/Google (no health-condition targeting, limited retargeting). Creative and targeting must be built condition-free. See `02-campaigns/12-ad-creative.md`.

### Tier C — Professional services
Personal injury & family law, estate planning, CPA/tax resolution, commercial insurance agencies, wealth management.

- Case/client value $3K–$50K+. Longest cycle, biggest payoff.
- Heavily reliant on referral, which caps growth — a real pain we can name in the first line of an email.
- **Risk:** legal advertising ethics rules vary by state; TN bar rules apply to client-facing claims we help write. Do not draft claim-of-outcome copy for attorneys without their review.

**Explicitly out of ICP for v1:** restaurants and retail (ticket too low, margin too thin), e-commerce (different playbook entirely, our WordPress + local-SEO stack is the wrong tool), real estate agents (individual agents churn violently; brokerages are fine), anything under ~$300K revenue (can't sustain $1,500/mo plus media).

## 4. Geography

Three concentric rings. They get different treatment, and this is a real strategic distinction the original plan collapsed into "Nashville + region."

| Ring | Definition | Why it's different | Treatment |
|---|---|---|---|
| **Ring 1 — Close** | Davidson, Williamson, Rutherford, Sumner, Wilson counties | We can be in a truck and at their office in 45 minutes | Phone-first. In-person close available. Highest priority regardless of score. |
| **Ring 2 — Regional** | Rest of Middle TN + Clarksville, Murfreesboro exurbs, Bowling Green KY | Local-adjacent, credible "we're local," no in-person | Phone + email. Video close. |
| **Ring 3 — Remote** | Anywhere else in the US | No geo story; competes on mechanism alone | Email + paid only. No outbound calling — call time is scarcer than email volume. |

**Rule:** Ring 1 is never a fallback stage. A Ring 1 prospect with real intent signal gets a human within one business day. See `01-data/07-scoring-and-routing.md`.

## 5. Messaging hierarchy by vertical

Same promise, different first sentence. This is what makes "targeted" true rather than claimed.

| Vertical | Pain we open on | Proof point to build | Words to avoid |
|---|---|---|---|
| Home services | "Your lead flow swings with the weather and your ad spend doesn't." | Cost per booked job, before/after | "Branding," "awareness" |
| Elective healthcare | "You're paying for clicks from people shopping three practices at once." | Cost per consult booked, show rate | Any condition/diagnosis language |
| Professional services | "Referrals are flat and you have no second channel." | Cost per signed case/retainer | Outcome guarantees, "best," "top" |

## 6. Proof strategy (the actual gap)

At $1,500/mo cold, the binding constraint is not targeting — it's **belief**. The plan currently has zero proof assets. Priority order to build:

1. **Three named case studies, one per tier**, with a real number in the headline. If they don't exist yet, run the first three clients at a documented discount in exchange for named results rights. Write the discount into the agreement as consideration.
2. **A live "signal report"** — the single best sales asset available. Before a call, pull real in-market counts for that prospect's category and county and show them: *"In the last 30 days, 412 people in Williamson County searched for emergency HVAC replacement. Here's what your competitors paid to reach them."* This converts because it's about them and verifiable.
3. **Screen-recorded teardown** of the prospect's current site and ads, 3–4 minutes, sent unsolicited to top-tier leads. Highest-cost, highest-converting asset we have. Reserve for Ring 1 + score ≥ 70.

## 7. What we are *not* claiming

Guardrails, because these get us in trouble and are easy to slip into under sales pressure:

- We do not claim a specific number of leads before we have vertical-level data to support it. Guarantee language lives in `02-offer-architecture.md` and nowhere else.
- We do not claim to know that a *named individual* searched for something. Our data is business- and audience-level signal. Claiming individual-level surveillance is both a positioning mistake and a privacy problem. See `00-strategy/05-compliance.md`.
- We do not claim Google/Meta partnership, certification, or preferred status we don't hold.
- We do not name a client without written permission.
