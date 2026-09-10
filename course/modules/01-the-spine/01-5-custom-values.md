# 01.5 Custom values

**Module:** 01 The Spine
**Video:** ~6 min
**Needs first:** 01.1
**You finish with:** your gym's facts stored once, and every agent and message
reading from them

## Why this matters

Your trial offer appears in six agent prompts, four workflows, three forms and
a dozen message templates. When you change the offer, you can either edit
twenty five things and miss four, or you can edit one.

Custom values are the one. They are variables. You write
`{{custom_values.trial_offer}}` in a message, and the system swaps in whatever
you set here.

This is also how the agents stay editable by you rather than by us. The agent
prompts reference custom values, so changing your offer does not mean touching
an AI prompt.

## Steps

1. Open **Settings > Custom Values**.

   [SHOT 01.5-01]

2. You will find most of these already created by the snapshot. Fill in the
   ones that are empty and correct the ones that are wrong.

3. Click a value to edit it, type the value, save.

   [SHOT 01.5-02]

## The values your agents read

Fill in every one of these. An empty custom value shows up in a live message
as blank space, and a message that says "Your trial is  starting" is worse
than no message.

| Value | What to put | Example |
|-------|------------|---------|
| `gym_name` | How you want to be called in messages, not your legal name | `Nashville MMA` |
| `gym_address` | Full address as you would text it to someone driving | `123 Example Rd, Nashville TN 37201` |
| `gym_phone` | The number members should call | |
| `trial_offer` | Your adult intro offer, in full, as a sentence fragment | `a free week trial` |
| `trial_offer_kids` | The kids version | `two free kids classes` |
| `booking_link` | Your intro calendar link | |
| `google_review_link` | The direct write-a-review URL, not your profile URL | |
| `owner_first_name` | Who messages sign off as | `Ben` |
| `quiet_hours` | When no agent may message | `9pm to 8am` |

## Getting the Google review link right

Not your Google Business Profile URL. You want the one that opens the review
box directly.

1. Search your gym on Google.
2. In your business panel, click **Ask for reviews** or **Get more reviews**.
3. Copy the short link it gives you.
4. Paste it into `google_review_link`.

Test it on your phone. It should open straight to the star rating, not to your
listing. Every extra tap loses reviews.

[SHOT 01.5-03]

## Writing the trial offer correctly

The value gets dropped mid sentence by the agents, like this:

> "I can get you in for {{custom_values.trial_offer}} on Tuesday at 6pm."

So write it as a fragment that fits: `a free week trial`. Not
`FREE WEEK TRIAL!!`, and not `Free Week Trial - Limited Time Only`, both of
which read as nonsense once they land inside a sentence.

## Adding your own

Anything you find yourself typing repeatedly should be a custom value. Common
additions for gyms:

- `parking_note`
- `what_to_bring`
- `kids_age_range`
- `current_promo`

Name them lowercase with underscores, same as the rest.

## Test it

1. Open Conversations and your `ZZ Test` contact.
2. Type a message using a custom value: `Testing {{custom_values.trial_offer}}
   at {{custom_values.gym_address}}`.
3. Send it, then read what actually arrived on your phone.

If you see the raw `{{custom_values.trial_offer}}` text in the received
message, the name is wrong or the value is empty.

## Checklist

- [ ] Every value in the table above is filled in
- [ ] Trial offer reads correctly mid sentence
- [ ] Google review link opens the review box directly on a phone
- [ ] Quiet hours set to something sensible
- [ ] Sent a test message and the values swapped in

## When it goes wrong

**Raw `{{custom_values.something}}` arrives in a message.** The value does not
exist under that exact name, or it is empty. Check spelling, check
underscores.

**A message reads oddly.** Read it out loud with the value substituted. Most
custom value problems are grammar, not technical.

## Shot list

| Shot | Screen | Capture | Highlight | Blur |
|------|--------|---------|-----------|------|
| 01.5-01 | Settings > Custom Values | The full list | Nothing | Values containing real details |
| 01.5-02 | Editing one value | The edit panel | The value field | Nothing |
| 01.5-03 | Google Business Profile, get more reviews | The share link dialog | The copy link button | Business details |
| 01.5-04 | Phone, receiving the test message | The received text | The substituted values | Phone number |

## Video script

**Hook.** Change your trial offer once, and twenty five messages update. Or do
not do this lesson, and change it in twenty five places, and miss four.

**Beats.**
1. On screen: Custom Values list. What they are, in one line: variables.
2. On screen: fill in trial_offer. Then show it appearing inside an agent
   message. That is the moment it clicks for people.
3. On screen: Google review link. Do it properly, on a phone, show the review
   box opening.
4. On screen: the fragment point. Type a bad one, read the resulting sentence
   out loud, laugh, fix it.
5. On screen: test message on a real phone.

**Go do.** Fill in all nine values, then text yourself using two of them.

## Verify on screen

- The exact custom value syntax in the current release.
- Whether the snapshot delivers these pre-created and pre-named as listed.
