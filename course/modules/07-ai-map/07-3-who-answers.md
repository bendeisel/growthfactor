# 07.3 Who answers, and what conflicts

**Module:** 07 The AI Map
**Video:** ~7 min
**Needs first:** 07.1
**You finish with:** one rule that prevents the most confusing failure in the
platform

## Why this matters

Two AI products can be enabled on the same channel at the same time. When that
happens, a member sends one message and gets two replies, from two different
personalities, sometimes contradicting each other.

It looks insane from the member's side, and it is genuinely hard to diagnose
because both products look correctly configured.

## The rule

**One AI owns a conversation at a time. A human beats all of them.**

Priority, highest first:

1. **A human.** The moment a person replies manually, agents step back.
2. **`no-ai` or `staff-handling` tags.** Stop everything AI.
3. **The specialist agent**, if the contact is in one. Follow-up,
   reactivation, review.
4. **The navigator.** Handles anything else.
5. **Nothing else.** Conversation AI stays off.

[SHOT 07.3-01]

## Why Conversation AI stays off

It does a subset of what your navigator does. Running both means both reply.

If you find it on, turn it off, and check whether somebody enabled it while
following an old tutorial. See the naming problem in 07.1.

## The specialist versus navigator question

Somebody is halfway through the follow-up sequence and they send a message
asking about your prices. Who answers?

**The specialist.** The follow-up agent is in an active conversation with
them. It stops its sequence, answers the question from the knowledge base,
and continues as a conversation rather than a sequence. See 09.5.

The navigator does not jump in on a conversation another agent owns. That is
what `ai_last_agent` is for. See 02.1.

## The human handover

The most important interaction, and the one members notice.

When you reply manually in Conversations:

1. `staff-handling` is applied
2. The agents stop
3. You own the conversation

When you are done, remove `staff-handling`, and the agents can pick up again.

**People forget step 3 constantly.** A contact left with `staff-handling`
never hears from an agent again. It is the most common cause of a member going
quiet in the system. Check for it in your quarterly clean. See 02.4.

[SHOT 07.3-02]

## Voice and text at the same time

These do not conflict, they cooperate.

The voice agent answers a call, then sends a summary text. That text lands in
the same conversation thread. If the member replies to that text, the
navigator picks it up, and it can read what happened on the call.

That is by design and it is one of the better things about running both.

## Diagnosing a double reply

If a member gets two AI replies:

1. Check whether Conversation AI is enabled. Turn it off.
2. Check `ai_last_agent` on the contact to see which agents have spoken.
3. Check whether two specialist agents are both active, meaning two firing
   tags are on the contact at once.
4. Check whether a workflow is also sending messages alongside an agent.

Number 4 is common. Somebody builds a helpful workflow that texts leads, not
realising an agent is already talking to them.

## Test it

1. Send a message to your gym number from your own phone, as a stranger would.
2. Confirm exactly one reply arrives.
3. Reply manually from Conversations.
4. Confirm `staff-handling` was applied.
5. Send another message from your phone. Confirm no agent replies.
6. Remove `staff-handling`. Send another. Confirm the agent picks up again.

That six step test proves the whole priority chain works. Run it once.

## Checklist

- [ ] Conversation AI is off
- [ ] I know the priority order
- [ ] I know a manual reply applies `staff-handling`
- [ ] I know to remove `staff-handling` when I am done
- [ ] I ran the six step test

## When it goes wrong

**Two replies to one message.** Work the diagnosis list above, starting with
Conversation AI.

**No reply at all.** Check for `staff-handling` or `no-ai` left on the
contact.

**The wrong agent replied.** Check which firing tags are on the contact.
Two firing tags at once means two agents think they own it.

## Shot list

| Shot | Screen | Capture | Highlight | Blur |
|------|--------|---------|-----------|------|
| 07.3-01 | Conversation AI settings showing off | The toggle | The off state | Nothing |
| 07.3-02 | A conversation where a human replied, tag applied | The thread and tag | `staff-handling` appearing | Names, content |
| 07.3-03 | A contact with two firing tags, the broken state | The tag list | Both tags | Name |

## Video script

**Hook.** A member sends one message and gets two replies from two different
personalities that contradict each other. Here is how that happens and how to
make sure it never does.

**Beats.**
1. On screen: a real example of a double reply, if one can be staged. It is
   worth staging.
2. On screen: the priority list. Human first, always.
3. On screen: Conversation AI, off. Say why in one line.
4. On screen: reply manually in Conversations, watch `staff-handling` appear.
   Then say the thing about forgetting to remove it, and show a contact stuck
   with it.
5. On screen: run the six step test, sped up.

**Go do.** Confirm Conversation AI is off. Then run the six step test.

## Verify on screen

- Whether a manual reply automatically applies `staff-handling` or whether
  that is wired in the snapshot.
- Whether Conversation AI and Managed Agents can genuinely both be active on
  one channel, since the lesson's premise depends on it.
