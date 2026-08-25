# Review Happy — New Account Onboarding

Target: under 60 minutes per client once the master snapshot exists.

## One-time, master sub-account only

- [ ] Build the seven custom fields (`custom-fields.md`)
- [ ] Build the "Review Ask Eligible" smart list
- [ ] Build the three workflows (Ask, Confirm, Exit)
- [ ] Build the Conversation AI bot from `conversation-ai-prompt.md`
- [ ] Enable Reviews AI, Suggestive mode (not Auto-Pilot — see below)
- [ ] Create the snapshot, selecting the **Conversation AI** category so the bot,
      prompt, knowledge base, and tone travel with it
- [ ] Register the A2P 10DLC brand + campaign

## Per client

- [ ] Load the snapshot into the new sub-account
- [ ] Resolve any bot name conflict (GHL will not auto-merge same-named bots)
- [ ] Connect Google Business Profile in Reputation settings
- [ ] Pull the direct review link from GBP → *Ask for reviews*, paste into slot 3
- [ ] Fill the 12 knowledge-base slots (`knowledge-base-template.md`) — draft 5–9 with Claude
- [ ] Set the vertical's trigger event and delay (`message-templates.md`)
- [ ] Paste the vertical's first-ask and re-ask copy
- [ ] Register this client as a 10DLC sub-brand, or add to the shared campaign
- [ ] Backfill `gave_google_review = No` on the existing contact list
- [ ] **Send one test to your own phone before enabling the trigger**
- [ ] Turn Reviews AI to Auto-Pilot only after you've read ~10 of its suggested replies

## Non-GHL clients

Their CRM fires a Zap → GHL contact create/update → same workflows run. Set up the Zap on
their account under the affiliate link.

One thing to keep clean: because you earn on that referral, say so in the proposal. A
one-line disclosure ("we use Zapier and receive a referral commission") covers the FTC
material-connection requirement and costs you nothing.

## Reviews AI mode

Start every account in **Suggestive** mode. It drafts, a human clicks send. Two reasons:
the first ten replies tell you whether the tone slot is right, and a bad auto-reply on a
1-star review is public and permanent. Move to Auto-Pilot per account once you trust it —
and consider keeping 1- and 2-star replies manual indefinitely. GHL lets you configure up
to five agents by star rating; use that split.

Cost is about $0.01 per generated response, so this is not a budget decision.
