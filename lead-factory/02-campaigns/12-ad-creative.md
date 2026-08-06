# Paid Media & Creative

Our own advertising — not what we run for clients. Three jobs: **capture** people already searching for what we sell, **retarget** everyone the outbound machine touches, and **distribute** the signal report as a lead magnet.

---

## 1. The dependency the original plan missed

The blueprint puts retargeting ads in Stage 1 against a cold intent list. **You cannot retarget a list.** Retargeting requires either a pixel fire (they visited a property of ours) or a matched custom audience (we upload hashed emails and the platform finds matching accounts).

Match rates on cold B2B lists run **20–50% on Meta and lower on Google**, because business emails frequently aren't the email attached to a personal ad account. So:

- **Every outbound email drives toward a pixeled destination** — the signal report page, the teardown page, the site. Retargeting audiences are *built by outbound*, not parallel to it.
- **Upload matched audiences anyway** for the 20–50% that hit, but budget as if it's 30%.
- **Sequence matters:** outbound touch → site visit → retargeting. A retargeting budget spent before there's traffic to retarget is spent on nothing.

## 2. Budget

`[ASSUMPTION]` $3,100/mo total, against a $2,000 CAC ceiling (`00-strategy/03-unit-economics.md §2`).

| Line | Budget | Target | Expected |
|---|---|---|---|
| Google Search — high intent | $1,800 | CPL < $150 | ~15 leads/mo |
| Meta — signal report lead magnet | $500 | CPL < $60 | ~10 leads/mo |
| Retargeting — Meta + Google Display | $500 | 15% lift on all conversions | — |
| Creative production | $300 | — | — |

**Before 10 accounts** (break-even), run only the Google Search line. Paid media is the right investment *after* the outbound machine has proven the offer converts, not before — otherwise you're buying traffic for a pitch you haven't validated.

## 3. Google Search

### Campaign structure

| Campaign | Match | Daily | Intent |
|---|---|---|---|
| **C1 — Category, geo-locked** | Phrase + exact | $30 | "marketing agency nashville," "digital marketing company nashville," "ppc management nashville" |
| **C2 — Service-specific** | Exact | $20 | "google ads management for contractors," "hvac marketing agency," "med spa marketing" |
| **C3 — Competitor** | Exact | $6 | Named competitor + "reviews"/"pricing"/"alternative" |
| **C4 — Problem-aware** | Phrase | $4 | "why aren't my google ads working," "website not getting leads" |

**C1 and C2 are the money.** C3 is cheap and converts unusually well because the searcher is already dissatisfied — same logic as the `SWITCH` segment. C4 is a small, patient bet on top-of-funnel.

**Negatives, applied at account level, day one:** free, cheap, jobs, career, salary, hiring, intern, course, tutorial, how to, diy, template, wordpress theme, "near me" *(when the geo target already handles it)*, reddit, examples, definition. Review the search terms report **weekly for the first month** — this is where the money leaks.

### Responsive Search Ad — C1

**Headlines** (pin H1 to position 1):
```
Nashville Lead Gen, Flat $1,500/Mo    ← pinned
Website + Ads. One Fee. One Team.
Only Chase Buyers Already Looking
90-Day Lead Guarantee
You Pay Google Direct — No Markup
Built For Service Businesses
No % Of Ad Spend. Ever.
See Your County's Search Data Free
```
**Descriptions:**
```
We build the site and run the ads, so nobody gets to blame the other guy.
$1,500/mo flat. You own everything. Leave anytime after 6 months.

Most agencies charge a % of your spend. We don't — you pay the platforms
directly. Get a free in-market demand report for your county.
```

**Price in the ad is deliberate.** It costs clicks and buys qualification. At $150/lead we cannot afford tire-kickers, and "flat $1,500/mo" filters the $300/mo shoppers before they cost us anything.

**Extensions:** sitelinks (Pricing / How It Works / Free Signal Report / Results) · callouts (No Setup Fee, You Own Your Accounts, Nashville-Based, 90-Day Guarantee) · structured snippets · call extension during business hours · location extension.

## 4. Meta — signal report campaign

Meta is wrong for capturing demand and right for distributing a lead magnet. Sell the **report**, not the service.

### Audiences

| Audience | Build | Use |
|---|---|---|
| **Matched intent list** | Upload hashed emails from Bands A/B | Highest priority, expect ~30% match |
| **Lookalike 1%** | Seed: closed-won + high-intent site visitors | Scale, once ≥100 seed records |
| **Interest + behavior** | Small business owners, 5 core counties, business page admins, interests in the ICP trades | Cold reach |
| **Retargeting — site** | All visitors, 30/60/90-day windows | Highest ROAS |
| **Retargeting — video** | 50%+ viewers of the teardown video | Warm and cheap |

### Primary creative — "The Report"

**Format:** static image or 15-sec text-motion video. Headline burned into the image, because most of this is seen with sound off in a feed.

```
Image text:  412 people in Williamson County searched for
             "emergency AC replacement" last month.
             Here's who got them.

Primary text:
We pull the actual search data for service businesses in Middle Tennessee —
how many people are looking, who's advertising against you, roughly what
they're paying per click.

Free report for your county and your category. No call required, no
obligation. You just get the numbers.

(We're a Nashville agency. Yes, this is also how we find clients. Seemed
more useful than another ad about "growing your business.")

Headline: Free In-Market Demand Report
CTA: Download
```
*The parenthetical is doing real work — naming the ad's own purpose disarms the reflexive skepticism that kills agency ads, and it's honest.*

### Secondary creative — "The Two Problems"
```
Image text:  Your ads work and your site leaks.
             Or your site's fine and your ads chase everybody.
             It's almost always one of the two.

Primary text:
We do both, for one flat fee. $1,500/mo, you pay Google and Facebook
directly on your own card. No percentage of your spend, no setup fee, and
you own everything if you leave.

90 days. If you're not getting qualified leads, we work free until you are.

Headline: Nashville Lead Gen — $1,500/Mo Flat
CTA: Learn More
```

### Retargeting creative — by page visited

| They saw | Ad angle |
|---|---|
| Homepage, no action | The guarantee. Risk reversal is what stalled them |
| Pricing page | "You already know the price. Here's what's in it." Full scope breakdown |
| Signal report page, didn't convert | "The report's still yours — 30 seconds" |
| Report downloaded, no meeting | Teardown offer: "Want me to record one for your site?" |
| Booked, no-show | "We missed each other — grab any slot" |

## 5. Creative angle library

Rotate every 3–4 weeks; a Meta creative in a local audience this small fatigues fast.

| # | Angle | Hook |
|---|---|---|
| 1 | **The data** | Real search volume for their county — most credible, best performer |
| 2 | **The two problems** | Site leaks vs. ads unfocused |
| 3 | **The % of ad spend** | "Your agency makes more when you spend more" — genuine industry indictment, resonates hard |
| 4 | **Account ownership** | "Can you take your ad history with you? Check." |
| 5 | **The guarantee** | 90 days or we work free |
| 6 | **One vendor** | No more web guy blaming the ads guy |
| 7 | **The teardown** | Free video breakdown of their site + ads |
| 8 | **Local** | Nashville-based, we'll come to you |
| 9 | **Speed to lead** | "How long before someone calls a new lead back?" |
| 10 | **Anti-pitch** | "You probably don't need us. Here's how to tell." |

Angles 3 and 4 are the strongest available because they're true, specific, checkable, and they reframe the category on terms where we win by default. Lead with them.

## 6. Vertical restrictions — read before writing a single ad

**Healthcare (Tier B):** Meta and Google both prohibit ad content and targeting that implies knowledge of a health condition. **No before/after imagery on Meta at all.** When advertising *for* health clients: no condition references, no personal attributes, no "you" statements implying a diagnosis. Retargeting from health-related pages is restricted. Build creative around the *practice* (the business), not the *patient*.

**Legal (Tier C):** TN Rules of Professional Conduct 7.1–7.5 govern attorney advertising. No outcome claims, no "specialist" without certification, no testimonials implying predicted results. **All attorney-facing creative gets written client sign-off before it runs** — put it in the agreement.

**Home services (Tier A):** license number display required in many trades and jurisdictions. Confirm at onboarding.

**Our own ads:** no fabricated results, no invented scarcity, no client names without written permission, and no claimed Google/Meta partner status we don't hold.

## 7. Measurement

| Metric | Target | Action |
|---|---|---|
| Google Search CPL | < $150 | > $200 for 2 weeks → pause C3/C4, consolidate to C1/C2 |
| Google lead → meeting | > 40% | Below → landing page or lead quality problem |
| Meta report CPL | < $60 | > $100 → creative fatigue, rotate angle |
| Report → meeting | > 15% | Below → the follow-up sequence, not the ad |
| Retargeting frequency | < 4/week | Above → burning goodwill and budget |
| Blended paid CAC | < $2,000 | Above for a full month → cut paid, reallocate to outbound and partners |

**Attribution:** UTM every destination, server-side conversion tracking where possible, and — most importantly — **ask on every discovery call: "how'd you come across us?"** Self-reported attribution is imprecise and still beats a platform grading its own homework. Log it as a required CRM field.
