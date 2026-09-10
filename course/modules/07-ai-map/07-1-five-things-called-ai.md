# 07.1 Five things called AI

**Module:** 07 The AI Map
**Video:** ~8 min
**Needs first:** module 00
**You finish with:** being able to tell these apart, which almost nobody can

## Why this matters

HighLevel has at least five separate things with AI in the name. They overlap,
they have been renamed, and the internet is full of tutorials describing
products that no longer exist under that name.

You will get confused, and confused owners turn things on that fight each
other. Ten minutes here prevents that.

## The five

[SHOT 07.1-01]

### 1. Managed Agents

**Formerly called Super Agents.** This is what your six agents are.

You describe what you want in plain language and get a configured agent that
can hold a conversation, look things up in your knowledge base, and take
actions in the CRM: tag a contact, book an appointment, update a field,
trigger a workflow.

The important part is **it takes actions**, not just talks. That is the
difference between an agent and a chatbot.

Built on Agent Studio underneath, and it follows the same lifecycle: draft,
test, publish, with versioning and rollback.

**This is the one you care about.** Module 09.

### 2. Agent Studio

The visual builder underneath. A canvas with nodes, conditional routing, tools
and testing, for building multi-agent systems by hand.

Managed Agents is the plain-language front door to it. You can drop into the
canvas for fine control.

**You mostly will not need this.** We use it when building. You edit through
the Managed Agents interface. If a tutorial has you wiring nodes on a canvas,
you are deeper than you need to be.

### 3. Conversation AI

The older text-conversation product. A bot that replies to messages across
channels, using a knowledge base.

Simpler than a Managed Agent, and it takes fewer actions.

**Do not turn this on.** Your navigator agent does this job, better. Running
both on the same channel is the conflict described in 07.3.

### 4. Voice AI

Answers and makes phone calls. Your sixth agent. See 09.8.

Separate from the text agents because voice has its own configuration: the
voice itself, the ring behaviour, working hours, call routing.

### 5. Ask AI

The assistant for **you**, not your members. Ask it questions about your
account and your data. It can also help build a knowledge base through a
guided chat.

Nobody outside your business ever talks to Ask AI. It is an internal tool.

## Plus the ones that are just features

Not agents, just AI helping inside a tool:

- **Workflow AI Builder.** Builds workflows from a description. See 06.2.
- **Content AI.** Writes copy inside emails and pages.
- **Funnel and Website AI.** Generates pages.
- **Reviews AI.** Drafts responses to reviews. See module 12 and 09.7.

These do not talk to your members autonomously. They help you make things.

## The one-line version

| Product | Talks to | Job |
|---------|---------|-----|
| Managed Agents | Your leads and members | Conversations plus CRM actions. **Yours** |
| Agent Studio | Nobody | The builder underneath |
| Conversation AI | Your leads | Older text bot. **Leave off** |
| Voice AI | Your callers | Phone. **Yours** |
| Ask AI | You | Internal assistant |

## The naming problem, and how to survive it

Managed Agents were called Super Agents until recently. Half the tutorials
online still say Super Agents, and some of the official articles have URLs
with the old name in them.

They are the same thing. If you find a guide about Super Agents, it is about
your agents.

More generally: this part of the platform changes fast. When something in this
course does not match what you see, trust the screen, then tell us so we can
update the lesson.

## Checklist

- [ ] I can name all five and say what each is for
- [ ] I know Managed Agents and Super Agents are the same thing
- [ ] I know Conversation AI should stay off
- [ ] I know Ask AI is for me, not for members

## Shot list

| Shot | Screen | Capture | Highlight | Blur |
|------|--------|---------|-----------|------|
| 07.1-01 | The AI menu, expanded | The menu items | Each of the five | Nothing |
| 07.1-02 | AI Agents list, the six Managed Agents | The list | Nothing | Nothing |
| 07.1-03 | Agent Studio canvas | The node canvas | Nothing | Nothing |
| 07.1-04 | Ask AI open with a question typed | The panel | The internal nature of it | Data in the answer |

## Video script

**Hook.** There are five separate things in here with AI in the name, two of
them do almost the same job, and one of them was renamed last year so half the
tutorials online describe something that does not exist any more.

**Beats.**
1. On screen: the AI menu. Point at each of the five as you name it.
2. On screen: the agent list. This is yours, this is module 09.
3. On screen: Agent Studio canvas, briefly. Say plainly: you will not need
   this.
4. On screen: talk to camera. Conversation AI stays off. Say why in one line
   and promise the detail in 07.3.
5. On screen: Ask AI. Ask it something about the account, show the answer.
6. On screen: the one-line table.

**Go do.** Open your AI menu and find all five. Confirm Conversation AI is
off.

## Verify on screen

- Exact current names and menu labels for all five.
- Whether Conversation AI still exists as a separate product or has been
  folded in.
- Whether Agent Studio is reachable by a member on our plan.
