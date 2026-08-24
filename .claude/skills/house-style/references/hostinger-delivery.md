# Hostinger delivery — the volume-site factory

Growth Factor builds on its own stack and deploys to Hostinger. Template
platforms (97Display, Wix, etc.) are now SOURCE material only — something a
client arrives from and we extract a kernel out of — never the build target.

## The stack

One folder per site, static-first:

```
sites/<client>/
├── kernel.json      # the extracted brand kernel — drives everything below
├── index.html       # semantic, crawlable markup; copy verbatim from client
├── style.css        # kernel tokens as CSS custom properties at :root
├── app.js           # the portable components: popup form, coverflow,
│                    # marquee, reveal-on-scroll — all vanilla, no framework
├── lead.php         # form handler (below)
├── img/             # downsampled, sized, alt-texted
├── sitemap.xml
└── robots.txt
```

Why static: nothing to patch, nothing to hack, nothing that breaks at 2am
across thousands of sites. Perfect Lighthouse scores are the default rather
than an optimization project. And the house components were deliberately built
framework-free, so they drop in unchanged.

The one dynamic need a small-business site actually has is lead capture, and
shared hosting's PHP covers it without any platform:

```php
<?php // lead.php — minimal form handler
if ($_SERVER['REQUEST_METHOD'] !== 'POST') { http_response_code(405); exit; }
if (!empty($_POST['website'])) { exit; }            // honeypot field
$body = "New website lead\n";
foreach (['first','last','email','phone'] as $f) {
  $body .= ucfirst($f) . ': ' . substr(strip_tags($_POST[$f] ?? ''), 0, 200) . "\n";
}
mail('CLIENT_EMAIL_HERE', 'Website lead', $body,
     'From: leads@' . $_SERVER['HTTP_HOST']);
header('Location: /thanks.html');
```

At real scale, replace per-site `mail()` with one central lead endpoint that
logs, dedupes, and notifies — build it once, point every site at it. Leads are
the product the client is paying for; losing one to a mail() silently failing
is the worst bug this business can have.

## Deploying

- **First dozens of sites:** hPanel's Git deployment (push to a repo, Hostinger
  pulls) or a scripted SFTP/rsync upload. Zero drama for static files.
- **Real scale:** shared-hosting plans cap the number of websites per plan
  (on the order of 100 per plan on Premium/Business tiers, ~300 on Cloud —
  verify current limits, they change). Thousands of sites means either many
  plans or, far more automatable, a few VPSes running nginx with one vhost per
  site and certbot for SSL. Static sites are so light that a single modest VPS
  serves hundreds of them; the bottleneck is management tooling, not compute.
- Each site on its own client-owned domain, free Let's Encrypt SSL either way.

## The economics, honestly

A $100 site only works as a factory. Budget arithmetic to keep in view:

- **Marginal cost per site** is genuinely tiny: hosting pennies-per-month at
  scale, generation cost in the low dollars, domain usually client-paid.
- **The constraint is human minutes.** At $100/site, everything human —
  kernel confirmation, copy intake, QA, launch — has to fit in well under an
  hour, or the price is a loss-leader by accident instead of on purpose.
- **Support is where $100 sites die.** 10,000 sites × fifteen minutes of
  "can you change my hours" per year is 2,500 hours. The build fee cannot fund
  that. Either edits are self-serve, or they're a paid care plan.
- **The recurring line is the actual business.** The $100 build is customer
  acquisition; hosting-and-care at $10–25/mo is the revenue. At scale, monthly
  recurring dwarfs the one-time build fees within the first year.

## Divergence at factory scale

The shipped log matters MORE at volume, not less. The axes give thousands of
combinations, so combinations will repeat across 10k sites — that's fine.
What may never repeat is a combination within the same vertical and radius,
which is the only collision a client can ever see. The Step 0 check is cheap
(a CSV filter) and must never be skipped for speed; it is the difference
between a factory and a template mill.

## Per-site SEO defaults (ship on every site, no exceptions)

- Real HTML content — no client-side-rendered copy, no text in images.
- One `<h1>`, keyworded section `<h2>`s, descriptive internal links to every
  page (teaser + link beats duplicated copy — the homepage distributes
  authority, the inner pages rank).
- `LocalBusiness` schema with NAP matching the Google Business Profile;
  `FAQPage` schema wherever there's an FAQ.
- Per-page `<title>`/meta description, `sitemap.xml`, `robots.txt`, canonical.
- Images sized, compressed, and alt-texted at build time.

## What stays human

Kernel confirmation with the client, the copy itself (the 99% lock means we
never write it), the go-live check, and the shipped-log entry. Everything
else is the pipeline's job.
