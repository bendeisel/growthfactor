# Quality Gate

Runs automatically after assembly. **Nothing reaches a client until it passes.**
Speed without a gate just produces fast garbage.

Driver: `scripts/qa.mjs` (Playwright + Lighthouse).

---

## Blocking — build fails

### Performance (Core Web Vitals, throttled mobile)
- [ ] LCP < 2.5s
- [ ] CLS < 0.1
- [ ] INP < 200ms
- [ ] Lighthouse Performance ≥ 85 mobile, ≥ 95 desktop
- [ ] Total page weight < 2.0 MB, hero poster < 150 KB
- [ ] **LCP element is text or a static poster — never a video, canvas or 3D scene**
- [ ] No layout shift from any `depth-layer`: every one has a reserved aspect ratio

### Accessibility
- [ ] axe-core: zero critical or serious violations
- [ ] All text/background pairs meet WCAG AA (4.5:1 body, 3:1 large)
- [ ] Every image has meaningful alt text
- [ ] Keyboard navigable end to end, visible focus rings
- [ ] Form inputs have associated labels
- [ ] Heading hierarchy is sequential, one `h1` per page
- [ ] `prefers-reduced-motion: reduce` disables every animation and video

**For the medical niche accessibility is a legal exposure area. No overrides.**

### Content integrity
- [ ] No lorem ipsum, no `TODO`, no `{{placeholder}}`, no unreplaced tokens
- [ ] NAP identical on every page and matching the GBP listing
- [ ] Phone numbers are `tel:` links and dial correctly
- [ ] Zero broken internal or external links
- [ ] Every form submits and routes to the right recipients
- [ ] No stat, credential or certification appears that isn't in `client.json`

### Technical
- [ ] Valid schema.org for the niche type, passes Rich Results Test
- [ ] Unique title + meta description on every page
- [ ] `sitemap.xml` and `robots.txt` present and correct
- [ ] Canonicals correct — critical with programmatic service-area pages
- [ ] HTTPS, no mixed content
- [ ] 404 page styled
- [ ] Favicon and OG image set, OG preview renders

---

## Visual — screenshots reviewed, not auto-failed

- [ ] Full-page capture at 390 / 768 / 1024 / 1440 / 1920
- [ ] No horizontal overflow at any width
- [ ] No orphaned words or awkward breaks in display headlines
- [ ] Images not stretched, squashed or badly cropped at any width
- [ ] Sticky elements don't cover content on short viewports

---

## Human polish pass (15–30 min, cannot be automated)

The agent reliably reaches 90%. This is the 10% that reads as expensive.

- [ ] Does the hero headline sound like a person, or like generated copy?
- [ ] Is section rhythm varied, or is it eight identical light sections in a row?
- [ ] Is there at least one full-bleed dark section?
- [ ] Is the accent colour used sparingly, or sprayed everywhere?
- [ ] Do the photos look like this business, or like stock?
- [ ] Is there one clear dramatic moment, and is everything else calm?
- [ ] Would you show this to a client at $10k without apologising?

Last question is the real gate. If the answer is no, find out why before sending.

---

## Niche additions

**Restoration** — emergency phone visible in the first viewport on mobile; sticky
call bar works; service-area pages generated and internally linked; insurance
messaging present.

**Medical** — no PHI collected in a non-HIPAA form; no outcome guarantees or
comparative superiority claims in copy; before/after images have documented
consent; testimonials cleared against state board advertising rules; provider
credentials accurate; accessibility statement present.

**Combat / fitness** — schedule current and reachable in one click; pricing visible;
trial offer above the fold; anti-intimidation messaging present; kids programs have
their own page; waiver/liability linked.
