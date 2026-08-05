# Component Inventory

Every component is a native [Bricks Component](https://academy.bricksbuilder.io/builder/features/components/)
with **variants** (visual alternatives without forking structure) and **slots**
(content injection points). Built once, in the core, used by every layout.

**The rule that keeps the library from fragmenting:** a layout may only reference
components and variants listed here. If a build needs something new, add it here as
a new variant — never bolt it onto a single client site.

All components accept a `depth` property (0–3) that the skin defaults and a section
can override. See `docs/3D-DEPTH-SYSTEM.md`.

---

## Structural

| Component | Variants | Slots |
|---|---|---|
| `nav` | `transparent-overlay`, `solid`, `centered-logo`, `with-cta-bar` | logo, links, cta |
| `footer` | `minimal`, `sitemap`, `mega-local` | brand, columns, legal |
| `sticky-mobile-cta` | `call-now`, `book-appointment`, `claim-trial` | label, target |

## Above the fold

| Component | Variants | Slots |
|---|---|---|
| `hero` | `split-urgent`, `centered-calm`, `fullbleed-kinetic`, `split-visual`, `stacked-editorial` | eyebrow, headline, subhead, cta-primary, cta-secondary, media, trust-strip |
| `trust-bar` | `certifications`, `insurance-logos`, `credentials`, `review-scores`, `stat-inline` | items[] |

## Body

| Component | Variants | Slots |
|---|---|---|
| `service-grid` | `cards-3up`, `cards-2up-large`, `list-detailed`, `programs-4up`, `alternating-rows` | heading, intro, items[] |
| `service-card` | `icon-top`, `image-top`, `glass`, `numbered` | icon/image, title, body, link |
| `proof-stats` | `band-4up`, `inline-3up`, `oversized-2up` | items[] |
| `process-steps` | `horizontal-3`, `vertical-timeline`, `numbered-cards` | heading, steps[] |
| `before-after` | `slider`, `side-by-side`, `grid-gallery` | heading, pairs[] |
| `testimonial-set` | `carousel`, `grid-3up`, `single-feature`, `quote-wall` | heading, items[] |
| `team-grid` | `cards-3up`, `cards-4up`, `list-bio`, `feature-lead` | heading, members[] |
| `team-card` | `photo-overlay`, `photo-above`, `horizontal` | photo, name, role, credentials, bio, link |
| `pricing-tiers` | `three-column`, `two-column-featured`, `single-offer`, `comparison-table` | heading, tiers[] |
| `schedule-table` | `weekly-grid`, `by-program`, `embed` | heading, entries[] |
| `gallery` | `masonry`, `carousel`, `grid-lightbox`, `fullbleed-strip` | heading, images[] |
| `faq` | `accordion`, `two-column`, `grouped` | heading, items[] |
| `rich-content` | `single-column`, `with-sidebar`, `two-column` | body |
| `logo-strip` | `static`, `marquee` | logos[] |

## Conversion

| Component | Variants | Slots |
|---|---|---|
| `cta-band` | `emergency`, `appointment`, `free-trial`, `split-image`, `minimal-centered` | headline, body, cta-primary, cta-secondary |
| `contact-block` | `form-map-split`, `form-only`, `multi-location`, `card-stack` | heading, form, map, hours, nap |
| `lead-form` | `short-3-field`, `standard`, `multi-step`, `quote-request` | fields[], submit, consent |

## Depth

| Component | Variants | Slots |
|---|---|---|
| `depth-layer` | `mesh-gradient`, `prerendered-video`, `shader-canvas`, `grain-only`, `parallax-image` | media, poster |

`depth-layer` is a background element other components compose with, not a section
on its own. It enforces the rules from `docs/3D-DEPTH-SYSTEM.md`: reserved aspect
ratio, poster-first loading, `prefers-reduced-motion` fallback, mobile downgrade.

---

## Conventions

- **No cosmetic global classes.** Styling lives in the component or in a token.
- **Every component works at depth 0.** Depth is additive decoration; nothing may
  depend on it to be legible or functional.
- **Every component has a dark-section state** via `.is-dark`, so any section can be
  inverted for rhythm without a new variant.
- **Slots take content, never markup.** If a slot needs custom HTML, that is a signal
  a new variant is required.
