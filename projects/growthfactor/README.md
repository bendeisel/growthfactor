# Growth Factor AI: house site

Ten pages, one artifact.
**https://claude.ai/code/artifact/dbb2356a-3e66-4dca-a481-4fe9ebfffea8**

Routine: `site-match`. Structure borrowed from stonesystems.io, identity and
copy entirely Growth Factor's own.

## Pages

| Page | File | What it carries |
| --- | --- | --- |
| Home | `index.html` | Hero, the 6:40pm problem, nine products, process, work, reviews, CTA |
| Products | `products.html` | All nine, click any row to open the full breakdown |
| Pricing | `pricing.html` | Three plans, monthly/annual toggle, product picker, six FAQs |
| Our Process | `process.html` | Eight steps with day markers, plus what happens after launch |
| Our Work | `our-work.html` | Six builds, plus the free mockup offer |
| Other Services | `other-services.html` | Eight bolt ons, website to website upgrade first and open by default |
| Partners | `partners.html` | Referral, white label, supplier, plus the stack |
| Reviews | `reviews.html` | Six reviews and an honest "what we are not good at" |
| About | `about.html` | Ben Grove, the forty one enquiries story, three rules |
| Contact | `contact.html` | Inline form plus the popup |

## The kernel

Declared, not extracted, because there was no prior site to mine. Frozen from
here exactly as an extracted one would be. See `kernel.json`.

```
ink   #0C0D0F    paper #F2F1EC    signal #2F4BFF    volt #D6FF4B
Space Grotesk (display + body) / IBM Plex Mono (labels, numerals, prices)
0px radius on every container and every action
```

Axes: **D offset asymmetric** / **1 extreme contrast** / dense / punctuated /
**alternating high contrast** / **M4 reactive**.

Motion is derived, not picked: zero-radius geometry means linear cuts at
120 to 220ms. Nothing on the site moves on its own, nothing springs, nothing
bounces. Every animation fires on hover or click.

## What was taken from the reference, and what was not

**Taken (structure only):** the section flow, the nine-product catalogue shape,
the two-tier plan idea, the deep footer carrying pages the top nav does not,
and the pricing page pattern where clicking a product reveals its description.

**Not taken:** every colour, typeface, shape and word. All copy is written from
scratch for gyms.

**Deliberately beyond the reference**, per Ben:
- A third **Site** tier at $97 for the website-to-website upgrade play.
- Products upgraded: an **AI Front Desk** voice agent, and reactivation re-run
  quarterly at no cost.
- **Other Services** page with website to website upgrade opened by default.
- **Partners** page with three partner types.

## Placeholder content: replace before go-live

- Six reviews on `reviews.html` and three on `index.html`. Fictional names and
  gyms, written to the right shape. Swap for real ones.
- Six Our Work cards. The browser frames are CSS, not screenshots.
- Partner logo wall on `partners.html` lists the real stack, no logo files yet.
- `hello@growth-factor.ai` and `/lead.php` are placeholders until the real
  address and the LeadConnector endpoint are wired.
- Pricing is a proposal, not a decision. Confirm the three numbers.

## Build

```bash
python3 .claude/skills/site-factory/scripts/split_pages.py \
  projects/growthfactor/site.html -o projects/growthfactor/build/ \
  --base https://growth-factor.ai
```

Audit: **0 blockers**. The one warning is the 1px hairline count, which is the
core motif and deliberate. The LocalBusiness notes are also deliberate: Growth
Factor is not a walk-in local business, so the JSON-LD uses `ProfessionalService`.
