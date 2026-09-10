# Custom field spec

Fields the agents read and write. Created in the snapshot before handover, so
a member should find these already present.

Naming: lowercase, underscores, prefixed by area. The agents reference these
by name in their prompts, so a rename breaks the agent.

## Contact fields

| Field | Type | Written by | Why it exists |
|-------|------|-----------|---------------|
| `program_interest` | Dropdown | Appointment agent, forms | Which program they asked about. Drives which calendar and which pitch. Options: adult-bjj, adult-striking, adult-mma, kids-martial-arts, kids-fitness, personal-training, general-fitness, weightlifting, unsure |
| `participant_is_child` | Checkbox | Appointment agent, forms | Changes who the agent is talking to and what it may ask. A parent books, a child attends |
| `child_first_name` | Text | Appointment agent | So the agent stops saying "your child" |
| `child_age` | Number | Appointment agent | Decides which kids class they qualify for |
| `experience_level` | Dropdown | Appointment agent | none, some, experienced, competed |
| `goal_stated` | Text | Appointment agent | In their own words. The follow-up and reactivation agents quote it back, which is why the follow-ups do not read like spam |
| `trial_date` | Date | Calendar, workflows | Drives reminders and no-show recovery |
| `first_visit_done` | Checkbox | Workflows | Gate for the review ask |
| `membership_type` | Dropdown | Staff, payments | none, trial, month-to-month, contract-6, contract-12, family, kids |
| `membership_start` | Date | Staff, payments | Anniversary offers, contract end maths |
| `contract_end` | Date | Staff, payments | Feeds the renewal smart list |
| `last_attended` | Date | Staff, integration | The single most useful field for reactivation. Everything about lapse detection hangs off it |
| `objection_last` | Text | Any agent | The last reason they gave for not joining. Price, time, nerves, partner, injury. The reactivation agent opens against it |
| `preferred_contact_time` | Text | Any agent | Stops the voice agent calling someone at work |
| `injury_notes` | Text | Staff | Read-only for agents. They must never give advice on it, only avoid pushing |

## Escalation and safety fields

| Field | Type | Purpose |
|-------|------|---------|
| `ai_escalated` | Checkbox | Set by any agent when it hands to a human. Powers the "needs a human" smart list |
| `ai_escalation_reason` | Text | Why. Read this weekly, it is the best list of what your agents cannot do yet |
| `ai_last_agent` | Text | Which agent spoke last. Stops two agents talking over each other and makes the logs readable |

## Custom values, account level

Set once in **Settings > Custom Values**. Every agent prompt and template reads
these instead of hardcoding, so an owner changes their trial offer in one place
and every agent updates.

| Value | Example |
|-------|---------|
| `{{custom_values.gym_name}}` | Nashville MMA |
| `{{custom_values.gym_address}}` | 123 Example Rd, Nashville TN |
| `{{custom_values.gym_phone}}` | The number members should call |
| `{{custom_values.trial_offer}}` | Free week trial |
| `{{custom_values.trial_offer_kids}}` | Two free kids classes |
| `{{custom_values.booking_link}}` | The intro calendar link |
| `{{custom_values.google_review_link}}` | Direct write-a-review URL |
| `{{custom_values.owner_first_name}}` | Who the messages sign off as |
| `{{custom_values.quiet_hours}}` | 9pm to 8am local |
