# Lead Scoring, Routing & SLA

Scoring exists to solve one problem: **calling hours are the scarcest resource we have.** Email scales; a human dialing does not. The score's only job is to decide who gets a human and in what order.

---

## 1. Fit score — 100 points

Two halves. **Fit** (are they a good client?) and **Intent** (are they in-market now?). Both matter; neither alone is enough. A perfect-fit business with no intent is a nurture record. A red-hot signal from a two-person shop with no budget is a waste of a dial.

### Fit — 50 points

| Signal | Points | Rationale |
|---|---|---|
| **Vertical** | | |
| Tier A/B/C ICP vertical | 12 | |
| Adjacent service business | 6 | |
| Out of ICP | 0 | + auto-band D |
| **Size** | | |
| Revenue est. $1M–$10M | 12 | Sweet spot — can afford us, still owner-decided |
| $500K–$1M or $10M–$25M | 8 | Under: budget strain. Over: procurement, committees |
| < $500K | 2 | Usually can't sustain fee + media |
| **Contact seniority** | | |
| Owner / Founder / President | 10 | One-call close is possible |
| VP/Director/Marketing Manager | 6 | |
| Other/unknown | 2 | |
| **Digital weakness** (the opportunity) | | |
| Mobile PageSpeed < 50 | 8 | Best cold hook available, and true |
| PageSpeed 50–70 | 5 | |
| No site or a page-builder freebie | 8 | |
| **Already advertising** | | |
| Running Google *and* Meta ads | 8 | Budget exists, mechanism understood — easiest sale |
| Running one | 5 | |
| Running none | 2 | Must sell the category first — slower |

### Intent — 50 points

| Signal | Points |
|---|---|
| **Intent type** — `SWITCH` 20 · `BOTH` 17 · `ADS` 12 · `SEO` 8 · `WEB` 8 | |
| **Vendor intent score** — 80–100 → 15 · 60–79 → 10 · 40–59 → 5 · <40 → 0 | |
| **Recency** — `HOT` ≤7d → 10 · `WARM` 8–30d → 6 · `COOL` 31–60d → 2 | |
| **Geo ring** — `R1` 5 · `R2` 3 · `R3` 0 | |

### Bands and modifiers

| Band | Score | Meaning |
|---|---|---|
| **A** | 80–100 | Call today. Teardown video if R1. |
| **B** | 60–79 | Sequence + call if capacity |
| **C** | 40–59 | Email sequence only |
| **D** | < 40 | Nurture or archive. No active outreach. |

**Hard overrides — these beat the score:**
- Suppressed (unsubscribe, complaint, competitor, current client, active deal) → **excluded entirely**, no exceptions
- Out-of-ICP vertical → capped at D regardless of intent
- Email not `verified: valid` → cannot be sequenced
- `dnc_status` not `clear` → cannot be called
- Referral or inbound source → **auto-band A**, bypasses scoring entirely. A warm intro outperforms any cold score.

## 2. Routing

```
                    ┌──────────────┐
   New record ────► │  Suppressed? │──yes──► drop
                    └──────┬───────┘
                           │no
                    ┌──────▼───────┐
                    │  score/band  │
                    └──────┬───────┘
        ┌──────────────────┼───────────────────┬──────────────┐
      Band A            Band B              Band C          Band D
        │                  │                    │              │
   ┌────▼────┐       ┌─────▼─────┐        ┌─────▼─────┐   ┌────▼────┐
   │ R1/R2?  │       │  R1 only? │        │ email seq │   │quarterly│
   └─┬─────┬─┘       └──┬──────┬─┘        │  only     │   │ nurture │
   yes│   no│         yes│    no│          └───────────┘   └─────────┘
      │     │            │      │
 ┌────▼───┐ │      ┌─────▼──┐ ┌─▼────────┐
 │CALL 1bd│ │      │call by │ │email seq │
 │+teardwn│ │      │ day 3  │ │  only    │
 │+email  │ │      │+email  │ └──────────┘
 └────────┘ │      └────────┘
       ┌────▼─────┐
       │email seq │
       │(no call) │
       └──────────┘
```

**Sequence assignment by intent type:**

| Intent | Sequence | Primary offer |
|---|---|---|
| `SWITCH` | `SEQ-SWITCH` | Core |
| `BOTH` | `SEQ-CORE` | Core |
| `ADS` | `SEQ-CORE` (ads-forward variant) | Core, Ads Engine as fallback |
| `WEB` | `SEQ-SITE` | Site & Search, Core as upsell |
| `SEO` | `SEQ-SITE` (SEO-forward variant) | Site & Search |

**Note what this replaces.** The original plan's Stage 2 and Stage 3 were *time-triggered fallbacks* — email them the full offer, wait, then offer less. Here, a website-intent prospect gets the website offer **on the first touch**, because that's what they told us they want. Nobody is ever offered a lower price because they went quiet. That's the whole correction, and it lives in this table.

## 3. SLA — speed is the whole game

Response speed beats nearly every other variable in outbound. Published, measured, and reported weekly:

| Trigger | SLA | Owner |
|---|---|---|
| Inbound form fill or call | **5 minutes**, business hours | Whoever is on duty |
| Inbound after hours | Auto-reply within 5 min, human by 9am | Duty rotation |
| Positive email reply | **1 hour**, business hours | Sequence owner |
| Band A record enters system | Called within **1 business day** | Sales |
| Band A R1 | Teardown video within **2 business days** | Sales |
| Band B R1 | Called within **3 business days** | Sales |
| Meeting booked → confirmation sent | 5 minutes (automated) | System |
| Post-call recap + proposal | **24 hours** | Rep |
| Proposal → first follow-up | 48 hours | Rep |

**Escalation:** any SLA breach older than 2× the window shows on the daily standup board. Not to punish — to surface capacity problems before they look like performance problems.

## 4. Capacity-based throttling

The score's real function is rationing. Weekly capacity per full-time seller `[ASSUMPTION]`:

| Activity | Weekly capacity |
|---|---|
| Dials | 250 |
| Conversations | ~30 |
| Discovery calls held | 10–12 |
| Teardown videos | 8 |
| Proposals | 6 |

**Fill from the top of the score distribution down until capacity is full. Stop.** Everything below the cut line gets email only — that's not neglect, it's the correct allocation. Working a Band C by phone costs the same hour as a Band A and converts at a fraction.

If Band A + B volume exceeds calling capacity for three consecutive weeks, that's the hiring signal — not revenue, not gut feel. Write it down now so it isn't debated later.

## 5. Status model

```
new → sequenced → engaged → meeting_booked → meeting_held → proposal → won
                     │            │               │            │
                     └────────────┴───────────────┴────────────┴──► lost / nurture
```

| Status | Definition | Exit |
|---|---|---|
| `new` | Scored, not yet contacted | Sequence start |
| `sequenced` | In an active sequence | Reply, or sequence end |
| `engaged` | Any human reply | Booked or disqualified |
| `meeting_booked` | Calendar hold exists | Held or no-show |
| `meeting_held` | Discovery completed | Proposal or disqualified |
| `proposal` | Written proposal sent | Won or lost |
| `won` | Agreement signed | → onboarding |
| `lost` | Explicit no or 3 proposal follow-ups unanswered | → nurture with dated re-entry |
| `nurture` | Not now. **Re-entry date required — no exceptions** | Re-score at date |
| `suppressed` | Opted out / complaint / DNC | Terminal |

**`lost` is never terminal.** Every loss carries a reason code (price, timing, competitor, no budget, no response, bad fit) and a re-entry date. Timing losses re-enter at 90 days and are, consistently, some of the easiest wins available — they already understand the offer and someone else already failed them.

## 6. Scoring maintenance

The model above is a guess, and it will be wrong in specific ways that only data reveals. Review monthly once 20+ closed-won records exist:

1. Score distribution of **closed-won** vs. all contacted. If A-band converts no better than B, the weights are noise.
2. Which single signal most separates won from lost? Increase its weight; cut the ones that separate nothing.
3. Any signal with zero correlation gets removed — every field costs enrichment budget and pipeline fragility.
4. Recalibrate band thresholds so Band A stays sized to actual calling capacity, not to a round number.

**Expected finding `[ASSUMPTION]`:** `SWITCH` intent and "already running ads on both platforms" will prove to be the two strongest predictors, because both indicate an existing budget and an existing dissatisfaction. If that holds, weight them up hard and consider building a segment that is *only* those two signals.
