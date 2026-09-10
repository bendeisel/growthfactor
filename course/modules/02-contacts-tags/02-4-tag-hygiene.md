# 02.4 Tag hygiene

**Module:** 02 Contacts, Tags and the Trigger Dictionary
**Video:** ~4 min
**Needs first:** 02.3
**You finish with:** rules that stop your tag list turning into a swamp in six
months

## Why this matters

Every account we take over has the same problem. Two hundred tags, forty of
them near duplicates, nobody remembers what half of them mean, and three
workflows listening for a tag that was renamed a year ago.

It happens slowly, one convenient tag at a time. Four rules prevent all of it.

## The four rules

### 1. Lowercase, hyphens, no spaces

`follow-up`. Not `Follow Up`, not `follow up`, not `Follow-Up`.

Tags are matched exactly. `Follow Up` and `follow-up` are two different tags
and one of them does nothing.

### 2. One job per tag

A tag either fires, records, or blocks. Never two.

The common mistake: using `review` both to ask for a review and to mark that
somebody left one. Now you cannot filter for who still needs asking. Use
`review` to fire and `gym-review-left` to record.

### 3. Your tags go under `gym-`

Everything you invent gets the prefix. It keeps your tags separate from ours
in the list, and it means a snapshot update from us can never overwrite
something you built.

### 4. Before you create a tag, ask what reads it

If nothing reads it, do not create it. A tag that no workflow, agent or smart
list uses is a note, and notes belong in the notes field.

[SHOT 02.4-01]

## The quarterly clean

Fifteen minutes, four times a year.

1. Open **Settings > Tags** and sort by usage or contact count.

   [SHOT 02.4-02]

2. Find tags on zero contacts. Delete them, unless a workflow applies them.

3. Find near duplicates. `bjj`, `BJJ`, `jiu-jitsu`, `jiujitsu`. Pick one, move
   the contacts, delete the rest.

4. Find anything you cannot explain in one sentence. If nobody knows what it
   means, it is not doing anything useful.

5. Check `staff-handling`. Anyone who has had it for more than a week has been
   forgotten about. Clear them, and go and look at those conversations, they
   are probably unanswered.

That last step catches real, live, ignored members. It is the reason to do
this quarterly rather than never.

## Before you rename anything

Renaming a tag is not a rename. In practice it detaches the tag from
everything listening for it.

Before renaming, search for the tag in:

- Workflow triggers
- Workflow actions
- Agent prompts
- Smart list filters

If it appears anywhere, do not rename it. Ask us. For the tags in the
dictionary, the answer is always do not rename it.

## Checklist

- [ ] I use lowercase and hyphens
- [ ] Every tag has exactly one job
- [ ] My tags carry the `gym-` prefix
- [ ] Quarterly clean is in my calendar
- [ ] I know renaming breaks things silently

## Shot list

| Shot | Screen | Capture | Highlight | Blur |
|------|--------|---------|-----------|------|
| 02.4-01 | A messy tag list from a demo account | The duplicates | Three near-duplicate tags | Nothing |
| 02.4-02 | Settings > Tags sorted by contact count | The list | Zero-count tags | Nothing |
| 02.4-03 | A contact stuck with staff-handling for weeks | The record | The tag and the date | Name and number |

## Video script

**Hook.** Every account we take over has two hundred tags and nobody knows
what forty of them do. It takes about six months to get there. Four rules stop
it.

**Beats.**
1. On screen: a genuinely messy tag list. Let it sit for a second, it is
   funny and it lands.
2. On screen: the four rules, one at a time, with an example of each breaking.
3. On screen: the quarterly clean. Show finding a contact stuck on
   `staff-handling` for three weeks. Point out that is a real person who was
   ignored.

**Go do.** Put a quarterly reminder in your calendar. Then check
`staff-handling` right now.

## Verify on screen

- Whether tags can be sorted by contact count in the current release.
- Whether renaming a tag in Settings updates references anywhere, since the
  lesson asserts it does not.
