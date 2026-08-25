# Review Happy

Google review generation and reply automation, delivered as a done-for-you service on
GoHighLevel. Built once in a master sub-account, cloned per client via snapshot.

- **Build spec (read this first):** https://claude.ai/code/artifact/2f91cf79-9b17-47d3-bb54-ee87ee277019
- `spec.html` — source for the artifact above. Republish this file path to update it in place.

## Paste-ready assets

| File | What it's for |
|---|---|
| `custom-fields.md` | The seven custom fields, defaults, and the "Review Ask Eligible" smart list |
| `conversation-ai-prompt.md` | The Conversation AI bot prompt, with the six hard rules |
| `knowledge-base-template.md` | The 12 per-client slots — the only file that changes per account |
| `message-templates.md` | Ask timing by vertical, plus first-ask and re-ask SMS copy |
| `onboarding-checklist.md` | One-time master setup, then the per-client run |

## Decisions locked

- **Platform: GoHighLevel**, not a custom app. Resell white-labeled; revisit building only
  at ~50 accounts or a feature GHL won't do.
- **Google only** for v1. Yelp deliberately out of scope.
- **Reviews AI handles replies** natively (~$0.01/reply) — start every account in Suggestive
  mode, not Auto-Pilot.
- **Conversation AI snapshots** are the cloning mechanism; they carry the bot, prompt,
  knowledge base, and tone.
- **Custom fields, not tags**, for review state. Fields survive bulk tag operations.
- **Claude authors knowledge bases and runs the attribution sweep.** It is not in the runtime
  path — the GHL bot answers SMS from its own knowledge base.
- **Non-GHL clients** come in through Zapier under the agency affiliate link, with the
  referral disclosed in the proposal.

## Hard constraints

These are load-bearing. Changing them changes the legal exposure, not just the behavior.

1. Exit condition is **"left a review", any star rating** — never "left a good review".
   Re-asking non-reviewers is fine; re-asking negative reviewers is review gating.
2. The bot **never drafts review text** for a customer. That's an AI-generated review under
   16 CFR 465.
3. The review link is **never withheld or delayed** based on customer sentiment.
4. **Three lifetime asks**, 30+ days apart, each tied to a real service event. Protects the
   shared 10DLC campaign from complaint-driven filtering.
5. `gave_google_review = No` is the **starting** state. `Yes` is the exit.

## Open items

- [ ] Verify AI Employee and Reviews AI pricing inside the account before quoting clients —
      published figures and third-party write-ups disagree.
- [ ] Decide 10DLC structure: shared campaign vs. per-client sub-brand.
- [ ] Build the reviews-read function against GHL API v2 (the official MCP server's 21 tools
      do not include reputation endpoints).
