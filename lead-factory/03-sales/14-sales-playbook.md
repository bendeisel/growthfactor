# Sales Playbook

The operating manual for anyone selling Lead Factory. Written to be imported into Notion — each `##` becomes a page, each `###` a toggle.

**The one-line philosophy:** we are diagnosing, not pitching. A prospect who talks themselves into the problem doesn't need to be talked into the solution. Every mechanic below exists to keep the rep asking rather than presenting.

---

## 1. Pipeline stages

| Stage | Entry criteria | Exit criteria | Owner | Max age |
|---|---|---|---|---|
| **1. New** | Scored, band A/B, not suppressed | First touch made | System | 2 days |
| **2. Working** | In sequence and/or call cadence | Human reply received | Rep | 21 days |
| **3. Engaged** | Any human reply | Meeting booked or disqualified | Rep | 10 days |
| **4. Meeting Booked** | Calendar hold exists | Meeting held | Rep | until date |
| **5. Discovery Held** | 20-min call completed | Proposal sent or disqualified | Rep | 3 days |
| **6. Proposal** | Written proposal + Loom sent | Signed or lost | Rep | 14 days |
| **7. Won** | Agreement signed, payment method on file | Onboarding kickoff booked | Rep → Delivery | 3 days |
| **8. Nurture** | Not now, with a **dated** re-entry | Re-entry date reached | System | — |
| **9. Lost** | Explicit no, or 3 unanswered proposal follow-ups | Reason logged, nurture date set | Rep | — |

**Two rules that keep the pipeline honest:**

1. **Nothing sits past its max age.** A deal older than its stage limit is either advanced, or moved to nurture with a date. A pipeline full of stale deals is a pipeline you can't forecast from, and it's the most common form of self-deception in sales.
2. **Every exit to Lost or Nurture requires a reason code.** Price, timing, budget, no response, competitor, bad fit, no authority. This is how the scoring model gets recalibrated (`01-data/07-scoring-and-routing.md §6`) — without reason codes, we learn nothing from losing.

## 2. Qualification — MEDDIC, trimmed to what matters at this deal size

Full MEDDIC is built for six-figure enterprise deals. At $1,500/mo with an owner-decider, four things matter:

| | Question that gets it | Disqualify if |
|---|---|---|
| **Pain** | "If you wanted 20% more jobs next quarter, what's in the way?" | They can't name one. No pain, no sale — move to nurture, don't push |
| **Budget** | "What are you spending on marketing now, all in?" | < $2,500/mo total available (fee + minimum media). Say so honestly and offer Site & Search |
| **Authority** | "Who else weighs in on something like this?" | Not the owner and can't get them on a call |
| **Timing** | "If this made sense, when would you want it live?" | > 6 months out → nurture with a date, don't work it |

**Disqualifying fast is the highest-value skill in this system.** A rep working four dead deals has no capacity for the one live one, and at 10–12 discovery calls a week, capacity is the whole constraint. *"Honestly, I don't think we're the right fit — here's who I'd talk to"* wins referrals and costs nothing.

### Hard disqualifiers
- Under ~$300K annual revenue — can't sustain fee + media
- Won't or can't spend $1,000/mo minimum on media
- Wants performance-based / rev-share pricing (see `15-objection-handling.md`)
- Outside ICP verticals with no adjacent fit
- Wants a one-time build with no ongoing relationship (**refer it out** — a good referral to a freelancer earns goodwill and reciprocal referrals)
- Has sued or publicly attacked a previous vendor
- Won't grant access to their own accounts

## 3. The discovery call — 20 minutes, five parts

**Rule: rep talks less than 40% of the time.** If the recording shows otherwise, the call was a pitch, and pitches at this stage lose to diagnoses.

### Part 1 — Frame (2 min)
```
"Thanks for the time. Here's what I want to do with 20 minutes: I'll ask
you about how leads come in now and where it's breaking. Then I'll show
you the actual search data for {{service}} in {{county}} — that's yours
either way.

At the end, one of two things is true. Either I think we can help and
I'll tell you exactly what it'd cost, or I don't and I'll tell you that
too. Sound alright?"
```
*Setting up "or I'll tell you no" is the single most disarming sentence available. It removes the pressure that makes people defensive, and it makes the eventual yes mean something.*

### Part 2 — Diagnose (8 min — the most important part of the call)

Ask, listen, don't solve yet. **Resist the urge to fix the first problem they name.** The first problem is rarely the real one.

- "Walk me through how a new customer finds you today."
- "Roughly what's the split — referral, search, repeat?"
- "What have you tried that didn't work?" → then: **"What do you think went wrong?"**
- "What's a customer worth to you, first job and over time?"
- "When someone calls and doesn't book — what happens next?"
- "If we're talking a year from now and you're happy, what changed?"

**Write down their exact words.** The proposal, the follow-up email, and every future conversation should use their language, not ours. A prospect who reads their own sentence in a proposal feels understood in a way no amount of polish achieves.

### Part 3 — Show the data (5 min)
Share screen. Their county, their category. Search volume, competitor count, estimated spend, seasonality.

```
"So here's {{county}} for {{service}}. {{volume}} searches last month.
{{n}} companies bidding. Here's roughly what a click costs.

You're visible for about {{x}} of these. The gap is the opportunity."
```
**Do not pitch over this slide.** Let them react. The reaction — *"that many?"* or *"I had no idea Smith was spending that"* — is the buying signal, and it arrives on its own if you're quiet.

### Part 4 — Prescribe (3 min)
Only now. And prescribe from *their* stated problem, in *their* words:

```
"Based on what you said — {{their exact words about the constraint}} —
here's what I'd actually do.

[Specific: site rebuilt around one conversion path / ads restricted to
in-market terms in these three counties / call tracking so you know which
half is working]

That's our Lead Factory package. $1,500 a month, six-month term. You pay
Google and Facebook directly on your own card — we never touch your budget.

And if we don't produce qualified leads in 90 days, we keep working free
until we do."
```

### Part 5 — Close to a next step (2 min)
```
"What's your reaction?"
```
Then silence. Let them fill it.

- **Positive** → *"I'll have a proposal to you tomorrow with a short video walking through it. Can we put 15 minutes on the calendar Thursday to make the decision either way?"* — **always book the decision call before ending.** A proposal sent into an empty calendar is a proposal that dies of neglect.
- **Hesitant** → *"What's the part you're unsure about?"* Handle it, then close to the same next step.
- **No** → *"Totally fine. Can I ask what makes it a no?"* Log the reason. Ask for a referral. Send the data anyway.

## 4. What never happens on a discovery call

- **No proposal on the call.** Deals closed under time pressure churn; the client never fully bought.
- **No discounting.** Ever, on a first call. Concessions come from the ladder in `00-strategy/02-offer-architecture.md §3`, and only later.
- **No slide deck.** A deck turns a conversation into a presentation and the rep into a talker.
- **No promising a lead number** we don't have vertical data to support.
- **No trashing a competitor or incumbent.** It reads as insecurity and they may still like the person.
- **No "let me check with my team."** The rep owns the answer or says *"I don't know — I'll find out today."* Not knowing is fine; pretending isn't.

## 5. The cadence, end to end

```
Day 0    Band A record enters → scored, routed, assigned
Day 0    Email E1 sends
Day 1    Call attempt 1 (Ring 1/2 only) → VM + email within 5 min
Day 2    Teardown video recorded (Band A, Ring 1)
Day 3    Email E2 (same thread) · Call attempt 2, different hour
Day 5    Call attempt 3
Day 7    Email E3
Day 9    Call attempt 4
Day 12   Email E4 (first calendar link)
Day 14   Call attempt 5
Day 17   Email E5
Day 19   Call attempt 6 — final
Day 21   Email E6 breakup
Day 22   → Nurture, dated re-entry at 90 days
```

**6 calls and 6 emails over 21 days.** More is diminishing and complaint-generating; less leaves money on the table. `[ASSUMPTION]` — measure where replies actually cluster and cut the tail once there's data.

## 6. Daily and weekly rhythm

**Daily (rep)**
- 8:00–9:30 · call block 1
- 9:30–10:00 · replies, SLA sweep (1-hour reply SLA on positive replies)
- 10:00–12:00 · discovery calls
- 1:00–3:00 · proposals, teardown videos, follow-up
- 3:00–4:00 · CRM hygiene — **log everything the same day**
- 4:00–5:30 · call block 2

**Weekly (team, 30 min, Monday)**
1. Numbers first: meetings booked, held, proposals, closed, new MRR — versus target
2. Every deal in stage 6 (Proposal), by name, with a next step and a date
3. Anything past its max stage age — advance or kill, decided in the room
4. Loss reasons from last week — **is a pattern forming?**
5. One thing to change this week. One.

**Monthly**
- Scoring model recalibration (once ≥20 closed-won)
- Sequence performance review, retire the worst-performing email
- Segment volume vs. plan (the §3 gap decision in `01-data/06-datamoon-buckets.md`)
- Discount register review — **>20% of deals discounted means the price or the proof is wrong, not the rep**

## 7. CRM — required fields

Non-negotiable, because everything else in this plan reads from them:

`segment` · `fit_score` · `band` · `ring` · `vertical` · `source` · **`self_reported_source`** *(asked on every call)* · `stage` · `stage_entered_at` · `owner` · `next_step` · `next_step_date` · `pain_verbatim` · `budget_stated` · `authority_confirmed` · `timing` · `loss_reason` · `nurture_reentry_date` · `discount_applied`

**`next_step` and `next_step_date` are mandatory on every open deal.** A deal without a next step isn't a deal, it's a hope. This one rule does more for forecast accuracy than any tooling.

## 8. Ramping a new rep

| Week | Focus |
|---|---|
| 1 | Read this repo end to end. Listen to 10 recorded calls. Sit in on 3 discoveries |
| 2 | Own the email replies and call blocks. Founder joins every discovery |
| 3 | Run discoveries solo, founder silent on the line, debrief after |
| 4 | Solo, reviewed weekly on recordings |

**Certification before solo selling:** can state the price, term, exclusions, and guarantee conditions from memory, without notes, correctly. Every one. Getting the ad-spend exclusion wrong on a live call costs a deal and, worse, sets up a client relationship on a false premise.
