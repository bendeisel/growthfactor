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
