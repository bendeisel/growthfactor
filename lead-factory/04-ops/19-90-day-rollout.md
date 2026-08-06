# 90-Day Rollout

The original blueprint ends with six next steps, no owners, no dates, and no ordering. This is the sequenced version.

**The critical path is domain warmup.** Nothing about copy, data, or offer design matters if there's nowhere to send from, and warmup takes 3–4 weeks of wall-clock time that cannot be shortened by working harder. Week 1, day 1.

**Owner column:** `B` = Ben/founder · `D` = delivery · `S` = sales (may be the same person early on) · `L` = legal/external.

---

## Phase 0 — Week 1: Unblock the critical path

Almost nothing here is strategic. It's all latency removal.

| # | Task | Owner | Blocks |
|---|---|---|---|
| 0.1 | **Register 5 sending domains, create 15 mailboxes, configure SPF/DKIM/DMARC, start warmup** | B | **Everything** |
| 0.2 | Engage attorney for the compliance review (`00-strategy/05-compliance.md`) | B/L | First send |
| 0.3 | Datamoon: account, DPA request, provenance questions in writing | B | Data pipeline |
| 0.4 | **Manual pull of segments 1–3 (~125 records). Hand-enrich 25. Read them.** | B | The whole premise |
| 0.5 | CRM configured with the required fields from `18 §6` | B | All measurement |
| 0.6 | Reactivation list built: every past client, dead quote, stalled lead | B | Week 2 sends |
| 0.7 | Decide the target: **5 clients/mo (needs a delivery hire) or 2–3 (solo)** | B | Everything downstream |

**Task 0.4 is the most important thing in this entire document.** One afternoon of reading 25 real enriched records answers the question the whole plan rests on: *is this data good enough to build a business on?* If the answer is no, we've spent an afternoon instead of a quarter.

**Task 0.7 is a real decision, not a formality.** 5 clients/month requires 115 hours of onboarding — more than a full-time person — on top of servicing. Choosing 5 without hiring guarantees a delivery failure in month two. Choose deliberately.

**Week 1 gate:** warmup running, first real records read, target chosen.

## Phase 1 — Weeks 2–4: Build while warming

Mailboxes can't send yet. Use the time.

| # | Task | Owner |
|---|---|---|
| 1.1 | Build `/signal-report` page + form + fulfillment workflow | D |
| 1.2 | Build `/leads` page with pricing published | D |
| 1.3 | Load all email sequences into the outbound tool, with fallback logic on every merge field | S |
| 1.4 | Build the signal report template — the actual deliverable, designed once, generated per prospect | B |
| 1.5 | Automate pull → dedupe → suppress for segments 1–3 | B |
| 1.6 | Build the suppression list and wire it into the sending tool | B |
| 1.7 | **Run SEQ-REACTIVATION from the primary domain** — warm list, no warmup needed | S |
| 1.8 | Start Ring 1 calling on segments 1 & 2 — **phone needs no warmup** | S |
| 1.9 | MSA, privacy policy, guarantee language finalized with counsel | B/L |
| 1.10 | Google Search campaign C1 built, live at $30/day | D |
| 1.11 | Partner outreach: 10 conversations with web designers, ad freelancers, brokers | B |

> **Weeks 2–4 can and should produce revenue.** Phone, reactivation, partners, and paid search all work on day one. Only cold email is gated on warmup. Treating this as a "build phase" with no selling is the most common way a 90-day plan produces nothing until day 60.

**Week 4 gate:** first meetings booked from phone/reactivation, landing pages live, mailboxes at 30/day.

## Phase 2 — Weeks 5–8: Turn on the machine

| # | Task | Owner |
|---|---|---|
| 2.1 | Cold email live: SEQ-CORE to segments 2–5, **start at 50% of planned volume** | S |
| 2.2 | Enrichment + verification in the pipeline (PageSpeed, ad libraries, platform, GBP) | B |
| 2.3 | Scoring model implemented, bands assigned, routing automated | B |
| 2.4 | SEQ-SITE live to segments 6, 7, 11 | S |
| 2.5 | SEQ-SWITCH live to segments 1, 8, **paired with same-day calls** | S |
| 2.6 | Teardown workflow: 8/week, Band A Ring 1 | S |
| 2.7 | Meta signal-report campaign live at $500/mo | D |
| 2.8 | Retargeting audiences built (traffic now exists to retarget) | D |
| 2.9 | Weekly scorecard running, manual spreadsheet | B |
| 2.10 | **First client onboarded end to end** — document every friction point | D |
| 2.11 | Second wave: 4 more domains, 12 mailboxes, warmup started | B |

**Ramp email at 50% for two weeks.** Full volume on fresh infrastructure with untested copy is how domains get burned in week one. Confirm delivery >97% and complaints <0.1% before going to 100%.

**Week 8 gate:** `[ASSUMPTION]` 2–4 clients signed, deliverability healthy, reply rate ≥3%, first client live and reporting.

## Phase 3 — Weeks 9–13: Tune and decide

| # | Task | Owner |
|---|---|---|
| 3.1 | Full email volume across all segments | S |
| 3.2 | First A/B test: E1 subject line, 400+ sends per arm | S |
| 3.3 | First real case study written from client #1's day-90 data | B |
| 3.4 | Replace E3-alt with the real case study in SEQ-CORE | S |
| 3.5 | Set guarantee number `N` per vertical from actual data | B |
| 3.6 | Cohort tracking + channel CAC live | B |
| 3.7 | Client reporting automated | D |
| 3.8 | Second sales/delivery hire decision, against capacity triggers | B |
| 3.9 | Scoring recalibration if ≥20 closed-won records exist | B |
| 3.10 | Quarterly review: pricing, vendor, segment volumes, target | B |

**Week 13 gate — the honest checkpoint.** Four questions, answered with numbers:

1. **Is the data good enough?** Segment volume vs. plan, reply rate by segment. If segments are thin, execute the gap options in `01-data/06 §3`.
2. **Is the offer converting?** Proposal→close vs. the 45% assumption. Below 30% means the offer or the proof, not the copy.
3. **Is delivery holding?** Hours per account vs. 10. Above 12 and margin is gone.
4. **Is CAC under the ceiling?** Fully-loaded vs. $2,000.

**Any two red → stop adding volume and fix the system.** Scaling a broken funnel just spends money faster, and it's the most common failure mode for a plan like this — the machine feels like it's working because activity is high.

## Sequenced dependencies

```
Domain warmup (wk1) ────────────────────► Cold email (wk5)
                                              │
Datamoon + manual pull (wk1) ──► Pipeline (wk5) ──► Scoring (wk6) ──► Routing
                                              │
Landing pages (wk2-4) ──► Paid ads (wk4) ──► Retargeting (wk7)
                                    │
Phone + reactivation (wk2) ──► FIRST REVENUE ──► First client (wk6)
                                                       │
                                          Day-90 data ──► Case study (wk13)
                                                       │
                                          Guarantee number N ──► Full offer
```

Two things to read off this diagram:

- **Phone and reactivation are the shortest path to revenue.** They depend on nothing.
- **The case study is on the critical path for the offer's credibility and can't arrive before week 13**, because it requires 90 days of a real client. Plan the first quarter's messaging around not having one (E3-alt), rather than waiting.

## Budget — first 90 days

| Line | One-time | Monthly |
|---|---|---|
| Domains (9) | $110 | — |
| Mailboxes (27 by month 2) | — | $160 |
| Outbound tool | — | $200 |
| Email verification | — | $50 |
| Enrichment | — | $150 |
| Intent data (Datamoon) | `[TBD]` | `[TBD]` |
| CRM | — | $100 |
| Call tracking + dialer | — | $120 |
| Legal review | $1,500 | — |
| Paid media (from week 4) | — | $1,000 → $3,100 |
| **Total ex-intent data** | **~$1,610** | **~$1,780 → $3,880** |

Against a `[ASSUMPTION]` $2,000 CAC ceiling and a 5-client target, 90-day acquisition spend of roughly $8–12K against 10–15 clients signed is comfortably inside the model — **provided the tenure assumption holds.** It's the number to validate before scaling spend, not after.

## What could go wrong, ranked

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| **Segment volume far below estimate** | **High** | High | Task 0.4 finds this in week 1. Gap options in `01-data/06 §3` |
| Deliverability incident | Medium | High | Warmup discipline, volume caps, weekly monitoring, spare domains |
| Delivery capacity blown by good sales | Medium | **High** | Hard cap 4 new clients/mo/FTE. Waitlist is a legitimate sales tool |
| Reply rates below 2% | Medium | Medium | Copy testing, but check targeting first — it's usually targeting |
| No case study by week 13 | Medium | Medium | E3-alt is designed for exactly this |
| Intent data provenance problem | Low | High | DPA + written answers before scaling (task 0.3) |
| Founder is the bottleneck on everything | **High** | High | The real constraint. Task 0.7 is where it gets confronted |

**The last row is the honest one.** Every task above is assigned to `B` by default because there is currently one person. The plan works at 2–3 clients/month solo. It does not work at 5 without a second person, and deciding that in week 1 costs nothing while discovering it in week 8 costs a quarter.
