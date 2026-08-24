# Worked example — Nashville MMA Training Camp

A real bland-template job, start to finish. Useful because it is the ordinary
case: a 97Display site that is competent, generic, and has more identity in it
than anyone assumed.

## Step 1 — The kernel (measured, not guessed)

Read from `Resources/Ultimate/assets/css` and the page's `:root` block:

```
faces    Bebas Neue (all of h1–h6, caps by nature)
         Montserrat 400 · 700 · 900 (body, 16px / 1.6)
ground   #131313  header + footer      (--bgHeader, --bgFooter)
         #171820  alternate section    (--sectionAltColor)
         #1E1E29  cards + form inputs  (--leadformInputBg)
         #000000  hero base            (--sliderBgColor)
accent   #D7AD56  primary gold         (--dynamic)
         #C0883A  buttons              (--buttonBg)
         #C59543  slogan band          (--sloganBg)
         #CC9900  inline emphasis      (hardcoded in copy)
detail   #303030  separators           (--separator)
geometry --cornerRadius 0px · --buttonRadius 8px · --dotCorner 80px
type     h1 72/72 · h2 60/60 · h3 40/50 · h4 30/30 (phone: 25 · 30 · 26 · 20)
rhythm   --sectionGap 80px (30px on phone) · --sectionBoxed 1600px
```

80 custom properties, 12 of them colors. None of this needed to be invented,
and none of it may be changed.

## Step 2 — Motif inventory

The site has six real devices. Every one is used timidly — which is what
"bland" actually means here.

| Motif | Exact spec | Times used |
| --- | --- | --- |
| Gold hairline | 3px `#D7AD56`, also 4px in footer | 3 places |
| Oversized numeral disc | 120×120, radius 80px, `#000` ground, 70px Bebas | 1 section |
| Bordered word band | 3px `#FFF` top+bottom, gold caps, `•` separators | 1 place |
| Radius tension | panels 0px against buttons 8px | global, unremarked |
| 80% dark scrim | `#1E1E29`/`#171820` at 0.8 over photography | 3 places |
| Condensed caps on near-black | Bebas gold on `#131313` | global |

None of that is generic. A gold hairline used three ways, a 120px numeral disc,
and a bullet-separated bordered band are specific choices. They are just each
used once and quietly.

## Step 3 — Substitution versus amplification

**What substitution looks like** (the drift to avoid). Every one of these reads
as an improvement in isolation:

- Swap Bebas for Anton or Oswald, "cleaner and better spaced"
- Lighten the palette to a warm off-white for "breathing room"
- Round the panels to 12px so they "feel modern"
- Replace `dotSection` with a three-column icon-label-paragraph grid
- Center the hero, add a gradient overlay, drop the word band
- Adopt a slate neutral scale for text hierarchy

Collectively: a different company's website, and the fourth site this quarter
that looks like the other three.

**What amplification looks like** — same six motifs, pushed until they are the
whole design language:

- **Hairline → connective tissue.** Currently decoration in three spots. Make it
  the divider system: every section boundary, every display heading underlined,
  the leading edge of the lead form. Use weight as hierarchy — 3px for
  ordinary rules, 4px for section breaks, 8px for the primary action. One
  existing element now organises the entire page.
- **Numeral disc → the signature.** Currently three discs in one band. Number
  the thirteen programs `01`–`13`. Number the sections. Set the 70px Bebas
  numeral in the margin as a section marker. This is the most distinctive thing
  the site owns; use it everywhere.
- **Word band → the heading treatment.** Currently one hero instance. Give every
  `h2` the 3px rules and bullet separators. Any visitor who sees two pages
  recognises the site.
- **Radius tension → information design.** Currently invisible because nothing
  draws attention to it. Enforce it as a rule: every container square, every
  interactive element 8px. The radius now *means* "this is clickable," which
  earns its keep instead of being an accident.
- **Scrim → a legibility scale.** Currently a flat 0.8 everywhere. Make it
  graded: 0.95 behind dense copy, 0.8 standard, 0.55 for atmosphere. This also
  fixes a real defect — the `dotSection` headings ("Our Facility", "Our
  Programs", "Our Coaches") are white text sitting directly on the gym photo
  with no scrim at all, while only the paragraph below each gets a panel.
- **Condensed caps → commit to it.** The phone breakpoint drops `h1` to 25px,
  which wastes the one face with real personality. A condensed caps face is
  built to run large.

Every move above passes the name-the-motif test: each one points at an element
that already exists in the client's stylesheet.

## Step 4 — Axes chosen

Currently the site sits at full-bleed bands / moderate contrast / balanced /
even / dark-dominant — the platform default, which is why it reads generic.

A defensible combination that imports nothing:

| Axis | Choice | Why it comes from the kernel |
| --- | --- | --- |
| Structure | **E. Editorial rail** | The margin is where the 70px numerals live |
| Type stance | **4. Condensed caps dominant** | Bebas is already the only display face |
| Density | **Dense** | Suits a 40,000 sqft gym with 80+ weekly classes |
| Rhythm | **Punctuated** | Gives the existing slogan band real impact |
| Color stance | **Duotone** | Gold and near-black are already the whole palette |

## Step 5 — Copy lock in practice

Every word preserved verbatim, including two things that look like errors:

- **Lowercase "community"** in the slogan — "We build champions! / Training for
  your goals. / community for your success." Bebas Neue renders caps-only, so
  it is invisible on the live site. Left alone; flagged, not fixed.
- **Truncation markers** in the review excerpts (`...Thanks Austin!...`) — an
  artifact of the review carousel's character limit. Structural, not a typo.

Neither was changed. Both were reported at handover. That is the whole
discipline: a redesign the client can review as a layout change, without having
to diff their own prose.
