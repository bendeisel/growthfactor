# 02.2 Smart lists worth having

**Module:** 02 Contacts, Tags and the Trigger Dictionary
**Video:** ~6 min
**Needs first:** 02.1
**You finish with:** six saved lists that answer the questions you actually ask

## Why this matters

You do not need to browse your contacts. You need answers to six recurring
questions, and a smart list is a saved answer that stays current.

A smart list is a filter you save. Contacts move in and out of it
automatically as their data changes. You build it once.

## The six

Build these in order. Each one is a filter, saved with a name.

### 1. Needs a human

The most important list in your account. Check it daily.

- Filter: `ai_escalated` is true, or tag is `staff-handling`
- Why: these are people an agent could not handle. Every one is a live person
  waiting.

### 2. Never contacted

- Filter: created more than 1 day ago, and no outbound message ever sent
- Why: this list should be empty. If it is not, something in your automation
  is broken and leads are rotting. Treat a non-empty list as an alarm.

### 3. Booked this week

- Filter: `trial_date` is within the next 7 days
- Why: who is coming in. Print it, put it on the desk, let coaches know names
  before they walk in.

### 4. No-showed, not recovered

- Filter: tag is `no-show-recovery`, and `trial_date` in the last 14 days
- Why: the fastest money in the account. They wanted to come and something
  got in the way.

### 5. Lapsing members

- Filter: tag is `member`, and `last_attended` more than 21 days ago
- Why: these people are about to cancel and do not know it yet. Catching them
  here is cheaper than winning them back later.

### 6. Contracts expiring

- Filter: `contract_end` within the next 60 days
- Why: renewal conversations happen before the contract ends, not after.

## Steps

1. Open **Contacts**.
2. Set your filters using the filter panel.

   [SHOT 02.2-01]

3. When the list looks right, save it. Name it exactly as listed above, so
   that when we talk to you in support we are both looking at the same thing.

   [SHOT 02.2-02]

4. Repeat for all six.

## Which ones to actually check, and when

| List | When |
|------|------|
| Needs a human | Every morning, first thing |
| Never contacted | Every morning. Should be empty |
| Booked this week | Every morning |
| No-showed, not recovered | Twice a week |
| Lapsing members | Weekly |
| Contracts expiring | Monthly |

That is the whole of your daily contact routine. Three lists, five minutes.
Module 14 puts it into a proper rhythm.

## Do not action lists in bulk

Tempting, and it is the single most damaging thing you can do in this account.
Selecting a smart list and bulk texting it is how gyms get their number
flagged, their A2P campaign revoked, and their members annoyed.

If a list needs working, put those people into a workflow that spreads the
sending out. See 06.3. Bulk send permission is off for your staff for exactly
this reason. See 01.4.

## Test it

1. Open your `ZZ Test` contact and set `last_attended` to 30 days ago, plus
   the `member` tag.
2. Open the Lapsing members list.
3. Confirm you are in it.
4. Change `last_attended` to yesterday. Confirm you drop out.

## Checklist

- [ ] All six lists built and saved with the exact names
- [ ] Never contacted is empty
- [ ] Needs a human is checked daily
- [ ] I know not to bulk action a list

## When it goes wrong

**Never contacted is not empty.** Something upstream is broken. Check that
your forms are connected to a workflow, and that the appointment agent is
published. This is an alarm, not a chore.

**Lapsing members list is enormous.** Either `last_attended` is not being
maintained, or you genuinely have a retention problem. Find out which before
you fire the reactivation agent at all of them.

**A list looks wrong.** Check whether a filter uses a text field. Text fields
match badly. Use dropdowns and dates for anything you filter on.

## Shot list

| Shot | Screen | Capture | Highlight | Blur |
|------|--------|---------|-----------|------|
| 02.2-01 | Contacts, filter panel open | The filter builder | The field and condition selectors | Contact names |
| 02.2-02 | Saving a smart list | The save dialog | The name field | Nothing |
| 02.2-03 | The six saved lists in the sidebar | The list | Needs a human | Counts if sensitive |

## Video script

**Hook.** You do not need to look through your contacts. You need answers to
six questions, and then you never look again.

**Beats.**
1. On screen: build "Needs a human" from scratch. Save it. That teaches the
   mechanic.
2. On screen: the other five, fast, showing each filter.
3. On screen: talk to camera. The check schedule. Three lists, five minutes,
   every morning.
4. On screen: talk to camera, serious. Do not bulk text a list. Say what
   happens if you do.

**Go do.** Build all six now. Then open Never contacted, and if it is not
empty, message us.

## Verify on screen

- The exact filter field names as they appear in the filter builder, which
  can differ from the custom field names.
- Whether smart lists are saved per user or shared across the sub-account.
