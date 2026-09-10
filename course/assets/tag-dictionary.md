# The Growth Factor Tag Dictionary

The agents listen for tags. This file is the contract between the workflows
and the agents. Change a tag name here and something stops firing, so treat it
as locked unless the whole account is updated at once.

Rules:

- Lowercase, hyphenated, no spaces. `follow-up`, never `Follow Up`.
- One job per tag. A tag either **fires** an agent, **records** a state, or
  **blocks** something. Never two.
- Firing tags are removed by the agent when it finishes, so the same contact
  can be put back through later. State tags are never removed automatically.
- Members can add their own tags freely in the `gym-` namespace. Everything
  else is ours.

## Firing tags

Adding one of these starts an agent. This is the whole control surface an
owner needs.

| Tag | Starts | Removed by | Use it when |
|-----|--------|-----------|-------------|
| `follow-up` | Follow-up agent | The agent, on reply, booking, or after the last message in the sequence | A lead went cold and you want the nudge sequence run |
| `reactivation` | Reactivation agent | The agent, on reply or booking | A member lapsed or an old lead is worth another swing |
| `review` | Review agent | The agent, after the ask is sent | Someone just had a good experience, usually after a class or a milestone |
| `voice-callback` | Voice receptionist, outbound callback | The agent, after the call attempt | A missed call needs a call back rather than a text |
| `no-show-recovery` | Follow-up agent, no-show variant | The agent | Booked and did not turn up |

## State tags

Recorded facts. Nothing fires off these directly, but agents and smart lists
read them constantly.

| Tag | Means |
|-----|-------|
| `lead` | In the database, has not booked anything |
| `trial-booked` | Has an intro or trial on the calendar |
| `trial-showed` | Turned up to the intro |
| `member` | Currently paying |
| `member-lapsed` | Was paying, is not now |
| `kids-program` | Interest or enrolment is a child, not the adult contact |
| `source-ads` | Came from a paid campaign |
| `source-walk-in` | Came through the door |
| `source-referral` | Sent by an existing member |

## Blocking tags

These stop things. An agent checks for these before it opens its mouth.

| Tag | Blocks |
|-----|--------|
| `do-not-contact` | Everything. No agent messages, no workflow sends, ever. Set on request, on complaint, and on any hard opt-out |
| `no-ai` | Agents only. Workflows still run. Use it when a member specifically wants a human, or when a conversation got sensitive |
| `staff-handling` | Agents only, temporarily. Applied when a human takes over a conversation. Remove it when the human is done |
| `injured` | Reactivation and follow-up agents. Somebody rehabbing does not want a win-back text |
| `billing-hold` | Review agent. Never ask for a Google review from someone whose card just failed |

## The rules an agent must follow

Every one of the six agent prompts carries this block. It is repeated in each
prompt file so that editing one agent cannot silently break the others.

1. Before sending anything, check for `do-not-contact`, `no-ai` and
   `staff-handling`. If any is present, stop and do nothing.
2. Never apply `do-not-contact` yourself. Escalate to a human instead. That tag
   has legal weight and it is not the agent's to hand out.
3. Remove your own firing tag when you finish so the contact can re-enter later.
4. Never apply another agent's firing tag except through the documented handoff
   in the navigator prompt.

## Naming space for members

Anything a gym invents goes under `gym-`. Examples: `gym-comp-team`,
`gym-6am-crew`, `gym-belt-blue`. Their tags never collide with ours, so we can
add tags in a future snapshot without overwriting somebody's work.
