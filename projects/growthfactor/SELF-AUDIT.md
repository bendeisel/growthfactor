# Self-audit: Growth Factor AI house site

House-style Step 5, answered in writing.

**Did any word change?**
Not applicable in the usual sense. The copy lock protects a *client's* words,
and this is Growth Factor's own site with no prior copy to preserve. Every word
is new. Nothing was lifted from the reference site: its structure was borrowed,
its sentences were not.

**Is every hex and face in the kernel?**
Yes. Audit confirms zero non-kernel colours. Two faces load, both declared:
Space Grotesk and IBM Plex Mono. `#FFFFFF` is registered as an allowed extra,
used only for text on the signal ground.

**For each visual decision, which motif is it from?**
- Section eyebrows wrapped in `[ ]`: motif 6, the bracket mark.
- Index numerals 01 to 09 on products, process steps and cards: motif 1.
- Every divider and every card gap as a 1px rule: motif 2, the hairline. This is
  why 1px shows up 50 times in the audit. It is the design language, not sloppiness.
- Content pinned hard left with metadata in the right margin: motif 3, the rail.
- Zero radius on every button, panel, input and card: motif 4.
- Solid blue rectangles behind headline fragments and on the CTA bands: motif 5,
  the signal block. No gradient anywhere on the site.
- Ink to paper as a hard cut between bands: motif 7, the ground flip.

**For each animation, which motif, and does its easing match the geometry?**
Stance is M4 reactive: nothing animates on its own. Every transition is a
`cubic-bezier(.2,0,0,1)` cut at 140ms or 220ms, which is the sharp end of the
curve because the geometry is 0px everywhere. Per motion.md, hard edges want
cuts. Nothing springs, overshoots or bounces.
- Button hover flips ground to ink and text to volt: a colour swap, motif 5.
- Product and FAQ rows shift 0.4 to 0.5rem left on hover and open on click: the
  rail motif being pushed, not a new gesture.
- Strip cells and logo wall fill with signal on hover: motif 5 again.
- Pricing toggle and product picker are instant state changes.
- No scroll reveal anywhere, no marquee, no counters, no parallax, no carousel.
Reduced motion is shipped and the site is fully usable with motion off, since
no content depends on an animation to become visible.

**If a reference informed anything, which mechanism was taken, and is it rebuilt
in the client's kernel?**
One mechanism: stonesystems.io's page inventory and the pricing-page pattern
where a product catalogue sits under the plans and clicking a product reveals
its description. Rebuilt entirely in the GF kernel, with GF's own copy, and
extended with the monthly/annual toggle and a third tier that the reference
does not have.

**Which two of {type, colour, layout} differ from same-vertical neighbours?**
All three. No same-vertical neighbour exists in the log, since the two Nashville
rows are gyms and this is the agency selling to them, but the check was run
against both anyway:
- Type: Space Grotesk and IBM Plex Mono against Bebas/Montserrat and Archivo/Didact.
- Colour: alternating high contrast against dark-dominant, duotone and light-dominant.
- Structure: D offset asymmetric against A full-bleed bands, E editorial rail and
  C split-screen.
- Motion as a fourth tiebreaker: M4 reactive, and every other row in the log is M3.

**Would this be mistaken for the last three sites shipped?**
No. Those are gym sites in gold-on-black and red-on-white with condensed caps
display faces and looping motion. This is electric blue on bone and near-black,
a grotesque with a mono counterpart, zero radius, and a page that does not move
until you touch it.

## Known gaps, stated rather than filled

- Testimonials, Our Work entries and partner logos are placeholders. Listed in
  `README.md` under "replace before go-live" rather than passed off as real.
- No invented statistics anywhere. The numbers on the page (14 days, 24/7,
  $97/$297/$750, two months free) are all claims about the offer, which Ben
  controls, not performance metrics attributed to nobody.
- Reference site could not be read directly: it is blocked by this session's
  egress policy. Structure was reconstructed from search indexing, so the page
  inventory and the two known price points are right but the section-by-section
  order is inferred.
