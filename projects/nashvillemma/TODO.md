# Nashville MMA: what is left to finish the site

Checked against the working tree on 2026-09-19. Every "ready" item names the
file its content already comes from, so anyone can pick it up without asking
Ben first. Every "blocked" item says exactly what is missing.

## Where it stands

17 pages built: the homepage, the schedule, the classes index, and 14 program
pages. All of them share the continuous gold background, the header and footer
from one source, and a working mobile layout. The 14 program pages and the
classes index carry the full-bleed hero and the card stack.

Four internal links still go nowhere: `about.html`, `contact.html`,
`events.html`, `recovery.html`.

## Ready to build, content already in the repo

Nothing here needs Ben. The copy is harvested and the pages can be generated
the same way the program pages are.

- **Contact** from `content/contact.md`, 315 words. Kills a dead link that the
  footer's View Our Location button also points at.
- **FAQ** from `content/faq.md`, 2002 words, plus 16 individual FAQ pages in
  `content/faq-*.md`. A real FAQ set, not filler.
- **Coaches** from `content/instructors.md` plus 17 `content/instructors-*.md`
  files. Index plus a page each. Note the standing rule: no invented
  credentials, and Dedrek Sanders still has no photo.
- **Reviews** from `content/reviews.md`. 62 reviews named, 38 with body text.
  The other 24 are a name only, because the vendor rendered reviews as images.
  No star rows, the gym is at 4.9.
- **Sponsors** from `content/classes-sponsors.md`, 564 words. This is half of
  what the Events and Sponsorships link needs.
- **Facilities** from `content/classes-facilities.md`, 505 words. Could stand
  alone or feed the About page.

## Blocked, needs Ben

- **Header structure.** Still 97Display's menu with two labels swapped. Needs
  the real sections and where each points. Cheap to change now: labels and
  destinations both live in `NAV` in `data/build_site.py` and nothing else.
- **About.** No source in the harvest at all. Facilities copy could carry part
  of it, the rest needs writing.
- **Recovery.** No copy and no photos. Recovery appears only as passing
  mentions inside the blog, facilities and FAQ pages. Nothing about what is
  actually in the room, so nothing can be written honestly.
- **Events.** No copy and no photos. Sponsors covers half the page.
- **Privacy and Terms.** No source, and legal text is not something to draft
  from nothing.
- **Blog.** The listing page carries excerpts for 10 articles and the harvest
  has the full text of exactly one, `blog-155719-gear-recommendations.md`,
  which is not among the 10. So the articles have to be re-harvested from the
  live site or the blog starts fresh. Worth deciding rather than defaulting:
  the existing posts are long general-interest pieces on sleep, mindfulness
  and motivation that would sit on any gym's blog. Fewer pages aimed at
  Nashville intent would carry more weight than ten that are not.
- **Photography.** Ben is generating new images. The current hero sources top
  out around 1000px, so they are upscaled in a 1440px hero and read soft.
  Target roughly 2400px wide at about 2:1, subject right, left third quiet.

## Functional gaps, not pages

- **The lead form posts nowhere.** The popup has inputs but no `<form>` and no
  action anywhere on the site. Every Request Information button opens a modal
  that cannot submit. This is the biggest functional hole in the build.
- **Meta descriptions unused.** 56 sit in the harvest front matter and zero
  reach the built pages. One change in the page shell.
- **The homepage has not been touched.** It still runs the original artboard
  hero and layout. It has the new background, header and footer, but not the
  bleed hero or the card treatment the program pages now use.
- **No sitemap or canonical tags.** The `site-ship` routine adds these at
  deploy, worth confirming before go-live rather than after.

## Standing rules that apply to all of it

- Copy is the client's. Place it verbatim, flag oddities, do not improve it.
- Never invent facts about real people, sponsors or partner businesses.
- Never write review text.
- Motion is rAF, never CSS animation.
- Square panels, rounded buttons. No index numerals on cards.
- No em dashes anywhere.
