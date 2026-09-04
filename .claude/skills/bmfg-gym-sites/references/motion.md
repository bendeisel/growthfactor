# Motion on a BMFG gym site

## The rule: JavaScript, not CSS animation

Ben's browser pauses CSS animations when the machine is in low-power mode. A
`@keyframes` marquee that ran perfectly in every test sat completely frozen on
his screen, and he reported it three separate times before the cause was found.
Reduced-motion emulation did not reproduce it; only his actual machine did.

So: anything that must visibly move is driven by `requestAnimationFrame`,
writing a `transform` each frame. Transforms are GPU-composited, so this is also
smoother than animating position or background offsets.

```js
componentDidMount() {
  var els = document.querySelectorAll('.dg');
  if (els.length && typeof requestAnimationFrame === 'function') {
    for (var i = 0; i < els.length; i++) { els[i].style.willChange = 'transform'; }
    var t0 = null;
    var tick = function (now) {
      if (t0 === null) { t0 = now; }
      var t = (now - t0) / 1000;
      for (var i = 0; i < els.length; i++) {
        var el = els[i];
        var ax  = parseFloat(el.getAttribute('data-ax')  || '165');
        var ay  = parseFloat(el.getAttribute('data-ay')  || '58');
        var per = parseFloat(el.getAttribute('data-per') || '20');
        var ph  = parseFloat(el.getAttribute('data-ph')  || '0');
        var s = Math.sin(2 * Math.PI * (t / per) + ph);
        el.style.transform = 'translate3d(' + (ax*s).toFixed(1) + 'px, ' + (ay*s).toFixed(1) + 'px, 0)';
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }
}
```

Per-element `data-` attributes let one loop drive many elements at different
phases, so nothing moves in lockstep. Give each element its own phase.

## Calibration — the values that landed

Getting amplitude wrong is the usual failure, in both directions.

| Effect | What works | What failed |
| --- | --- | --- |
| Gold wash drift | broad soft glow covering ~⅓ of the section, travelling ~165px x / ~58px y over ~20s | 35px travel read as completely static; 300px+ travel turned it into a bright dot flying off screen |
| Text shimmer | highlight sweeping a `background-clip: text` gradient, ~4.5s cycle | — |
| Button spark | short bright arc in a rotating conic gradient, ~6s per lap, thin ring | — |

The lesson from the wash: **size and travel are coupled.** A big soft glow
moving a short distance reads as alive. A small bright glow moving a long
distance reads as a bug. Ben's phrasing when it was wrong: *"you got a dot that
just moves on and off the screen, and you can barely notice it."*

## Techniques

**Drifting wash.** A radial-gradient layer, absolutely positioned inside a
`position: relative; overflow: hidden` section, sized larger than the section so
its edges never enter frame, translated on both axes. Because the gradient fades
to transparent, oversizing costs nothing visually.

**Text shimmer.** Gold text with a lighter band swept across it:

```css
.shim { color: #D7AD56;
  background-image: linear-gradient(100deg, #D7AD56 0%, #D7AD56 36%, #F7E3B4 46%,
                    #FFF8E4 50%, #F7E3B4 54%, #D7AD56 64%, #D7AD56 100%);
  background-size: 280% 100%; background-repeat: no-repeat;
  -webkit-background-clip: text; background-clip: text;
  -webkit-text-fill-color: transparent; }
```

Animate `backgroundPosition` from JS. Note this makes the text transparent — if
`background-clip: text` ever fails the text vanishes, so only use it on display
text that also exists elsewhere on the page, never on the only copy of something
important.

**Border spark.** A conic gradient with one short bright arc, on a square layer
much larger than the button, rotating behind it. An inset panel covers the
middle so only a thin ring shows. Keep the arc short and the rotation slow.

## Video

Gym heroes are video. Autoplay reliably by forcing the properties in JS rather
than trusting attributes — `muted` and `loop` set as DOM properties, plus an
`ended` listener as a fallback, because a bare `loop` attribute can be dropped
by a renderer and the hero then freezes on its last frame after one play.

Keep the encode small. Embedded video dominates file size and can silently push
a document past a publish limit.
