# 06.3 The workflows that feed your agents

**Module:** 06 Automations
**Video:** ~9 min
**Needs first:** 06.1, 02.3
**You finish with:** the map of how your whole system is wired together

## Why this matters

Read this one even if you skip the rest of the module.

Your agents do not decide when to run. Workflows decide, by applying tags. The
workflows are the nervous system and the agents are the muscles.

Once you have this map, you can diagnose almost anything: an agent that did
not fire, a member who got two messages, a lead that went nowhere.

## The map

```
  SOURCE                    WORKFLOW                    TAG            AGENT
  ------                    --------                    ---            -----
  form submitted     -->  New Lead Intake         -->  (direct)  -->  Appointment
  ad lead            -->  New Lead Intake         -->  (direct)  -->  Appointment
  inbound message    -->  (none, direct)                         -->  Navigator
  missed call        -->  (none, direct)                         -->  Voice
  no reply, 24h      -->  Cold Lead Sweep         -->  follow-up -->  Follow-up
  no-show marked     -->  No-show Handler         -->  no-show-  -->  Follow-up
                                                       recovery       (short)
  last_attended 30d  -->  Lapse Watch             -->  reactiv-  -->  Reactivation
                                                       ation
  lost 90 days       -->  Dead Lead Sweep         -->  reactiv-  -->  Reactivation
                                                       ation
  first visit +3d    -->  Review Trigger          -->  review    -->  Review
  membership +30d    -->  Review Trigger          -->  review    -->  Review
  payment failed     -->  Failed Payment Recovery -->  billing-  -->  (blocks
                                                       hold           Review)
```

Two agents fire directly from an event, with no workflow in between: the
navigator on an inbound message, and the voice agent on an unanswered call.
Everything else runs through a workflow that applies a tag.

[SHOT 06.3-01]

## The workflows, one by one

All installed by the snapshot. Find them in **Automation**.

### New Lead Intake

- **Trigger:** Contact Created, or Form Submitted
- **Does:** creates the opportunity in New Lead, sets the source tag, sets
  opportunity value, checks for duplicates
- **Then:** the appointment agent takes over

The duplicate check matters. Without it, a returning lead gets a second
opportunity card. See 04.2.

### Cold Lead Sweep

- **Trigger:** scheduled, daily
- **Does:** finds contacts with no reply after 24 hours who are not already in
  a sequence, applies `follow-up`
- **Guardrails:** skips `do-not-contact`, `no-ai`, `staff-handling`, `injured`

### No-show Handler

- **Trigger:** Appointment status changed to no-show
- **Does:** applies `no-show-recovery`, moves the opportunity back

### Lapse Watch

- **Trigger:** scheduled, daily
- **Does:** finds members whose `last_attended` is over 30 days, applies
  `reactivation`
- **Depends on:** `last_attended` being maintained. See 02.1. If nobody
  updates that field, this workflow does nothing, or worse, does the wrong
  thing

### Dead Lead Sweep

- **Trigger:** scheduled, weekly
- **Does:** finds opportunities in Lost for over 90 days, applies
  `reactivation`
- **Guardrail:** never tags the same contact twice within six months

### Review Trigger

- **Trigger:** scheduled, daily
- **Does:** finds contacts hitting a review moment, applies `review`
- **Guardrails:** skips `billing-hold`, skips anyone asked in the last six
  months

### Failed Payment Recovery

Covered in 05.6.

[SHOT 06.3-02]

## The rate limit on the sweeps

The daily and weekly sweeps have a cap on how many contacts they tag per run.
This is deliberate.

Without it, the first time Dead Lead Sweep runs on an account with 800 lost
leads, it tags all 800 and starts 800 conversations in one minute. Your number
gets flagged, and you cannot handle 800 replies anyway.

The cap is set to a sensible number, usually 20 to 50 per day. Leave it alone
unless you have a reason, and if you raise it, raise it gradually.

[SHOT 06.3-03]

## What you may safely change

| Change | Safe? |
|--------|-------|
| Message wording inside a workflow | Yes |
| Wait timings | Yes, within reason |
| The lapse window, 30 days to 45 | Yes |
| The daily cap on a sweep | Carefully, gradually |
| Which tag a workflow applies | **No.** Ask us |
| Deleting a workflow | **No.** Pause it instead |
| Adding another workflow that applies a firing tag | **No.** You will get double sequences |

That last row is the most common self-inflicted problem. Somebody builds a
helpful new workflow that also applies `follow-up`, and now leads get two
follow-up sequences at once. If you want a new sequence, use a new tag in the
`gym-` namespace and a new workflow, and ask us to wire an agent to it if you
need one.

## Diagnosing with the map

**"The follow-up agent never fires."**

1. Is Cold Lead Sweep published?
2. Did it run today? Check history. See 06.6.
3. Did it tag anyone? Check a specific contact for the `follow-up` tag.
4. If the tag is there and nothing happened, the problem is the agent, not the
   workflow. Go to 09.11.

That sequence works for every agent. Find the workflow, confirm it ran,
confirm the tag landed, then look at the agent.

## Checklist

- [ ] I have the map, or can find it
- [ ] I know which two agents fire without a workflow
- [ ] I know all seven workflows and what each does
- [ ] I know `Lapse Watch` is only as good as `last_attended`
- [ ] I know not to create another workflow that applies a firing tag
- [ ] I can run the four step diagnosis

## When it goes wrong

**A member got two follow-up sequences.** Something else is applying
`follow-up`. Check the contact's activity to see what applied it and when.

**A sweep tagged hundreds of people.** The cap was raised or removed. Pause
everything, then come and talk to us before unpausing.

**Nothing has fired for days.** Check whether the scheduled workflows are
running at all. A paused workflow is silent.

## Shot list

| Shot | Screen | Capture | Highlight | Blur |
|------|--------|---------|-----------|------|
| 06.3-01 | Automation list, the seven installed workflows | The list | The seven names | Nothing |
| 06.3-02 | Lapse Watch workflow open | The canvas | The last_attended condition | Nothing |
| 06.3-03 | The cap setting on a sweep | The limit config | The number | Nothing |
| 06.3-04 | A contact's activity log showing a tag applied by a workflow | The activity | Which workflow applied it | Name |

## Video script

**Hook.** Your agents do not decide when to run. These seven workflows decide,
by applying tags. This is the map of your whole system, and it is the lesson
that makes you able to fix things yourself.

**Beats.**
1. On screen: the map diagram. Take your time. Everything else in the lesson
   hangs off it.
2. On screen: Automation list. Open each of the seven briefly, one line each.
3. On screen: Lapse Watch. Make the point about `last_attended` again, hard.
4. On screen: the cap setting. Tell the 800 leads story.
5. On screen: run the four step diagnosis live on a real contact.

**Go do.** Screenshot the map. Then open your Automation list and confirm all
seven workflows are there and published.

## Verify on screen

- Confirm the snapshot ships all seven workflows with these exact names.
- Confirm the sweep caps exist and find their default values.
- Confirm the navigator and voice agents really do fire without an
  intermediate workflow.
