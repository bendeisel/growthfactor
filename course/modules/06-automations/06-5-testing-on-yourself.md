# 06.5 Testing on yourself

**Module:** 06 Automations
**Video:** ~5 min
**Needs first:** 06.1
**You finish with:** a repeatable test routine you run before anything goes
live

## Why this matters

This is the one rule from 00.5. Everything else in this course is
recoverable. A bad message sent to your list is not.

Testing takes five minutes. Not testing costs you members.

## Your test contacts

Create these once and keep them forever.

| Contact | Purpose |
|---------|---------|
| `ZZ Test` | Your own number and email. The happy path |
| `ZZ Blocked` | Your number again, tagged `do-not-contact`. The negative case |
| `ZZ Kid` | Your number, `participant_is_child` true, `child_age` 8 | 

The `ZZ` prefix keeps them at the bottom of an alphabetical list and makes
them obvious. Never delete them.

[SHOT 06.5-01]

## Can you use your own number twice?

Yes. Several contacts can share a phone number. Messages all arrive on the
same phone, which is exactly what you want for testing, and you can tell them
apart by content.

If it gets confusing, use your number for `ZZ Test` and a spare or a family
member's number, with permission, for the others.

## The routine

Every time, before publishing anything that sends.

### 1. Happy path

Trigger it on `ZZ Test`. Watch every message arrive on your actual phone.

**Read them on the phone, not on screen in HighLevel.** They look different.
Line breaks land differently, links look different, and a message that reads
fine in the builder can arrive as a wall of text.

[SHOT 06.5-02]

### 2. Negative case

Trigger it on `ZZ Blocked`. Nothing should arrive. Nothing at all.

If anything arrives, stop and fix the guardrail before doing anything else.

### 3. Timing

Check the gaps are what you intended. If a workflow is meant to wait two days,
you do not want to wait two days to test it, so:

- Temporarily shorten the waits to two minutes
- Run the whole sequence
- Set the waits back
- Republish

Write down that you shortened them. People forget to set them back, and then
a member gets five messages in ten minutes.

### 4. Read it as a sequence

Once all messages have arrived, scroll your phone and read them as one
conversation.

This is the step everybody skips and it is the most valuable one. Individually
each message is fine. Together they often repeat themselves, contradict each
other, or sound relentless.

Ask: if I got these five messages, would I reply, or would I block this
number?

## Testing something that involves money

Use test mode. See 05.1. Never test a payment flow live with a real card
unless it is the final one dollar check.

## Testing an agent

Different, because an agent responds rather than sends on a schedule. Covered
properly in 09.10, with the twelve messages every agent should survive.

## After it goes live

Test again on real behaviour in the first week:

1. Check Conversations daily for anything an agent or workflow sent.
2. Read a handful in full.
3. Look for anything that reads wrong in context.

The gap between "works as configured" and "reads right to a real person" only
closes with real conversations.

## Checklist

- [ ] `ZZ Test`, `ZZ Blocked` and `ZZ Kid` exist
- [ ] I test the happy path on my own phone
- [ ] I test the negative case every time
- [ ] I shorten waits to test, and set them back
- [ ] I read the whole sequence as a conversation
- [ ] I check real conversations in the first week after going live

## When it goes wrong

**Test messages not arriving.** A2P, from 01.2. Or the workflow is not
published. Or the contact does not match the trigger conditions.

**They arrive but look wrong.** Read on the phone, always. Fix the formatting
in the builder and resend.

**I forgot to set the waits back.** Check right now. Then check whether
anybody entered the workflow in the meantime.

## Shot list

| Shot | Screen | Capture | Highlight | Blur |
|------|--------|---------|-----------|------|
| 06.5-01 | Contacts, the three ZZ test contacts | The list | The ZZ prefix grouping | Own number |
| 06.5-02 | Phone, a sequence of arrived messages | The thread | The whole sequence | Number |
| 06.5-03 | A wait step temporarily set to 2 minutes | The step | The duration | Nothing |

## Video script

**Hook.** Five minutes of testing, or a message you cannot unsend. That is the
trade every single time.

**Beats.**
1. On screen: create the three test contacts. Ninety seconds.
2. On screen: run a workflow on ZZ Test. Cut to a real phone, messages
   arriving. Read one on the phone, point out the formatting difference.
3. On screen: run it on ZZ Blocked. Show the phone staying silent. Hold the
   shot slightly too long, silence is the point.
4. On screen: shorten waits, run, set back. Say out loud: write this down.
5. On screen: phone, scroll the whole sequence. Ask the block-this-number
   question.

**Go do.** Create the three contacts now. Then run your most recent workflow
on both ZZ Test and ZZ Blocked.

## Verify on screen

- Whether multiple contacts may share a phone number in the current release.
- Whether a workflow can be manually triggered on a specific contact, and how.
