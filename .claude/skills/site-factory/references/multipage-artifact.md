# One artifact, many pages

## The problem this fixes

Building each page of a site as its own artifact produces exactly what
happened on the Fighters Boxing build: a pile of separate URLs with no
relationship to each other. Nobody can review it, because reviewing means
opening eight tabs and holding the site in their head. The client cannot click
from the homepage to the programs page, which is the single most important
thing they want to try. And nothing can be assembled into a real site by
script, because the pages do not know they belong together.

A site is one thing. It gets one artifact.

## The strict system: code is the site, the artifact is a view of it

Both real builds landed here the same way, and this is now the rule rather
than a coincidence:

```
projects/<slug>/site/       real code — Astro components, data, CMS wiring
        │                   THIS is the site. It is the only source of truth.
        ├── build ────────> dist/          real pages, real assets
        │                     ├── bundle_artifact.py ──> ONE artifact, one URL
        │                     │                          how anyone reviews it
        │                     └── deploy ─────────────> preview, then production
        └── design/         artboards, when a design pass earns one
                            an INPUT to the code, never the deliverable
```

Three rules, and they are the whole standard:

1. **The code is the site.** Not the artifact, not the artboard. Copy, class
   times, coach lists and FAQs live in data files or the CMS, so changing a
   class time once changes it everywhere it appears.
2. **One artifact per site, generated, never hand-maintained.** Run
   `scripts/bundle_artifact.py` against the built output and publish the result
   to the site's existing artifact URL. Because it is generated, it can never
   drift from the code, and regenerating is cheaper than patching it.
3. **Design artboards are inputs.** A canvas is worth making when a look needs
   deciding. The moment it is decided, it becomes code, and the canvas stops
   being a thing anyone reviews. It never gets its own published artifact per
   stage of the work.

### What this replaced, and why

Fighters Boxing was built as eight separate page artifacts. Nobody could
review it: reviewing meant opening eight tabs and holding the site in your
head, the client could not click from the homepage to the classes page, and no
script could assemble the pieces because the pages did not know they belonged
together. Nashville MMA drifted the other way, into two artifacts split by
stage of work — homepage canvas and inner-page canvas — which is the same
problem wearing a tidier coat.

Both are now one artifact each, generated from a build.

### Bundling

```bash
python3 scripts/bundle_artifact.py --root projects/<slug>/site/dist \
  --out /tmp/<slug>.html --client "<Client name from sites.csv>" \
  --order "/,/classes/,/schedule/,/contact-us/" \
  --fonts "Archivo:wght@500;700;800;900" --fonts "Didact+Gothic"
```

It hoists the shared header and footer out of the pages so they are written
once, inlines every stylesheet, image and video, swaps local `@font-face` for
the Google Fonts stylesheet (the artifact host allows `fonts.googleapis.com`
and blocks `/_astro/*.woff2`), points the site's own links at hash routes, and
runs each page's scripts once. It reports any asset it could not find rather
than shipping a silent gap, and prints the finished size against the 16MB
ceiling.

Publish the output to the URL already in the registry. `--order` puts the home
page first; it is the route that shows when someone opens the link cold.

There is no `--title`. The artifact is named `<client> Site` and the script
builds that from `--client`, so every site's artifact is named the same way and
none of them drift into a stage word. See non-negotiable 4 in the skill.

### The hand-authored path

Everything below is the older pattern: author one HTML file with `.gf-page`
sections and split it for production. It is still what `split_pages.py`,
`deploy_preview.sh` and `deploy_production.sh` expect as input, so a build that
uses it keeps working. Use it only for something genuinely small, a one or two
page site with no data behind it. Anything with a schedule, a coach roster or a
CMS goes the code-first route above.

Seam worth knowing before you wire a code-first build to Hostinger: the deploy
scripts take a shell HTML and split it, while a code-first build already has a
`dist/` directory of real pages. Point the deploy at the built directory rather
than round-tripping it through an artifact.

## The contract

`templates/site-shell.html` is the starting point. Four conventions carry the
whole pattern, and `scripts/split_pages.py` depends on all four literally — it
matches these strings, so do not restyle them.

### 1. Chrome markers — what is preview furniture, not site

```html
<!-- GF-CHROME:START -->
  ...page-switcher nav, preview badge, switcher script...
<!-- GF-CHROME:END -->
```

Everything between the markers exists to review the site and is not part of
it. `split_pages.py` deletes these blocks entirely, always. Anything the
client's real site needs must live outside them.

### 2. Pages are sections

```html
<section class="gf-page" id="home" data-title="Home" data-file="index.html">
<section class="gf-page" id="programs" data-title="Programs" data-file="programs.html" hidden>
```

- `id` — the deep-link hash and the switcher's handle
- `data-title` — the chrome tab label, and the `<title>` of the emitted page
- `data-file` — the production filename; the home page must be `index.html`
- `hidden` on every page but the first

Visibility is toggled with the `hidden` property, never `style.display`. The
artifact host's reset includes `[hidden]{display:none!important}`, so `hidden`
is reliable there in a way inline display is not.

### 3. Shared header and footer sit outside the pages

```html
<header data-gf-shared> ... </header>
<main id="gf-pages"> ...the sections... </main>
<footer data-gf-shared> ... </footer>
```

Written once, and `split_pages.py` copies them into every emitted page. This
is why the pattern does not balloon the artifact: eight pages share one header
instead of carrying eight copies.

### 4. Internal links work in both worlds

```html
<a href="programs.html" data-gf-link>Programs</a>
```

The switcher intercepts clicks on `[data-gf-link]` and changes page inside the
artifact. In production the attribute is inert and the `href` is a real
navigation. One markup, both behaviours — so the nav is live during review
instead of a row of dead links, which was the other half of the review problem.

Match `href` to the target's `data-file` exactly; the switcher resolves the
link by looking for the page whose `data-file` matches.

## Sizing

The 16MB artifact ceiling counts embedded data URIs, and images are what
actually threatens it. Reference images by relative path while working in
`projects/<slug>/`, and upload them as artifact assets rather than inlining
them as base64. A site of a dozen pages of markup is nowhere near the limit;
a dozen inlined hero photos can be.

## Publish early

Publish the shell as soon as the build starts — pages stubbed, kernel tokens
in, nav wired — then redeploy to the **same file path** as sections land.

Three reasons this is the rule rather than a nicety:

- Redeploying the same path keeps the same URL, so the link in the registry and
  the link already sent to the client never go stale.
- The build is reviewable while it happens, so a wrong kernel or wrong
  structure gets caught at page one instead of page eight.
- Nobody has to remember to publish. "Publish when finished" is a step that
  gets skipped precisely on the builds that ran long and interesting.

Keep `favicon` and `title` stable across redeploys — a changed favicon reads
as a different page to someone who has the tab open.

## Theme

Client sites commit to one look: their kernel's grounds and accents, in the
stance the axes picked. Paint `background` and `color` explicitly on `body`
from kernel tokens and skip the `prefers-color-scheme` swap — the artifact host
paints its own ground behind a transparent body, and a client's dark site
should not turn light because the reviewer's laptop is in light mode.

The chrome is the exception and is deliberately neutral, so it never reads as
part of the client's design.

## Splitting for production

```bash
python3 scripts/split_pages.py projects/<slug>/site.html -o projects/<slug>/build/
```

Emits one file per `data-file`, chrome stripped, shared header and footer in
each, `hidden` removed, per-page `<title>`, and a `sitemap.xml`. Add
`--noindex` for a preview build; `deploy_preview.sh` passes it for you.
