# Data Layer — Segment Taxonomy & Bucket Structure

The original plan called for three buckets: ads intent / website intent / both. That's the right skeleton and too coarse to route on — "both intent" in Ring 3 with no budget signal is a very different prospect from "ads intent" in Williamson County at 40 employees.

This spec is written **vendor-neutral**. Datamoon is the assumed source, but if it underperforms on diligence (`00-strategy/05-compliance.md §5`) or coverage, the taxonomy holds and the source swaps underneath.

---

## 1. Design principles

1. **A bucket exists only if it changes what we do.** If two segments get the same message from the same person on the same day, they're one segment.
2. **Signal decays.** Intent older than 30 days is a cold list wearing a costume. Every record carries a signal date and ages out.
3. **Naming is machine-parseable.** Segment names encode their dimensions so routing rules can read them without a lookup table.
4. **One record, one owner.** A prospect appears in exactly one active sequence at a time. Overlap is the fastest route to a spam complaint.

## 2. The dimensions

Every record is tagged on five axes. Segments are combinations of these.

**A. Intent type** — what they're signaling for
- `ADS` — paid media, PPC, "Facebook ads agency," "Google ads management," "lead generation"
- `WEB` — site build/redesign, "WordPress developer," "website redesign cost," hosting migration
- `SEO` — organic/local search, "rank on Google," "local SEO," GBP terms
- `BOTH` — ≥2 of the above within the window (**highest value**)
- `SWITCH` — competitor/dissatisfaction signal: agency review searches, "fire my marketing agency," competitor brand + "alternative"/"pricing"/"reviews" (**highest value of all, lowest volume**)

**B. Geo ring** — from `00-strategy/01-positioning.md §4`
- `R1` Close (5 core counties) · `R2` Regional · `R3` Remote US

**C. Vertical**
- `HOME` Tier A home services · `HLTH` Tier B elective healthcare · `PROF` Tier C professional services · `OTHR` in-ICP-adjacent, holding pen

**D. Fit score band** — from `07-scoring-and-routing.md`
- `A` 80–100 · `B` 60–79 · `C` 40–59 · `D` <40 (suppress)

**E. Signal recency**
- `HOT` ≤7 days · `WARM` 8–30 days · `COOL` 31–60 days (nurture only) · expire at 60

### Naming convention

```
LF_{INTENT}_{RING}_{VERTICAL}_{BAND}
e.g.  LF_BOTH_R1_HOME_A     LF_WEB_R3_PROF_C
```

Sequences reference segment names directly. Adding a vertical adds segments without touching routing logic.

## 3. The active segment set

Not every combination is worth building — that's 5 × 3 × 4 × 4 = 240 segments and most would hold four records. **Build these 14 at launch:**

| # | Segment | Est. monthly vol `[ASSUMPTION]` | Treatment | Priority |
|---|---|---|---|---|
| 1 | `LF_SWITCH_R1_*_AB` | 15 | **Call day 1** + teardown video | P0 |
| 2 | `LF_BOTH_R1_*_AB` | 40 | **Call day 1** + email sequence | P0 |
| 3 | `LF_ADS_R1_HOME_AB` | 70 | Call day 2–3 + Core sequence | P1 |
| 4 | `LF_ADS_R1_HLTH_AB` | 45 | Call day 2–3 + Core sequence | P1 |
| 5 | `LF_ADS_R1_PROF_AB` | 50 | Call day 2–3 + Core sequence | P1 |
| 6 | `LF_WEB_R1_*_AB` | 90 | Site & Search sequence, upsell path | P1 |
| 7 | `LF_SEO_R1_*_AB` | 60 | Site & Search sequence | P2 |
| 8 | `LF_SWITCH_R2_*_AB` | 25 | Email + call if capacity | P1 |
| 9 | `LF_BOTH_R2_*_AB` | 80 | Core sequence + call if capacity | P1 |
| 10 | `LF_ADS_R2_*_AB` | 220 | Core sequence, email only | P2 |
| 11 | `LF_WEB_R2_*_AB` | 180 | Site & Search sequence | P2 |
| 12 | `LF_BOTH_R3_*_A` | 150 | Core sequence, email only, no calling | P2 |
| 13 | `LF_ADS_R3_*_A` | 400 | Core sequence, email only | P3 |
| 14 | `LF_*_*_*_C` | ~800 | Quarterly nurture newsletter only | P4 |

Rough total addressable ≈ **2,200/mo**, against the 3,300/mo the funnel math wants for 5 clients (`00-strategy/04-funnel-math.md §2`).

> **Gap to close.** If real volumes land near these estimates, the list alone doesn't fund 5 clients/month. Options in order of preference: (a) widen vertical coverage inside Ring 3 — cheapest; (b) add a fourth vertical; (c) supplement with firmographic-only lists at lower conversion; (d) lower the target to 3/mo and lean on partner and paid channels. **Decide this in week 3 once the first real pull lands, not in month two.** Volume validation is the single most important early experiment in this plan.

## 4. Record schema

Minimum viable fields. Everything downstream — scoring, personalization, routing — depends on these existing and being clean.

| Field | Type | Source | Required | Used by |
|---|---|---|---|---|
| `record_id` | uuid | generated | ✅ | dedupe |
| `company_name` | text | vendor | ✅ | personalization |
| `website` | url | vendor/enrich | ✅ | scoring, teardown |
| `domain` | text | derived | ✅ | dedupe key |
| `contact_first_name` | text | enrich | ✅ | personalization |
| `contact_last_name` | text | enrich | | |
| `contact_title` | text | enrich | ✅ | scoring (decision-maker) |
| `email` | email | enrich | ✅ | sending |
| `email_verified` | enum valid/risky/invalid | verification | ✅ | **send gate — valid only** |
| `phone` | e164 | enrich | | calling |
| `phone_type` | enum mobile/landline | enrich | | **SMS gate — never cold** |
| `dnc_status` | enum clear/listed/internal | DNC scrub | ✅ | call gate |
| `street`,`city`,`state`,`zip`,`county` | text | vendor | ✅ | ring assignment |
| `ring` | enum R1/R2/R3 | derived from county | ✅ | routing |
| `vertical` | enum HOME/HLTH/PROF/OTHR | classified | ✅ | segment, copy variant |
| `naics` / `sic` | code | vendor | | classification |
| `employee_count` | int | vendor | | scoring |
| `revenue_estimate` | int | vendor | | scoring |
| `intent_topics[]` | array | vendor | ✅ | intent type, personalization |
| `intent_type` | enum ADS/WEB/SEO/BOTH/SWITCH | derived | ✅ | segment |
| `intent_score` | int 0–100 | vendor | ✅ | scoring |
| `intent_first_seen`,`intent_last_seen` | date | vendor | ✅ | recency band, expiry |
| `runs_ads_google`,`runs_ads_meta` | bool | enrich (ad libraries) | | scoring, copy angle |
| `site_platform` | text | enrich (BuiltWith-style) | | scoring, copy angle |
| `site_mobile_speed` | int 0–100 | PageSpeed API | | **scoring + the best cold-email hook we have** |
| `gbp_review_count`,`gbp_rating` | int/float | enrich | | scoring, copy angle |
| `fit_score` | int 0–100 | computed | ✅ | band, routing |
| `score_band` | enum A/B/C/D | derived | ✅ | routing |
| `segment` | text | derived | ✅ | sequence assignment |
| `suppression_reason` | enum/null | suppression check | ✅ | **hard send gate** |
| `owner` | user | routing | | accountability |
| `status` | enum new/sequenced/replied/meeting/won/lost/nurture/suppressed | workflow | ✅ | state |

**The four enrichment fields — `site_mobile_speed`, `runs_ads_*`, `site_platform`, `gbp_*` — are what make the email copy specific rather than generic.** They're also the cheapest lift in the whole build: PageSpeed and the Meta/Google ad libraries are free APIs. Do not skip this step to save a week; it is worth more than any copy iteration.

## 5. Pipeline

```
1. PULL       Vendor query per segment definition, weekly, Monday 6am
2. DEDUPE     By domain, then by email. Existing record → update intent, don't re-add
3. SUPPRESS   Global suppression list. Drop, don't flag
4. GEO        County → ring. Non-US → drop (see compliance §3)
5. CLASSIFY   NAICS/site content → vertical. Unclassifiable → OTHR holding pen
6. ENRICH     Contact + email + phone; PageSpeed; ad libraries; platform; GBP
7. VERIFY     Email verification. Anything not `valid` never sends
8. SCRUB      DNC federal + TN + internal, for records with phone
9. SCORE      fit_score → band (see 07)
10. SEGMENT   Assign LF_ name
11. ROUTE     Band A/B → owner + sequence; C → nurture; D → archive
12. LOG       Row counts at every step
```

**Step 12 is not optional.** The most common silent failure in a pipeline like this is a step dropping 80% of records for a boring reason (enrichment provider rate-limited, geo lookup failing on a county spelling) and nobody noticing for three weeks because the output still looks like a list. Log counts in and out at every step and alert on a >30% week-over-week swing at any stage.

## 6. Refresh cadence

| Job | When | Notes |
|---|---|---|
| Full segment pull | Weekly, Mon 6am | Fresh signal in before the week's sends |
| `SWITCH` + `BOTH` R1 pull | **Daily** | Perishable and highest-value — a switch signal is worthless in 10 days |
| Enrichment refresh on active records | Every 30 days | Contacts churn |
| Recency re-band | Nightly | HOT→WARM→COOL→expire |
| Suppression sync | On every write | Never batched |
| Segment volume report | Weekly, Mon 9am | Feeds the §3 gap decision |

## 7. Quality gates

A pull is rejected and re-run if any is true:

- Email-verified rate < 70% → enrichment or source problem
- Records missing `county` > 10% → ring assignment unreliable, routing will misfire
- Duplicate rate vs. existing DB > 40% → we've exhausted the segment; widen or rest it
- `intent_last_seen` median > 21 days → we're buying stale signal, escalate to vendor
- Any record with a non-US address → geo filter has failed, **halt the pipeline** (compliance)

## 8. What to build first

Don't build the whole pipeline before validating the premise. Sequence:

1. **Week 1 — manual pull of segments 1, 2, 3 only** (~125 records). Export to sheet. Hand-enrich 25. Read them. **Are these real businesses we'd actually want as clients?** This one afternoon answers the most important open question in the plan and costs nothing.
2. **Week 2** — automate the pull + dedupe + suppress path for those three segments. Everything else stays manual.
3. **Week 3** — enrichment and verification. This is where the copy hooks come from.
4. **Week 4** — scoring, routing, remaining segments.

If step 1 shows the data is thin or the businesses are wrong, we've spent an afternoon instead of a month.
