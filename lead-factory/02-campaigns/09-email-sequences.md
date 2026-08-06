# Email Sequences — Full Copy

Four cold sequences plus five lifecycle sequences. All copy is written to be sent **plain text, no images, no tracking pixel, minimal links** — see `01-data/08-sending-infrastructure.md`.

---

## Copy principles

1. **Under 90 words on the first touch.** Cold email is read on a phone in a truck cab between jobs. Anything requiring a scroll is deleted.
2. **The first line is about them, never us.** If the opening sentence could be sent to any of 3,000 people, it will perform like it was.
3. **One ask per email.** Two asks is zero asks.
4. **No link in email 1.** Links depress deliverability and imply work.
5. **Interest-based CTA, not calendar-based.** "Want me to send it?" outperforms "book 15 minutes" by a wide margin on cold — it costs the reader nothing and starts a conversation instead of demanding a commitment.
6. **Write at an 8th-grade level.** Not because the reader is unsophisticated — because they're busy.
7. **Every sequence ends politely.** The breakup email is consistently among the highest-reply messages in any sequence, and a graceful exit preserves the nurture path.

### Merge fields

`{{first_name}}` `{{company}}` `{{city}}` `{{county}}` `{{service}}` (e.g. "HVAC replacement") `{{mobile_speed}}` `{{platform}}` `{{competitor_count}}` `{{search_volume}}` `{{ad_platforms}}` `{{review_count}}`

**Every merge field needs a fallback.** A single `Hi {{first_name}},` rendering as `Hi ,` on 400 sends is worse than not personalizing at all. Fallback rules: `first_name` → "there"; anything numeric → **drop the whole sentence via conditional block, never substitute a guess.**

---

# SEQ-CORE — for `ADS` and `BOTH` intent

**Segments:** 2, 3, 4, 5, 9, 10, 12, 13 · **Offer:** Core ($1,500/mo) · **Length:** 6 emails / 21 days

### E1 — Day 0 · The signal
**Subject:** `{{county}} {{service}} searches`

```
Hi {{first_name}},

Last month there were about {{search_volume}} searches in {{county}} from people
looking for {{service}} — and {{competitor_count}} companies bidding to be the
one they find.

I pulled the numbers for your category while researching {{city}} service
businesses. Happy to send you the breakdown — who's spending, what it's
costing them, where the gaps are.

Want it?

Ben
```
*Why it works: opens on their market, not our service. The ask is for permission to send information, which is nearly free to say yes to. Zero links. The data is real and verifiable, which is the entire moat.*

**Fallback if `search_volume` is unavailable:**
> `There are {{competitor_count}} companies bidding on {{service}} searches in {{county}} right now. I pulled the breakdown while researching {{city}} service businesses — who's spending, what it's costing, where the gaps are.`

### E2 — Day 3 · The site problem *(same thread, reply to E1)*
**Subject:** *(reply — no subject)*

```
{{first_name}} — one more thing I noticed.

{{company}}'s site scores {{mobile_speed}}/100 on Google's mobile speed test.
Under 50 usually means about half the people who click an ad leave before the
page finishes loading.

Which matters because it means you'd be paying for those clicks twice — once
to get them, once to get them back.

That's the piece most agencies won't touch. We do both, which is the only
reason I'm bothering you.

Ben
```
*Specific, verifiable, and it names the exact reason the bundled offer exists. Conditional block — only sends when `mobile_speed` < 60. Otherwise use the E2-alt below.*

**E2-alt** (site speed is fine):
```
{{first_name}} — following up.

You're running {{ad_platforms}} already, so you're past the "should we
advertise" conversation.

The question I'd ask instead: do you know what a booked job costs you right
now, by channel? Most {{service}} companies I talk to know their ad spend
and their revenue but nothing in between.

We can usually find 20-30% of a budget going to searches that were never
going to buy. Want me to look at yours?

Ben
```

### E3 — Day 7 · Proof
**Subject:** `how {{vertical_example}} did it`

```
{{first_name}},

Quick story instead of a pitch.

[CLIENT] in [CITY] was spending $[X]/mo on Google ads and getting leads,
but couldn't tell which ones turned into jobs. We rebuilt the site around
one conversion path, put call tracking on everything, and pointed the ads
only at people already searching in their service area.

90 days: cost per booked job went from $[X] to $[Y]. Same budget.

Same setup would take about three weeks for {{company}}. Worth a look?

Ben
```
> **⚠️ Do not send E3 until a real case study exists.** Fabricating one is both dishonest and pointless — the first prospect who asks a follow-up question exposes it. Until then, run **E3-alt**:

**E3-alt — the honest version, which converts fine:**
```
{{first_name}},

I'll be straight with you: we're building our {{vertical}} portfolio right
now, which is exactly why I'm reaching out to you and not sitting back
waiting for referrals.

What that means for you — you'd get founder-level attention instead of being
account #40 at an agency, and I'd rather prove it than argue about it.

I'll do a free teardown of your site and current ads. 10 minutes of video,
no call required, yours whether we work together or not.

Want me to record it?

Ben
```
*Turning the lack of proof into a reason to buy is more credible than pretending you have proof. It also generates a teardown, which is our highest-converting asset.*

### E4 — Day 12 · The objection, pre-answered
**Subject:** `the part nobody tells you`

```
{{first_name}} —

Most {{service}} owners I talk to have been burned by an agency before. Usually
the same way: nice reports, no idea if the phone rang more.

So here's how we're different, in one line: you pay us $1,500/mo, you pay
Google and Facebook directly on your own card, and if we don't produce
qualified leads in 90 days we keep working for free until we do.

No setup fee games, no percentage of your ad spend, no hostage-taking of
your accounts.

If that's worth 15 minutes: [CALENDAR LINK]

Ben
```
*First link in the sequence lands here, on day 12, after four touches. Price is stated plainly — it disqualifies fast and builds trust with the rest. The ad-spend clarification is doing enormous work; make sure it's never omitted.*

### E5 — Day 17 · Different angle, short
**Subject:** `{{company}} — one question`

```
{{first_name}}, honest question:

When someone calls {{company}} and doesn't book, does anyone follow up?

Asking because we usually find more revenue in the leads a business already
has than in new ones. If your follow-up is tight, ads will work great. If
it isn't, no amount of targeting fixes it.

Happy to tell you which one you are, free.

Ben
```
*Sells the diagnosis, not the service. Frequently the highest-reply message in the sequence because it's a genuine question with a useful answer, and it sets up the CRM add-on.*

### E6 — Day 21 · Close the loop
**Subject:** `closing your file`

```
{{first_name}} — I'll stop here.

Three options and I'm good with any of them:

1. "Send the {{county}} numbers" — I'll send them, no call.
2. "Not now, check back in [month]" — I'll set a reminder and go quiet.
3. Nothing — I'll assume it's a no and take you off my list.

Either way, good luck this season.

Ben

Growth Factor · [ADDRESS] · reply "stop" and I won't contact you again
```
*Reliably the #2 reply-generating email. Option 2 is the important one — it converts a dead record into a dated nurture entry.*

---

# SEQ-SITE — for `WEB` and `SEO` intent

**Segments:** 6, 7, 11 · **Offer:** Site & Search ($500/mo + build), Core as upsell · **Length:** 5 emails / 18 days

**Positioning shift:** these people told us they want a website. Sell them the website. Introduce ads only as a consequence of the site being good — never as the opening.

### E1 — Day 0
**Subject:** `{{company}} site`

```
Hi {{first_name}},

Your site's on {{platform}} and scores {{mobile_speed}}/100 for mobile speed.
For a {{service}} company that's the difference between showing up for
"{{service}} {{city}}" and not.

We rebuild sites for service businesses on a system we've already built —
so it's about three weeks, not three months, and it's built to rank and
convert rather than to win a design award.

Want to see what it'd look like for {{company}}?

Ben
```

### E2 — Day 3 *(same thread)*
```
{{first_name}} — the specific thing I'd fix first:

You've got {{review_count}} Google reviews and they're not on your site,
and your Google Business Profile isn't set up to feed them there.

That's usually a same-week fix and it moves both rankings and close rate,
because the people who find you are already comparing you to two other
companies.

Want me to record a quick walkthrough of what I'd change? No call needed.

Ben
```

### E3 — Day 8
**Subject:** `what a site should actually cost`

```
{{first_name}},

Since you're probably getting quotes — here's the range you'll see and
what's behind it:

$500-2,000: template, no strategy, you'll redo it in 18 months
$5,000-15,000: custom build, usually good, usually slow, then you're alone
$25,000+: agency retainer, you're funding their office

We do it differently: $1,500 to build on our system, then $500/mo to host,
maintain, secure it, and do the SEO work that makes it worth having.

You own the site. Leave whenever you want and take it with you.

15 minutes if you want to see it: [CALENDAR LINK]

Ben
```
*Naming competitors' price ranges honestly is disarming and positions our price without defending it.*

### E4 — Day 13 · The upsell bridge
**Subject:** `after the site`

```
{{first_name}} — one thing worth saying before you decide.

A new site by itself usually moves the needle a little. A new site plus ads
pointed only at people already searching for {{service}} in {{county}} moves
it a lot, because the site finally has something to convert.

That's our $1,500/mo package — site, SEO, and two ad channels, one invoice.
You'd pay the ad platforms directly.

Not pushing you there. But if the goal is more booked jobs and not just a
nicer site, it's the honest recommendation.

Ben
```

### E5 — Day 18 · Breakup
**Subject:** `closing your file`
*(same structure as SEQ-CORE E6, with "send the site walkthrough" as option 1)*

---

# SEQ-SWITCH — for `SWITCH` intent · **highest value, lowest volume**

**Segments:** 1, 8 · **Length:** 4 emails / 12 days · **Always paired with a phone call, Ring 1**

These people are actively unhappy with a current provider. Speed and specificity matter more than cleverness. **Do not badmouth the incumbent** — it's unattractive and they may still like them personally.

### E1 — Day 0
**Subject:** `switching agencies`

```
Hi {{first_name}},

If you're weighing a change on the marketing side — two things worth
checking before you sign anywhere else:

1. Do you own your ad accounts, or does the agency? (If they do, you can't
   leave with your history, and that history is worth real money.)
2. Are you paying a % of ad spend? (Then they're incentivized to spend more,
   not to spend well.)

We do neither. Flat $1,500/mo, you own everything, you pay the platforms
directly.

Happy to look at what you've got and tell you whether it's worth moving.
No pitch.

Ben
```
*Gives away genuinely useful advice that happens to indict the standard agency model. It's true, it's checkable, and it reframes the evaluation on terms we win.*

### E2 — Day 2 *(same thread)*
```
{{first_name}} — quick add.

The riskiest part of switching isn't the new agency. It's the two months
where the old campaigns are off and the new ones haven't learned yet.

We handle that by running parallel: we build alongside what's live and cut
over only once the new setup is producing. Costs you nothing extra and
removes the gap.

That's usually the thing people are actually worried about.

Ben
```
*Names the real fear behind switching inertia and dissolves it.*

### E3 — Day 6
**Subject:** `the {{county}} numbers`
```
{{first_name}},

Whether or not we ever talk — here's something useful.

I pulled the in-market search data for {{service}} in {{county}}: volume,
who's bidding, roughly what they're paying. If your current agency can't
show you this, that itself is information.

Want me to send it over?

Ben
```

### E4 — Day 12 · Breakup
```
{{first_name}} — last one from me.

If you're staying put, genuinely good — switching is expensive and
disruptive and most people who do it don't need to.

If you do end up looking, my number's below. No sequence, no follow-up,
just call.

Ben
[PHONE]
```

---

# Lifecycle sequences

## SEQ-CONFIRM — meeting booked → held
*Fixing the 30% no-show assumed in the funnel math is worth more than any copy change upstream.*

| When | Channel | Content |
|---|---|---|
| Instantly | Email | Confirmation, calendar invite, **what to bring** (ad account access is not needed — reduce perceived prep), 1-line agenda |
| T−24h | Email | "Still good for tomorrow at [time]? Reply yes or reschedule here." **Requiring a reply is the single biggest lever on show rate.** |
| T−2h | SMS | *Only if they opted in at booking.* "See you at [time] — [link]. Reply R to reschedule." |
| T+10m no-show | Email | "Looks like we got crossed up — here's my calendar, grab any slot." Warm, zero guilt |
| T+1d no-show | Email | Send the teardown video anyway. Converts a meaningful share of no-shows |

## SEQ-PROPOSAL — sent → decision
| Day | Content |
|---|---|
| 0 | Proposal + **2-minute Loom walking through it.** Never send a proposal to be read alone — you lose control of the framing |
| 2 | "Any questions on the [specific section]?" — reference something real from the call |
| 5 | Send a relevant proof asset. New angle, no chase energy |
| 9 | "Where'd this land for you?" — direct, one line |
| 14 | Breakup + 90-day nurture entry |

## SEQ-NURTURE — the long game
Monthly, one email, genuinely useful, **no pitch in 3 of 4**. Rotating themes: local search data for their county, a platform change that affects them, a teardown of an anonymized site, one seasonal-timing note. Fourth month carries a soft offer.

This is where "not now" leads live, and `[ASSUMPTION]` it should produce 15–25% of closed business by month 6. It is the highest-ROI, lowest-effort sequence in the whole system, and it will be the first thing dropped when things get busy. Don't.

## SEQ-REACTIVATION — past clients & dead quotes
Week 1 of rollout. Free, warm, fastest wins available.

```
Subject: been a minute

{{first_name}} — it's Ben at Growth Factor.

We [worked together on X / talked about Y] back in [when]. A lot has
changed since then, mostly that we now run the ads and the site together
instead of just building sites.

No pitch — genuinely curious how {{company}}'s doing on leads these days.
Still [pain point from before]?

Ben
```

## SEQ-ONBOARD — signature → live
See `04-ops/17-onboarding-and-delivery.md`. Summary: day 0 welcome + access checklist, day 1 kickoff booked, day 3 access nudge (**the #1 cause of delayed launches**), day 7 site preview, day 14 ads live, day 30 first report, day 90 guarantee review **+ referral ask**.

---

## Testing plan

Test one variable at a time, minimum 400 sends per arm before reading anything.

| Priority | Test | Why |
|---|---|---|
| 1 | **E1 subject line** | Largest single lever on reply rate |
| 2 | **CTA: "want it?" vs. calendar link** | Interest-CTA should win on cold; verify |
| 3 | Signal-open vs. site-speed-open on E1 | Which hook actually earns the reply |
| 4 | Sequence length 6 vs. 4 | Diminishing returns and complaint risk after E4 |
| 5 | Price in E4 vs. price withheld | Expect stated price to lower reply and raise *qualified* reply |

**Read qualified replies and meetings booked, not opens.** Apple Mail Privacy Protection makes open rate near-meaningless — it's a deliverability canary, not a performance metric.
