# 08.2 The Gym knowledge base, section by section

**Module:** 08 Knowledge Bases
**Video:** ~12 min
**Needs first:** 08.1
**You finish with:** a complete knowledge base for your gym

## Why this matters

This is the two hours. Work through it with the template open.

Template: `assets/kb-gym.md`. It has every section with square brackets where
your content goes. If you run a martial arts gym, do this lesson first, then
08.3 for the sections that change.

## Structure it as separate sources

Do not paste everything into one giant document.

Each section goes in as its own source. When an agent gives a bad answer, you
can trace it to one section and fix that section, without re-reading nine
pages.

[SHOT 08.2-01]

| Section | Source type |
|---------|------------|
| 1 to 3, 6 to 8 | Rich Text |
| 4 Schedule | Table |
| 5 Pricing | Table |
| 9 FAQ | FAQ |
| 10 Rules | Rich Text |
| Waiver, handbook, price sheet | File Upload |
| Your website | Web Crawler, as backup |

Tables beat prose for anything the agent looks up precisely. A schedule
written as a paragraph produces agents that get times slightly wrong.

## Steps

1. Open **AI > Knowledge Base** and open the one the snapshot installed, or
   create one.

   [SHOT 08.2-02]

2. Add a source, choose the type, paste the content.

   [SHOT 08.2-03]

3. Work through sections 1 to 10 in order.

## The sections, and what people get wrong

### 1. Who we are

The one that matters: **who you are not for.** Be blunt.

> `Not for people looking for the cheapest gym in town. Not for people who
> want to train alone with headphones in. We are a coached, group-based gym
> and it is social.`

Owners resist writing this, because it feels like turning people away. It is,
and that is the point. An agent that filters out wrong-fit leads saves you the
trial slot and saves them the wasted evening.

### 2. Where and when

Include the quirk. Every gym has one.

> `We are round the back of the building, the front door is a barber shop.
> Park in the lot behind, not on the street, they ticket.`

That sentence prevents more first-visit problems than anything else you will
write today.

### 3. Programs

Per program, and include **the common worry and the honest answer**. That
field exists because most enquiries are a worry dressed up as a question.

> `Common worry: "Will I be the least fit person there?" Honest answer:
> usually not, and every movement gets scaled. Most people's first class is
> half the weight of everyone else's and nobody notices.`

### 4. Schedule, as a table

Day, Time, Class, Coach, Level, Capacity.

Then add a note: **how often does this change?** If your schedule changes more
than monthly, tell the agent to send the booking link rather than reciting
times. An agent confidently quoting last month's schedule is worse than one
that sends a link.

### 5. Pricing, as a table

Plan, Price, Billing period, Contract length, What is included, Cancellation
terms.

Then, in text, the rules:

- **May the agent say prices?** All of them, the starting price only, or none.
  Decide this properly, it is the most consequential setting in your KB.
- Never offer a discount that is not listed.
- Joining fee, freeze policy, cancellation notice, refunds.

**On whether to publish prices:** gyms argue about this endlessly. The
practical answer is that hiding price does not stop people asking, it just
means they ask and then get a non-answer, which annoys them. Most gyms do
better with at least a starting price. Your call, but decide deliberately.

### 6. The offer

What happens on the first visit, minute by minute. Write it out properly.

The agent uses this to answer the real question behind "what happens at the
trial", which is "how much am I going to embarrass myself".

### 7. Coaches

Name, what they coach, credentials, **one human detail**.

The human detail is what stops the agent sounding like a directory. "Mike
coaches the 6am, he has three kids and is the reason we started the parents
class" gives an agent something to say that no competitor's bot can.

### 8. Policies

Age minimum, guests, showers, lockers, childcare, dress code, contracts.

Injury and medical: the agent never advises. It says talk to the coach and
offers to flag it.

### 9. FAQ

Use the FAQ source type. One question, one answer.

Start with the template's list, then add the real ones. **Twenty real FAQs
beat two hundred invented ones.** Question 30 in the intake asks for the five
questions you are sickest of answering. Those are your best five.

### 10. Rules for the agent

Not about the gym. The behaviour contract. The always, the never, and when to
hand to a human.

Two things to decide here specifically:

1. **How the agent describes itself if asked whether it is a bot.** Write the
   exact sentence. Do not leave it to improvise, and do not have it claim to
   be human.
2. **What it must never discuss.** Beyond the standard list, add anything
   specific to your gym.

[SHOT 08.2-04]

## Search for square brackets before you finish

When you think you are done, search your knowledge base for `[`.

An agent that answers a member with a square bracket still in it went live too
early. It happens, and it looks terrible.

## Test it

Do not test by reading it. Test by asking.

1. Open your agent's test panel. See 09.10.
2. Ask ten questions a real lead would ask.
3. For each answer, check: is it correct, is it specific, does it sound like
   your gym?
4. Any answer that is vague means a gap. Go and fill that section.

Then ask five questions the KB does not cover, and confirm the agent says it
will check rather than inventing something.

## Checklist

- [ ] All ten sections filled
- [ ] Schedule and pricing are tables, not prose
- [ ] Who we are not for is written, bluntly
- [ ] The location quirk is in there
- [ ] Common worry and honest answer written for each program
- [ ] Price disclosure decided deliberately
- [ ] Twenty real FAQs
- [ ] Section 10 written, including the am-I-a-bot sentence
- [ ] Searched for `[` and found none
- [ ] Tested with ten real questions and five it cannot answer

## When it goes wrong

**The agent is still vague.** The section it needs is thin. Ask the question,
see which section should have answered, go and thicken that section.

**The agent quotes an old price.** Update the pricing table. Also check
whether your website crawler source is serving an old price from a page you
forgot about.

**The agent contradicts itself.** Two sources say different things. Usually
the crawler picked up an outdated page. See 08.5.

## Shot list

| Shot | Screen | Capture | Highlight | Blur |
|------|--------|---------|-----------|------|
| 08.2-01 | Knowledge base with several sources listed | The source list | The different source types | Nothing |
| 08.2-02 | AI > Knowledge Base entry | The KB | The add source button | Nothing |
| 08.2-03 | Adding a Table source for the schedule | The table editor | The columns | Nothing |
| 08.2-04 | Section 10 rules pasted in as Rich Text | The content | The never list | Nothing |
| 08.2-05 | Test panel, a specific answer coming back | The test conversation | The specific detail | Nothing |

## Video script

**Hook.** This is the boring two hours that decides whether your agents sound
like your gym or like software. Get a coffee.

**Beats.**
1. On screen: the template. Explain separate sources, one per section, and why.
2. On screen: work through sections 1 to 3 live, typing real content. Do not
   fast forward, watching someone actually write this is the lesson.
3. On screen: build the schedule and pricing tables. Say why tables beat prose.
4. On screen: talk to camera on price disclosure. Give the honest opinion,
   then say it is their call.
5. On screen: section 7, coaches, and the human detail. Read a good one out
   loud.
6. On screen: section 10. The am-I-a-bot sentence. Write it on camera.
7. On screen: search for `[`. Show one being found.
8. On screen: test panel, ask ten questions, react honestly to the answers.

**Go do.** Two hours, sections 1 to 10, then run the ten question test.

## Verify on screen

- Available source types and their exact names.
- Whether sources can be individually enabled, disabled and re-indexed.
- How long re-indexing takes after an edit, since the test depends on it.
