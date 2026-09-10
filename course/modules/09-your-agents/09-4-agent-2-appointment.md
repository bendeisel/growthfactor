# 09.4 Agent 2: Appointment

**Module:** 09 Your Agents
**Video:** ~10 min
**Needs first:** 09.2, module 03
**You finish with:** every form submission answered in under a minute and
booked

## Why this matters

A form submission is the highest intent signal a gym gets, and most gyms waste
it. The average gym replies to a web lead in hours.

This agent replies in under a minute, while the tab is still open.

For ad leads it matters even more. A Meta lead form captures ninety seconds of
curiosity, and that curiosity decays fast. See 10.4.

## What fires it

**Form Submitted**, on every lead form in the account. Web forms, funnel
forms, chat widget forms, Facebook and Instagram lead ads.

[SHOT 09.4-01]

## What it does

1. **Reads the form first.** Never asks for something they already typed.
2. **Replies in two sentences**, acknowledging the specific thing they asked
   about, and offers two specific times.
3. **Fills the gaps** only where it must: adult or child, which program, any
   experience.
4. **Asks why they came**, and writes it to `goal_stated`.
5. **Books it**, then confirms with everything they need.
6. **Hands to follow-up** if they go quiet.

## The first message is the whole job

Good:

> `Hi Sarah, thanks for asking about the kids BJJ. I can get Ollie in Tuesday
> 5pm or Thursday 5pm for a free class, which suits?`

Bad:

> `Thank you for your interest in our world class facility. One of our team
> will be in touch shortly to discuss your fitness goals.`

The first uses the name, the child's name, the specific program and offers a
decision. The second could be any gym anywhere and asks for nothing.

If your agent is sending anything like the second one, your knowledge base or
your form mapping is the problem.

## The confirmation, and why it decides your show rate

When somebody books, the confirmation goes out immediately with:

- Day, date, time
- Address, `{{custom_values.gym_address}}`
- What to wear
- What to bring
- How long they will be there
- Who will meet them, by name if known

**This message is the biggest lever you have on show rate.** Somebody who
knows exactly where to park, what to wear and who to ask for turns up.
Somebody with "you're booked for Tuesday" does not.

[SHOT 09.4-02]

## Why they came, and why it matters later

At some point before booking, the agent asks what made them look now, and
writes the answer verbatim to `goal_stated`.

Every other agent uses it. The follow-up agent at day 8. The reactivation
agent eight months later. It is the field that makes the system feel like it
remembers people, because it does.

Do not remove this question to shorten the conversation.

## No-shows

If appointment triggers report a no-show, it sends one message that assumes
life happened, offers to rebook, and applies `no-show-recovery`. Never
scolds. See 03.6.

## The prompt

Full text: `assets/agent-prompts/02-appointment-agent.md`.

## What you should edit

1. **Which calendar it books into.** The most common edit by far. If you added
   a kids intro calendar, this agent needs to know which calendar goes with
   which `program_interest`.
2. **The confirmation content.** What to bring and who meets them is
   gym-specific and worth getting exactly right.
3. **Two times versus a link.**

## Test it with real forms

Type into the test panel and you will not catch the thing that actually
breaks, which is form field mapping. Submit real forms.

1. Full form with everything. It must not ask anything already given.
2. Bare form, name and phone only.
3. Kids enquiry where the parent's name is on the form and the child's is not.
4. Submitted at 11pm. Quiet hours must hold it.
5. Same person submits twice in five minutes. Must not start two
   conversations.
6. Reply `how much first` before booking.
7. Reply `just send me a link`.
8. Reply `actually my shoulder is bad`. Must escalate.
9. Book, then `sorry can we move it to Friday`.
10. A no-show, the next day.

[SHOT 09.4-03]

Test 1 is the one people fail. If the agent asks for a name that was on the
form, your mapping is wrong and every lead will notice.

## Checklist

- [ ] Submitted a real form and got a reply in under a minute
- [ ] The reply used what was on the form and asked for nothing already given
- [ ] Confirmation includes address, what to wear, what to bring, who meets them
- [ ] `goal_stated` is being captured
- [ ] Correct calendar per program
- [ ] Quiet hours respected on a late submission
- [ ] Ran all ten tests
- [ ] No-show path tested

## When it goes wrong

**It asks for information the form already had.** Field mapping. See 03.2.

**No reply at all.** Is the form actually firing Form Submitted? This is the
most common wiring problem in the account. See 06.3 and test end to end.

**Two conversations for one person.** Duplicate handling in New Lead Intake.
See 06.3.

**It books the wrong calendar.** The program-to-calendar mapping in the
prompt.

**Replies are generic.** The form is not passing what they asked about, or the
knowledge base is thin.

## Shot list

| Shot | Screen | Capture | Highlight | Blur |
|------|--------|---------|-----------|------|
| 09.4-01 | The appointment agent's trigger config | The trigger | Form Submitted, and the forms selected | Nothing |
| 09.4-02 | Phone, a real confirmation message | The text | The what-to-bring detail | Number |
| 09.4-03 | A form submitted and the reply arriving, timestamped | Split view | The elapsed time | Names |
| 09.4-04 | Contact record after, showing goal_stated | The field | The captured answer | Name |

## Video script

**Hook.** The average gym replies to a web lead in a few hours. By then they
have messaged two other gyms. This one replies in under a minute.

**Beats.**
1. On screen: submit a real form, then cut to a phone. Show the timestamp gap.
   That shot is the lesson.
2. On screen: read the good first message and the bad one out loud. The
   contrast teaches it.
3. On screen: the confirmation. Say plainly that this message is the biggest
   lever on show rate, then read a full one out.
4. On screen: the `goal_stated` question in a real conversation, then the
   contact record with it captured. Reference how reactivation uses it months
   later.
5. On screen: run test 1, the full form. Show it not asking for the name.

**Go do.** Submit your own intro form with everything filled in. Time the
reply. Then check whether it asked you for anything you already typed.

## Verify on screen

- Whether the trigger can select all forms or must list them individually.
- Confirm a calendar booking and a form submission fire the trigger as
  expected.
- Confirm appointment status triggers reach this agent for the no-show path.
