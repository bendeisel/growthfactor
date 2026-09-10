# 04.2 The Gym Sales pipeline

**Module:** 04 Opportunities
**Video:** ~7 min
**Needs first:** 04.1
**You finish with:** one pipeline, seven stages, and clear rules for what each
one means

## Why this matters

Vague stages produce useless reporting. If nobody can say exactly when a card
moves from Contacted to Booked, then half your cards are in the wrong place
and every number downstream is wrong.

This lesson is mostly about definitions, and definitions are what make the
pipeline worth having.

## One pipeline

You get one, called `Gym Sales`. Resist building more.

Gym owners commonly want a separate pipeline for kids, for PT, for
memberships. Do not. Use `program_interest` on the contact to segment, and
keep one pipeline so every report compares like with like.

The exception: if you run a genuinely different business alongside the gym,
supplements retail, a physio practice, that deserves its own pipeline.

## The seven stages

[SHOT 04.2-01]

| # | Stage | Enters when | Leaves when |
|---|-------|-------------|-------------|
| 1 | New Lead | Any form, ad, chat, or missed call creates a contact | First outbound message is sent |
| 2 | Contacted | An agent or human has messaged them | They reply, or the follow-up sequence ends |
| 3 | Booked | An intro is on the calendar | The appointment time passes |
| 4 | Showed | They turned up | They buy, or go cold |
| 5 | Trialed | They completed the trial period | They buy or they do not |
| 6 | Joined | Payment collected, membership active | Never. This is the win |
| 7 | Lost | Said no, or went silent past the sequence | Reactivation puts them back at 1 |

## The definitions that matter

**Contacted means a message went out.** Not that they read it. Not that they
replied. Sent.

**Booked means there is a real appointment.** Not that they said "yeah maybe
Tuesday". On the calendar.

**Showed is the honest one.** They physically turned up. This is the stage
most gyms cannot fill reliably, because nobody marks attendance. See 03.6. If
you cannot mark shows, say so out loud, because your show rate is then a guess
and you should not make decisions on it.

**Joined means money moved.** Not that they said yes. Not that they signed.
Paid.

**Lost is not deletion.** Lost is your reactivation inventory. Module 09.6
lives off this stage.

## One open opportunity per contact

A returning lead gets their existing card moved back to New Lead. They do not
get a second card.

Two cards for one person means you count them twice in every report, your
conversion rate looks worse than it is, and two agents can end up working the
same person.

## Steps

1. Open **Opportunities > Pipelines**, or the pipeline settings.

   [SHOT 04.2-02]

2. Open `Gym Sales`, installed by the snapshot.

3. Check the stages match the seven above.

4. Rename a stage if your gym genuinely calls it something else. `Trialed`
   might be `On Trial` or `In Their Week`. Keep the meaning, change the word.

   Do not add stages. Seven is enough, and every extra stage is another place
   for cards to get stuck.

5. Save.

## Checklist

- [ ] One pipeline
- [ ] Seven stages, matching the definitions
- [ ] I can say out loud what each stage means
- [ ] I know whether I can reliably fill the Showed stage
- [ ] One open opportunity per contact

## When it goes wrong

**Everything is stuck in New Lead.** The automation that moves cards is not
running. See 04.3.

**Cards in Joined that never paid.** Somebody moved them by hand on a promise.
Joined means paid. Move them back.

**The same person appears twice.** Merge them, and find out what created the
second card.

## Shot list

| Shot | Screen | Capture | Highlight | Blur |
|------|--------|---------|-----------|------|
| 04.2-01 | The Gym Sales board with all seven columns | The full board | The stage headers | Names and values |
| 04.2-02 | Pipeline settings, stage list | The stages | The rename control | Nothing |
| 04.2-03 | A single card in Booked | The card | The linked appointment | Name |

## Video script

**Hook.** Seven stages, and the whole thing is worthless unless you can say
exactly what each one means. So let me be annoyingly precise for six minutes.

**Beats.**
1. On screen: the board. Name the seven stages.
2. On screen: talk to camera. The four definitions that matter. Contacted
   means sent. Booked means on the calendar. Showed means turned up. Joined
   means paid. Say each one slowly.
3. On screen: talk to camera. The Showed problem. Be honest that most gyms
   cannot fill it, and that a guessed show rate is worse than no show rate.
4. On screen: pipeline settings. Renaming a stage, and not adding any.

**Go do.** Open your board and find three cards in the wrong stage. There will
be three.

## Verify on screen

- Whether pipelines are edited under Opportunities or Settings in the current
  release.
- Confirm the snapshot ships `Gym Sales` with these seven stages.
