# Nashville MMA: what is left to finish the site

Checked against the working tree on 2026-09-19. Every "ready" item names the
file its content comes from. Every "blocked" item says exactly what is
missing and who has it.

## Where it stands

41 pages built, and no link on the site points at a page that does not exist.

The homepage, the schedule, the classes index and 14 program pages were there
before. New this round: about, contact, FAQ, coaches index plus a page for
each of the 16 coaches, reviews, facilities, recovery and events. All 41 share
the continuous gold background, one header, one footer, a working mobile
layout, and now a meta description.

The menu is no longer 97Display's. It is built from what the site has:
About, Classes, Kids, Coaches, Schedule, Recovery, Contact. Fitness sits
inside Classes and Events sits in the footer, because the header row holds
seven labels before it wraps. Both live in `NAV` in `data/build_site.py` and
swapping either back is a one-line edit that lands on all 41 pages.

## Ready to build, content already in the repo

- **Blog.** A decision, not a blocker. The listing page carries excerpts for
  10 articles and the harvest has the full text of exactly one,
  `blog-155719-gear-recommendations.md`, which is not among the 10. So either
  the articles get re-harvested from the live site or the blog starts fresh.
  Worth deciding rather than defaulting: the existing posts are long
  general-interest pieces on sleep, mindfulness and motivation that would sit
  on any gym's blog. Fewer pages aimed at Nashville intent would carry more.

## Blocked, needs Ben

- **The lead form posts nowhere.** The popup has inputs but no `<form>` and no
  action anywhere on the site. Every Request Information button opens a modal
  that cannot submit. This is the biggest functional hole in the build and it
  needs a destination: GHL, an inbox, or a webhook.
- **A recovery room photo.** The page is built from the gym's own words, which
  name the sauna, the cold tub, the Normatec boots and the mobility area. The
  hero is a general gym photo, captioned as one, because no photo of that room
  exists anywhere in the harvest.
- **Two numbers disagree in the client's own copy.** The homepage says 80+
  classes per week, the call to action on every program page says 90+. Both
  came from the vendor site. Pick one and it changes everywhere.
- **Upcoming events have passed.** The events page carries March and April
  dates, harvested as written. They need replacing with what is actually next.
- **Privacy and Terms.** No source, and legal text is not something to draft
  from nothing.
- **Photography.** The current hero sources top out around 1000px, so they are
  upscaled in a 1440px hero and read soft. Target roughly 2400px wide at about
  2:1, subject right, left third quiet.

## Functional gaps, not pages

- **The homepage has not been touched.** It still runs the original artboard
  hero and layout. It has the new background, header and footer, but not the
  bleed hero or the card treatment the rest of the site now uses.
- **No sitemap or canonical tags.** The `site-ship` routine adds these at
  deploy, worth confirming before go-live rather than after.
- **24 of the 62 reviews are a name with no words**, because the vendor
  rendered every review as the same image. Those 24 are left off the reviews
  page rather than given words they never said. Pulling their text from the
  Google listing would put them back.

## What changed in the structure, and why

97Display gave every FAQ answer its own page, fifteen of them, each one
question long, and then repeated all fifteen on a listing page as well. That
is thin duplicate content twice over. The FAQ is now one page with a jump
list, and every question keeps an anchor you can link straight to.

The coaches went the other way. Sixteen coaches with real biographies were a
single scrolling list on the old site. Each one now has a page, because a
named coach with three paragraphs of history is exactly what people search.

## Standing rules that apply to all of it

- Copy is the client's. Place it verbatim, flag oddities, do not improve it.
- Never invent facts about real people, sponsors or partner businesses.
- Never write review text.
- Motion is rAF, never CSS animation.
- Square panels, rounded buttons. No index numerals on cards.
- No em dashes anywhere.
