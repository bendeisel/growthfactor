# Motion

A design canvas is a still image. A website is not. Everything between those
two facts is motion, and it is the single largest thing that separates a site
that reads as built from a site that reads as a mockup someone exported.

This file is Axis 6. It obeys the same locks as every other axis: motion is
derived from the kernel, never imported, and it is chosen deliberately rather
than applied uniformly by a library.

## The lock, restated for motion

**Motion is a property of the geometry that is already there.** You do not get
to pick an easing curve because you like it. You read it off the client's own
shapes.

| Kernel geometry | What the motion has to be |
| --- | --- |
| 0px radius, hard edges, heavy caps display | Linear or sharp cubic-bezier. Cuts, not eases. Short. Nothing bounces. |
| Large radii, soft shapes, rounded buttons | Overshoot allowed. Springs read as correct because the shapes already curve. |
| High-contrast duotone, few colors | Motion carries the emphasis the palette refuses to. Larger travel, longer holds. |
| Dense, packed, many elements | Motion must be near-invisible or the page vibrates. Reveal once, then still. |
| Airy, one idea per viewport | Motion can be the content. A slow deliberate sequence has room to land. |

Nashville MMA is 0px containers, 8px buttons, Bebas caps, gold on near-black.
That kernel wants sharp linear cuts and a hard wipe, not a springy fade-up. A
bounce on that site is exactly as wrong as importing a new typeface, and it is
the same failure: house default filling a vacuum.

The name-the-motif test applies unchanged. For every animation, name the
existing element it came from. A gold hairline that already runs the page spine
can *draw itself* on scroll, because the hairline is in the kernel. A card that
lifts on hover with a soft shadow bloom cannot, because the site has no shadows.

## The five motion stances

Pick one per site. Do not mix, and do not default to Reveal because it is what
every scroll library ships.

**M1. Static.** No motion beyond instant state change. Hover swaps a color with
no transition, nothing animates in. Reads as utilitarian, fast, serious.
Correct for trades, industrial, legal, medical, and anything where speed is the
brand promise. This is a legitimate choice, not an unfinished one.

**M2. Reveal.** Content arrives as it enters the viewport, and then the page is
still. Nothing loops, nothing responds beyond ordinary hover. The most common
stance and the easiest to overdo, so if you pick it, reveal *sections* rather
than every element inside them.

**M3. Continuous.** Exactly one thing on the page never stops: a marquee, a
looping hero video, a ticker, a slow pan. Everything else is dead still. The
contrast is the whole effect, and it collapses the moment a second element also
moves.

**M4. Reactive.** Motion happens only in response to input: hover, click, drag,
cursor position, scroll direction. Nothing moves on its own. Reads as
responsive and expensive. Requires real hover targets, so it weakens on mobile
and needs a touch plan.

**M5. Cinematic.** Sustained choreography. Scroll-driven scenes, layered
parallax, pinned sections that play through. High effort, high risk, and the
only stance that can genuinely fail on a slow phone. Reserve it for a client
whose product is visual and whose audience is not on a job site.

## Physics

These are the numbers. They are not preferences, they are the range in which
motion reads as intentional rather than broken.

| Job | Duration | Easing |
| --- | --- | --- |
| Instant feedback (button press, toggle) | 80 to 150ms | linear or ease-out |
| State change (hover, focus, color) | 120 to 200ms | ease-out |
| Element entering the page | 300 to 500ms | ease-out, decelerating |
| Element leaving | 150 to 250ms | ease-in, accelerating |
| Section or scene transition | 600 to 900ms | custom cubic-bezier |
| Anything above 1000ms | Justify it in writing or cut it | |

Four rules that break more builds than the durations do:

1. **Entering decelerates, leaving accelerates.** Things arriving slow down as
   they land. Things leaving speed up as they go. Getting this backwards is why
   an animation feels wrong when every number looks right.
2. **Travel is short.** A reveal moves 16 to 32px. Not 100px. Long travel reads
   as a slideshow, and it forces a longer duration, which makes the page feel
   slow to a user who is scrolling past.
3. **Stagger is 40 to 80ms and it is capped.** Twelve cards at 80ms is a full
   second before the last one shows up. Cap the total at roughly 400ms and let
   the remainder arrive together.
4. **Animate `transform` and `opacity`. Nothing else.** Those two are the only
   properties the compositor handles without re-laying out the page. Animating
   `width`, `height`, `top`, `left`, `margin`, or `box-shadow` causes layout
   thrash on exactly the cheap Android phones our clients' customers use.

## Reduced motion is not optional

Ship this on every site. It is a genuine accessibility requirement, it is four
lines, and it also happens to be the fastest way to verify that the site is
fully usable with motion off.

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

If the page becomes unusable or content stays invisible with that applied, the
motion is load-bearing and the build is broken. Reveal-on-scroll implementations
fail this constantly, because they set `opacity: 0` in CSS and never restore it
when the observer does not fire.

## The house reveal, done correctly

Vanilla, no library, drops into `app.js` per `hostinger-delivery.md`. Handles
reduced motion, handles no-JS, does not trap content at zero opacity, and stops
observing once an element has arrived.

```js
// Reveal on scroll. Elements opt in with data-reveal.
(function () {
  var els = document.querySelectorAll('[data-reveal]');
  if (!els.length) return;

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced || !('IntersectionObserver' in window)) {
    els.forEach(function (el) { el.classList.add('is-in'); });
    return;
  }

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-in');
      io.unobserve(entry.target);          // arrive once, then stop
    });
  }, { rootMargin: '0px 0px -12% 0px', threshold: 0.15 });

  els.forEach(function (el) { io.observe(el); });
})();
```

```css
/* No-JS safety: only hide when JS has claimed the page. */
.js [data-reveal] {
  opacity: 0;
  transform: translateY(24px);
  transition: opacity 420ms ease-out, transform 420ms ease-out;
}
.js [data-reveal].is-in { opacity: 1; transform: none; }

/* Stagger, capped. Past the sixth child everything lands together. */
.js [data-reveal-group] > *          { transition-delay: 0ms; }
.js [data-reveal-group] > *:nth-child(2) { transition-delay: 60ms; }
.js [data-reveal-group] > *:nth-child(3) { transition-delay: 120ms; }
.js [data-reveal-group] > *:nth-child(4) { transition-delay: 180ms; }
.js [data-reveal-group] > *:nth-child(5) { transition-delay: 240ms; }
.js [data-reveal-group] > *:nth-child(n+6) { transition-delay: 300ms; }
```

Set `document.documentElement.className += ' js'` as the first thing in `<head>`
so a JS failure leaves a fully readable page instead of a blank one.

## Banned motion defaults

The motion equivalents of the banned visual tropes. Same rule: banned as
reflexes, allowed when the kernel genuinely calls for one.

- **AOS or any drop-in scroll library applied site-wide.** The tell is that
  every element fades up by the same 100px over the same 800ms. It is uniform,
  which means it is not designed.
- **Counting-number stat counters.** Doubly banned, because decorative
  statistics are already banned. A number that spins up to 500 is a number
  nobody trusts.
- **Typewriter or text-rotator headlines.** Dated, hurts LCP, and it fights the
  copy lock by making the headline a moving target.
- **The bouncing scroll-down arrow.** Signals that the hero failed to imply
  there is more page.
- **Hover lift plus shadow bloom on cards.** The default shadcn gesture. If the
  kernel has no shadows, this invents one.
- **Autoplaying carousels.** Moves content away from a reader mid-sentence.
  Nashville MMA's own programs carousel showed one of thirteen items, which is
  why it became a grid.
- **Parallax on everything.** Parallax is M5 and it is a decision. Applying it
  to three unrelated backgrounds is not.
- **Page-load preloader animations.** A static site on Hostinger loads in under
  a second. A preloader adds time to hide time that does not exist.
- **Scroll-jacking.** Taking over the scroll wheel breaks the one interaction
  every user already knows.

## Logging it

`motion_stance` is a column in `data/shipped-log.csv`. It is not one of the
three axes the divergence check requires, but log it anyway: two same-vertical
neighbours that share a stance feel more alike than the axes alone predict,
and it is the cheapest tiebreaker when the required two differences are already
satisfied and you want a third.
