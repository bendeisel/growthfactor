# 00.4 Your six agents, before you touch anything

**Module:** 00 Start Here
**Video:** ~7 min
**Needs first:** 00.2
**You finish with:** knowing what is already running and what fires each one

## Why this matters

This is the reason you bought this. Six agents are installed in your account
right now. Some are already live. You should know what they do before one of
them talks to a member and surprises you.

Module 09 teaches you to edit them. This lesson is just so you know what they
are.

## The six

| # | Agent | Fires when | What it does |
|---|-------|-----------|--------------|
| 1 | Front Desk Navigator | Anyone messages you, any channel | Answers, books, routes. Always on |
| 2 | Appointment | A form is submitted | Replies in under a minute and gets them booked |
| 3 | Follow-up | The `follow-up` tag is added | Five touches over twelve days, stops the second they reply |
| 4 | Reactivation | The `reactivation` tag is added | Works lapsed members and dead leads, differently |
| 5 | Review | The `review` tag is added | Asks how it is going, routes happy to Google and unhappy to you |
| 6 | Voice Receptionist | A call rings out unanswered | Picks up, answers, books, texts a summary |

[SHOT 00.4-01]

## How they hand off to each other

This is the bit worth understanding. They are not six separate bots, they are
one system that passes work along.

```
   inbound message              form submitted           unanswered call
          |                            |                        |
   [1 Navigator] ................ [2 Appointment] ....... [6 Voice]
          |                            |                        |
          +---- goes quiet ------------+------------------------+
                         |
                  [3 Follow-up]
                         |
                 no reply after 12 days
                         |
                    Opportunity: Lost
                         |
                 90 days later, tagged
                         |
                [4 Reactivation]

   turned up and had a good time  -->  [5 Review]

   any agent, anything sensitive  -->  YOU
```

The handoffs run on tags. That is why module 02 spends a whole lesson on the
tag dictionary and why renaming a tag breaks things.

## What they will never do

Worth knowing now so you trust them enough to leave them alone.

- Never message anyone tagged `do-not-contact`. Ever.
- Never quote a price that is not in your knowledge base.
- Never give injury, medical or nutrition advice.
- Never negotiate, discount, or process a cancellation.
- Never argue with a complaint. It goes straight to you.
- Never message inside your quiet hours.

Every one of those is enforced in the shared rules block that all six carry.
You will see it in 09.9.

## What is switched on right now

We hand over with agents 2 through 5 live and agents 1 and 6 paused, because
those two talk to people in real time and they should not go live until your
knowledge base is filled in.

Turning them on is lesson 09.11, and the gate is module 08. Do not skip ahead
and unpause them with an empty knowledge base. A live front desk agent that
does not know your prices is worse than no front desk agent.

## Checklist

- [ ] I can name all six and what fires each
- [ ] I understand the handoffs run on tags
- [ ] I know agents 1 and 6 are paused until my knowledge base is done
- [ ] I have read what they will never do

## Shot list

| Shot | Screen | Capture | Highlight | Blur |
|------|--------|---------|-----------|------|
| 00.4-01 | AI Agents list | All six, showing status | The live and paused status column | Nothing |
| 00.4-02 | One agent open, overview tab | The agent's trigger config | The trigger | Nothing |
| 00.4-03 | Conversations, an agent reply in a real thread | The exchange | The agent's message | Names and numbers |

## Video script

**Hook.** Six agents are already in your account. Two of them are answering
messages today. Here is what each one does before you change a thing.

**Beats.**
1. On screen: agent list. Name all six with what fires each. Fast.
2. On screen: the handoff diagram. Slow down. This is the concept that makes
   the rest of the course make sense.
3. On screen: a real conversation with an agent reply. Let it land.
4. On screen: talk to camera. The never list. Read it properly, it is what
   lets them sleep.
5. On screen: agent list, the paused ones. Explain the gate.

**Go do.** Open Conversations and find one message an agent has already sent
on your behalf. Read it. Decide if it sounds like your gym. Write down what
you would change, you will use that list in module 09.

## Verify on screen

- The status labels used in the agent list: live, published, draft, paused.
  Wording matters here, the whole lesson refers to it.
- Confirm the snapshot really does hand over with 1 and 6 paused.
