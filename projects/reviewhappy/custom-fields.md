# Review Happy — Custom Field Schema

Create these once in the master sub-account, then carry them via snapshot.
Fields (not tags) so state survives bulk tag operations and keeps an audit trail.

| Field key | Type | Default | Purpose |
|---|---|---|---|
| `gave_google_review` | Single option: Yes / No | `No` | The exit flag. `Yes` removes the contact from every review workflow and smart list. |
| `review_asked_count` | Number | `0` | Lifetime asks. Hard cap at 3. |
| `review_last_asked_date` | Date | empty | Enforces the 30-day minimum gap between asks. |
| `review_link_clicked` | Single option: Yes / No | `No` | Set by the GHL trigger link. Narrows the candidate pool for name matching. |
| `review_confirmation_source` | Dropdown | empty | `link_click` \| `self_reported` \| `name_match` \| `manual`. Tells you how much to trust the flag. |
| `review_opt_out` | Single option: Yes / No | `No` | "Don't ask me about reviews." Distinct from a global SMS unsubscribe — permanent exclusion from review workflows only. |
| `review_needs_owner` | Single option: Yes / No | `No` | Bot detected a complaint and handed off. Owner notification fires on this. |

## Smart list definition

**"Review Ask Eligible"**

```
gave_google_review  = No
AND review_opt_out  = No
AND review_asked_count < 3
AND (review_last_asked_date is empty OR review_last_asked_date is more than 30 days ago)
```

## Notes

- `gave_google_review = Yes` is the terminal state. Nothing re-enters the loop after it.
- Do **not** delete the opportunity when a contact converts. Move it to a `Reviewed`
  won-stage instead — the count of contacts in that stage is the number you put on the
  client's monthly report, and it's what renews the contract.
- Bot suppression is driven off `gave_google_review` and `review_opt_out`: a workflow
  action disables Conversation AI for that contact so the bot cannot re-engage them.
