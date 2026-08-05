# Component Spec Format

`design-system/components/*.json` are **build specs**: enough detail for Claude Code
driving Novamira to construct each Bricks component without further design decisions.
`design-system/components.md` is the human-readable index over the same data.

These specs are the **source of truth**. `scripts/validate-config.mjs` reads them and
fails the build if a layout references anything not defined here.

---

## Shape

```jsonc
{
  "component-name": {
    "description": "What it is and when to use it",
    "root": "section",              // Bricks element the component's root is
    "globalClasses": [".section"],  // layout primitives applied at root
    "properties": {                 // Bricks component properties
      "depth": { "type": "number", "options": [0,1,2,3], "default": 1 }
    },
    "slots": {                      // Bricks slots — content injection points
      "headline": { "element": "heading", "tag": "h1", "required": true,
                    "source": "generated", "from": "business.differentiator" }
    },
    "variants": {
      "split-urgent": {
        "description": "…",
        "structure": [ /* element tree, see below */ ],
        "notes": ["…"]
      }
    },
    "tokens": ["space-section-y", "color-accent"],
    "responsive": { "768": "…" },
    "a11y": ["…"],
    "depthBehaviour": { "0": "…", "2": "…" }
  }
}
```

### The element tree

`structure` is a nested array. Each node:

```jsonc
{
  "el": "heading",          // Bricks element name
  "tag": "h1",              // for headings/text
  "class": ["hero__title"], // component-scoped classes
  "global": [".container"],  // global classes
  "slot": "headline",        // this node renders a slot
  "settings": { "typography": { "font-size": "var(--gf-type-size-hero)" } },
  "children": [ … ],
  "repeat": "services",      // node repeats over a client.json array
  "if": "depth > 0"          // conditional on a property
}
```

Rules the trees follow, without exception:

1. **Every value in `settings` is a `var(--gf-…)` token reference.** A raw hex, px or
   ms value in a spec is a bug. This is what makes skins work.
2. **Component-scoped classes use `component__element` naming.** Global classes are
   layout primitives only (`.section`, `.container`, `.stack`, `.grid-3`).
3. **Slots take content, never markup.** If a slot would need custom HTML, the
   component needs a new variant instead.
4. **Variants change structure and styling. They never change slot names.** A layout
   swapping variants must not have to re-map its content.

### `source` on slots

| Value | Meaning |
|---|---|
| `intake` | comes straight from a `client.json` field named in `from` |
| `generated` | written by the copy pass from `from` + the niche voice guide |
| `asset` | an image/video from the client's photos or the niche pack |
| `static` | fixed in the component, same on every site |

Every `intake` and `generated` slot traces to `client.json`. That is what makes
rule 4 of `CLAUDE.md` enforceable: nothing appears on a site that isn't in the data.

---

## Bricks specifics

**Element names** (`el`) are Bricks' internal element names — `section`, `container`,
`block`, `div`, `heading`, `text-basic`, `text`, `button`, `image`, `video`, `icon`,
`svg`, `accordion-nested`, `slider-nested`, `tabs-nested`, `form`, `map`, `code`.

Verify these against your installed Bricks version on the first build by asking
Novamira to introspect an existing element rather than trusting this list — Bricks
renames and adds elements between releases, and a wrong element name fails loudly but
wastes a build cycle.

**Prefer nestable elements** (`accordion-nested`, `slider-nested`, `tabs-nested`) over
their legacy counterparts. The nestable versions are composed of real child elements,
so their contents stay editable in the builder and stylable with your own tokens. The
legacy ones are opaque widgets and will fight the design system.

**Properties, variants and slots** map onto Bricks' own component features. Variants
are defined once on the component; a layout picks one per instance. Do not implement
variants as duplicated components.

**Global variables** carry the `--gf-` prefix, grouped to mirror
`design-system/tokens.json` (`--gf-color-accent`, `--gf-space-section-y`,
`--gf-type-size-hero`). Register all of them in the Global Variables Manager before
building any component.

---

## Build order

Components have dependencies. Build in this order or you will rework:

1. **Tokens** — every variable registered first
2. **Global classes** — `.section`, `.container`, `.stack`, `.cluster`, `.grid-*`, `.is-dark`
3. **`depth-layer`** — most other components compose with it
4. **Atoms** — `service-card`, `team-card`, `logo-strip`
5. **Sections** — everything that composes atoms
6. **Chrome** — `nav`, `footer`, `sticky-mobile-cta`

Then run `node scripts/validate-config.mjs` and build one page of one layout end to
end before building the remaining nine. The first page will surface every wrong
assumption in this document.
