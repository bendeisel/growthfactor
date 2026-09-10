# Fighters Boxing Gym (Fighters Nashville)

Sister project to Nashville MMA: that one is the **dark** site, this is the
**light** one, and the two will interlink through mirrored "Our Gyms" pages.

- `kernel.json`: brand kernel measured from the client's WordPress build
  (Ring theme + Elementor), with Ben's revisions layered on top: display
  face is now Archivo (Jost read too newspaper), body stays Didact Gothic,
  buttons stay Josefin Sans. Grounds white / `#F5F5EF` / `#090909`, ink
  `#181817`, logo-ring red `#CC0000`.
- `source/`: copy inventory (`copy.md`, including Ben's revision log) and
  the raw homepage capture (`capture-mobile.html`) from Ben's browser-save
  zip. The session egress proxy blocks the dev domain, so the capture is
  the record.
- `site/`: the Astro build (static output per
  `.claude/skills/house-style/references/hostinger-delivery.md`).
  `npm install && npm run build` in `site/`; deploy `site/dist/`.

## One artifact, the whole site

https://claude.ai/code/artifact/d598735d-1010-42f4-8a53-34c358755630

All 13 pages live in that one artifact, switched by the nav, with the hero
video and every photo embedded. Build it from `site/` and bundle it:

```bash
cd site && npm install && npx astro build
python3 ../../../.claude/skills/site-factory/scripts/bundle_artifact.py \
  --root dist --out /tmp/fightersboxing.html \
  --title "Fighters Boxing Gym | Full Site" \
  --fonts "Archivo:wght@500;700;800;900" --fonts "Didact+Gothic" \
  --fonts "Josefin+Sans:wght@700"
```

Then republish that file to the artifact URL above. Never publish a page as
its own artifact: this build spent a round as eight loose page artifacts and
nobody could review it.

Status: all 13 pages built. The eight single-page artifacts from the first
round are superseded and slated for deletion.

Standing client instructions (Ben):
- NEVER use an em dash. Anywhere. See root CLAUDE.md.
- No blog. Boxing Blog is out of the nav.
- Popup lead form on every request CTA: the LeadConnector "New Trial Form"
  (`link.growth-factor.ai/widget/form/0maCMu9uqM7cqIfqR9Mb`) the WP build
  uses.
- Hero: background video (`fbg-header.mp4`). The media guy is resizing it;
  drop the finished file at `site/public/video/fbg-header.mp4` and the
  existing `<video>` tag picks it up with no code change. Photos live in
  the content sections, one use each, never repeated.
- Rounded (20px) photos in mat frames, buttons with the rotating red ring:
  both stay, Ben approved.
- Red Our Classes ticker between the sections; classes section (01 to 04
  numeral rings) further down. Class names are Ben's strings.
- Work color into the page: dark hero, red ticker, dark classes band, warm
  alt sections. Not all white.
- Production domain not yet confirmed; astro.config + robots/sitemap assume
  fightersnashville.com. Confirm with Ben before launch.

Needed from client / open items:
- Resized hero video from the media guy.
- More gym photos (capture had two usable shots).
- A page for "Masters boxing" (its card links to /boxing-classes/ for now).
- "Our Gyms" mirror page on both sites.

Handover flags: see the bottom of `source/copy.md`.
