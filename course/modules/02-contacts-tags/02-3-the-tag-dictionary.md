# 02.3 The tag dictionary

**Module:** 02 Contacts, Tags and the Trigger Dictionary
**Video:** ~9 min
**Needs first:** 02.1
**You finish with:** understanding the control surface for all six agents

## Why this matters

This is the most important lesson in the first half of the course.

Your agents do not have an on switch each. They have tags. Adding
`reactivation` to a contact starts the reactivation agent on that person.
That is the entire interface, and once you understand it, you can run the
whole system from a contact record.

It also means a renamed tag is a broken agent, with no error message.

Full reference: `assets/tag-dictionary.md`. This lesson teaches you to use it.

## Three kinds of tag

Every tag in your account does exactly one of three jobs. Never two.

| Kind | Does what |
|------|-----------|
| **Firing** | Starts an agent |
| **State** | Records a fact |
| **Blocking** | Stops something |

## Firing tags

Add one of these and an agent starts working. This is your control panel.

[SHOT 02.3-01]

| Tag | Starts | Use it when |
|-----|--------|-------------|
| `follow-up` | Follow-up agent | A lead went cold, run the nudge sequence |
| `reactivation` | Reactivation agent | A member lapsed, or an old lead is worth another go |
| `review` | Review agent | Someone just had a good experience |
| `voice-callback` | Voice agent, outbound | A missed call needs calling back |
| `no-show-recovery` | Follow-up agent, no-show version | Booked and did not turn up |

**The agent removes its own firing tag when it finishes.** That is deliberate.
It means you can tag the same person again in three months and it works.

Adding a firing tag by hand is completely fine and is how you should use the
system day to day. Somebody had a great session, add `review`. Somebody has
gone quiet, add `follow-up`.

## State tags

Facts. Nothing fires off these, but agents and lists read them constantly.

`lead`, `trial-booked`, `trial-showed`, `member`, `member-lapsed`,
`kids-program`, `source-ads`, `source-walk-in`, `source-referral`

These are never removed automatically. A contact accumulates them as their
history builds.

## Blocking tags

The ones that stop things. Learn these properly, they are your safety net.

| Tag | Stops |
|-----|-------|
| `do-not-contact` | Everything, forever. No agent, no workflow, no message |
| `no-ai` | Agents only. Workflows still run. Use when a member wants a human |
| `staff-handling` | Agents only, temporarily. Applied when a human takes over |
| `injured` | Reactivation and follow-up. Nobody rehabbing wants a win-back text |
| `billing-hold` | The review agent. Never ask for a review from someone whose card just failed |

[SHOT 02.3-02]

### `do-not-contact` is yours alone

No agent may ever apply it. They escalate instead. That tag has legal weight
under messaging rules and it is not an AI's to hand out.

Apply it yourself when: somebody asks to stop hearing from you, somebody
complains about being contacted, or you get any kind of formal complaint.

### `no-ai` versus `staff-handling`

Both stop the agents. The difference is how long.

- `staff-handling` is temporary. It goes on when you take over a conversation
  and comes off when you are done. If you forget to remove it, that member
  never hears from an agent again, so it is worth checking now and then.
- `no-ai` is a standing preference. This member wants humans. It stays.

## The `gym-` namespace

Anything you invent goes under `gym-`. `gym-comp-team`, `gym-6am-crew`,
`gym-belt-blue`.

Two reasons. It keeps your tags visually separate from ours in a long list,
and it means when we push a snapshot update with new tags, we cannot collide
with something you made.

## Running your gym from tags

Here is the practical version. A member finishes a great first month.

1. You open their contact.
2. You add `review`.
3. Done. The review agent asks how it is going, and if they are happy, sends
   them your Google link.

Somebody cancels because they moved.

1. Open contact, add `member-lapsed`.
2. Do not add `reactivation`. They moved. Add `do-not-contact` if they asked.

Somebody enquired two months ago and never booked.

1. Add `follow-up`. Twelve days of nudges, stopping the moment they reply.

That is the whole system.

## What not to do

**Do not rename our tags.** `follow-up` is not `Follow Up` and not `followup`.
Rename it and the agent listens for a tag that no longer exists. No error, no
warning, it just quietly stops working.

**Do not use one tag for two jobs.** If `review` also means "left a review",
you cannot tell who to ask and who not to. Use `review` to fire, and a
separate `gym-review-left` to record.

**Do not add firing tags in bulk.** Tagging 400 contacts with `reactivation`
at once starts 400 conversations at once. See 02.5 and 06.4.

## Test it

1. Open `ZZ Test`.
2. Add `review`. Watch what arrives.
3. Check the contact again in a few minutes. The `review` tag should be gone,
   removed by the agent.
4. Now add `do-not-contact`, then add `review` again. Nothing should send.

Step 4 is the one to actually run. Confirming your blocking tags work is worth
more than confirming your firing tags do.

## Checklist

- [ ] I understand firing, state and blocking
- [ ] I know all five firing tags and what each starts
- [ ] I know `do-not-contact` is mine to apply, never an agent's
- [ ] My own tags go under `gym-`
- [ ] I have not renamed anything
- [ ] I tested that `do-not-contact` actually blocks

## When it goes wrong

**An agent did not start.** Check the tag spelling on the contact. It is
almost always this.

**A member stopped getting anything.** Check for a leftover `staff-handling`
tag. This is the most common cause of a contact going silent.

**Two agents messaged the same person.** Check whether a workflow is applying
a firing tag at the same time you did by hand. Look at the contact activity.

## Shot list

| Shot | Screen | Capture | Highlight | Blur |
|------|--------|---------|-----------|------|
| 02.3-01 | Settings > Tags, full list | The tag list | The five firing tags | Nothing |
| 02.3-02 | A contact with blocking tags applied | The tag area of the record | `do-not-contact` | Name and number |
| 02.3-03 | Adding a tag on a contact record | The tag input | The autocomplete | Name |
| 02.3-04 | The same contact minutes later, firing tag removed | Tag area | The absence of the tag | Name |

## Video script

**Hook.** Your six agents do not have on switches. They have tags. Learn five
words and you can run this whole system from a contact record.

**Beats.**
1. On screen: talk to camera. Three kinds of tag. Ten seconds.
2. On screen: tag list. The five firing tags, one line each.
3. On screen: a live demo. Add `review` to a test contact, cut to a phone, the
   message arrives. Cut back, the tag is gone. This demo teaches the concept
   better than any explanation.
4. On screen: blocking tags. Slow down on `do-not-contact` and say plainly
   that no agent will ever apply it.
5. On screen: talk to camera. Do not rename anything. Say what happens: no
   error, just silence.

**Go do.** Add `review` to your test contact and watch it work. Then add
`do-not-contact` and confirm nothing sends.

## Verify on screen

- Exact nav path for the tag list.
- Confirm the snapshot ships every tag in the dictionary, spelled as written.
- Confirm agents really do remove their own firing tag on completion.
