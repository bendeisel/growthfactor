# The anatomy of a gym website

## Page inventory

A martial-arts gym with a full programme list runs to roughly 30 pages. They
group into a handful of templates, which is what makes the build tractable.

| Group | Count | Notes |
| --- | --- | --- |
| Homepage | 1 | video hero, programmes, reviews, request form |
| Programme pages | 10–15 | the SEO workhorses; one template stamps all of them |
| Schedule | 1 | most-visited page after the homepage |
| Coaches | 1 index + one per coach | credentials sell memberships |
| Facility / open gym | 1 | square footage, mats, equipment, recovery |
| Events + Sponsors | 2 | often separate; events may be an embed from a booking platform |
| FAQ, About, Contact, Reviews | 4 | |
| Legal — privacy, terms | 2 | real text from the client or their counsel, never invented |

Pages get renamed, moved or added over a project — plan for that, and never
delete one. If a page's premise stops being true (an "exercise classes" page
when only one fitness class survives), repurpose it and say so.

## Programme pages are where the search traffic is

Each discipline gets its own page — jiu-jitsu, boxing, muay thai, MMA,
wrestling, self-defence, kids programmes, women's classes, personal training.
Prospective members search the discipline plus the city, not the gym's name.

One template stamps all of them. Structure that works:

1. Framed hero photo, title centred, discipline named plainly
2. Intro: the client's own positioning paragraphs, plus a body photo
3. Body sections from their existing copy — levels, benefits, what to expect
4. **This programme's class times**, generated from shared data
5. Coach block where a named coach leads the programme
6. Areas served (real local SEO value, and it's their own list)
7. Request-information band

## Kids and adults are different audiences

Never mix them in one list. A parent scanning for a kids class and an adult
beginner want different pages. Tag every class by audience, then:

- adult programme pages exclude kids classes
- kids pages carry only their own
- a "kids programmes" umbrella page may list all of them

## The schedule is shared data, not page content

This is the structural decision that matters most, and Ben asked for it by name
after seeing it done well elsewhere: *"if I change one class, it changes on all
the schedules."*

Keep one file — every class exactly once:

```json
{ "day": "Monday", "start": "6:00 AM", "end": "7:00 AM",
  "name": "Gi Brazilian Jiu-Jitsu: Intermediate",
  "programs": ["jiu-jitsu"], "audience": "adult", "sort": 360 }
```

Derive `programs` and `audience` from the class name by rule rather than typing
them per page, so renaming a class can't leave a stale copy behind. Then every
view generates from that file: the master grid, and each programme page's times.

**Prove it works** by renaming a class in the data, rebuilding, and confirming
it changed on both the programme page and the master schedule. Assertions about
this are worth nothing; the test takes a minute.

In production this becomes a content collection, and a git-backed CMS gives the
client a normal admin screen to edit it. That fits a low-cost hosting model with
no per-site CMS fee.

## Building the schedule grid

- **One grid, not seven.** A single CSS grid with a time gutter plus seven day
  columns aligns by construction. Seven sibling grids that must independently
  agree on column widths will drift.
- **Fixed time rows.** Every class at 6:00 AM sits in the 6:00 AM row across all
  days. This is the thing clients notice: *"I want a schedule where the times
  line up."*
- **Break names deliberately.** Long class names wrap badly in a narrow column.
  Split at the name's own colon and set the level beneath in the accent colour,
  so a cell is at most two intentional lines.
- **Let blocks fill their slot** so single-class cells don't float in tall rows.
- **Filters by audience** (all / adults / kids / fitness) earn their place on a
  90-class timetable.

## Facility copy sells

Gyms compete on square footage, mat space, a cage or ring, recovery rooms.
Their own facility page usually has specifics worth surfacing on programme and
open-gym pages.
