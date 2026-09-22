# Source components

Components Ben has sent, kept verbatim. **None of this is built or shipped.**
The site has no Node, no React, no Tailwind and no build step, and adding one
was considered and rejected. These files are here so the reference survives
between sessions, because the recurring problem has been components living
only in a chat and being gone by the next one.

When one of these is wanted on the site, the behaviour gets ported by hand
into the Python build and the port names the file it came from.

| File | What shipped instead |
| --- | --- |
| `cards-stack.tsx` | `varied_items()` in `data/build_program_pages.py`, live on the Muay Thai class levels |
| `lib/utils.ts` | Not shipped. The `cn` helper `cards-stack.tsx` imports, reduced to a join since there is no Tailwind to merge against |

## cards-stack.tsx

A sticky scroll stack: cards pin and come over each other as you scroll.

The React, `motion` and Tailwind are not doing the work. `ContainerScroll` is
a container with `perspective: 1000px`. `CardSticky` is `position: sticky`
with `top: index * incrementY` and `z: index * incrementZ`.

Two things to know if this is ever ported again:

**`z` is translateZ, not z-index.** In `motion`, `style={{ z }}` compiles to
`transform: translateZ(...)`. Against the container's perspective that is what
brings each card nearer the viewer so it comes over the one before. Read as
paint order it produces flat overlap and looks nothing like the reference.
This cost a round.

**`overflow: hidden` on any ancestor silently disables `position: sticky`.**
The sections use it to clip the gold wash layers, so the build emits
`overflow: hidden; overflow: clip`. Clip does the same clipping without
creating a scroll container, with hidden first as the fallback.

Dropped from the supplied demo on purpose: `rounded-2xl`, against the
kernel's `--cornerRadius: 0`, and the `String(index + 1).padStart(2, "0")`
index numerals, which are a standing no.
