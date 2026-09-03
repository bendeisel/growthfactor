---
name: house-style
description: Growth Factor's house process for client website design and redesign work. Use this whenever the work touches a client's site — redesigning or refreshing an existing site, editing or improving a page, building a new site, making design artboards or mockups, choosing typefaces or colors, or restructuring sections. Trigger it even when the request sounds casual ("make this look better", "clean up the homepage", "the hero feels bland", "give me some options") and even when no client name is mentioned, because the whole point of this skill is to stop generic design defaults from replacing the client's own visual identity. Read it BEFORE opening a design tool, writing markup, or picking a single color.
---

# House style: designing for clients without converging

## The failure this exists to prevent

Ask for a redesign with no constraints and you get regression to the mean. A
bland input gives almost nothing to anchor on, "make it better" is an
unconstrained instruction, and the vacuum gets filled with the same house
defaults every time: centered hero, oversized generous type, three-column
feature grid, soft rounded cards, muted palette, lots of whitespace, Inter.

The output is competent and completely interchangeable. Ten clients get ten
versions of one site. For an agency, that is an existential problem — clients
notice, and the ones who notice are competitors in the same city.

The fix is not more taste or more theme presets. It is a small set of locks
that survive editing, because drift happens one reasonable-looking edit at a
time.

## The four locks

### 1. Copy is frozen at 99%

Preserve the client's words verbatim. Do not rewrite headlines, tighten
paragraphs, punch up CTAs, or "improve" section labels. Growth Factor handles
copy separately with the client, and a redesign that silently rewords the site
forces them to diff prose when they were trying to review layout.

The 1% covers mechanical repairs only: a genuine typo, a doubled word, an
encoding artifact, a truncation marker in an excerpt. Anything you *want* to
reword, list at handover instead of changing.

This lock also does real design work. When words are fixed you cannot solve a
weak section by writing a better headline — you have to solve it with
hierarchy, scale, and space, which is the actual craft.

### 2. The brand kernel is frozen

The kernel is the client's real, measured identity: exact typefaces, exact
hexes, exact structural motifs. It comes out of their existing site, logo,
signage, print, or vehicle wrap — never out of your preferences.

Extract it mechanically. Reading a palette off a screenshot is where drift
starts: you approximate `#D7AD56` as "gold", then "gold" drifts to whatever
gold you like, and three edits later it is someone else's site.

```bash
python3 scripts/extract_kernel.py <saved-site-dir> --palette -o kernel.json
```

Trust `tokens` and `token_colors` most — those are values the client's own
stylesheet declares. See `references/extraction.md` for what to do when there
is no site to mine.

### 3. Editing amplifies what is there; it never imports

This is the load-bearing rule. **If a change requires a typeface, color, or
shape the site does not already use, it is out of scope.**

Frozen: typefaces, hexes, and the motif vocabulary.
Fair game: hierarchy, scale, density, rhythm, section order, whitespace,
crop, alignment, and how hard an existing motif is pushed.

Bland sites are almost never blank — they are *under-committed*. A template
typically ships four or five genuinely specific devices and uses each one
once, quietly, at 80% opacity. Improving such a site means finding those
devices and making them the entire design language. Replacing them with your
own vocabulary is the drift you are trying to avoid, even when the result is
objectively prettier.

**The name-the-motif test.** For every visual decision, name the existing
element it came from. If you cannot point at one, you drifted — revert it.
This is deliberately checkable: anyone reviewing the work can ask "which
existing motif is this from?" and get a real answer or catch the drift.

This lock is also what rules out the popular "feed a URL to a generator and
swap the branding" workflow, which is import in its purest form. There are
three legitimate ways to use reference material and a set of hard limits on
it: `references/reference-intake.md`.

### 4. Diverge from the log, not from randomness

`data/shipped-log.csv` records what has already shipped: client, vertical,
city, type pairing, color stance, layout archetype, density. Read it before
designing and append to it after.

Before building, check the new site against every logged site in the same
vertical within roughly 100 miles. At least two of {type pairing, color
stance, layout archetype} must differ. Same-vertical neighbours are the only
collisions anyone actually notices.

A log beats a bigger theme library because theme collisions follow the
birthday problem — protection scales with the *square root* of library size,
so 30 themes only buys about two more clients than 10 does. The arithmetic is
in `references/axes.md`. Variety comes from combining a few axes and tracking
what you used, not from maintaining a catalog.

## Workflow

**Step 0 — Read the log.** `data/shipped-log.csv`. Note what the same-vertical
neighbours used, so you know what you are steering away from.

**Step 1 — Extract the kernel.** Run `scripts/extract_kernel.py` on whatever
the client has. Write down the faces, the hexes, and which section archetypes
the site currently uses. State them in one line to the user, so a wrong kernel
gets caught before it is built on.

**Step 2 — Inventory the motifs.** List the specific devices the site already
has, however timidly used — a hairline rule, an oversized numeral, a bordered
band, an unusual radius pairing. This list is the palette of moves available in
Step 4, so be concrete and generous. Note how many times each is currently
used; anything used once is an amplification candidate.

**Step 3 — Pick the axes.** Choose structure, type stance, density, rhythm,
color stance, and motion stance from `references/axes.md`, constrained by
Step 0's divergence check. This is the only place variation is allowed to come
from outside the client. Motion is Axis 6 and it is chosen here, at design
time, not discovered later during the build.

**Step 4 — Build.** Copy verbatim, kernel exact, motifs amplified, motion
derived from the geometry rather than picked (`references/motion.md`). Build as
ONE multi-page artifact from `../site-factory/templates/site-shell.html`, never
one artifact per page — see `../site-factory/references/multipage-artifact.md`.
House defaults for small-business builds (standing client instruction): lead-capture
forms open as a popup/modal from every request CTA rather than living only
inline, and interactive showcases should be portable — vanilla JS/CSS that can
drop into a template platform as a custom block, not framework-bound
components. The build
target is Growth Factor's own static stack deployed to Hostinger — see
`references/hostinger-delivery.md` for the architecture, form handling, deploy
paths and the volume economics. Template platforms (97Display etc.) are source
material a client arrives FROM: `references/97display.md` stays useful for
reading what such a site currently uses, never as a thing we build on.

**Step 5 — Self-audit.** Before handover, answer these in writing:

- Did any word change? Which, and why was it mechanical?
- Is every hex and face in the kernel?
- For each visual decision: which existing motif is it from?
- For each animation: which existing motif is it from, and does its easing match
  the kernel's geometry?
- If a reference informed anything, which single mechanism was taken, and is it
  rebuilt entirely in the client's kernel?
- Which two of {type, color, layout} differ from same-vertical neighbours?
- Would this be mistaken for the last three sites shipped?

**Step 5b — Run the craft audit.** The audit above catches drift. It does not
catch craft. Run the `polish` skill over the built files before handover:

```bash
python3 .claude/skills/polish/scripts/audit.py <site-dir> --kernel kernel.json
```

Blockers ship broken, so clear them. A polish pass may not introduce anything,
which is the same lock as Step 4.

**Step 6 — Log it.** Append a row to `data/shipped-log.csv`. A skipped row
makes the next project's divergence check silently useless.

## Banned defaults

These are the specific tropes that generic output converges on. They are
banned as *defaults* — if the client's kernel genuinely contains one, it stays.

- **Typefaces:** Inter, Roboto, Open Sans, Lato, Montserrat-as-a-default,
  Poppins, Fraunces. (Montserrat is fine when it is the client's actual face,
  as at Nashville MMA — banned as a reflex pick.)
- **The shadcn/Tailwind look:** slate or zinc neutrals, 6–8px rounded cards,
  soft diffuse shadows, `gray-50` section banding. Good components, exhausted
  aesthetic.
- **Gradient-mesh or aurora hero backgrounds.** Also glassmorphism panels.
- **Rounded card with a colored left border accent.**
- **The safe hero:** centered headline, centered subhead, centered button pair,
  full-bleed stock photo at low opacity.
- **The reflex three-column feature grid** with an icon, a bold label, and two
  lines of gray text in each column.
- **Emoji as iconography.** Draw inline SVG on a consistent grid instead.
- **Decorative statistics** — round numbers with no source, invented to fill a
  band.

Reaching for one of these is the tell that the vacuum is being filled with
defaults instead of the client's identity. Stop and go back to Step 2.

Motion has its own banned list — the site-wide scroll library, counting stat
counters, typewriter headlines, hover-lift-plus-shadow, autoplay carousels,
preloaders, scroll-jacking. See `references/motion.md`.

## The routines that run this process

This skill is the design law. The `site-*` skills are the procedures that
apply it end to end, and `site-factory` is the shared spine underneath them:

| Routine | For |
| --- | --- |
| `site-redesign` | The client has a live site to upgrade |
| `site-new` | No site; identity assembled from research |
| `site-match` | A reference site for structure, client brand for identity |
| `site-preview` | Publish a build to `preview.<domain>/<slug>` for approval |
| `site-ship` | Deploy an approved build to the client's domain |
| `site-factory` | The spine: build pipeline, registry, Hostinger, artifact shell |

Every one of them runs Steps 0 through 6 above. The locks are not optional
because a routine is in a hurry.

## Reference files

- `references/extraction.md` — mining a kernel from a site, a logo, or print
  when there is no CSS to read.
- `references/axes.md` — the axes kit (structure, type, density, rhythm, color,
  motion) and the collision arithmetic behind preferring axes to a theme
  catalog.
- `references/motion.md` — Axis 6 in full: the five motion stances, the
  physics, the house reveal implementation, and the banned motion defaults.
- `references/reference-intake.md` — how to use Awwwards, screenshot-to-code,
  and URL-to-site generators without importing someone else's identity.
- `references/hostinger-delivery.md` — the build target: static stack on
  Hostinger, form handling, deploy paths, and the volume-pricing economics.
- `references/97display.md` — LEGACY/source-platform reference: reading the
  section archetypes of a site a client is migrating away from.
- `references/worked-example-nashvillemma.md` — one project end to end: kernel,
  motif inventory, and what amplification versus substitution looks like on a
  real bland template.
- `data/shipped-log.csv` — the divergence log. Read at Step 0, append at Step 6.

The separate `polish` skill runs the craft audit at Step 5b.
