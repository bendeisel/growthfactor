# Component Inventory

The build specs live in **`design-system/components/*.json`** and are the source of
truth. `scripts/validate-config.mjs` reads them directly and fails the build if a
layout or skin references anything not defined there.

This file is the map, not a second copy of the data — deliberately, so the two can
never drift.

| Spec file | Components |
|---|---|
| `components/depth.json` | `depth-layer` |
| `components/hero.json` | `hero` · `trust-bar` |
| `components/body.json` | `service-card` · `service-grid` · `proof-stats` · `process-steps` · `before-after` · `testimonial-set` · `team-card` · `team-grid` · `pricing-tiers` · `schedule-table` · `gallery` · `faq` · `rich-content` · `logo-strip` |
| `components/conversion.json` | `cta-band` · `contact-block` · `lead-form` |
| `components/structural.json` | `nav` · `footer` · `sticky-mobile-cta` |

23 components, 87 variants. Format and Bricks mechanics: `docs/COMPONENT-SPEC-FORMAT.md`.

```bash
# what exists, and what each variant is for
node -e "for(const f of ['depth','hero','body','conversion','structural']){
  const s=require('./design-system/components/'+f+'.json');
  for(const[n,d]of Object.entries(s)){ if(n[0]==='\$')continue;
    console.log('\n'+n); for(const[v,x]of Object.entries(d.variants))
      console.log('  '+v.padEnd(22)+x.description.slice(0,80)); }}"
```

---

## The rule that keeps the library converging

**A layout may only reference components and variants that exist in the specs.** If a
build needs something new, add it to the core as a new variant — never bolt it onto a
single client site. That way client 12 inherits what client 5 paid for, and the
library gets better with every project instead of fragmenting.

`validate-config.mjs` enforces this. It is not a style guide, it is a build gate.

## Conventions

- **No cosmetic global classes.** Styling lives in the component or in a token.
  Global classes are layout primitives only: `.section`, `.container`, `.stack`,
  `.cluster`, `.grid-2/3/4`, `.is-dark`.
- **Every value is a token.** The validator fails on any hard-coded colour in a spec.
  The one exception is neutral black scrims over client-supplied media, which exist to
  guarantee contrast regardless of skin.
- **Every component works at depth 0.** Depth is additive decoration; nothing may
  depend on it to be legible or functional.
- **Every component has a dark state** via `.is-dark`, so any section can be inverted
  for vertical rhythm without adding a variant.
- **Slots take content, never markup.** A slot that needs custom HTML means a variant
  is missing.
- **Variants never change slot names.** Swapping a variant must not force a layout to
  re-map its content.

## Invariants the validator enforces

| Rule | Why |
|---|---|
| `contact-block` depth is always 0 | The conversion surface stays fast. It is the reason the site exists. |
| `before-after` depth is always 0 | The photographs are the effect; depth competes with them. |
| Section depth is an integer 0–3 | Beyond 3 is not a tier, it's a mistake. |
| Skin `defaults` resolve to real variants | A typo'd default silently falls back and the skin looks wrong for no visible reason. |
| Skin `overrides` target real tokens | An override on a nonexistent token silently no-ops — the worst kind of bug, because the skin *looks* correct. |
| Declared `tokens` and every `var(--gf-…)` resolve | Catches renames before they reach a build. |
