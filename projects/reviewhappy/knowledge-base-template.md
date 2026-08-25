# Review Happy — Knowledge Base Intake

Twelve slots. Fill these and the cloned bot is client-ready — this is the only file that
changes per account. Lives in the GHL Conversation AI knowledge base, which travels in the
Conversation AI snapshot.

| # | Slot | Notes |
|---|---|---|
| 1 | `business_name` | Exactly as customers say it, not the legal entity name. |
| 2 | `owner_name` | Used in the complaint hand-off line. First name only. |
| 3 | `google_review_url` | The direct "write a review" link, not the profile URL. Pull from GBP → Ask for reviews. |
| 4 | `tone` | One line, e.g. "Warm and casual, small-town diner" / "Calm and clinical, no slang". |
| 5 | `service_list` | What they actually sell, in customer words. |
| 6 | `hours` | Including which days they're closed. |
| 7 | `location` | Address plus a landmark, for "where are you?" replies. |
| 8 | `top_objections` | The 5–10 questions the front desk answers daily, with the approved answer. |
| 9 | `do_not_say` | Claims the bot must never make — pricing, guarantees, medical or legal advice, competitor comparisons. |
| 10 | `escalation_contact` | Who gets the `NEEDS_OWNER` notification, and by what channel. |
| 11 | `service_trigger` | The CRM event that means "service happened" for this business. Drives ask timing. |
| 12 | `vertical` | Selects the message template and delay from `message-templates.md`. |

## Where Claude fits

Claude **authors** this file — feed it the client's website, GBP listing, and existing
reviews and it drafts slots 5–9, which are the slow ones. Claude does **not** serve it at
runtime: the GHL bot answers SMS from its own knowledge base, so the content has to live in
GHL. Draft with Claude, paste into GHL, snapshot.
