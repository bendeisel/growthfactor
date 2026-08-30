#!/usr/bin/env bash
# Generates the program pages from one template so shared chrome cannot drift.
# Re-run after editing the template or any program's copy.
set -euo pipefail
cd "$(dirname "$0")/src/programs"

emit() {
  local slug="$1" title="$2" h1="$3" desc="$4" lead="$5" body="$6" sport="$7"
  cat > "${slug}.html" <<PAGE
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<meta name="description" content="${desc}">
<link rel="canonical" href="https://furstplacemma.com/programs/${slug}/">
<meta property="og:type" content="website">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${desc}">
<meta property="og:url" content="https://furstplacemma.com/programs/${slug}/">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;600;700&family=Archivo+Black&display=swap" rel="stylesheet">
<link rel="stylesheet" href="../css/site.css">
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Service",
  "name": "${h1}",
  "serviceType": "${sport}",
  "description": "${desc}",
  "url": "https://furstplacemma.com/programs/${slug}/",
  "provider": { "@id": "https://furstplacemma.com/#gym" },
  "areaServed": { "@type": "City", "name": "Hendersonville, TN" },
  "offers": {
    "@type": "Offer",
    "name": "Free first class",
    "price": "0",
    "priceCurrency": "USD",
    "description": "Your first class is free and there is no contract."
  }
}
</script>
</head>
<body>
<a class="skip" href="#main">Skip to content</a>

<header class="header">
  <a class="header__mark" href="../index.html">Furst Place <span>MMA</span></a>
  <nav class="header__nav" id="primaryNav" aria-label="Primary">
    <a href="mixed-martial-arts.html">MMA</a>
    <a href="kickboxing.html">Kickboxing</a>
    <a href="no-gi-jiu-jitsu.html">No-Gi Jiu Jitsu</a>
    <a href="../index.html#schedule">Schedule</a>
    <a href="../index.html#coach">Coach</a>
    <a href="../index.html#visit">Visit</a>
  </nav>
  <button class="navtoggle" type="button" data-navtoggle aria-expanded="false" aria-controls="primaryNav" aria-label="Menu"><span></span><span></span><span></span></button>
  <a class="header__tel" href="tel:+16154958560">(615)&nbsp;495-8560</a>
</header>

<main id="main">
  <section class="section">
    <div class="wrap">
      <nav class="eyebrow" aria-label="Breadcrumb" style="margin-bottom:1.5rem">
        <a href="../index.html" style="text-decoration:none;color:inherit">Furst Place MMA</a>
        &nbsp;/&nbsp; Programs
      </nav>
      <h1 style="font-size:clamp(2.5rem,7vw,5rem);max-width:14ch">${h1}</h1>
      <p style="max-width:56ch;margin-top:1.5rem;font-size:1.125rem;color:var(--ink-soft)">${lead}</p>
      <p style="margin-top:2rem">
        <button class="btn btn--accent" data-lead="${h1}">Claim your free class</button>
      </p>
    </div>
  </section>

  <!-- PHOTO SLOT: replace with the client's own ${slug} photograph -->
  <div style="height:clamp(16rem,42vh,26rem);background:#1a1613 center/cover url('../img/${slug}.jpg');border-block:2px solid var(--ink)" role="img" aria-label="${h1} training at Furst Place MMA"></div>

  <section class="section">
    <div class="wrap wrap--narrow">
      <p class="eyebrow">What the class is</p>
      ${body}
    </div>
  </section>

  <section class="section section--deep">
    <div class="wrap wrap--narrow">
      <p class="eyebrow">Starting out</p>
      <h2 style="font-size:clamp(1.75rem,4vw,2.75rem)">No experience needed</h2>
      <p style="color:var(--ink-soft)">Every class is scaled so a first-timer and a
      competitor can train side by side. The room is full of locals who started
      exactly where you are, with no background at all. Sparring is always optional
      and controlled, and only happens once you and your coach agree you are ready,
      so beginners are never forced into contact.</p>
      <p style="margin-top:2rem">
        <button class="btn" data-lead="${h1}">Claim your free class</button>
      </p>
    </div>
  </section>
</main>

<footer class="footer">
  <div class="footer__grid">
    <div>
      <a class="header__mark" href="../index.html">Furst Place <span>MMA</span></a>
      <p style="margin-top:1rem;font-size:.9375rem">Mixed martial arts, kickboxing
      and no-gi jiu jitsu in Hendersonville, Tennessee.</p>
    </div>
    <div>
      <h3>Programs</h3>
      <ul>
        <li><a href="mixed-martial-arts.html">Mixed Martial Arts</a></li>
        <li><a href="kickboxing.html">Kickboxing</a></li>
        <li><a href="no-gi-jiu-jitsu.html">No-Gi Jiu Jitsu</a></li>
      </ul>
    </div>
    <div>
      <h3>Gym</h3>
      <address style="font-style:normal;line-height:1.8">
        122 Taylor Industrial Blvd<br>
        Hendersonville, TN 37075<br>
        <a href="tel:+16154958560">(615) 495-8560</a>
      </address>
    </div>
  </div>
  <div class="footer__base">
    <span>&copy; <span id="yr">2026</span> Furst Place MMA. All rights reserved.</span>
    <span>Hendersonville, Tennessee</span>
  </div>
</footer>

<div class="modal" id="leadModal" hidden role="dialog" aria-modal="true" aria-labelledby="leadTitle">
  <div class="modal__panel">
    <button class="modal__close" type="button" data-lead-close aria-label="Close">&times;</button>
    <h2 id="leadTitle">Claim your free class</h2>
    <p class="modal__intro">No contract, no experience needed. Tell us where to reach you and we&rsquo;ll get you on the mat.</p>
    <form method="post" action="../lead.php" novalidate>
      <input type="hidden" name="source" id="leadSource" value="${h1}">
      <div class="hp" aria-hidden="true">
        <label for="company">Company</label>
        <input type="text" id="company" name="company" tabindex="-1" autocomplete="off">
      </div>
      <div class="field"><label for="name">Name</label><input type="text" id="name" name="name" required autocomplete="name"></div>
      <div class="field"><label for="phone">Phone</label><input type="tel" id="phone" name="phone" required autocomplete="tel"></div>
      <div class="field"><label for="email">Email</label><input type="email" id="email" name="email" required autocomplete="email"></div>
      <button class="btn btn--accent" type="submit">Book my free class</button>
      <p class="modal__fine">Or call <a href="tel:+16154958560">(615) 495-8560</a></p>
    </form>
  </div>
</div>

<script src="../js/site.js"></script>
</body>
</html>
PAGE
  echo "  wrote ${slug}.html"
}

emit "kickboxing" \
  "Kickboxing Classes in Hendersonville, TN | Furst Place MMA" \
  "Kickboxing" \
  "Kickboxing classes in Hendersonville, TN. Boxing hands, powerful kicks, knees and sharp footwork. Your first class is free and there is no contract." \
  "Boxing hands together with powerful kicks, knees, and sharp footwork for a full-body workout." \
  '<p>High-energy rounds on pads and bags that scale to any fitness level. You will
      work combinations on the pads and the heavy bag, and you will learn genuine
      striking technique the same way a fighter does &mdash; proper stance, guard,
      weight transfer, and how to generate power from the ground up.</p>
      <p>Most people walk in with zero striking background. The coaches teach every
      punch, kick, and combination from step one.</p>' \
  "Kickboxing"

emit "no-gi-jiu-jitsu" \
  "No-Gi Jiu Jitsu Classes in Hendersonville, TN | Furst Place MMA" \
  "No-Gi Jiu Jitsu" \
  "No-gi jiu jitsu and grappling classes in Hendersonville, TN. Takedowns, scrambles, top pressure, chokes and joint locks. First class free, no contract." \
  "Take the fight to the ground, control it, and finish with chokes and joint locks." \
  '<p>The no-gi grappling curriculum works takedowns, scrambles, and top pressure &mdash;
      controlling the position first, then finishing from it.</p>
      <p>No gi is required. Shorts and a t-shirt or rash guard is all you need for
      your first class.</p>' \
  "Brazilian Jiu-Jitsu"

emit "mixed-martial-arts" \
  "Mixed Martial Arts Classes in Hendersonville, TN | Furst Place MMA" \
  "Mixed Martial Arts" \
  "MMA classes in Hendersonville, TN. Striking and grappling under one roof, taught by a coach who has lived it. First class free, no contract." \
  "Both halves, one sport. Stand-up and ground taught together, by the same coaches, under one roof." \
  '<p>Mixed martial arts is where the stand-up and the ground meet. You will train
      striking and grappling as one system rather than as two hobbies &mdash; how to
      close distance, how to defend the takedown, what to do when the fight changes
      levels.</p>
      <p>The instruction is technical, practical, and focused on what actually works,
      not flashy moves or watered-down classes. It is a real fight gym with a team
      that competes, and the coaches hold beginners and fighters to the same
      standard.</p>' \
  "Mixed Martial Arts"

echo "Program pages generated."
