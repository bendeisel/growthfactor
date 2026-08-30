# Growth Factor AI — our own site

**Live preview (all three pages, one URL):**
https://claude.ai/code/artifact/975b8079-7787-4428-acea-d9f9ae9d22e2

## What this is

The positioning shift: Growth Factor AI is **the software**, not an agency
retainer. You build it yourself, we teach you, and we build your first set of
ads with you while you learn. $100 flat. Done-For-You is a separate, quoted
line of business.

## Layout of this folder

```
src/            # EDIT HERE — partials and page bodies
  _head.html    _header.html    _footer.html    _modal.html
  home.html     features.html   done-for-you.html
features.py     # EDIT HERE — the feature catalog (drives both the homepage
                #   index and every row on the features page)
build.py        # assembler:  python3 build.py
site/           # GENERATED — the deployable static site (do not hand-edit)
preview.html    # GENERATED — single-file version with a hash router, for the
                #   Artifact preview only
```

Run `python3 build.py` after any edit to `src/` or `features.py`.

## Build target

Static site on Hostinger per
`.claude/skills/house-style/references/hostinger-delivery.md`.
`site/lead.php` is the form handler — point it at a central lead endpoint
before this goes anywhere near volume. Fonts are self-hosted (two variable
woff2 files, 72 KB total); the preview uses the Google Fonts CDN because the
Artifact CSP requires it.

## Open questions for Ben

- **$100 is billed monthly** in all the copy. Say the word if it's meant to be
  a one-time or annual figure and it's a one-line change.
- **The ember hex `#D2763F` is a considered pick, not a sample** — jonmayo.com
  is blocked from the build environment. Send a screenshot and it gets swapped
  in `site/assets/gf.css` (`--ember`).
- **The accent gradient** (orange → amber) runs on the hero accent line and the
  logo mark only. Set `--accent-grad` to `var(--ember)` for flat, or to a grey
  if you'd rather the accent stay quiet there.
- **The `$1,500–$5,000` middle band** was invented to bridge your $500 and
  $10,000 anchors. Change or drop it.

## Locked decisions

Kernel in `kernel.json`. The two that matter most:

- **Keep it basic.** v1 was rejected for doing too much — rails, spines, grid
  meshes, node diagrams, a ticker, scroll reveals. One centred column, plain
  sections, one hairline between them. Adding a device back needs a reason.
- **Rounded everywhere, Claude-style.** 8px controls, 12px media, 16px panels.
  No sharp corners on anything.
- **One animated thing:** the typing line in the hero. That's the piece Ben
  liked; everything else stays still.
