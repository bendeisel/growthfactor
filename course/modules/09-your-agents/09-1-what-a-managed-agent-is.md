# 09.1 What a Managed Agent is

**Module:** 09 Your Agents
**Video:** ~7 min
**Needs first:** module 07, module 08
**You finish with:** understanding what your agents are and how they differ
from everything else you have built

## Why this matters

You have spent eight modules building workflows. An agent is a different kind
of thing, and the difference is worth understanding before you edit one.

## Workflow versus agent

| | Workflow | Agent |
|---|----------|-------|
| Decides what to do | You did, in advance | It does, in the moment |
| Handles the unexpected | No. Falls through or stops | Yes |
| Message content | Written by you, fixed | Written by it, guided by you |
| Predictable | Completely | Mostly |
| Good at | Timing, tagging, moving data | Conversation, judgement |

A workflow sends message three on day five whether or not you replied to
message two. An agent reads what you said and decides what to say next.

Neither is better. You need both, which is why module 06 exists. Workflows
handle the timing and the plumbing. Agents handle the talking.

## What makes it a Managed Agent rather than a chatbot

**It takes actions.** That is the whole distinction.

Your agents can:

- Look things up in your knowledge base
- Book an appointment on a real calendar
- Add and remove tags
- Update contact fields
- Move an opportunity
- Trigger a workflow
- Notify a human

A chatbot answers. An agent answers and then does the thing.

[SHOT 09.1-01]

## How they were built

In plain language. Somebody described what the agent should do, and the
builder assembled it.

That is why the prompts in `assets/agent-prompts/` read like instructions to a
new employee rather than code. Because that is what they are.

Underneath it runs on Agent Studio, with the same lifecycle: **draft, test,
publish**, with versions and rollback. You mostly stay in the plain-language
layer.

## The four parts of an agent

When you open one, this is what you are looking at.

[SHOT 09.1-02]

### 1. The prompt

Its instructions. Who it is, what it does, what it must never do, when to hand
off. This is the part you edit most.

### 2. The trigger

What starts it. An inbound message, a form submission, a tag being added, a
schedule, an appointment event.

### 3. The tools

What it is allowed to do. Knowledge base lookup, calendar booking, tag
management, field updates, notifications.

An agent cannot do something it does not have the tool for, which is a safety
feature. The reactivation agent does not have a payment tool, so it cannot
charge anybody, no matter what its prompt says.

### 4. The knowledge base

What it knows. Module 08. Same base for all six.

## Versions, and why you should not be nervous

Every publish creates a version. You can roll back.

That is worth knowing before you start editing, because the fear of breaking
something is what stops owners from customising their agents, and an agent
that sounds like your gym is worth far more than one that is safely
untouched.

Edit it. Test it. If it is worse, roll it back.

[SHOT 09.1-03]

## What they cannot do

Being clear about limits builds the right kind of trust.

- They cannot know something that is not in the knowledge base. They will say
  so and escalate.
- They cannot see your check-in system unless we connected it.
- They cannot take payment.
- They cannot process a cancellation.
- They cannot see a conversation that happened on your personal phone.
- They will occasionally get something wrong. That is why 09.13 exists.

## Checklist

- [ ] I know the difference between a workflow and an agent
- [ ] I know an agent takes actions, not just answers
- [ ] I can name the four parts of an agent
- [ ] I know versions exist and I can roll back
- [ ] I know what they cannot do

## Shot list

| Shot | Screen | Capture | Highlight | Blur |
|------|--------|---------|-----------|------|
| 09.1-01 | An agent taking an action in a real conversation | The thread plus the resulting booking | The booking confirmation | Names |
| 09.1-02 | An agent open, showing prompt, trigger, tools, KB | The agent config | The four areas | Nothing |
| 09.1-03 | Version history with a rollback option | The version list | The rollback control | Nothing |

## Video script

**Hook.** Everything you built in the last three modules was plumbing. This is
the thing at the end of the plumbing, and it works differently from anything
else in here.

**Beats.**
1. On screen: the workflow versus agent table. Use the day-five example, it
   makes the difference obvious.
2. On screen: a real conversation where an agent answered and then booked.
   Say: a chatbot answers, an agent does the thing.
3. On screen: open an agent, point at the four parts.
4. On screen: the tools list. Say the reactivation agent has no payment tool
   and therefore cannot charge anybody. Safety by capability, not by
   instruction.
5. On screen: version history. Tell them to edit fearlessly, they can roll
   back.

**Go do.** Open one of your agents and find all four parts. Do not change
anything yet.

## Verify on screen

- Exact layout and tab names of a Managed Agent.
- Whether version history and rollback are exposed to a sub-account user.
- The tool list available to Managed Agents currently.
