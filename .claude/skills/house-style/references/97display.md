# 97Display "Ultimate" theme — the archetypes you already own

Many Growth Factor clients sit on 97Display's platform. Its "Ultimate" theme
ships far more section archetypes than any one site uses, and switching
archetype is the cheapest restructuring available: it changes the page's spine
without importing anything from outside the vendor's own vocabulary, so it
never violates the amplify-don't-import lock.

Everything below was read out of `Resources/Ultimate/assets/css` on a real
client download, not from memory. Re-verify per client — vendors add variants,
and a given account may not have all of them enabled.

## The full variant list

| Slot | Variants available | Count |
| --- | --- | --- |
| Header | `uHeader-1`, `uHeader-2`, `uHeader-3`, `uHeader-Farell` | 4 |
| Hero / slider | `uSlider-1`, `-2`, `-3`, `-5`, `-8`, `-9`, `-10`, `-11`, `-Farell`, `-video` | 10 |
| About | `uAbout-1`, `uAbout-2`, `ultimate--about-n2` | 3 |
| Programs | `uPrograms-1`, `uPrograms-2` | 2 |
| Services | `uServices-1`, `uServices-2` | 2 |
| Reviews | `uReviews-1`, `uReviews-2`, `uReviews-4` | 3 |
| Location | `uLocation-1`, `uLocation-2` | 2 |
| Footer | `uFooter-1`, `uFooter-2`, `uFooter-tiny-1`, `uFooter-tiny-2`, `uFooter-tiny-3` | 5 |
| FAQ | `uFaq-1`, `uFaq-2` | 2 |
| Membership | `uMembership-1` | 1 |
| Instructors | `uInstructors` | 1 |

Plus standalone devices that are not slot-based: `dotSection` (numbered
milestone row), `stackSlider97` (stacked-card carousel), `innerpageBanner`
(full-width slogan band), and `farellStyle` (an alternate visual treatment
that restyles sliders and buttons).

## How much restructuring is already available

Counting just the seven-slot spine — header × hero × about × programs ×
reviews × location × footer:

```
4 × 10 × 3 × 2 × 3 × 2 × 5 = 7,200 structural permutations
```

That is 7,200 arrangements available on the platform the client is already
paying for, before touching type, color, density, or rhythm. Add the services
slot and it doubles.

The practical consequence: when a 97Display site feels bland, the first move
is almost never custom code. It is checking which archetype each slot is using
and whether a different one serves the content better.

## Reading what a site currently uses

`scripts/extract_kernel.py` reports this directly as
`section_variants_used` versus `section_variants_available`. The gap between
those two lists is your free restructuring budget.

Nashville MMA, for example, uses one archetype per slot out of the 7,200
available:

`uHeader-2` · `uSlider-10` · `dotSection` · `stackSlider97` ·
`about-n2` · `uReviews-2` · `innerpageBanner` · `uLocation-2` ·
`uFooter-tiny-3`

## Caveats worth knowing before you promise anything

- **Variants are not always enabled per account.** The CSS shipping a variant
  does not guarantee the client's admin exposes it. Confirm before quoting work.
- **Some variants carry hardcoded structure.** `uSlider-10` puts its background
  behind a 95vw band on mobile and reflows the copy below it; swapping heroes
  can change mobile layout more than desktop.
- **The theme's own overrides fight you.** Vendor CSS uses `!important`
  liberally (every `:root` token is `!important`). Expect to work with the
  token layer rather than against it.
- **Tokens are the supported surface.** The `:root` custom properties are the
  vendor's own theming contract — changing those is durable, while overriding
  deep selectors tends to break on platform updates.
