# 09.5 Agent 3: Follow-up

**Module:** 09 Your Agents
**Video:** ~11 min
**Needs first:** 09.2, 02.1
**You finish with:** a follow-up sequence written in your voice that stops the
moment somebody replies

## Why this matters

Most gym leads do not say no. They go quiet.

They meant to reply. They got busy. They are still interested and they are
never going to think about you again unless you make them.

This agent works the quiet ones, and it is where most of the recovered revenue
in this system comes from.

## Why it is not a drip sequence

A drip sends message four whether or not you replied to message three.

This agent reads the history first. It knows what has already been said, it
knows what they told you their goal was, it knows what objection they raised,
and it stops the instant they reply.

That difference is the whole reason it works. People can tell.

## The cadence

Five touches over twelve days.

[SHOT 09.5-01]

| Touch | Day | Channel | Angle |
|-------|-----|---------|-------|
| 1 | 0, two hours after tagging | SMS | Direct, references what they asked about |
| 2 | 2 | SMS | Answers their objection |
| 3 | 5 | Email | Social proof, a member who started where they are |
| 4 | 8 | SMS | Lower the ask. Come and watch a class |
| 5 | 12 | SMS | Close the file |

## Touch 5 is the one that works

> `Hey Sarah, I will stop messaging after this one. Is it a no for now?`

It outperforms the four before it, consistently, because it is the only one
that costs something to ignore.

It also does something more valuable than a booking: it gets you a reason.
That reason goes into `objection_last` and it makes every future conversation
with that person better.

Do not soften this message. Owners want to add "but the door is always open
and we would love to see you". That turns a question into a goodbye and the
reply rate drops.

## Banned phrases

The prompt forbids these and you should too:

- "Just following up"
- "Circling back"
- "Checking in"
- "Bumping this"

Every one of them says "I have nothing new to say but I want something from
you". Each touch should have a reason to exist.

## Touch 2 is where you earn your money

It answers their specific objection from `objection_last`. If that field is
empty, it uses the most common objection for their `program_interest`:

| Objection | Angle |
|-----------|-------|
| Price | What is included, and the cost per session |
| Time | The shortest and most flexible option |
| Nerves | What actually happens in a beginner's first class |
| Partner or family | The family option, or childcare |

**These four responses are the highest value edit in the whole course.**

They should be in your words, with your actual answers. The generic version is
competent. Yours will be better, because you have had this conversation four
hundred times at the front desk and you know exactly what makes somebody's
shoulders drop.

Write them the way you would say them. See 09.9 for how to edit.

[SHOT 09.5-02]

## Touch 3 needs a real story

Social proof, from the knowledge base.

**The agent will not invent a member.** If there is no story in your KB, it
sends the answer to a common question instead, which is fine but weaker.

So put one in. One paragraph, in your coaches section or its own source:

> `Dave came in at 48, hadn't trained since school, was convinced he'd be the
> oldest and least fit in the room. He was neither. Eight months later he
> trains four times a week and brought his son in.`

That paragraph makes touch 3 land, and it takes five minutes to write.

## The no-show variant

If the contact carries `no-show-recovery`, it runs shorter: three touches over
five days, and **never mentions that they did not turn up.**

The reason is almost always ordinary. Work ran over, the kid got sick, they
got nervous. Making somebody feel worse does not get them through the door.

## What ends it

- **They reply.** Stops immediately, removes `follow-up`, hands to whoever
  should own it next.
- **They book.** Stops.
- **They say no.** Records the reason, thanks them, stops. One rescue attempt
  is a conversation. Two is harassment.
- **Twelve days, nothing.** Removes the tag, moves the opportunity to Lost.
  Reactivation gets them in ninety days.

## The prompt

Full text: `assets/agent-prompts/03-follow-up-agent.md`.

## What you should edit

1. **The four objection responses.** Do this one properly.
2. **The cadence**, if twelve days does not suit your sales cycle. Change the
   table and the prompt together.
3. **Touch 3's story**, by putting one in the knowledge base.

## Test it with these ten

1. Tag `ZZ Test`, shorten the waits, let all five run. Read them as one
   conversation. Do they repeat themselves?
2. Reply after touch 2. Does it stop cleanly?
3. Reply `not interested` at touch 1. Does it stop and record the reason?
4. Reply `how much again` at touch 3. Does it answer rather than continue the
   sequence?
5. Set `objection_last` to `price` before tagging. Does touch 2 address price?
6. Set `objection_last` to `my wife said no`. Does it handle it sensibly?
7. Tag someone who also has `injured`. Nothing should send.
8. Tag `ZZ Blocked`. Nothing should send.
9. Run the `no-show-recovery` variant. Does it avoid blaming them?
10. Let it finish. Does the opportunity land in Lost?

Test 1 is the important one. Individually the messages are fine. Read as a
sequence is where the problems show up.

[SHOT 09.5-03]

## Checklist

- [ ] Read all five messages as one conversation
- [ ] The four objection responses rewritten in my words
- [ ] A real member story in the knowledge base
- [ ] Banned phrases absent
- [ ] Touch 5 not softened
- [ ] Stops on reply, tested
- [ ] Blocked and injured contacts get nothing, tested
- [ ] No-show variant does not blame
- [ ] Ends in Lost correctly

## When it goes wrong

**It repeats itself.** Read the five together. Usually two touches make the
same argument. Rewrite one.

**It keeps going after a reply.** Stop-on-reply. See 06.4.

**Nobody replies to any of them.** Almost always the objection responses are
generic. Rewrite touch 2 in your own words and watch what happens.

**It sounds desperate.** Too many touches or the timing is compressed. Twelve
days over five touches is not desperate. Five days over five touches is.

## Shot list

| Shot | Screen | Capture | Highlight | Blur |
|------|--------|---------|-----------|------|
| 09.5-01 | The follow-up agent config | The prompt, cadence section | The five touches | Nothing |
| 09.5-02 | The objection responses in the prompt | The four angles | The price response | Nothing |
| 09.5-03 | Phone, all five touches in one thread | The whole sequence | Touch 5 | Number |
| 09.5-04 | A contact where the sequence stopped on reply | The thread | The stop point | Names |

## Video script

**Hook.** Your leads are not saying no. They are going quiet, they meant to
reply, and they will never think about you again unless something makes them.

**Beats.**
1. On screen: talk to camera. Drip versus this. Use the message-four example.
2. On screen: the cadence table.
3. On screen: read touch 5 out loud. Then read a softened version. Explain why
   the soft one gets ignored. This is the best thirty seconds in the lesson.
4. On screen: the banned phrases. Read them, wince.
5. On screen: the four objection responses. Rewrite the price one live, in
   your own words. Say this is the highest value edit in the course.
6. On screen: write a member story into the knowledge base, then show touch 3
   using it.
7. On screen: phone, all five touches. Read them as a sequence out loud.

**Go do.** Rewrite the four objection responses in your own words. Then run
test 1 and read all five on your phone.

## Verify on screen

- Whether waits can be temporarily shortened without disturbing contacts in
  flight.
- Confirm the no-show variant is a branch inside this agent, not a separate
  agent.
