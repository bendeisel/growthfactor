# Pre-publish checks

Every item here exists because it caught a real defect that markup review
missed. Running them takes a couple of minutes and has repeatedly been the
difference between shipping and shipping something broken.

## Load it in a real browser

Not "the HTML looks right". Open it, wait for the page to mount, and probe.
Rendering reveals what reading cannot.

## Check tag balance

An unclosed `<div>` does not throw. It silently reparents everything that
follows, and the symptom shows up somewhere unrelated — in one case a gold
background wash stretched from 700px to 4602px because its section wrapper never
closed, putting the glow entirely outside the visible area. The page looked
merely "flat"; nothing errored.

```python
body = html[html.index('<x-dc>'):html.index('</x-dc>')]
depth = len(re.findall(r'<div\b', body)) - len(re.findall(r'</div>', body))
```

Scan cumulatively to find *where* depth first goes negative, rather than only
checking the total — two opposite errors can cancel and look correct.

## Confirm animation actually moves

Sample the transform at intervals and compare, rather than trusting that the
code is present:

```js
const read = () => frame.evaluate(() =>
  [...document.querySelectorAll('.dg')].map(e => e.style.transform));
// sample, wait, sample again, assert the values differ
```

Also assert `getComputedStyle(el).animationName === 'none'`, proving the motion
is script-driven and won't be paused.

## Confirm images and video

Count `document.images` where `complete && naturalWidth > 0`. Broken images are
invisible in markup review. For video, check `paused`, `currentTime` advancing,
and that it wraps — a bare `loop` attribute can be dropped by a renderer, so the
hero plays once and freezes.

## Check the publish actually wrote

Publishing tools can refuse oversized files and still report success. After
publishing, verify the artifact's timestamp moved and grep the payload for a
string unique to the change. Remember attribute quotes may be escaped inside a
packaged payload, so grep for an unquoted substring or the file will look
unchanged when it is fine.

## Watch file size

Embedded video and images dominate. Keep individual entries under the platform's
per-entry budget and the document under its cap, and re-encode down rather than
hand-fixing after each rebuild — bake the compression into the generator so it
cannot regress.

## Re-run the generator before believing a fix

If pages are generated, a manual edit to an output file is erased on the next
build. Fix the generator, regenerate, then verify. After any generator change,
confirm the effect survives a rebuild.
