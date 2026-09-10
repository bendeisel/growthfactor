# The gym pipeline

One pipeline. Resist the urge to build five.

Name: `Gym Sales`

| # | Stage | A card enters when | It leaves when | Automated by |
|---|-------|--------------------|----------------|--------------|
| 1 | New Lead | Any form, ad lead, chat, or missed call creates a contact | First outbound contact is made | Workflow, on contact created |
| 2 | Contacted | An agent or human has sent a message | They reply, or the follow-up sequence ends | Navigator and follow-up agents |
| 3 | Booked | An intro or trial is on the calendar | The appointment time passes | Calendar, appointment booked trigger |
| 4 | Showed | They turned up | They buy, or they go cold | Staff, or check-in integration |
| 5 | Trialed | They completed the trial period | They buy or they do not | Workflow, on trial end date |
| 6 | Joined | Payment collected, membership active | Never. This is the win | Payments, on successful charge |
| 7 | Lost | Explicitly said no, or went silent past the sequence | Reactivation puts them back at 1 | Follow-up agent, on sequence end |

## Rules

- **Opportunity value is set at stage 1**, to the annual value of the
  membership they asked about, not the trial price. If the pipeline shows the
  trial price, reporting shows a gym that makes no money.
- **A contact has one open opportunity at a time.** A returning lead gets the
  old card moved back to New Lead rather than a second card. Two cards means
  double counting in every report downstream.
- **Lost is not deletion.** Lost is the reactivation agent's inventory.
- Stage 4, Showed, is the one stage that usually needs a human or a check-in
  integration. If a gym cannot mark shows reliably, their show rate reporting
  is fiction and they should know that.

## What reads this pipeline

- Module 11 reporting, for conversion by stage and revenue by source.
- The reactivation agent, which pulls from Lost.
- The follow-up agent, which pulls from Contacted and Booked no-shows.
