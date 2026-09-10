# 09.12 Snapshots and a second location

**Module:** 09 Your Agents
**Video:** ~6 min
**Needs first:** 09.11
**You finish with:** knowing how your setup gets copied, and what does not
travel with it

## Why this matters

Two reasons this matters to you.

1. **Your setup arrived as a snapshot.** Understanding that explains why some
   things were already there and some were not.
2. **If you open a second location**, the whole thing can be copied in
   minutes rather than rebuilt.

## What a snapshot is

A package of an account's configuration. Workflows, calendars, pipelines,
custom fields, tags, forms, funnels, and now agents.

Managed Agents can be packaged inside a snapshot and deployed across
sub-accounts. That is how your six arrived configured rather than blank.

[SHOT 09.12-01]

## What travels, and what does not

The most useful thing to know in this lesson.

| Travels | Does not travel |
|---------|-----------------|
| Agents and their prompts | Your contacts |
| Workflows | Your conversation history |
| Calendars and their settings | Your Stripe connection |
| Pipelines and stages | Your A2P registration |
| Custom fields and values | Your phone number |
| Tags | Your email domain authentication |
| Forms and funnels | Your knowledge base content, usually |
| Templates | Your team members |

**A2P and email authentication never travel.** They are tied to a legal
entity and a domain, so a second location has to register separately, and
that takes days. Start it the moment you open the sub-account, exactly as in
01.2.

**Knowledge base content usually does not travel cleanly.** Even if it did,
you would want it rewritten, because a second location has a different
address, different coaches and a different schedule. Assume you are refilling
module 08 for the new site.

## Opening a second location

The order that works.

1. Tell us. We create the sub-account under the agency and push the snapshot.
2. **Start A2P registration on day one.** See 01.2.
3. Start email domain authentication. Often the same domain, still needs
   configuring.
4. Connect Stripe.
5. Update custom values: address, phone, gym name if different, review link.
   This alone corrects most of what the agents say. See 01.5.
6. Rebuild the calendars with real availability for that site.
7. Add the coaches as users.
8. Rewrite the knowledge base for that location.
9. Republish the agents.
10. Run the twelve message test again for the new site.

Steps 5 and 8 are where the work is. Everything else is quick.

[SHOT 09.12-02]

## Why custom values do so much work here

This is the payoff for setting them up properly in 01.5.

Because the agent prompts reference `{{custom_values.gym_address}}` rather
than a hardcoded address, changing one field updates every agent, workflow
and template at the new location.

If your first location's setup had hardcoded addresses in messages, opening a
second site would mean hunting through dozens of places. It does not, because
of one lesson in module 01.

## What we handle

Snapshot creation, pushing it, and any wiring that needs agency-level access.
You do not need to learn snapshots as a skill.

What you should know is what does not travel, so you plan for A2P delay
rather than being surprised by it.

## Updating an existing location from a snapshot

Occasionally we push an update: a fix, an improved prompt, a new workflow.

**Your customisations can be affected.** Before we push anything to a live
account we will tell you what it touches, and if you have heavily edited an
agent we will work around it.

If you have made edits you care about, keep a copy of your prompt text
somewhere outside the platform. Paste it into a note. Five minutes of
insurance.

## Checklist

- [ ] I understand my setup came from a snapshot
- [ ] I know A2P and email auth do not travel
- [ ] I know the knowledge base needs rewriting per location
- [ ] I have a copy of any agent prompt I heavily edited
- [ ] If I am opening a second site, I have told you early enough for A2P

## When it goes wrong

**Second location's agents give the first location's address.** Custom values
were not updated. See 01.5.

**Nothing texts at the new location.** A2P is not approved yet. Nothing to do
but wait.

**An update overwrote my edits.** Restore from your saved copy. This is why
the copy exists.

## Shot list

| Shot | Screen | Capture | Highlight | Blur |
|------|--------|---------|-----------|------|
| 09.12-01 | Snapshot contents including agents | The included items | The agents section | Account names |
| 09.12-02 | A new sub-account's custom values being updated | The values | The address field | Real details |
| 09.12-03 | A prompt copied into a plain note as backup | Split view | The saved copy | Nothing |

## Video script

**Hook.** If you open a second gym, most of this copies across in minutes.
Two things do not, and they take days, so you need to know which.

**Beats.**
1. On screen: a snapshot's contents. What a snapshot is, in twenty seconds.
2. On screen: the travels and does-not-travel table. Slow on A2P and email
   auth.
3. On screen: the ten step order for a second location. Emphasise step 2 on
   day one.
4. On screen: custom values updating and an agent immediately saying the new
   address. This is the satisfying moment and it pays off module 01.
5. On screen: copying a prompt into a note. Five minutes of insurance.

**Go do.** If you have edited any agent prompt, copy it into a note right now.

## Verify on screen

- Confirm Managed Agents can be included in snapshots on our plan.
- Confirm what a snapshot carries in the current release, particularly
  knowledge base content.
