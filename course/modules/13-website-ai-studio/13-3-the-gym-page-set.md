# 13.3 The gym page set

**Module:** 13 Website
**Video:** ~9 min
**Needs first:** 13.2
**You finish with:** the right pages, doing the right jobs

## Why this matters

Gym sites have a specific anatomy, and it is not the same as a restaurant's or
a consultant's.

Get the page set right and the site works for search and for the nervous
beginner at the same time. Get it wrong, usually by putting everything on one
long page, and it does neither.

## The page set

| Page | Job | Priority |
|------|-----|----------|
| Home | Convince and route | High |
| Programs, index | Route to the real pages | Medium |
| **One page per program** | **SEO workhorse** | **Highest** |
| Schedule | The most visited page on the site | Highest |
| Coaches | Sells memberships | High |
| Pricing | Answers the question everybody has | High |
| About | Trust | Medium |
| Contact | Location, parking, hours | Medium |

[SHOT 13.3-01]

## Programme pages are the SEO workhorses

**One page per programme. Not one page listing all of them.**

Somebody searching does not type "gym". They type "bjj classes nashville",
"kids karate near me", "boxing gym east nashville". Each of those is a
different page.

A single Programs page listing eight things cannot rank for eight searches. A
page about your BJJ programme, with your BJJ schedule, your BJJ coaches and
your BJJ photos, can.

What goes on a programme page:

1. What it is, for somebody who has only seen it on TV
2. Who it is for, and who it is not for
3. What happens in a session
4. Contact level, if it is a martial art. See 08.3
5. What to bring, what you lend
6. **The class times for that programme**, read from the shared schedule file
7. The coaches who teach it
8. Photos of that class specifically
9. The enquiry action

That is a real page. Six of those is a site that ranks.

## The schedule is the most visited page

More than home, usually, because members check it constantly and prospects
check it before deciding.

So: fast, readable on a phone, and correct.

**Class data lives in exactly one file.** The master schedule and every
programme page's times generate from it. Change the Tuesday boxing time once
and it moves everywhere.

That instruction was in the prompt in 13.2. Check it actually happened. If
your class times are hardcoded into each page, ask AI Studio to refactor it:

> `Move all class times into a single data file and have the schedule page and
> every program page read from it.`

Duplicated times are not a shortcut, they are a defect you will discover the
day you change a class and get a member turning up to an empty mat.

[SHOT 13.3-02]

## Coaches sell memberships

People join gyms because of people.

Per coach: a real photo, what they teach, real credentials, and one human
detail. Same as your knowledge base in 08.2, and you can reuse that content.

**Never invent a credential.** Not a rank, not a record, not a title. If you
are not sure whether a coach's black belt is under the person you think, ask
them before it goes on a public page with their name on it.

## Kids and adults are different audiences

Do not mix them in one list.

A parent looking for kids martial arts and an adult looking to start boxing
want completely different pages, different photos and different reassurance.

Separate programme pages. If you run a lot of kids programmes, a Kids section
in the navigation is justified.

## Pricing

Put it on the site.

Hiding it does not stop people wanting to know, it just means they leave to
find it elsewhere, or they ask and you have to answer anyway. See the price
discussion in 08.2, and be consistent between your site and your agents.

If you genuinely cannot publish full pricing, publish a starting price. "From
$129 a month" is far better than nothing.

## Contact

The practical page. Address, a map, parking, the quirk about finding the door,
staffed hours, phone, and the enquiry form.

Same content as knowledge base section 2, reused. See 08.2.

## Every page needs one action

One clear enquiry action per page, and use a **popup form**, not only an
inline one at the bottom.

A button that opens a form where they are converts better than a form they
have to scroll to find. That is the house standard for every small business
site we build, and it applies here.

Wire the form to HighLevel in 13.5.

[SHOT 13.3-03]

## What not to build

- **One long scrolling page.** It reads as generated, and it cannot rank for
  more than one thing.
- **A blog you will not write.** An empty blog with two posts from 2024 looks
  worse than no blog.
- **A members area.** You have one in HighLevel. See 00.3.
- **A shop**, unless you genuinely sell online. Use payment links. See 05.3.

## Checklist

- [ ] Real separate pages, not one scroller
- [ ] One page per programme
- [ ] Class times read from a single data file
- [ ] Schedule page fast and readable on a phone
- [ ] Coaches page with real credentials only
- [ ] Kids and adults separated
- [ ] Pricing published, or at least a starting price
- [ ] Contact page has the parking quirk
- [ ] Popup enquiry action on every page

## Shot list

| Shot | Screen | Capture | Highlight | Blur |
|------|--------|---------|-----------|------|
| 13.3-01 | The site navigation with the full page set | The nav | The programme pages | Nothing |
| 13.3-02 | The single schedule data file, and two pages reading from it | Split view | The shared source | Nothing |
| 13.3-03 | A popup enquiry form opening from a button | The popup | The form | Nothing |
| 13.3-04 | A complete programme page | The page | The class times section | Nothing |

## Video script

**Hook.** Nobody searches for "gym". They search for "kids karate near me" and
"boxing gym east nashville". One page listing eight programmes cannot rank for
eight searches.

**Beats.**
1. On screen: the page set table. Point out which two are highest priority
   and why.
2. On screen: build out one programme page properly, on camera, with all nine
   parts.
3. On screen: the schedule data file. Show one edit moving times on two pages.
   Say the empty mat story.
4. On screen: coaches. Say the never-invent-a-credential rule plainly. It is a
   short beat and it matters.
5. On screen: talk to camera. Publish your pricing, and keep it consistent
   with what your agents say.
6. On screen: a popup form opening from a button.

**Go do.** Build one programme page completely, then copy its structure for
the rest.

## Verify on screen

- Nothing platform-specific in HighLevel. AI Studio specifics only.
