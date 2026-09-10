# 02.5 Importing your member list without burning your number

**Module:** 02 Contacts, Tags and the Trigger Dictionary
**Video:** ~8 min
**Needs first:** 02.1, 02.3, and A2P approved (01.2)
**You finish with:** your existing members and leads in the system, tagged
correctly, without a single message going out

## Why this matters

This is the highest risk thing you will do in this course.

Two things go wrong, both permanent:

1. **You import 800 contacts and a workflow fires on all of them.** Everyone
   gets a "welcome, book your free trial" text, including members who have
   trained with you for four years. It is embarrassing and you cannot unsend.
2. **You bulk message an old list that never consented.** Spam complaints go
   up, carriers filter your number, and your A2P campaign can be revoked. That
   is not a slap on the wrist, it is your texting shut off.

Both are avoidable. Neither is recoverable.

## Before you import anything

**Turn off everything that could fire.**

1. Open **Automation** and list every workflow with a trigger of Contact
   Created or Tag Added.
2. Pause each one. Write down which you paused.

   [SHOT 02.5-01]

3. Confirm the agents that fire on tags cannot start. See 09.11 for pausing an
   agent.

Do not skip this because you think your import will not trigger anything. It
will.

## Prepare the file

A CSV, one row per person. Clean it in a spreadsheet before it goes anywhere
near HighLevel, because fixing 800 records afterwards is a day of your life.

Columns to include:

| Column | Notes |
|--------|-------|
| First Name | Split it out. Do not import "John Smith" into first name |
| Last Name | |
| Phone | One format. `+16155551234` is safest. Strip brackets and dashes |
| Email | |
| Tags | Comma separated. This is how you segment on the way in |
| `membership_type` | If you have it |
| `membership_start` | Date format consistent throughout |
| `last_attended` | If you have it. Worth real effort to get |

### Tag them in the file, not afterwards

This is the trick that makes the whole thing safe. Put the right tags in the
CSV so contacts arrive already segmented.

| Who | Tags in the file |
|-----|-----------------|
| Current members | `member` |
| Former members | `member-lapsed` |
| Leads who never joined | `lead` |
| Anyone who ever asked you to stop | `do-not-contact` |
| Anyone you are not certain consented | `do-not-contact` |

That last row is the important one. Be conservative. A contact tagged
`do-not-contact` can be untagged later if they opt in. A contact who got an
unwanted text cannot be un-texted.

**Never put a firing tag in an import file.** No `follow-up`, no
`reactivation`, no `review`. Importing 400 rows tagged `reactivation` starts
400 conversations in one minute.

## The consent question, answered honestly

You can only text people who agreed to be texted. Not people whose number you
have. Not people who once walked in. Agreed.

Realistically, for a gym list:

| Group | Safe to text? |
|-------|--------------|
| Current members who signed a form with consent language | Yes |
| Former members who signed the same form | Usually yes |
| Leads who filled in a web form with a consent checkbox | Yes |
| Numbers from a paper sign-up sheet with no consent wording | No |
| A list you bought, or scraped, or got from anywhere else | Absolutely not, ever |
| Numbers you are not sure about | Treat as no |

Email is more forgiving than SMS, but the same principle applies.

If a big part of your list is uncertain, do not text it. Email it once with a
clear opt-in, and text only the people who respond. Slower, and it keeps your
number alive.

## Steps

1. **Contacts**, then **Import Contacts**.

   [SHOT 02.5-02]

2. Upload the CSV.

3. **Map every column.** Go slowly here. Match each spreadsheet column to the
   right field, and check the custom fields specifically, since those are the
   ones that get mismapped.

   [SHOT 02.5-03]

4. Choose how to handle duplicates. Update existing is usually right, so you
   do not create second copies of people already in there.

5. **Import a test batch of 5 first.** Not the whole file. Five rows, from a
   copy of the file.

6. Open those five contacts. Check every field landed where it should. Check
   the tags. Check the phone format.

7. Only then import the rest.

   [SHOT 02.5-04]

## After the import

1. Spot check twenty records at random.
2. Check the tag counts. Does the number of `member` tags roughly match your
   actual membership? If not, something mismapped.
3. Confirm no messages went out. Check Conversations for anything outbound in
   the last hour.
4. **Then** unpause your workflows, one at a time, watching each.

## Warming up, if you are texting an old list

Even with consent, blasting 800 texts from a fresh number gets you filtered.

Spread the first contact over two weeks. Two hundred a day at most, ideally
fewer. Use a workflow with a batching or drip setting rather than a bulk send.
See 06.3.

## Test it

Before the real import, run the whole process on a five row file containing
you and four made up people with your own number variations. Confirm:

- Fields land correctly
- Tags apply
- Nothing sends

## Checklist

- [ ] Every Contact Created and Tag Added workflow paused
- [ ] Tag-firing agents paused
- [ ] CSV cleaned, phone in one format, names split
- [ ] Tags in the file, no firing tags anywhere in it
- [ ] Uncertain consent marked `do-not-contact`
- [ ] Five row test import checked field by field
- [ ] Full import done
- [ ] Twenty records spot checked
- [ ] Confirmed nothing sent
- [ ] Workflows unpaused one at a time

## When it goes wrong

**Messages went out during the import.** Pause everything immediately,
including the agents. Then work out which workflow fired, and go and read
what was actually sent so you know how bad it is. If it went to members,
a short honest apology text does more good than silence.

**Fields are in the wrong place.** Do not fix 800 records by hand. Delete the
imported batch and reimport with corrected mapping. Much faster, and this is
exactly why the five row test exists.

**Duplicates everywhere.** The duplicate handling setting was wrong. Merge
tools exist but they are painful, which is another argument for the test
batch.

## Shot list

| Shot | Screen | Capture | Highlight | Blur |
|------|--------|---------|-----------|------|
| 02.5-01 | Automation, workflow list | Workflows with their status | The pause toggles | Workflow names if sensitive |
| 02.5-02 | Contacts > Import | The import entry point | The button | Nothing |
| 02.5-03 | Column mapping screen | The mapping table | A custom field mapping | Real data in preview rows |
| 02.5-04 | A cleaned CSV in a spreadsheet | The columns including Tags | The Tags column | Real names and numbers |
| 02.5-05 | Post import, tag counts | The tag list with counts | The `member` count | Nothing |

## Video script

**Hook.** The single worst thing you can do in this account is import your
member list with your automations switched on. Eight hundred people get a
"welcome, book your free trial" text, including the guy who has trained here
for four years.

**Beats.**
1. On screen: Automation. Pause the workflows. Do this first, on camera,
   before even opening the CSV. Order matters and showing the order teaches it.
2. On screen: a spreadsheet. Clean it. Show the Tags column being filled in.
   Say plainly: no firing tags in this column, ever.
3. On screen: talk to camera. The consent table. Be blunt about bought lists.
4. On screen: import five rows. Check them. Then the rest.
5. On screen: unpause the workflows one at a time.

**Go do.** Clean your CSV tonight. Do not import until your workflows are
paused and you have run the five row test.

## Verify on screen

- Exact import flow and the duplicate handling options in the current release.
- Whether workflows can be bulk paused or only one at a time.
- Whether import supports tag assignment via a column, since the whole safe
  approach here depends on it.
