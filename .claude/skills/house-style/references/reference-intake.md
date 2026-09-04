# Reference intake

There is a genre of advice that goes: find a site you like on Awwwards, feed
the URL to a generator, swap in your logo and copy, ship it. Screenshot-to-code
tools make the same offer from an image instead of a URL.

The tools work. The workflow is the exact failure this skill exists to prevent,
just arriving from a new direction. Lock 3 says editing amplifies what is there
and never imports. A URL-to-clone pipeline is *pure* import: it replaces the
client's vocabulary with a stranger's, and does it so completely that there is
nothing left to audit.

It also fails on its own terms. The reason an award-winning site looks good is
that its design is an argument about that specific company. Transplanted onto a
Nashville jiu-jitsu gym, the argument is gone and what remains is a shape.

This file is how to use these tools without any of that.

## The three legitimate uses

### 1. Pointed at the client's own material (the best one)

Screenshot-to-code aimed at the client's existing site, brochure, signage, menu,
or vehicle wrap is not cloning. It is kernel extraction, which is Step 1 of the
workflow, and it directly fills the gap `extraction.md` Case 2 currently handles
by hand.

Use it when there is no stylesheet to read. Then verify against the rules that
already govern extraction:

- Sample the hex from the source file, do not trust the model's transcription of
  it. Generated code reports approximations, and `#D7AD56` coming back as
  `#D4AF37` is the first inch of drift.
- Identify the real typeface. A generator will label anything condensed as
  "Oswald" and anything geometric as "Poppins". Both are banned defaults and
  neither is likely to be the client's actual face.
- Treat the generated markup as a reading of the layout, not as code to ship.
  Its value is the section inventory it hands you for Step 2.

### 2. Studying a mechanism, then leaving the reference behind

You are allowed to learn from a site you admire. You are not allowed to carry
its surface home. The separation is the **one-mechanism rule**:

> Take at most one structural mechanism per reference. Write down what it does
> in a sentence with no adjectives. Then rebuild that behavior entirely out of
> the client's kernel, and name it in the Step 5 audit.

"Section headings sit in the left margin and stay pinned while their content
scrolls past" is a mechanism. It is Structure E plus Motion M4, both already in
the axes kit, and it can be built in Bebas and gold without a single value from
the reference.

"It looks premium and has a nice feel" is not a mechanism. It is a description
of a surface, and chasing it produces a copy.

The tell that you took too much: if you cannot rebuild the idea from your
one-sentence note, without reopening the reference, you took the surface.

### 3. The approval gate

This is the genuinely good idea buried in the screenshot-to-code advice, and it
has nothing to do with cloning: **approve a structured design before any code is
written.**

Growth Factor already works this way. Artboards go on a design canvas, the
client approves them, then the Hostinger build follows. The transcripts arrive
at the same sequencing from the other end, which is a reason to keep it rather
than a reason to change anything.

Hold the order. Generating code first and designing afterwards means every
design decision is now a refactor, and refactors are where the kernel quietly
gets rounded off.

## Hard limits

**Never clone a same-vertical competitor.** This is the collision the shipped
log exists to prevent, executed on purpose. If a Nashville gym's site gets
rebuilt from another Nashville gym's site, both of them notice, and one of them
is our client.

**Never ship generated markup unread.** Cloned output arrives with the source's
class names, its framework assumptions, occasionally its asset URLs, and
sometimes its licensed fonts. The build target is hand-owned static HTML on
Hostinger. Code you have not read cannot be maintained at a hundred sites, and
a hotlinked asset is a broken site the day the source rotates it.

**Never take a typeface from a reference.** Faces come from the kernel. This is
the fastest and most visible form of drift, and it is the one clients recognize
without being able to name.

**Never take a palette from a reference.** Same reason, one step less visible,
which makes it more dangerous.

**Never let a reference set the copy.** The 99% lock does not move.

## What a reference may actually contribute

Reference material is allowed to inform exactly the things the axes kit already
covers, because those are the choices that were never the client's to begin
with:

| Allowed | Because |
| --- | --- |
| Structure (Axis 1) | How a page organizes itself is a pattern, not an identity |
| Density (Axis 3) | Information per screen is a decision about the audience |
| Rhythm (Axis 4) | Spacing pattern, not spacing values |
| Motion stance (Axis 6) | Which of the five, not which easing curve |
| A single mechanism | Under the one-mechanism rule above |

| Never allowed | Because |
| --- | --- |
| Typefaces | Kernel |
| Hexes | Kernel |
| Motifs and shapes | Kernel |
| Copy | Lock 1 |
| Markup | Maintenance and licensing |
| Overall composition | That is the clone |

Read that as: a reference may contribute the choices the axes kit was built to
supply, and nothing that the kernel was built to protect.

## Recording it

If a reference informed a build, put it in the `notes` column of the shipped
log, with the mechanism you took stated in a sentence. Two reasons. It makes
the Step 5 audit answerable by someone who was not there, and if the same
reference starts showing up across several projects, that is the same
convergence problem as a theme library, arriving one honest decision at a time.
