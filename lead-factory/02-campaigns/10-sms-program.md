# SMS Program — Consent-Based Only

**The original plan called for three SMS sequences including cold outbound to intent-list numbers. That part is cancelled.** See `00-strategy/05-compliance.md §2` for the reasoning — briefly: TCPA statutory damages run $500–$1,500 *per message* with no cap and an active plaintiffs' bar, and "it's B2B" is not a defense when the number is a mobile, which most small-business numbers are.

What follows is the SMS program that is both legal and genuinely useful. It's smaller than what was planned and it will outperform the cold version anyway, because everyone receiving these messages asked to.

---

## 1. Consent architecture

**Nothing sends without a consent record containing:** the exact language shown, timestamp, source, IP or rep name, and the consented number. Retain ≥4 years (TCPA limitations period).

### Consent capture points

| Point | Language shown |
|---|---|
| Meeting booking form | ☐ *Text me reminders about this meeting. Message and data rates may apply. Reply STOP to opt out.* |
| Website lead form | ☐ *You can text me. Msg & data rates may apply. Msg frequency varies. Reply STOP to opt out, HELP for help.* |
| Verbal on a call | Rep says: *"Is it alright if I text you the details?"* → logged in CRM with date, time, rep name |
| Client agreement | Signed clause covering service communications |

**Never pre-check the box.** Never bury consent in terms of service. Never treat "they gave me their cell" as consent — a number is not permission.

## 2. Required program elements

- [ ] **10DLC brand + campaign registered** with the carriers, with sample messages and the exact opt-in language
- [ ] Sender identified in the **first message of every conversation**
- [ ] **STOP / STOPALL / UNSUBSCRIBE / CANCEL / END / QUIT** honored automatically and instantly
- [ ] **HELP** returns sender identity + contact + opt-out instructions
- [ ] Quiet hours **8am–9pm recipient local time**, enforced by the tool
- [ ] Frequency cap: **4 messages/recipient/month** outside active scheduling threads
- [ ] Every opt-out mirrors to the **global email suppression list** — someone who opts out of texts is telling us something broader

## 3. The sequences

### SMS-1 · Meeting reminder *(consent at booking)*

**T−24h**
```
Hi {{first_name}}, Ben from Growth Factor. We're set for {{time}} tomorrow —
{{link}}. Reply R to reschedule or STOP to opt out.
```
**T−1h**
```
Starting in an hour, {{first_name}} — {{link}}. See you then.
```
**T+5m if no-show**
```
{{first_name}}, I'm on the line when you're ready — {{link}}. If now's bad,
reply R and we'll find another time.
```
*`[ASSUMPTION]` this sequence alone should move show rate from ~70% to ~85%, which is worth roughly one extra client per month at the 5-client target. It is the highest-ROI item in this file by a wide margin.*

### SMS-2 · Post-call follow-up *(verbal consent, logged)*

**T+10m**
```
{{first_name}} — Ben. Recap and the proposal are in your inbox. Anything
that didn't make sense, just text me here.
```
**T+3d, only if the proposal is unopened**
```
{{first_name}}, did the proposal land OK? Happy to walk through it in 5 min
if easier.
```
Cap at two. A third text on an unanswered proposal reads as pressure and costs the nurture path.

### SMS-3 · Inbound speed-to-lead *(consent on form)*

Fires within **60 seconds** of a form submission, before any email.
```
{{first_name}}, Ben at Growth Factor — got your request about {{topic}}.
Calling you in a couple minutes from {{number}}. If now's bad, reply with
a better time.
```
*Speed-to-lead is the highest-leverage automation in the stack. It also demonstrates the exact capability we sell, to someone evaluating whether to buy it.*

### SMS-4 · Client service *(agreement clause)*

Onboarding milestones, monthly report ready, urgent account issues, report-call reminders. Low volume, high goodwill. **Never marketing or upsell** — the moment this channel is used to sell, clients opt out and the operational value is gone.

## 4. What replaces the cold SMS volume

The original plan wanted SMS at Stage 1 and Stage 4 for reach. Reallocated:

| Original intent | Replacement | Why it's better |
|---|---|---|
| Cold SMS to Stage 1 intent list | Email volume + Ring 1 calling | Legal, and phone converts ~8× better per contact (`00-strategy/04-funnel-math.md §4`) |
| Cold SMS on Stage 4 closer touch | Phone call, moved to **first** touch for Band A R1 | The best channel should not be the last resort |
| SMS for urgency | Same-thread email replies on day 2–3 | Reply-in-thread creates most of the urgency at none of the risk |

## 5. Metrics

| Metric | Target | Meaning |
|---|---|---|
| Delivery rate | > 95% | Below → carrier filtering, check 10DLC registration |
| Opt-out rate | < 2% | Above → over-messaging or wrong content |
| Meeting show rate w/ vs. w/o SMS | +10pts | The whole justification for the program |
| Speed-to-lead median | < 60s | Automation health |
| Complaint / carrier violation | **0** | Any occurrence → halt program, audit consent records |

## 6. If cold SMS ever comes up again

It will — it's tempting, the volume is right there, and someone will make the "everyone does it" argument. The answer:

**Everyone does it, and TCPA plaintiffs' firms run automated dockets against exactly those senders.** The economics are not close. One class action exceeds the entire lifetime profit of this program. The compliant version of this channel captures most of the value at none of the risk, and the value that's left on the table is worth roughly one extra client a month — recoverable through email volume and phone, both of which are already in the plan.

If the business ever genuinely needs cold SMS reach, the legitimate path is building an opted-in list through content and lead magnets over 6–12 months. That's a real strategy. Buying numbers and texting them is not.
