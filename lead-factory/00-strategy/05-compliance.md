# Compliance & Risk

> **Not legal advice.** This is an operating framework built from public regulatory guidance. Before the first send, have a TN attorney familiar with TCPA and CAN-SPAM review §2, §3, and the DPA question in §5. Budget ~$1,500 for that review. It is the cheapest insurance in this plan — a single TCPA class action costs more than the entire first year of this program.

The source blueprint flagged SMS as "borderline, careful." That's an accurate instinct and an insufficient control. This file converts it into rules.

---

## 1. Risk ranked

| Risk | Likelihood | Severity | Net |
|---|---|---|---|
| Cold SMS to non-consented numbers (TCPA) | High if we do it | **Severe** — $500–$1,500 statutory *per message*, class-actionable | **Do not do it** |
| Cold calling numbers on the DNC registry | Medium | High — up to ~$50K+ per violation under FTC/FCC rules | Scrub, always |
| Cold email non-compliance (CAN-SPAM) | Low | Moderate — up to ~$53K per email, but enforcement targets bad actors | Manageable with controls |
| Domain/IP reputation damage | **High** | High — program stops working, months to recover | Primary operational risk |
| Intent-data provenance | Medium | Moderate–High — CCPA/CPRA exposure, client trust | Diligence required |
| Client-side ad claims (health, legal) | Medium | Moderate — platform bans, bar complaints | Review process |

**The one to actually lose sleep over is deliverability**, because it's near-certain to bite and it silently ends the program. The one to be genuinely careful about is SMS, because it's the only item here with class-action economics.

## 2. SMS — the rule

**No cold SMS. None. Not to businesses, not to mobile numbers pulled from intent data, not "carefully."**

Reasons, briefly:
- TCPA restricts autodialed/pre-recorded calls and texts to mobile numbers without prior express consent. Statutory damages are $500 per message, trebled to $1,500 for willful violation, with no cap and an active plaintiffs' bar. 5,000 cold texts is theoretical exposure of $2.5M–$7.5M.
- The "B2B" intuition does not protect you. Most small-business numbers *are* mobile numbers, and TCPA attaches to the line, not the entity.
- Independently, US carriers require 10DLC campaign registration with documented opt-in language. Sending cold on a registered campaign gets the campaign revoked, taking the compliant SMS program down with it.

**Where SMS is legitimate and valuable** — every one of these requires documented, logged, timestamped consent:

| Use | Consent source |
|---|---|
| Appointment confirmation & reminder | Checkbox at booking: *"Text me reminders about this meeting"* |
| Post-call follow-up with a prospect who gave their mobile | Verbal consent, logged in CRM with date/time/rep |
| Active-client service comms | Signed agreement includes SMS consent clause |
| Lead-response speed for *our clients'* leads | The lead opted in on the client's form |

**Required on every SMS program:** registered 10DLC brand and campaign, sender identification in the first message, STOP/HELP honored automatically and immediately, consent record retained ≥4 years (the TCPA statute of limitations), and quiet hours 8am–9pm in the recipient's local time.

**Where the plan's SMS volume goes instead:** email (compliant, scalable) and phone (compliant with scrubbing, and 8× more efficient per contact anyway — see `04-funnel-math.md §4`).

## 3. Cold email — compliant by construction

CAN-SPAM permits unsolicited commercial email with conditions. B2B cold email is legal in the US when you follow them. Non-negotiable on every send:

- [ ] **Accurate header info.** From name, from address, and reply-to identify Growth Factor truthfully. Alternate sending domains are fine; fake identities are not.
- [ ] **Non-deceptive subject line.** No fake `Re:` or `Fwd:`, no invented prior relationship, no fabricated urgency.
- [ ] **Valid physical postal address** in every message. A registered agent address or PO box is acceptable.
- [ ] **Clear opt-out**, honored within 10 business days — we honor within 24 hours, automatically. A plain-text one-liner ("Reply 'stop' and I won't contact you again") converts better than a footer link and satisfies the requirement.
- [ ] **Never sell or transfer** a harvested address list.
- [ ] **No scraped-and-blasted addresses.** Verified, role-appropriate business addresses only.

**If we ever email into Canada or the EU, these rules change materially** (CASL is consent-based with penalties up to CAD $10M; GDPR requires a lawful basis and a documented legitimate-interest assessment). **Rule for v1: US-only sending.** Geo-filter the list and enforce it at the tool level, not by discipline.

## 4. Cold calling

- **Scrub against the National DNC Registry** before every call block. Business-to-business calls to business lines are generally exempt, but a large share of small-business "business lines" are personal mobiles — scrub anyway. Subscription is required if we call more than a handful of area codes.
- **Maintain our own internal DNC list.** Anyone who asks not to be called goes on it permanently, within 24 hours, and it is checked before every dial.
- **Tennessee DNC** applies in addition to federal.
- **Calling hours 8am–9pm** recipient local time.
- **Identify yourself and the company in the first sentence.** Always. It's required, and pretexting destroys the trust the whole offer depends on.
- **No call recording without consent.** TN is one-party consent, but we call into other states, some of which are all-party. Announce recording on every call or don't record.

## 5. Intent data — the diligence nobody does

Before scaling spend on Datamoon or any successor, get written answers to these. If a vendor can't or won't answer, that's the answer.

1. **Where does the signal originate?** Publisher co-op, bidstream, panel, or first-party pixel network? Bidstream data is the most legally contested category and the most likely to be restricted.
2. **How was consent obtained** from the individuals whose behavior generates the signal, and is that consent auditable?
3. **Is the output individual-level or account/audience-level?** This changes what we may honestly claim and what obligations attach.
4. **Does the vendor honor CCPA/CPRA deletion and opt-out requests, and how do those flow to us?**
5. **Will they sign a DPA** with indemnification for data provenance? **Do not scale without this.**
6. **What's the refresh cadence and decay window?** Signal older than ~30 days is usually noise — this is a data-quality question as much as a legal one.

**Positioning constraint that follows from this:** we say *"businesses in your category and county are actively searching for this service"* — audience-level, verifiable, true. We never say *"we know Bob at Bob's HVAC searched for X on Tuesday."* Individual-level surveillance claims are a privacy problem, a credibility problem, and in California a regulatory problem. They also sell worse — they make prospects uneasy rather than impressed.

## 6. Deliverability — the operational risk that will actually bite

Treated as compliance because the failure mode is identical: the program stops.

- **Never send cold from the primary domain.** `growth-factor.ai` sends client, billing, and transactional mail only. Cold outbound goes on lookalike secondary domains (`growthfactor-ai.com`, `getgrowthfactor.com`, etc.) that redirect to the main site.
- **SPF, DKIM, and DMARC on every sending domain.** Start DMARC at `p=none` with reporting, move to `p=quarantine` once clean.
- **Warm every mailbox 3–4 weeks** before real sends. Ramp: 5/day week 1, 10 week 2, 20 week 3, 30 week 4.
- **Hard cap 30 sends/mailbox/day.** No exceptions, no "just this campaign."
- **Verify every address before sending.** Bounce rate over 3% is an emergency; over 5% and the domain is likely already damaged.
- **Suppression list is global and permanent** — unsubscribes, bounces, complaints, current clients, active deals, and anyone a rep is already working. One list, checked by the tool, not by a person.
- **Plain text or near-plain text.** No images, no tracking pixels on cold sends (they hurt deliverability and inflate open rates into uselessness), no link shorteners, at most one link and preferably zero in the first email.
- **Monitor blocklists weekly** (Spamhaus, Barracuda, SURBL). If a domain lands on one, pull it from rotation immediately — do not try to send through it.

## 7. Client-facing advertising claims

We write copy for regulated verticals. Guardrails:

- **Healthcare:** no ad targeting or creative referencing a health condition, treatment, or diagnosis — Meta and Google both prohibit it and enforce it with account bans. No before/after imagery on Meta. HIPAA does not usually apply to us directly, but if we touch a client's patient data we may become a business associate and need a BAA. **Default: never accept patient data.** Leads route to the client's system, not ours.
- **Legal:** TN Rules of Professional Conduct 7.1–7.5 govern attorney advertising. No claims of specialization without certification, no outcome guarantees, no client testimonials that imply predicted results. **All attorney-facing ad copy gets client sign-off in writing before it runs.** Put this in the agreement.
- **Home services:** license number display is required in many trades and jurisdictions. Confirm at onboarding; it goes in the site footer and on ad landing pages.
- **Universal:** no fabricated reviews, no fake scarcity, no "as seen on" without the placement, no earnings or outcome claims we can't document.

## 8. Our own agreements

Master services agreement must cover: scope and exclusions (media spend explicitly excluded), term and cancellation, the guarantee with its qualified-lead definition and client-side conditions, IP ownership on exit, data handling and confidentiality, the client's sole responsibility for the accuracy and legality of claims in their own advertising, limitation of liability capped at fees paid, and indemnification for client-supplied content.

## 9. Pre-launch checklist

Every box below is checked before a single cold send goes out.

- [ ] Attorney review of email, calling, and SMS policy complete
- [ ] Secondary sending domains registered, SPF/DKIM/DMARC configured
- [ ] Mailbox warmup started (**week 1 — this gates everything**)
- [ ] Suppression list built and wired into the sending tool
- [ ] Email verification step in the list pipeline, enforced by tooling
- [ ] DNC subscription active and scrub step in the calling workflow
- [ ] Internal DNC list created, owner assigned
- [ ] Datamoon DPA signed and provenance questions answered in writing
- [ ] Physical address and opt-out mechanism in every template
- [ ] 10DLC registration filed — **for consent-based SMS only**
- [ ] MSA and privacy policy reviewed and published
