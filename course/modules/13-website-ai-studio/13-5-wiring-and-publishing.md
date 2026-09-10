# 13.5 Wiring it to HighLevel, and publishing

**Module:** 13 Website
**Video:** ~9 min
**Needs first:** 13.4, module 09
**You finish with:** a live site whose forms feed your agents

## Why this matters

A beautiful site that does not feed your CRM is a brochure.

The whole point of the previous twelve modules is that somebody enquires and
an agent answers in under a minute. That only happens if the form on your new
site is a HighLevel form.

## What to wire, in order

| Thing | Why | Lesson |
|-------|-----|--------|
| Enquiry forms | Feeds the appointment agent | 09.4 |
| Chat widget | Feeds the navigator | 09.3 |
| Booking embed | Direct booking without a conversation | 03.2 |
| Tracking | So attribution works | 11.3 |
| Phone number | So calls reach the voice agent | 09.8 |

## Forms

**Do not build a custom form and email yourself the results.** That is a lead
that arrives in an inbox, gets read four hours later, and never reaches an
agent.

1. In HighLevel, open **Sites > Forms** and build or open your enquiry form.
   Same fields as 03.2: name, phone, email, `program_interest`,
   `participant_is_child`, `goal_stated`, and the consent checkbox.

   [SHOT 13.5-01]

2. Get the embed code.

3. In AI Studio, ask for it to be placed in your popup:

   > `Put this embed code inside the enquiry popup that opens from the Book a
   > Free Trial buttons. Do not change the code.`

4. Publish and **submit the form yourself from the live site.**

5. Confirm: contact created, `goal_stated` captured, agent replied in under a
   minute.

Step 5 is the only step that proves the whole thing works. Do not skip it
because the form looked fine.

## Chat widget

1. In HighLevel, get the chat widget code.
2. Ask AI Studio to add it to every page, before the closing body tag.
3. Test from your phone. Send a message, confirm it lands in Conversations,
   confirm the navigator answers. See 09.3.

The chat widget is high intent. Somebody typing into a chat box on your
schedule page at 9pm is closer to joining than almost anyone else on your
site.

[SHOT 13.5-02]

## Booking embed

For people who would rather just book than talk.

Embed your intro calendar from 03.2 on the pricing page and the contact page.

Keep the popup enquiry form as well. Different people want different things,
and the enquiry form catches the ones with a question first.

## Tracking

Without this, module 11 cannot tell you where members came from.

1. Get your HighLevel tracking code.
2. Ask AI Studio to add it to every page.
3. Also add your Meta pixel and Google tag if you are running ads. See module
   10.
4. Confirm sessions appear in your reporting.

## Phone number

Put your **HighLevel number** on the site, not your personal mobile or an old
line.

Calls to that number reach the voice agent when nobody answers. Calls to any
other number do not, and they are invisible in your reporting. See 09.8.

## Publishing

AI Studio can deploy directly. That is the fastest route and it is fine for a
first version.

1. Use the deploy option in AI Studio.
2. You get a live URL.

   [SHOT 13.5-03]

3. Point your domain at it, or use the URL while you decide.

**Pointing your domain:** this is the step most likely to need help. If your
current site is live on that domain, changing it is not reversible in the
next five minutes, and DNS takes time to propagate.

If your existing site is live and getting traffic, ask us before you switch.
It is a ten minute job for us and it avoids a day of your site being down or
your email breaking, which is the thing that actually goes wrong.

## Do not lose your old URLs

If your old site had pages that rank, and your new site uses different
addresses, those rankings break.

Before switching:

1. List your old site's page addresses. A free site crawler will do it in
   minutes.
2. For any that matter, either use the same address on the new site, or set
   up a redirect.

Skipping this is how a rebuild loses a gym its search traffic, and it takes
months to notice and months to recover.

Ask us if you are unsure. This is the one part of a rebuild with lasting
consequences.

## Test the whole thing live

From your phone, on mobile data, not wifi:

1. Load every page. Note anything slow or broken.
2. Submit the enquiry form. Confirm the agent replies in under a minute.
3. Send a chat message. Confirm the navigator answers.
4. Book through the calendar embed. Confirm the confirmation arrives.
5. Call the number. Let it ring. Confirm the voice agent answers.
6. Check the schedule page. Are the times right?

Six checks, ten minutes. Do them on the day you publish.

## Checklist

- [ ] HighLevel form embedded in the popup, on every page
- [ ] Chat widget on every page
- [ ] Booking embed on pricing and contact
- [ ] Tracking code, plus pixel and tag if running ads
- [ ] HighLevel phone number on the site
- [ ] Published
- [ ] Old URLs preserved or redirected
- [ ] All six live tests passed from a phone on mobile data

## When it goes wrong

**Form submits but nothing happens.** It is not a HighLevel form, or the
embed did not carry over. Check the contact was created before looking
anywhere else.

**Chat widget not appearing.** Usually placement. Ask AI Studio to put it
immediately before the closing body tag.

**Site went live and email broke.** DNS records were replaced rather than
added. Tell us immediately, it is fixable.

**Traffic dropped after launch.** Old URLs. See above.

## Shot list

| Shot | Screen | Capture | Highlight | Blur |
|------|--------|---------|-----------|------|
| 13.5-01 | HighLevel form embed code | The embed dialog | The copy button | Nothing |
| 13.5-02 | The chat widget open on the live site, on a phone | The widget | The conversation | Nothing |
| 13.5-03 | Deploy step in AI Studio | The deploy control | The resulting URL | Nothing |
| 13.5-04 | Live test: form submitted, agent reply arriving | Split, site and phone | The elapsed time | Number |

## Video script

**Hook.** A beautiful site that does not feed your CRM is a brochure. Here is
the wiring that makes it the front end of everything you built in the last
twelve modules.

**Beats.**
1. On screen: talk to camera. Do not build a custom form that emails you. Say
   why in one line.
2. On screen: get the HighLevel form embed, drop it into the AI Studio popup.
3. On screen: publish, then submit the form from the live site on a phone,
   and show the agent reply arriving. That is the payoff shot of the whole
   module.
4. On screen: chat widget, tested from a phone.
5. On screen: talk to camera, careful tone. Pointing the domain, and old URLs.
   Tell them to ask us. This is the bit with lasting consequences.
6. On screen: run the six live tests.

**Go do.** Embed the HighLevel form, publish, then submit it from your phone
and time the agent's reply.

## Verify on screen

- Current AI Studio deploy options and whether custom domains are supported
  directly.
- HighLevel form and chat widget embed paths.
