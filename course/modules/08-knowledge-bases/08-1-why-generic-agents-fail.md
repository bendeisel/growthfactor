# 08.1 Why a generic agent sounds like a chatbot

**Module:** 08 Knowledge Bases
**Video:** ~5 min
**Needs first:** module 07
**You finish with:** understanding why this module is the highest leverage two
hours in the course

## Why this matters

Your six agents are all built on the same technology as everybody else's. The
prompts are good, but prompts are not the difference.

The difference is what the agent knows.

An agent with an empty knowledge base can only be polite and vague. An agent
that knows your Tuesday beginners class fills up, that your car park is round
the back behind the barber shop, and that most people who ask about BJJ are
worried about getting hurt, sounds like somebody who works there.

## The same question, two agents

**"do you do beginner classes?"**

Empty knowledge base:

> `Yes, we offer classes suitable for all levels. Would you like to book a
> consultation to learn more?`

Filled knowledge base:

> `Yeah, Tuesday and Thursday at 6 are our fundamentals classes, and they are
> mostly people in their first few months. You would not be the only new
> person. Want me to put you in Tuesday?`

Same agent. Same prompt. Same model. The second one books people.

[SHOT 08.1-01]

## What a knowledge base is

A store of your business information that the agent looks things up in before
answering.

It is not training. You are not teaching the AI. You are giving it a reference
book to check, and telling it to answer from that book or admit it does not
know.

That last part is what stops it inventing things. An agent grounded in a
knowledge base says "let me check with the team" instead of making up a price.

## What goes in it

Everything a good front desk person would know:

- What you sell, and what it costs
- When things run
- Where you are and how to get in
- Who coaches what
- Your policies
- The questions people actually ask
- The rules for what the agent may and may not say

That last one is the section people skip, and it is the one that keeps you out
of trouble. See 08.2 section 10.

## Why it gates going live

Agents 1 and 6, the navigator and the voice receptionist, talk to strangers in
real time. A live front desk agent that does not know your prices is worse
than no front desk agent, because it will answer anyway, vaguely, and the
person will assume that is how your gym is.

The other four agents work from tags and can be a bit safer with less
knowledge, but they are also much better with it.

## Budget two hours

Genuinely. Block it out.

This is the least fun part of the course and the highest return. Everything
else you have built, the calendars, the pipeline, the workflows, is plumbing.
This is the part that decides whether the thing at the end of the plumbing
sounds like your gym.

## Checklist

- [ ] I understand the knowledge base is what makes the agents specific
- [ ] I know it grounds the agent so it stops inventing things
- [ ] I have two hours blocked out
- [ ] I know agents 1 and 6 stay paused until this is done

## Shot list

| Shot | Screen | Capture | Highlight | Blur |
|------|--------|---------|-----------|------|
| 08.1-01 | Two agent replies side by side, generic and specific | Both messages | The specific details | Nothing |
| 08.1-02 | AI > Knowledge Base, a filled one | The source list | The variety of sources | Nothing |
| 08.1-03 | An agent citing a KB answer in a real conversation | The thread | The specific detail | Names |

## Video script

**Hook.** Read these two replies. Same agent, same prompt, same AI. One of
them books people and one of them does not.

**Beats.**
1. On screen: the two replies, side by side. Read both out loud. Let it land
   before explaining anything.
2. On screen: talk to camera. It is not training, it is a reference book.
3. On screen: the KB with sources in it. What goes in.
4. On screen: talk to camera. Two hours, block it out, this is the boring one
   that matters most.

**Go do.** Open `assets/kb-intake-30-questions.md` and read the questions. You
do not have to answer them yet.

## Verify on screen

- Nothing structural. Confirm the KB nav path matches 07.2.
