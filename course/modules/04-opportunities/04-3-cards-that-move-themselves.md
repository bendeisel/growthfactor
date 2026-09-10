# 04.3 Cards that move themselves

**Module:** 04 Opportunities
**Video:** ~6 min
**Needs first:** 04.2, and a look at module 06
**You finish with:** a pipeline that stays accurate without you touching it

## Why this matters

A pipeline that needs manual updating is a pipeline that is wrong by Wednesday.

Everything except one stage can move itself. Knowing which automation moves
which card is what lets you diagnose a stuck board in thirty seconds instead
of assuming the whole thing is broken.

## What moves what

[SHOT 04.3-01]

| Card moves to | Moved by | Trigger |
|---------------|----------|---------|
| New Lead | Workflow | Contact created from any source |
| Contacted | Navigator or appointment agent | First outbound message sent |
| Booked | Workflow | Appointment booked |
| **Showed** | **A human, or a check-in integration** | **Attendance marked** |
| Trialed | Workflow | Trial end date passes |
| Joined | Workflow | Successful payment |
| Lost | Follow-up agent | Sequence completed with no reply |

Six of the seven are automatic. One is not, and it is the one that matters
most for your numbers.

## The Showed problem, addressed properly

Nothing in HighLevel knows whether somebody physically walked into your gym.
It knows they booked. It cannot know they came.

Three ways to solve it, and you must pick one:

1. **Check-in integration.** If you run Zen Planner, Kicksite, Push Press or
   similar, we can wire attendance across. Best answer. Ask us.
2. **Coach marks it on the mobile app.** After the session, two taps. Works if
   the habit holds. Make it part of closing up.
3. **You clear yesterday each morning.** Part of the 60 second read in 04.5.

If you pick none of these, accept that your show rate and everything
downstream of it is unreliable, and say so when you look at reports. A wrong
number confidently presented is worse than a missing one.

## Where the automations live

1. Open **Automation**.
2. Find the workflows the snapshot installed with `Pipeline` in the name.

   [SHOT 04.3-02]

3. Open one and look at the **Update Opportunity** action. That is what moves
   the card.

   [SHOT 04.3-03]

You do not need to build these. You need to know they exist so that when a
card does not move, you know where to look.

## Diagnosing a stuck board

In order:

1. **Which stage is everything stuck in?** That tells you which automation
   failed.
2. Open the workflow that should move it.
3. Check it is **published**, not draft.
4. Open its history and see whether it ran for a specific stuck contact.
5. If it ran and did nothing, check the action's conditions.

Nine times out of ten it is step 3.

## Moving a card by hand

Fine, and sometimes right. Drag it.

Two rules:

- If you find yourself doing it constantly for the same stage, the automation
  is broken. Fix the automation, not the cards.
- Never move a card to Joined without payment. It corrupts your revenue
  reporting, and you will trust the reports less because of it.

## Test it

1. Create a test opportunity by submitting your intro form as `ZZ Test`.
2. Confirm a card appears in New Lead.
3. Wait for the appointment agent's first message. Confirm the card moves to
   Contacted.
4. Book the appointment. Confirm it moves to Booked.
5. Mark it as attended. Confirm it moves to Showed.

Run all five. This is the clearest way to see the whole system working
together, and it is worth doing once even if you are confident.

## Checklist

- [ ] I know which automation moves each card
- [ ] I have picked a way to mark attendance and it is happening
- [ ] I can find the pipeline workflows in Automation
- [ ] I know to check published status first when a card is stuck
- [ ] I ran the end to end test

## When it goes wrong

**Everything stuck in New Lead.** The Contacted move happens when a message
sends. If no messages are sending, this is an A2P problem, not a pipeline
problem. Back to 01.2.

**Cards move to Booked but never to Showed.** Nobody is marking attendance.

**Cards in Joined but no payment.** Somebody moved them by hand.

**A contact has two cards.** Something created a second opportunity instead of
updating the first. Merge, then tell us so we can look at the trigger.

## Shot list

| Shot | Screen | Capture | Highlight | Blur |
|------|--------|---------|-----------|------|
| 04.3-01 | Board with cards across several stages | The full board | Nothing | Names and values |
| 04.3-02 | Automation list filtered to pipeline workflows | The workflow list | Published status column | Nothing |
| 04.3-03 | A workflow's Update Opportunity action | The action config | The target stage | Nothing |
| 04.3-04 | Workflow history for one contact | The run log | A successful run | Contact name |

## Video script

**Hook.** Six of your seven stages move themselves. The seventh needs a human,
and it is the one your whole show rate depends on.

**Beats.**
1. On screen: the table of what moves what.
2. On screen: talk to camera. The Showed problem. Three options, pick one,
   and be honest if you pick none.
3. On screen: Automation, open a pipeline workflow, show the Update
   Opportunity action. Just so they recognise it later.
4. On screen: the diagnosis order. Emphasise checking published first.
5. On screen: run the end to end test, sped up.

**Go do.** Submit your own intro form and watch the card move through New
Lead, Contacted and Booked.

## Verify on screen

- Exact name of the opportunity update action.
- Whether workflow history is called History, Executions or Logs.
- Confirm the snapshot ships the pipeline workflows referenced here.
