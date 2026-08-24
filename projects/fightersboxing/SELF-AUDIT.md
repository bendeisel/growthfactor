# House-style Step 5 self-audit: Fighters Boxing homepage (2026-08-24)

**Did any word change? Which, and why was it mechanical?**
No. All 60 rendered strings (nav, hero, two sections, footer, legal) ship
verbatim from the WP capture, including two sentences with apparently lost
em dashes ("more than a gym we've built a community", "stronger not just in
body"): left as-is and flagged in `source/copy.md`. One addition that is
reuse, not writing: the marquee band: which the WP build ships configured
but empty: carries the existing hero line "WHAT ARE YOU FIGHTING FOR?".
Meta description reuses the hero subline verbatim. Alt text (metadata, not
copy) was written descriptively because the live alt says "nashvile-mma".

**Is every hex and face in the kernel?**
Yes. Grounds #FFFFFF/#F5F5EF/#090909/#000000; ink #181817/#ABABA3; border
#DCDCD1; accent #CC0000/#B70000; on-dark #FFFFFF. Faces Jost / Didact
Gothic / Josefin Sans, weights as measured. The live site's lime #B6D40E
(theme-skin default, appears once on the email band) was NOT imported;
replaced with kernel white/red and flagged for the client.

**For each visual decision: which existing motif is it from?**
- Rotating red arc around buttons → the logo's red ring, set in motion.
- Pill buttons → measured button spec (radius 36, Josefin 700, shadow).
- 20px rounding on all photos → the popup panel's measured 20px radius.
- Crossfading hero photos → replaces the WP hero's background video with
  its own two gym photos; the fade is the site's measured entrance
  transition (opacity 0→1) applied to media.
- Diamond + ring hero decorations → the logo mark's two shapes.
- Marquee band → the trx_addons bg-text band configured (150px uppercase
  #181817) but empty on the live site, finally used.
- Grain overlay at 0.04 → the site's own texture tile at its measured
  opacity.
- Reveal-on-scroll (y 20px→0) → the site's own parallax entrance params.
- Dark email band + black footer → the live page's dark punctuation strips.
- 3/4 portrait crops → the two sections' measured custom CSS.

**Which two of {type, color, layout} differ from same-vertical neighbours?**
Nashville MMA (same city, adjacent vertical) logged: type stance 1 extreme
contrast (Bebas condensed caps), color duotone dark (gold/near-black),
structure E editorial rail. Fighters ships: type stance 2 moderate contrast
(Jost geometric sans, recurring 55px titles ≈ 3.4× body), color
light-dominant + red accent, structure C split-screen. All three differ,
plus the deliberate mirror: light vs dark, round (20px/pill/circle logo)
vs square (0px containers), red vs gold.

**Would this be mistaken for the last three sites shipped?**
Only Nashville MMA is logged; no: opposite ground, different faces,
different spine, different geometry. The two read as deliberate opposites,
which is the "Our Gyms" concept working.
