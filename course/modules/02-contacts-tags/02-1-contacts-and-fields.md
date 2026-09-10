# 02.1 Contacts and the fields a gym needs

**Module:** 02 Contacts, Tags and the Trigger Dictionary
**Video:** ~7 min
**Needs first:** module 01
**You finish with:** understanding every field your agents read and write

## Why this matters

A contact record is not an address book entry. It is what your agents read
before they decide what to say.

The reactivation agent opens differently depending on `objection_last`. The
appointment agent talks to a parent differently than an adult, based on
`participant_is_child`. If those fields are empty, your agents fall back to
generic, and generic is what everybody else's software sounds like.

## The contact record

[SHOT 02.1-01]

Four things live on every contact:

1. **Standard fields.** Name, phone, email, address.
2. **Custom fields.** The gym-specific ones, listed below.
3. **Tags.** Covered in 02.3.
4. **Activity.** Every message, appointment, payment and workflow that ever
   touched them.

## The fields we installed

Already created by the snapshot. Find them in **Settings > Custom Fields**.

[SHOT 02.1-02]

### Fields the agents write themselves

You do not fill these in. The agents do, from conversation.

| Field | What lands in it |
|-------|-----------------|
| `program_interest` | Which program they asked about |
| `participant_is_child` | Whether the person training is a child |
| `child_first_name` | So the agent stops saying "your child" |
| `child_age` | Which kids class they qualify for |
| `experience_level` | none, some, experienced, competed |
| `goal_stated` | Why they came, in their own words |
| `objection_last` | The last reason they gave for not joining |
| `preferred_contact_time` | Stops the voice agent calling during work |

**`goal_stated` is the one that matters most.** It is the difference between
a follow-up that says "still thinking about it?" and one that says "you
mentioned you wanted to be able to keep up with your kids". Same agent, same
sequence, completely different reply rate.

### Fields you or your staff maintain

| Field | Who fills it | Why |
|-------|-------------|-----|
| `membership_type` | Staff, or payments | Drives who counts as a member |
| `membership_start` | Staff, or payments | Anniversary and contract maths |
| `contract_end` | Staff | Feeds the renewal list in 02.2 |
| `last_attended` | Staff, or a check-in integration | The single most useful field you own |
| `first_visit_done` | Workflow | Gates the review ask |
| `injury_notes` | Staff only | Agents read it to avoid pushing. They never advise on it |

### `last_attended`, and why it deserves attention

Everything about spotting a member before they quit hangs off this one field.
A member who has not trained in three weeks is about to cancel, and if you
catch them at three weeks instead of at cancellation, you keep a good number
of them.

Three ways to keep it current:

1. **A check-in integration.** If you run Zen Planner, Kicksite, Push Press or
   similar, connect it and let it write this field. Best option by a distance.
   Ask us to wire it.
2. **A staff habit.** Someone updates it from the class roster. Works, but
   only for as long as the habit holds.
3. **Proxy it.** If neither is possible, use last payment or last appointment
   instead, and accept it is rougher. Set the reactivation window wider to
   compensate. See 09.6.

Be honest with yourself about which of these you will actually do. A
reactivation agent running on a field nobody updates will message people who
trained yesterday, and that is embarrassing.

## The escalation fields

| Field | Purpose |
|-------|---------|
| `ai_escalated` | Set by any agent when it hands to a human |
| `ai_escalation_reason` | Why. **Read this weekly** |
| `ai_last_agent` | Which agent spoke last |

`ai_escalation_reason` is the most useful diagnostic in the whole account. It
is a running list of everything your agents cannot handle. Half of those are
knowledge base gaps you can fix in ten minutes. See 09.13.

## Adding your own field

1. **Settings > Custom Fields**, then **Add Field**.
2. Pick the type. Dropdown for anything with fixed options, date for dates,
   checkbox for yes or no. Use text sparingly, because text fields cannot be
   filtered cleanly in a smart list.
3. Name it lowercase with underscores.
4. Save.

[SHOT 02.1-03]

**Do not rename the fields we installed.** The agent prompts call them by
name. Rename `objection_last` and the reactivation agent stops opening against
the objection, silently, with no error anywhere.

## Test it

1. Open your `ZZ Test` contact.
2. Fill in `goal_stated` manually with something specific: `wants to lose 20lb
   before a wedding in June`.
3. Add the `follow-up` tag.
4. Read what the follow-up agent sends. It should reference the wedding.

That test is the clearest demonstration in the whole course of why fields
matter. Run it before you decide the agents are generic.

## Checklist

- [ ] I know which fields the agents write and which I maintain
- [ ] I have a real plan for keeping `last_attended` current
- [ ] I have not renamed any installed field
- [ ] I ran the `goal_stated` test and saw the difference

## Shot list

| Shot | Screen | Capture | Highlight | Blur |
|------|--------|---------|-----------|------|
| 02.1-01 | A contact record, full view | The whole record | The custom fields panel | Name, phone, email |
| 02.1-02 | Settings > Custom Fields | The installed field list | Nothing | Nothing |
| 02.1-03 | Add field dialog | Type selector | The dropdown type option | Nothing |
| 02.1-04 | The test: follow-up message referencing goal_stated | The received text | The personalised phrase | Phone number |

## Video script

**Hook.** Two follow-up messages. One says "still thinking about it". The
other says "you mentioned the wedding in June". Same agent. The difference is
one field.

**Beats.**
1. On screen: a contact record. Four parts of it, fast.
2. On screen: the field list. Which the agents write, which you maintain.
3. On screen: talk to camera. `last_attended`. Be blunt about the three
   options and about picking one you will actually do.
4. On screen: the test. Fill in `goal_stated`, tag, and show the text arriving
   on a real phone. This is the money shot of the lesson.

**Go do.** Run the `goal_stated` test on yourself.

## Verify on screen

- Exact nav path for Custom Fields.
- The field type options available in the current release.
- Confirm the snapshot ships every field listed here, with these exact names.
