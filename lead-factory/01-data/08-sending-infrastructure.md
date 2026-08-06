# Sending Infrastructure & List Hygiene

Operational build sheet for the outbound stack. Policy lives in `00-strategy/05-compliance.md §6`; this is the implementation.

**This is week-1 work.** Warmup takes 3–4 weeks of wall-clock time that cannot be compressed, parallelized, or bought. Every other workstream in the plan can start late without consequence. This one can't.

---

## 1. Domain architecture

```
growth-factor.ai            ← PRIMARY. Clients, billing, transactional. NEVER cold outbound.
│
├── growthfactor-ai.com     ← cold sending #1  ┐
├── getgrowthfactor.com     ← cold sending #2  │  301 → primary site
├── growthfactorleads.com   ← cold sending #3  │  Own SPF/DKIM/DMARC
├── tryGrowthFactor.com     ← cold sending #4  │  Registered ≥30d before first send
└── growthfactor-hq.com     ← cold sending #5  ┘
```

**Rules:**
- Register all secondaries at once, from the same registrar, with matching WHOIS. Aged domains send better; the clock starts at registration, so buy them before you need them.
- Each redirects 301 to `growth-factor.ai`. A recipient who checks the domain must find a real business.
- 3 mailboxes per domain. More concentrates risk; fewer wastes domain cost.
- **If a domain's reputation degrades, retire it — don't rehabilitate it.** A replacement domain costs $12 and 4 weeks. Recovering a burned one costs months and usually fails.

**Sizing** (from `00-strategy/04-funnel-math.md §3`):

| Target | Contacts/mo | Sends/mo | Mailboxes | Domains |
|---|---|---|---|---|
| 2–3 clients | ~2,000 | ~10,000 | 16 | 6 |
| **5 clients** | **3,300** | **16,500** | **27** | **9** |

Start with 5 domains / 15 mailboxes. Add the second wave in month 2 — warmup on the second wave starts in month 1 regardless, so capacity is there when needed.

## 2. DNS records

Per sending domain, before warmup begins:

| Record | Value |
|---|---|
| SPF | `v=spf1 include:_spf.google.com ~all` (adjust to provider; **one SPF record only** — multiple silently break auth) |
| DKIM | Provider-generated 2048-bit key |
| DMARC | Start `v=DMARC1; p=none; rua=mailto:dmarc@growth-factor.ai; pct=100` → move to `p=quarantine` after 2 clean weeks |
| MX | Provider standard |
| Custom tracking domain | Only if link tracking is used — and prefer not to on cold sends |

Verify all three pass before the first warmup email. An unauthenticated first impression damages a fresh domain immediately.

## 3. Warmup schedule

Per mailbox, non-negotiable:

| Week | Sends/day | Activity |
|---|---|---|
| 1 | 5 | Warmup network only. Human-looking replies. |
| 2 | 10 | Warmup network |
| 3 | 20 | 80% warmup / 20% real prospects |
| 4 | 30 | 50/50 |
| 5+ | **30 hard cap** | Real sends; keep ~20% warmup running permanently |

**Never exceed 30/mailbox/day.** The temptation arrives in month two when the pipeline looks thin — adding mailboxes is the answer, raising the cap is not. It works for about ten days and then the domain is gone.

Set the mailbox display name to a real person (`Ben Deisel`, not `Growth Factor Team`), a real signature with the physical address, and a plain-text-first template. Cold email from a brand account converts worse and lands worse.

## 4. Suppression architecture

**One global suppression list. Enforced by the tool, not by discipline.** Anything checked by a person will eventually not be.

| Reason | Source | Duration |
|---|---|---|
| Unsubscribe / "stop" reply | Auto-parse + manual sweep | **Permanent** |
| Spam complaint | Provider feedback loop | **Permanent** |
| Hard bounce | Send response | Permanent |
| Soft bounce ×3 | Send response | Permanent |
| Current client | CRM sync | While active + 12mo |
| Active open deal | CRM sync | While open |
| Competitor / agency | Manual + NAICS | Permanent |
| Personal / do-not-contact request | Manual | Permanent |
| Already in another active sequence | System | Until sequence ends |

**Suppression is checked at pull time *and* at send time.** Records can be added to suppression between the two; a single email to someone who unsubscribed last week is a complaint, and complaints compound.

**Domain-level suppression:** an unsubscribe from `bob@bobshvac.com` suppresses the whole `bobshvac.com` domain. Emailing a colleague of someone who just opted out is the fastest way to earn a complaint instead of a bounce.

## 5. Verification

Every address passes verification before entering a sequence. Non-negotiable gates:

| Result | Action |
|---|---|
| `valid` | Send |
| `catch-all` / `accept-all` | **Hold.** Send only from a designated low-volume "risky" mailbox, capped at 10/day, and monitor bounces separately |
| `risky` / `unknown` | Do not send |
| `invalid` | Suppress permanently |

Re-verify anything older than 60 days before re-sequencing. Business email decays roughly 2%/month.

**Bounce thresholds:** under 2% is healthy. 2–3% investigate today. **Over 3% — stop the campaign, don't diagnose while sending.**

## 6. Monitoring

| Check | Frequency | Trigger |
|---|---|---|
| Blocklist check per domain (Spamhaus, Barracuda, SURBL) | Weekly | Any listing → pull from rotation immediately |
| Google Postmaster Tools | Weekly | Reputation below "High" → cut volume 50% |
| DMARC aggregate reports | Weekly | Auth failures → fix before scaling |
| Bounce rate per domain | Daily | >3% → pause that domain |
| Complaint rate per domain | Daily | >0.1% → investigate. **>0.3% → stop today** |
| Reply rate per domain | Weekly | A domain replying far below its peers is landing in spam |
| Deliverability seed test | Bi-weekly | Inbox placement per major provider |

**The tell that matters most:** a domain whose *reply rate* collapses while its *delivered* rate stays high. That's spam-folder placement, and the delivered metric will happily report success the whole time. Compare domains against each other weekly — a single domain's absolute number tells you almost nothing.

## 7. Rotation & failover

- Distribute each campaign across all healthy mailboxes; never bind a campaign to a single domain.
- Keep 2 mailboxes in reserve, warm and unused, as failover.
- A prospect always receives the entire sequence from **one** mailbox. Rotating mid-thread breaks threading, looks automated, and kills reply rates.
- Retire and replace domains on a rolling basis. `[ASSUMPTION]` expect 12–18 months of useful life per cold domain — budget replacement as a recurring cost, not an incident.

## 8. Stack

| Function | Requirement | Est. cost/mo |
|---|---|---|
| Mailboxes | Google Workspace or MS365, 27 seats | ~$160 |
| Domains | 9 × ~$12/yr | ~$10 |
| Sending / sequencing | Multi-inbox rotation, warmup built in, CRM sync, reply detection | $100–300 |
| Email verification | Bulk + API | ~$50 |
| Enrichment | Contact + firmographic | $100–200 |
| Intent data | Datamoon or equivalent | `[TBD — get quote]` |
| CRM | Pipeline, sequences, call logging, reporting | $50–150 |
| Call tracking | Client-facing, per-account numbers | ~$50 + usage |
| Dialer | Ring 1 calling | $30–100 |
| **Total (ex-intent data)** | | **~$550–1,000/mo** |

Against a $2,000 CAC ceiling and a 5-client target, that's ~$150/client in tooling. Cheap. **Do not economize here** — a $50/mo saving that costs one deliverability incident is a catastrophic trade.

## 9. Hygiene calendar

**Daily:** bounce + complaint review · suppression sync · SLA breach check
**Weekly:** blocklist + postmaster check · pipeline row-count audit (`06 §5 step 12`) · segment volume report
**Monthly:** re-verify aging addresses · enrichment refresh on active records · domain reputation review · retire/add domains
**Quarterly:** full list decay audit · scoring model recalibration · vendor performance review
