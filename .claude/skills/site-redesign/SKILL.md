---
name: site-redesign
description: Rebuild and upgrade a client's existing website. Use when the client already has a live site — however dated, template-built, or badly broken — and wants it redone: "redesign their site", "rebuild this site", "copy their site and make it better", "their site is awful, fix it", "modernize this page". The site itself is the identity source, so this routine copies it down and extracts the kernel mechanically before changing anything. Not for a client with no site (site-new) and not for a client who wants to look like a different site (site-match).
---

# Routine: redesign an existing site

The client has a site. That site is the brand, whatever anyone thinks of it —
their customers recognize it, their signage matches it, and their competitors
do not look like it. The job is to make it good without making it someone
else's.

Read `../site-factory/SKILL.md` first; the spine from Step 3 lives there. This
file covers intake and the kernel.

## Step 1 — Take the site down whole

A saved copy, not screenshots. The stylesheet is the point: it carries the
exact values that a screenshot only approximates, and approximation is where
drift begins.

```bash
mkdir -p projects/<slug>/download && cd projects/<slug>/download
wget --mirror --convert-links --page-requisites --no-parent https://client.com
```

`httrack` works too, and saveweb2zip is the easiest handoff when the client is
sending it themselves.

Take screenshots as well, at desktop and mobile widths — they capture what CSS
cannot: hover states, a carousel mid-motion, what the hero actually looks like
with their photography in it. Cross-check only, never the colour source.

**If the site is JS-rendered** and `wget` returns an empty shell, say so rather
than pretending a kernel was extracted. Fall back to a DOM dump from the
browser plus screenshots, and mark the kernel confidence as lower when you
state it.

## Step 2 — Extract the kernel mechanically

```bash
python3 ../house-style/scripts/extract_kernel.py projects/<slug>/download \
  --palette -o projects/<slug>/kernel.json
```

Read the output in the confidence order given in
`../house-style/references/extraction.md`: `tokens` and `token_colors` first
(the vendor wrote those down as the theme contract), then
`typefaces.webfonts_loaded`, then `section_variants_used`. Treat
`image_palette` as a cross-check only — third-party icons carry other
companies' colours.

Then state it back in one line and wait:

> Matching your existing site: Bebas Neue over Montserrat, `#D7AD56` gold on
> `#131313`, square panels with 8px buttons.

A wrong kernel caught here costs a sentence. Caught after the build it costs
the build.

## Step 3 — Map the pages, and record what is broken

Two lists, both of which get used later:

**The path map.** Every existing URL and what it becomes. This decides
`data-file` names, and any path that changes needs a redirect at ship time
(`hostinger.sh` exposes the redirects endpoint) or the client loses rankings
they already had. Keeping the old paths is almost always the right call.

**The defect list.** Illegible text over photography with no scrim, a dead
form, a 13-item carousel showing one item at a time, a phone number that is
not a `tel:` link, images at 4000px. These are concrete wins and they belong
in the handover, because "we redesigned it" persuades nobody while "your
programs were in a carousel showing one of thirteen" persuades everybody.

Fixing a live legibility or conversion defect is in scope and is not drift.

## Then: the spine

Steps 3 to 8 of `../site-factory/SKILL.md` — divergence check, motif
inventory, axes, build as one multi-page artifact from
`templates/site-shell.html`, publish immediately, register, self-audit, log.

## What makes this routine go wrong

**Substituting instead of amplifying.** The site is bland, so the reflex is to
replace its vocabulary with a better one. That is house-style's Lock 3 and the
single most common failure. A template ships four or five genuinely specific
devices and uses each one once, quietly — a hairline rule, an oversized
numeral, a bordered word band. Find them, make them the entire design
language. For every visual decision, name the existing element it came from;
if you cannot point at one, revert it.

**Rewriting the copy.** Frozen at 99%. Mechanical repairs only. Anything you
want to reword goes on the handover list instead of into the build.

**Losing the SEO they already have.** They have rankings, however modest. Keep
the paths, keep the `<h1>` intent, keep the `LocalBusiness` NAP identical to
their Google Business Profile, and redirect anything that does move.
