#!/usr/bin/env python3
"""Builds the Fuel Fortress Nashville site: one HTML file per page, plus a
single-file preview that routes between them for review. Output is plain
static HTML, no framework, per the Hostinger delivery spec."""
import os, re

NAV = [("equipment.html","Equipment"),("gym.html","The Gym"),
       ("addons.html","Add-Ons"),("membership.html","Membership"),
       ("kickboxing.html","Kickboxing")]

def nav_html(active):
    return "\n".join(
      '    <a href="%s"%s>%s</a>' % (h, ' class="is-here"' if h==active else '', t)
      for h,t in NAV)

FOOTER = '''<footer class="ftr">
  <div class="ftr-grid">
    <div class="contact">
      <h4>Fuel Fortress Nashville</h4>
      <a href="tel:+16155623966">(615) 562-3966</a>
      <a href="mailto:fuelfortress615@gmail.com" style="font-size:14px;letter-spacing:0">fuelfortress615@gmail.com</a>
      <p style="margin-top:14px">412 Davidson St<br>Nashville, TN 37213</p>
    </div>
    <div>
      <h4>The Gym</h4>
      <a href="equipment.html">Equipment</a>
      <a href="gym.html">What's Inside</a>
      <a href="gym.html#sauna">Sauna</a>
      <a href="kickboxing.html">Kickboxing</a>
    </div>
    <div>
      <h4>Join</h4>
      <a href="membership.html">Membership &amp; Pricing</a>
      <a href="addons.html">Add-Ons</a>
      <a href="membership.html#signup">How To Sign Up</a>
      <a href="index.html#location">Location</a>
    </div>
    <div>
      <h4>Hours</h4>
      <p>Open 24 hours a day to members.</p>
      <p class="small">Staffed hours<br>
        Mon &#8211; Fri: 8:00 AM &#8211; 8:00 PM<br>
        Saturday: 8:00 AM &#8211; 4:00 PM<br>
        Sunday: 11:00 AM &#8211; 4:00 PM</p>
    </div>
  </div>
  <div class="ftr-base">
    <span>&copy; <span id="yr">2026</span> Fuel Fortress Nashville. All rights reserved.</span>
    <span><a href="privacy-policy.html">Privacy Policy</a> &nbsp;&middot;&nbsp; <a href="terms-of-service.html">Terms of Service</a></span>
  </div>
</footer>'''

MODAL = '''<div class="modal" id="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
  <div class="modal-card">
    <button class="modal-close" id="modal-close" aria-label="Close">&times;</button>
    <h2 id="modal-title">Get Started</h2>
    <p class="small" id="modal-sub">Leave your details and we'll get straight back to you.</p>
    <form action="lead.php" method="post">
      <input type="text" name="website" class="hp" tabindex="-1" autocomplete="off" aria-hidden="true">
      <input type="hidden" name="interest" id="modal-interest" value="join">
      <div class="fld"><label for="f-first">First name</label><input id="f-first" name="first" required></div>
      <div class="fld"><label for="f-last">Last name</label><input id="f-last" name="last" required></div>
      <div class="fld"><label for="f-email">Email</label><input id="f-email" name="email" type="email" required></div>
      <div class="fld"><label for="f-phone">Phone</label><input id="f-phone" name="phone" type="tel" required></div>
      <div class="fld" style="margin-top:26px"><button class="btn" type="submit" style="width:100%">Send</button></div>
    </form>
  </div>
</div>

<div class="lb" id="lb"><button class="lb-close" aria-label="Close">&times;</button><img id="lb-img" alt=""></div>'''

LD = '''<script type="application/ld+json">
{"@context":"https://schema.org","@type":"ExerciseGym","name":"Fuel Fortress Nashville",
"url":"https://fuelfortressnashville.com/","telephone":"+1-615-562-3966",
"email":"fuelfortress615@gmail.com",
"address":{"@type":"PostalAddress","streetAddress":"412 Davidson St","addressLocality":"Nashville","addressRegion":"TN","postalCode":"37213","addressCountry":"US"},
"areaServed":["Nashville","East Nashville","Belle Meade","Berry Hill","Forest Hills","Oak Hill"],
"aggregateRating":{"@type":"AggregateRating","ratingValue":"5.0","reviewCount":"8"},
"openingHoursSpecification":[{"@type":"OpeningHoursSpecification","dayOfWeek":["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"],"opens":"00:00","closes":"23:59"}]}
</script>'''

LAYOUT = '''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{title}</title>
<meta name="description" content="{desc}">
<link rel="canonical" href="https://fuelfortressnashville.com/{canon}">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{desc}">
<meta property="og:type" content="website">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="style.css">
{ld}
</head>
<body>

<div class="trail" id="trail" aria-hidden="true"></div>

<header class="hdr" id="hdr">
  <a class="brand" href="index.html">Fuel Fortress <span>Nashville</span></a>
  <button class="navtoggle" id="navtoggle" aria-expanded="false" aria-controls="nav">Menu</button>
  <nav class="nav" id="nav">
{nav}
  </nav>
  <a class="btn btn-call" href="tel:+16155623966">Call Now</a>
</header>

<main>
{main}
</main>

{footer}
{modal}
<script src="app.js"></script>
</body>
</html>'''

def faq(items, eyebrow="Questions", heading="Frequently asked."):
    rows = "\n".join('''      <details class="faq-item">
        <summary>%s</summary>
        <div class="faq-a"><p>%s</p></div>
      </details>''' % (q, a) for q, a in items)
    return '''<section class="band on-light" id="faq">
  <div class="band-inner">
    <p class="eyebrow rv">%s</p>
    <h2 class="d2 rv">%s</h2>
    <div class="faq rv">
%s
    </div>
  </div>
</section>''' % (eyebrow, heading, rows)

def cta(kicker, heading, body):
    return '''<section class="band">
  <div class="band-inner">
    <p class="eyebrow rv">%s</p>
    <h2 class="d1 rv" style="max-width:15ch">%s</h2>
    <p class="lede rv" style="margin-top:22px">%s</p>
    <div class="btn-row rv">
      <button class="btn" data-modal="join">Join Now</button>
      <button class="btn btn-ghost" data-modal="tour">Book a Gym Tour</button>
    </div>
    <p class="small rv" style="margin-top:18px">No commitment required &middot; Military, First Responder &amp; Student discounts</p>
  </div>
</section>''' % (kicker, heading, body)

def page_hero(eyebrow, h1, lede, slot_label, slot_file):
    return '''<section class="phero">
  <div class="phero-media">
    <!-- SWAP IN: <img src="%s" alt="%s"> -->
    <div class="slot-ph"><b>%s</b><code>%s</code></div>
  </div>
  <div class="phero-scrim"></div>
  <div class="phero-inner">
    <p class="eyebrow">%s</p>
    <h1 class="d1">%s</h1>
    <p class="lede">%s</p>
  </div>
</section>''' % (slot_file, slot_label, slot_label, slot_file, eyebrow, h1, lede)

EQ_BRANDS = [
 ("01","Arsenal Strength","Plate-loaded and selectorized",
  "Heavy-gauge frames and honest loading. The build quality that doesn't develop a rattle in year two.",
  "img/equip-arsenal.jpg"),
 ("02","Atlantis","Precision strength machines",
  "Strength curves matched to how the muscle actually works through the range, not how it looked on a spec sheet.",
  "img/equip-atlantis.jpg"),
 ("03","Hammer Strength","Iso-lateral pressing and rows",
  "Each side works independently, so your strong side doesn't get to quietly carry your weak one.",
  "img/equip-hammer.jpg"),
 ("04","Rogers Athletic","Custom platforms and racks",
  "Built for college and pro weight rooms, then put on our floor custom-branded in Fuel Fortress colors.",
  "img/equip-rogers.jpg"),
]

def eq_rail():
    items, stages = [], []
    for i,(n,name,kick,body,img) in enumerate(EQ_BRANDS):
        a = 'true' if i==0 else 'false'
        items.append('''        <button class="eq-item%s" role="tab" aria-selected="%s"
                id="eq-tab-%d" aria-controls="eq-panel-%d" tabindex="%d" data-eq="%d">
          <span class="eq-num">%s</span>
          <span class="eq-name">%s</span>
          <span class="eq-kick">%s</span>
        </button>''' % (' is-active' if i==0 else '', a, i, i, 0 if i==0 else -1, i, n, name, kick))
        stages.append('''      <div class="eq-panel%s" role="tabpanel" id="eq-panel-%d" aria-labelledby="eq-tab-%d"%s>
        <div class="slot eq-shot">
          <!-- SWAP IN: <img src="%s" alt="%s equipment at Fuel Fortress Nashville"> -->
          <div class="slot-ph"><b>%s %s</b><code>%s</code></div>
        </div>
        <p class="eq-body">%s</p>
      </div>''' % (' is-active' if i==0 else '', i, i, '' if i==0 else ' hidden', img, name, n, name, img, body))
    return '''    <div class="eq rv">
      <div class="eq-list" role="tablist" aria-label="Equipment brands">
%s
      </div>
      <div class="eq-stage">
%s
      </div>
    </div>''' % ("\n".join(items), "\n".join(stages))

REVIEWS = [
 ("LA","Luis Jose Lois Arias","Luxury spot with amazing equipment that I haven't seen in other gym facilities around Nashville. Definitely a vibe to workout in this new spot!"),
 ("N","Nick","Beautiful facility. Best gym I've ever seen, hands-down! Top notch equipment, you can tell no expense was spared. The owners are awesome and are truly passionate about what they do."),
 ("TD","Tyler Duquette","As someone who has been to pretty much every gym in Nashville, I can confidently say there's a lot that goes into making a gym truly special. This gym has all of the above."),
 ("MA","Matthew Anderson","The equipment is next-level and you can tell it was chosen intentionally, not the usual big-box stuff. It feels like a gym built by people who actually train."),
 ("VO","Victor Olivo","This gym is hands down one of the best gyms you can train at. It's clean, luxurious and the equipment is next level. The aesthetic is unmatched with an atmosphere that pushes you to go harder."),
 ("PF","Priddy Fit","Another incredible fitness experience at a new Fuel Fortress location, close to the new Titan's stadium. From the lighting, equipment, and overall vibe, you get the true Fuel experience."),
 ("LC","Leah Campagna","Solid gym. Great vibes, friendly people, and a really welcoming atmosphere. Everything's clean and well run, and you can tell they care about the community."),
 ("CE","caleb edmondson","This gym has everything you could ever ask for, including a great atmosphere. 10 out of 10, would recommend."),
]

def review_deck(heading="Real people. Real results.", lede="Every review below is a real one, left on Google by a member of the Nashville gym. All 8 of them are five stars."):
    cards = "".join('''      <article class="deck-card" data-i="%d" tabindex="-1">
        <span class="deck-mark">%s</span>
        <p class="deck-stars">&#9733;&#9733;&#9733;&#9733;&#9733;</p>
        <blockquote class="deck-quote">%s</blockquote>
        <p class="deck-by">%s, Google review</p>
      </article>\n''' % (i, m, q, by) for i,(m,by,q) in enumerate(REVIEWS))
    return '''<section class="band" id="reviews">
  <div class="band-inner">
    <p class="eyebrow rv">Member Stories</p>
    <h2 class="d2 rv">%s</h2>
    <p class="lede rv">%s</p>
    <div class="deck rv" id="deck">
      <div class="deck-stage" id="deck-stage">
%s      </div>
      <div class="deck-nav">
        <button class="deck-btn" type="button" data-dir="-1" aria-label="Previous review">&#8249;</button>
        <button class="deck-btn" type="button" data-dir="1" aria-label="Next review">&#8250;</button>
      </div>
    </div>
  </div>
</section>''' % (heading, lede, cards)

GALLERY_SHOTS = ["143028","143128","143220","143406","143424","143528","143602","143710","143916","144014"]
def gallery(heading="Where lifestyle meets luxury."):
    tiles = "".join(
      '      <div class="slot"><div class="slot-ph"><b>Gallery photo</b>'
      '<code>img/gallery-%02d.jpg &middot; dji_mimo_20260309_%s</code></div></div>\n' % (i+1, s)
      for i, s in enumerate(GALLERY_SHOTS))
    return '''<section class="band" id="gallery">
  <div class="band-inner">
    <p class="eyebrow rv">Gallery</p>
    <h2 class="d2 rv">%s</h2>
    <div class="mosaic rv" id="mosaic">
%s    </div>
  </div>
</section>''' % (heading, tiles)

# ============================ PAGES ============================
PAGES = {}

PAGES["index.html"] = dict(
 title="Weightlifting Gym in Nashville &amp; East Nashville, TN | Fuel Fortress",
 desc="A 24 hour weightlifting gym on Davidson Street between downtown Nashville and East Nashville. Arsenal Strength, Atlantis, Hammer Strength and Rogers Athletic, plus a sauna for recovery. From $84.99/mo.",
 canon="", ld=LD,
 main='''<section class="hero">
  <div class="hero-media">
    <!-- SWAP IN: <video autoplay muted loop playsinline poster="img/hero-poster.jpg"><source src="video/hero.mp4" type="video/mp4"></video> -->
    <div class="slot-ph"><b>Hero video</b><code>video/hero.mp4 &middot; from 0308-2.mp4</code></div>
  </div>
  <div class="hero-scrim"></div>
  <div class="hero-inner">
    <p class="eyebrow">Weightlifting Gym &middot; Nashville &amp; East Nashville, TN</p>
    <h1 class="d1">Train hard.<br>Recover strong.<br>Perform better.</h1>
    <p class="lede">A 24 hour weightlifting gym on Davidson Street, sitting right on the line between downtown Nashville and East Nashville. Built for powerlifting, bodybuilding and everything heavy in between, with a sauna to recover in and nobody waiting on your rack at 5am.</p>
    <div class="btn-row">
      <button class="btn" data-modal="join">Join Now</button>
      <button class="btn btn-ghost" data-modal="tour">Book a Gym Tour</button>
    </div>
  </div>
</section>

<div class="rail">
  <div class="rail-item"><b>24/7</b><span>Member access</span></div>
  <div class="rail-item"><b>4</b><span>Locations &middot; KY &amp; TN</span></div>
  <div class="rail-item"><b>5.0<i>&#9733;</i></b><span>8 Google reviews</span></div>
  <div class="rail-item"><b>412</b><span>Davidson St, Nashville</span></div>
</div>

<div class="ticker" aria-hidden="true">
  <div class="ticker-track">''' + "".join(
    '<span>%s</span><span class="dot">&middot;</span>' % k for k in
    ["Weightlifting","Powerlifting","Bodybuilding","Strength Training","Free Weights",
     "24 Hour Gym","Sauna &amp; Recovery","Personal Training","Nashville","East Nashville"]*2) + '''</div>
</div>

<section class="band on-light">
  <div class="band-inner">
    <p class="eyebrow rv">The Equipment</p>
    <h2 class="d2 rv">The best equipment<br>in Nashville.</h2>
    <p class="lede rv">Whether you came in for powerlifting numbers, bodybuilding shape or your first month of strength training, four names carry the room: Arsenal Strength, Atlantis, Hammer Strength and Rogers Athletic.</p>
    <p class="small rv" style="margin-top:26px"><a class="ulink" href="equipment.html">See the full equipment list</a></p>
  </div>
</section>

<section class="band">
  <div class="band-inner">
    <p class="eyebrow rv">The Problem</p>
    <h2 class="d2 rv">Nashville lifters<br>deserve better.</h2>
    <ul class="idx idx-4 rv">
      <li><span class="num">01</span><h3>Broken Equipment &amp; No Standards</h3><p>You show up ready to train only to find broken machines and gear that hasn't been replaced in years.</p></li>
      <li><span class="num">02</span><h3>Lack of Guidance &amp; Real Support</h3><p>Most big-box gyms leave you to figure things out on your own. No real guidance, no experienced people around to help, just equipment without direction.</p></li>
      <li><span class="num">03</span><h3>Recovery Is an Afterthought</h3><p>You train like a professional but recover in facilities that feel like a high school locker room.</p></li>
      <li><span class="num">04</span><h3>Cold, Corporate, Impersonal</h3><p>You wanted community. Instead you got a franchise that treats members like a membership number.</p></li>
    </ul>
  </div>
</section>

<section class="band on-light">
  <div class="band-inner">
    <p class="eyebrow rv">Inside</p>
    <h2 class="d2 rv">What's actually<br>in the building.</h2>
    <div class="stack rv">
      <div class="stack-row"><h3>The Floor</h3><div><p>Racks, competition platforms, free weights and a dumbbell run that goes heavy enough to matter.</p><p class="stack-link"><a href="gym.html">Tour the gym</a></p></div></div>
      <div class="stack-row"><h3>The Sauna</h3><div><p>Cleaned daily, included with every membership, and hot when you get there.</p><p class="stack-link"><a href="gym.html#sauna">More on recovery</a></p></div></div>
      <div class="stack-row"><h3>Kickboxing</h3><div><p>Teryn is a former fighter and one of the owners. Twice a week she runs kickboxing for members, and it is an outstanding workout whether or not you ever want to learn to strike.</p><p class="stack-link"><a href="kickboxing.html">More on kickboxing</a></p></div></div>
      <div class="stack-row"><h3>Add-Ons</h3><div><p>Personal training and ready-made meals, both priced separately from membership.</p><p class="stack-link"><a href="addons.html">See add-ons</a></p></div></div>
    </div>
  </div>
</section>

<section class="band">
  <div class="band-inner">
    <p class="eyebrow rv">Membership</p>
    <h2 class="d2 rv">One rate.<br>Every location.</h2>
    <p class="lede rv">From $84.99 a month, covering the weightlifting floor, the sauna, kickboxing and 24 hour access at all four Fuel Fortress locations across Kentucky and Tennessee.</p>
    <div class="btn-row rv"><a class="btn" href="membership.html">See Pricing</a></div>
  </div>
</section>

''' + gallery() + "\n\n" + review_deck() + '''

<section class="band on-light" id="location">
  <div class="band-inner">
    <p class="eyebrow rv">Proudly Serving</p>
    <h2 class="d2 rv">Between downtown and<br>East Nashville.</h2>
    <p class="lede rv">We're at <strong>412 Davidson Street</strong>, a few minutes from the new stadium and right on the line between downtown Nashville and East Nashville. That corner is why so many members train here: they work downtown, they live in East Nashville, and this is the weightlifting gym on the drive between the two.</p>
    <div class="areas rv">
      <span>Nashville</span><span>East Nashville</span><span>Belle Meade</span>
      <span>Berry Hill</span><span>Forest Hills</span><span>Oak Hill</span>
    </div>
    <div class="btn-row rv" style="margin-top:32px">
      <a class="btn" href="https://maps.google.com/?q=412+Davidson+St+Nashville+TN+37213" target="_blank" rel="noopener">Get Directions</a>
      <button class="btn btn-ghost" data-modal="tour">Book a Gym Tour</button>
    </div>
  </div>
</section>

''' + faq([
  ("Is the gym open 24 hours?","Yes. Members have access 24 hours a day using the QR code issued at signup. Staffed hours are Monday to Friday 8:00 AM to 8:00 PM, Saturday 8:00 AM to 4:00 PM and Sunday 11:00 AM to 4:00 PM."),
  ("How much is membership?","$84.99 a month on the annual rate, $104.99 month to month, or $25 for a day pass. Military, first responder and student discounts are available with valid ID."),
  ("What is included?","The weightlifting floor, the sauna, kickboxing and 24 hour access at all four Fuel Fortress locations across Kentucky and Tennessee."),
  ("What costs extra?","Personal training and ready-made meals. That is the whole list."),
  ("Do you run classes or programs?","No. There is no class timetable and no program to enrol in. The one exception is a couple of recreational kickboxing sessions a week, which come with your membership."),
  ("Can I sign up in the middle of the night?","Yes. Sign up online at any hour, get your QR code immediately, and scan in the same night."),
  ("Where are you?","412 Davidson Street, Nashville, TN 37213, between downtown and East Nashville."),
]) + "\n\n" + cta("Nashville's Sanctuary For Results","Ready when you are.",
  "The best equipped weightlifting gym in Nashville, open 24 hours, with a sauna waiting when you're done. Your first session starts whenever you decide it does."))

PAGES["equipment.html"] = dict(
 title="Gym Equipment in Nashville | Arsenal, Atlantis, Hammer Strength | Fuel Fortress",
 desc="Arsenal Strength, Atlantis, Hammer Strength and Rogers Athletic on one floor in Nashville. Plate-loaded machines, competition platforms and free weights for powerlifting and bodybuilding.",
 canon="equipment.html", ld="",
 main=page_hero("The Equipment","The best equipment<br>in Nashville.",
   "Four manufacturers, one floor, and nothing on it chosen because it was cheap. This is the reason most of our members drove past three closer gyms to get here.",
   "Equipment hero","img/equip-hero.jpg") + '''

<section class="band eq-band">
  <div class="band-inner">
    <p class="eyebrow rv">Who Makes It</p>
    <h2 class="d2 rv">Four names<br>carry the room.</h2>
''' + eq_rail() + '''
    <figure class="pull rv">
      <q>The equipment is next-level and you can tell it was chosen intentionally, not the usual big-box stuff.</q>
      <figcaption><cite>Matthew Anderson &middot; Google review, March 2026</cite></figcaption>
    </figure>
  </div>
</section>

<section class="band">
  <div class="band-inner">
    <p class="eyebrow rv">Why It Matters</p>
    <h2 class="d2 rv">Equipment is the<br>whole argument.</h2>
    <div class="stack rv">
      <div class="stack-row"><h3>For Powerlifting</h3><div><p>Competition platforms and Rogers Athletic racks, the same builds that go into college and pro weight rooms. If you are training a squat, bench and deadlift total, you are not fighting the equipment to do it.</p></div></div>
      <div class="stack-row"><h3>For Bodybuilding</h3><div><p>Arsenal Strength and Atlantis cover the angles a barbell cannot. Plate-loaded and selectorized machines with strength curves that load the muscle through the range instead of dumping tension at the top.</p></div></div>
      <div class="stack-row"><h3>For Pressing And Pulling</h3><div><p>Hammer Strength iso-lateral machines let each side work independently, so a strong side cannot quietly carry a weak one. Imbalances show up on the machine instead of in an injury.</p></div></div>
      <div class="stack-row"><h3>For Free Weights</h3><div><p>A dumbbell run that goes heavy enough to matter, plus benches, racks and bars that get maintained rather than replaced once a decade.</p></div></div>
    </div>
    <p class="small rv" style="margin-top:30px"><a class="ulink" href="membership.html">See membership pricing</a></p>
  </div>
</section>

''' + faq([
  ("Can I try the equipment before joining?","Yes. A day pass is $25 and gets you the full floor for the day, or you can book a tour and we will walk you around it first."),
  ("Is the equipment the same at every Fuel Fortress?","Every location is built to the same standard, but the exact machine list differs by building. Your membership works at all four locations across Kentucky and Tennessee."),
  ("Do you have competition platforms?","Yes, Rogers Athletic platforms and racks, custom-branded in Fuel Fortress colors."),
  ("Is anything on the floor off limits to new members?","No. Everything on the floor comes with your membership. If you are not sure how a machine works, ask someone on staff."),
], "Equipment Questions", "Questions about the floor.") + "\n\n" + cta(
  "The Equipment","Come put your hands on it.",
  "Photos only get you so far. Book a tour, walk the floor, and load something."))

PAGES["gym.html"] = dict(
 title="24 Hour Gym with Sauna in Nashville, TN | Fuel Fortress",
 desc="Inside the Fuel Fortress weightlifting gym on Davidson Street: the floor, the sauna, 24 hour member access and kickboxing, all included with membership.",
 canon="gym.html", ld="",
 main=page_hero("The Gym","Open when<br>you are.",
   "A 24 hour gym on Davidson Street with a weightlifting floor, a sauna and no class schedule to work around. You get the floor, the recovery room and the door code. The rest is yours.",
   "Gym floor hero","img/gym-hero.jpg") + '''

<section class="band">
  <div class="band-inner">
    <p class="eyebrow rv">Inside</p>
    <h2 class="d2 rv">What's actually<br>in the building.</h2>
    <div class="stack rv">
      <div class="stack-row"><h3>The Weightlifting Floor</h3><div><p>Racks, competition platforms, free weights and a dumbbell run that goes heavy enough to matter, with plate-loaded machines along the far wall. Whether you are chasing a powerlifting total or building for bodybuilding, it is laid out so you can superset without crossing the building or waiting out somebody's phone break.</p><p class="stack-link"><a href="equipment.html">See the equipment</a></p></div></div>
      <div class="stack-row"><h3>24 Hour Member Access</h3><div><p>Your schedule doesn't fit in a nine to five window, so your gym shouldn't either. Sign up online and your QR code is your key from that minute. Early mornings, late nights, holidays, whenever the gap in your day shows up.</p><p class="stack-link"><a href="membership.html#signup">How signing up works</a></p></div></div>
      <div class="stack-row"><h3>Kickboxing</h3><div><p>Teryn is a former fighter and one of the owners of the gym. Twice a week she runs kickboxing for members: a serious workout on its own, and real striking instruction if you want it. You do not have to be a fighter, and it costs nothing extra.</p><p class="stack-link"><a href="kickboxing.html">More on kickboxing</a></p></div></div>
      <div class="stack-row"><h3>Clean, Every Day</h3><div><p>Wiped down daily, restocked daily, and the sauna is part of that routine rather than an exception to it. Half our Google reviews mention it without being asked.</p></div></div>
    </div>
  </div>
</section>

<section class="split on-light" id="sauna">
  <div class="slot">
    <!-- SWAP IN: <img src="img/sauna.jpg" alt="The sauna at Fuel Fortress Nashville"> -->
    <div class="slot-ph"><b>Sauna</b><code>img/sauna.jpg</code></div>
  </div>
  <div class="split-pad">
    <p class="eyebrow rv">Recovery</p>
    <h2 class="d3 rv">A sauna you'll actually want to sit in.</h2>
    <p class="lede rv">Plenty of gyms in Nashville list a sauna on the amenities page, then hide it behind a broken door in the corner of the locker room. Ours gets wiped down every single day, it runs hot the moment you walk in, and it is included with every membership. No upcharge, no booking window, no add-on fee.</p>
    <p class="lede rv">Sit in it after a heavy session, sleep better that night, and come back Wednesday without your legs arguing about it. If you have been hunting for a gym with a sauna in Nashville that treats recovery as part of training instead of a bullet point, this is the one.</p>
    <p class="small rv"><a class="ulink" href="membership.html">See membership pricing</a></p>
  </div>
</section>

''' + gallery("Inside the fortress.") + "\n\n" + faq([
  ("Is the gym really open 24 hours?","Yes. Members have access 24 hours a day, every day, using the QR code issued when you sign up. Staffed hours are Monday to Friday 8:00 AM to 8:00 PM, Saturday 8:00 AM to 4:00 PM and Sunday 11:00 AM to 4:00 PM."),
  ("Is the sauna included?","Yes, with every membership. There is no upcharge and no booking window."),
  ("Do I need to book a time to train?","No. There is no booking system and no class schedule. Show up when it suits you."),
  ("Is kickboxing extra?","No. It comes with your membership. Personal training and meals are the two things that cost extra."),
  ("Where exactly are you?","412 Davidson Street, Nashville, TN 37213, a few minutes from the stadium and right on the East Nashville line."),
], "Gym Questions", "Questions about the gym.") + "\n\n" + cta(
  "The Gym","Come see the place.",
  "Book a tour and walk the floor, or take a $25 day pass and train on it."))

PAGES["addons.html"] = dict(
 title="Personal Training &amp; Ready-Made Meals in Nashville | Fuel Fortress",
 desc="Two optional add-ons at Fuel Fortress Nashville: one on one personal training, and ready-made macro-balanced meals built on Fuel Nutrition. Both priced separately from membership.",
 canon="addons.html", ld="",
 main=page_hero("Add-Ons","Available, but not<br>part of the membership.",
   "Two things we offer on top of your membership. Both cost extra, both are optional, and neither one is bundled into your monthly rate. We would rather say that plainly than surprise you at the desk.",
   "Add-ons hero","img/addons-hero.jpg") + '''

<section class="band">
  <div class="band-inner">
    <span class="addon-tag rv">Costs extra</span>
    <p class="eyebrow rv" style="margin-top:18px">One on One</p>
    <h2 class="d2 rv">Personal Training</h2>
    <p class="lede rv">We have trainers in the building and you can hire one. This is not included with membership and we will never tell you otherwise. It is coaching you buy because you want it, priced separately, with no pressure from anyone at the desk if you don't.</p>
    <div class="stack rv">
      <div class="stack-row"><h3>Built Around You</h3><div><p>One on one coaching shaped by your goals, your body and your timeline. If you are training for a meet, that looks different from a first month back after ten years off, and it should.</p></div></div>
      <div class="stack-row"><h3>Real Credentials</h3><div><p>Coaches who train themselves and can explain why a program looks the way it does, rather than sales staff running a script.</p></div></div>
      <div class="stack-row"><h3>How To Start</h3><div><p>Ask at the front desk during staffed hours and we will match you with someone, or send us your details and we will call you back.</p></div></div>
    </div>
    <div class="btn-row rv" style="margin-top:30px"><button class="btn" data-modal="pt">Ask About Training</button></div>
  </div>
</section>

<section class="band on-light">
  <div class="band-inner">
    <span class="addon-tag rv">Costs extra</span>
    <p class="eyebrow rv" style="margin-top:18px">Nutrition</p>
    <h2 class="d2 rv">Ready-Made Meals</h2>
    <p class="lede rv">Ready-made, macro-balanced meals in the building, built on the legacy of Fuel Nutrition, the Bowling Green meal prep company Josh and Kaitie launched in 2018 on a simple belief: serious athletes deserve serious food.</p>
    <div class="stack rv">
      <div class="stack-row"><h3>Actually Balanced</h3><div><p>Macro-balanced meals for people who train hard and don't have time to waste. No shortcuts, no cutting corners. What you eat is half the equation, and a hard session on top of a skipped lunch is just a hard session wasted.</p></div></div>
      <div class="stack-row"><h3>Grab It On The Way Out</h3><div><p>They live in the building. Finish your session, pick up food that already fits your day, and skip the drive-through decision you were going to regret at 9pm.</p></div></div>
      <div class="stack-row"><h3>Where It Came From</h3><div><p>Fuel Nutrition taught the owners recipe testing, supplier relationships and macro tracking at scale. That same attention became the blueprint for every Fuel Fortress location, from the equipment selection to the sauna.</p></div></div>
    </div>
    <p class="small rv" style="margin-top:26px"><a class="ulink" href="membership.html">See membership pricing</a></p>
  </div>
</section>

''' + faq([
  ("Is personal training included in my membership?","No. Personal training is an add-on that costs extra, on top of your monthly rate. Membership gets you the floor, the sauna, kickboxing and 24 hour access."),
  ("Do I have to buy training to join?","No. Most of our members never buy a session and that is completely fine."),
  ("Are the meals included?","No. Meals are sold separately in the building."),
  ("Do I need a membership to buy meals?","Ask at the desk during staffed hours and we will sort you out."),
  ("How do I get started with a trainer?","Ask at the front desk during staffed hours, or leave your details and we will call you back."),
], "Add-On Questions", "Questions about add-ons.") + "\n\n" + cta(
  "Add-Ons","Start with the membership.",
  "Join first, train for a few weeks, and add coaching or meals later if you actually want them."))

PAGES["membership.html"] = dict(
 title="Gym Membership &amp; Pricing in Nashville, TN | Fuel Fortress",
 desc="Fuel Fortress Nashville membership: $84.99/mo annual, $104.99/mo month to month, $25 day pass. Covers the floor, the sauna, kickboxing and 24 hour access at all four locations.",
 canon="membership.html", ld="",
 main=page_hero("Membership","One rate.<br>Every location.",
   "From $84.99 a month, covering the weightlifting floor, the sauna, kickboxing and 24 hour access at all four Fuel Fortress locations across Kentucky and Tennessee. No extra fees, no friction.",
   "Membership hero","img/membership-hero.jpg") + '''

<section class="band" id="pricing">
  <div class="band-inner">
    <p class="eyebrow rv">Pricing</p>
    <h2 class="d2 rv">Pick your rate.</h2>
    <div class="plans rv">
      <div class="plan">
        <span class="tag">Day Pass</span>
        <p class="price">$25<sub>/ day</sub></p>
        <p class="plan-blurb">Try the fortress before you commit. Walk in, train hard, walk out.</p>
        <ul class="plan-feats">
          <li><svg class="tick" viewBox="0 0 18 18" aria-hidden="true"><path d="M7.162 13.5 2.887 9.225l1.07-1.069 3.205 3.207 6.882-6.882 1.069 1.07z"/></svg><span>Full floor, sauna and kickboxing</span></li>
          <li><svg class="tick" viewBox="0 0 18 18" aria-hidden="true"><path d="M7.162 13.5 2.887 9.225l1.07-1.069 3.205 3.207 6.882-6.882 1.069 1.07z"/></svg><span>No commitment of any kind</span></li>
          <li><svg class="tick" viewBox="0 0 18 18" aria-hidden="true"><path d="M7.162 13.5 2.887 9.225l1.07-1.069 3.205 3.207 6.882-6.882 1.069 1.07z"/></svg><span>Same access a member gets</span></li>
        </ul>
        <button class="btn" data-modal="daypass">Get Started</button>
      </div>
      <div class="plan is-feature">
        <span class="plan-badge">Most Popular</span>
        <span class="tag">Annual</span>
        <p class="price">$84.99<sub>/ mo</sub></p>
        <p class="plan-blurb">Lock in the lowest rate we offer, billed annually.</p>
        <ul class="plan-feats">
          <li><svg class="tick" viewBox="0 0 18 18" aria-hidden="true"><path d="M7.162 13.5 2.887 9.225l1.07-1.069 3.205 3.207 6.882-6.882 1.069 1.07z"/></svg><span>Our lowest monthly rate</span></li>
          <li><svg class="tick" viewBox="0 0 18 18" aria-hidden="true"><path d="M7.162 13.5 2.887 9.225l1.07-1.069 3.205 3.207 6.882-6.882 1.069 1.07z"/></svg><span>All four locations, KY and TN</span></li>
          <li><svg class="tick" viewBox="0 0 18 18" aria-hidden="true"><path d="M7.162 13.5 2.887 9.225l1.07-1.069 3.205 3.207 6.882-6.882 1.069 1.07z"/></svg><span>Everything included, no add-on fees</span></li>
        </ul>
        <button class="btn" data-modal="annual">Join Now</button>
      </div>
      <div class="plan">
        <span class="tag">Month to Month</span>
        <p class="price">$104.99<sub>/ mo</sub></p>
        <p class="plan-blurb">Full access with complete flexibility.</p>
        <ul class="plan-feats">
          <li><svg class="tick" viewBox="0 0 18 18" aria-hidden="true"><path d="M7.162 13.5 2.887 9.225l1.07-1.069 3.205 3.207 6.882-6.882 1.069 1.07z"/></svg><span>Cancel anytime, no penalties</span></li>
          <li><svg class="tick" viewBox="0 0 18 18" aria-hidden="true"><path d="M7.162 13.5 2.887 9.225l1.07-1.069 3.205 3.207 6.882-6.882 1.069 1.07z"/></svg><span>All four locations, KY and TN</span></li>
          <li><svg class="tick" viewBox="0 0 18 18" aria-hidden="true"><path d="M7.162 13.5 2.887 9.225l1.07-1.069 3.205 3.207 6.882-6.882 1.069 1.07z"/></svg><span>Everything included, no add-on fees</span></li>
        </ul>
        <button class="btn" data-modal="monthly">Get Started</button>
      </div>
    </div>
    <p class="fineprint rv">Family memberships include two members. Additional members +$40/month. Active duty military, first responders and students receive special pricing, valid ID required.</p>
  </div>
</section>

<section class="band on-light">
  <div class="band-inner">
    <p class="eyebrow rv">What You Get</p>
    <h2 class="d2 rv">Everything below is<br>in the price.</h2>
    <ul class="plain rv">
      <li><h3>The Weightlifting Floor</h3><p>Arsenal Strength, Atlantis, Hammer Strength and Rogers Athletic, plus free weights and competition platforms.</p></li>
      <li><h3>The Sauna</h3><p>Cleaned daily, no upcharge, no booking window.</p></li>
      <li><h3>Kickboxing</h3><p>Twice a week with Teryn, a former fighter and one of the owners. No extra cost.</p></li>
      <li><h3>24 Hour Access</h3><p>Your QR code is your key, from the minute you sign up.</p></li>
      <li><h3>All Four Locations</h3><p>Kentucky and Tennessee, one membership, no transfer fees.</p></li>
      <li><h3>Discounts</h3><p>Military, first responders and students, with valid ID.</p></li>
    </ul>
    <p class="small rv" style="margin-top:26px">Personal training and ready-made meals are the two things that cost extra. <a class="ulink" href="addons.html">See add-ons</a></p>
  </div>
</section>

<section class="band" id="signup">
  <div class="band-inner">
    <div class="joinnow" style="margin-top:0;padding-top:0;border-top:0">
      <div class="joinnow-copy">
        <p class="eyebrow rv">Signing Up</p>
        <h2 class="d2 rv">Join at 2am.<br>Train at 2:15.</h2>
        <p class="lede rv">Whether we are staffed or not makes no difference. Sign up from your phone at any hour, pay, and a QR code lands the moment you are done. That code is your key. Scan it at the door and get your session in the same night.</p>
      </div>
      <svg class="qr rv" viewBox="0 0 100 100" role="img" aria-label="Illustration of a scan code">
        <g fill="currentColor">
          <path d="M4 4h26v26H4V4zm6 6v14h14V10H10z"/><path d="M70 4h26v26H70V4zm6 6v14h14V10H76z"/>
          <path d="M4 70h26v26H4V70zm6 6v14h14V76H10z"/>
          <rect x="14" y="14" width="6" height="6"/><rect x="80" y="14" width="6" height="6"/>
          <rect x="14" y="80" width="6" height="6"/><rect x="38" y="4" width="6" height="6"/>
          <rect x="50" y="4" width="6" height="6"/><rect x="38" y="16" width="6" height="6"/>
          <rect x="56" y="16" width="6" height="6"/><rect x="44" y="28" width="6" height="6"/>
          <rect x="56" y="28" width="6" height="6"/><rect x="4" y="38" width="6" height="6"/>
          <rect x="16" y="38" width="6" height="6"/><rect x="38" y="38" width="6" height="6"/>
          <rect x="50" y="38" width="6" height="6"/><rect x="68" y="38" width="6" height="6"/>
          <rect x="86" y="38" width="6" height="6"/><rect x="10" y="50" width="6" height="6"/>
          <rect x="28" y="50" width="6" height="6"/><rect x="44" y="50" width="6" height="6"/>
          <rect x="62" y="50" width="6" height="6"/><rect x="80" y="50" width="6" height="6"/>
          <rect x="4" y="62" width="6" height="6"/><rect x="38" y="62" width="6" height="6"/>
          <rect x="56" y="62" width="6" height="6"/><rect x="74" y="62" width="6" height="6"/>
          <rect x="38" y="74" width="6" height="6"/><rect x="62" y="74" width="6" height="6"/>
          <rect x="86" y="74" width="6" height="6"/><rect x="44" y="86" width="6" height="6"/>
          <rect x="68" y="86" width="6" height="6"/><rect x="86" y="86" width="6" height="6"/>
        </g>
      </svg>
      <ol class="steps rv">
        <li><span class="steps-time">02:11 AM</span><h4>Sign up online</h4><p>Pick your membership and pay on your phone. No appointment, no front desk, no waiting for staffed hours to start again in the morning.</p></li>
        <li><span class="steps-time">02:13 AM</span><h4>Get your QR code</h4><p>It arrives the second you are finished. Save it to your phone and it stays your key for as long as you are a member.</p></li>
        <li><span class="steps-time">02:15 AM</span><h4>Scan in and train</h4><p>Hold it up at the door and you are through. Two in the morning on a Tuesday counts exactly the same as six in the evening.</p></li>
      </ol>
      <div class="btn-row rv" style="margin-top:clamp(30px,3.6vw,46px)"><button class="btn" data-modal="join">Sign Up Now</button></div>
    </div>
  </div>
</section>

''' + review_deck("What members say about the value.",
  "Every review below is real, left on Google by a member of the Nashville gym. All 8 of them are five stars.") + "\n\n" + faq([
  ("Is there a contract?","Month to month is $104.99 and you can cancel anytime with no penalties. The annual rate of $84.99 a month is lower because you are committing for the year."),
  ("What does the membership include?","The weightlifting floor, the sauna, kickboxing and 24 hour access, at all four Fuel Fortress locations across Kentucky and Tennessee."),
  ("What costs extra?","Two things: personal training and ready-made meals. Nothing else."),
  ("Can I use the other locations?","Yes, all four across Kentucky and Tennessee, on the same membership, with no extra fees."),
  ("Do you offer discounts?","Active duty military, first responders and students receive special pricing. Bring valid ID."),
  ("How do family memberships work?","A family membership includes two members. Additional members are $40 a month each."),
  ("Can I sign up outside staffed hours?","Yes. Sign up online at any hour and your QR code arrives immediately, so you can scan in and train the same night."),
  ("Can I try before joining?","A day pass is $25, or book a tour and we will walk you around first."),
], "Membership Questions", "Questions about joining.") + "\n\n" + cta(
  "Membership","Lock in your rate.",
  "$84.99 a month on the annual rate, at every Fuel Fortress location. Sign up in a couple of minutes and train tonight."))

PAGES["kickboxing.html"] = dict(
 title="Kickboxing in Nashville, TN | Included With Membership | Fuel Fortress",
 desc="Kickboxing at Fuel Fortress Nashville: a couple of recreational sessions a week run by Teryn, a former fighter and one of the owners. Included with every membership at no extra cost.",
 canon="kickboxing.html", ld="",
 main=page_hero("Kickboxing","Train with a<br>former fighter.",
   "Teryn is a former fighter and one of the owners of the gym. Twice a week she runs kickboxing for members: an outstanding workout on its own, and real striking instruction if you want to take it further. You do not have to be a fighter. Included with every membership.",
   "Kickboxing hero","img/kickboxing-hero.jpg") + '''

<section class="band">
  <div class="band-inner">
    <p class="eyebrow rv">Who Runs It</p>
    <h2 class="d2 rv">Teryn.</h2>
    <p class="lede rv">Teryn is one of the owners of Fuel Fortress and the general manager here in Nashville. She is a former fighter with a Muay Thai background, and she is the one holding the pads.</p>
    <p class="lede rv">That matters more than it sounds. You are learning from somebody who actually competed, not from an instructor who took a weekend certification and can only teach you the shapes. If you want technique, she can teach you technique. If you want to hit something hard for an hour and leave soaked, that works just as well.</p>
  </div>
</section>

<section class="band on-light">
  <div class="band-inner">
    <p class="eyebrow rv">Being Straight</p>
    <h2 class="d2 rv">Come for either reason.</h2>
    <div class="addons rv">
      <article class="addon">
        <span class="addon-tag">Reason one</span>
        <h3>It's an incredible workout</h3>
        <p>Rounds on the bags and the pads will do more for your conditioning than any treadmill in this building, and you get to hit something while it happens. No experience needed, nobody watching to see whether you look good doing it. Show up once a week or show up every time.</p>
      </article>
      <article class="addon">
        <span class="addon-tag">Reason two</span>
        <h3>You can actually learn to strike</h3>
        <p>Kickboxing and Muay Thai, taught properly, by someone who competed. Take it as far as you want. Plenty of members come for the workout and end up caring about their technique, which is exactly how it should go.</p>
      </article>
    </div>
    <p class="small rv" style="margin-top:26px">Included with every membership, at no extra cost. <a class="ulink" href="membership.html">See pricing</a></p>
  </div>
</section>

''' + faq([
  ("Does kickboxing cost extra?","No. It comes with your membership at no extra cost, on every plan including the day pass."),
  ("Do I need experience?","None at all. Most people who come have never thrown a punch. Teryn will show you how to hold pads and throw properly from your first session."),
  ("Do I need my own gloves?","Ask at the front desk before your first session and we will tell you what to bring."),
  ("When are the sessions?","Twice a week. Times move around, so call (615) 562-3966 or ask at the desk for this week's schedule."),
  ("Is this Muay Thai or kickboxing?","The sessions are billed as kickboxing, and Teryn's own background is Muay Thai, so you can learn either. Tell her what you are interested in."),
  ("Do you have a fight team?","No. You can learn real striking here, but we do not run a competition program. If your goal is to fight, we will happily point you to a gym that specialises in it."),
], "Kickboxing Questions", "Questions about kickboxing.") + "\n\n" + cta(
  "Kickboxing","It comes with the membership.",
  "Join the gym and the sessions are yours. Ask at the desk for this week's times."))

# ============================ EMIT ============================
def render(fn, p):
    return LAYOUT.format(title=p["title"], desc=p["desc"], canon=p["canon"],
                         ld=p.get("ld",""), nav=nav_html(fn), main=p["main"],
                         footer=FOOTER, modal=MODAL)

if __name__ == "__main__":
    for fn, p in PAGES.items():
        open(fn, "w").write(render(fn, p))
        print("wrote", fn, len(render(fn,p)), "bytes")
    urls = "".join('  <url><loc>https://fuelfortressnashville.com/%s</loc></url>\n'
                   % ("" if fn=="index.html" else fn) for fn in PAGES)
    open("sitemap.xml","w").write(
      '<?xml version="1.0" encoding="UTF-8"?>\n'
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n%s</urlset>\n' % urls)
    print("wrote sitemap.xml")

def make_preview(path):
    """One artifact that routes between the six real pages, for review only."""
    import re as _re
    css = open("style.css").read(); js = open("app.js").read()
    tpls, first = [], None
    for fn in PAGES:
        html = render(fn, PAGES[fn])
        main = html.split("<main>",1)[1].split("</main>",1)[0]
        if first is None: first = fn
        tpls.append('<template data-page="%s">%s</template>' % (fn, main))
    nav = "\n".join('    <a href="%s" data-route="%s">%s</a>' % (h,h,t) for h,t in NAV)
    return '''<title>Fuel Fortress Nashville</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet">
<style>
%s
.pvw{position:fixed;left:50%%;bottom:14px;transform:translateX(-50%%);z-index:120;
  background:var(--band-alt);border:1px solid var(--rule);padding:7px 14px;
  font:500 9.5px/1 var(--body);letter-spacing:.18em;text-transform:uppercase;color:var(--text-dim)}
</style>

<div class="trail" id="trail" aria-hidden="true"></div>

<header class="hdr" id="hdr">
  <a class="brand" href="index.html" data-route="index.html">Fuel Fortress <span>Nashville</span></a>
  <button class="navtoggle" id="navtoggle" aria-expanded="false" aria-controls="nav">Menu</button>
  <nav class="nav" id="nav">
%s
  </nav>
  <a class="btn btn-call" href="tel:+16155623966">Call Now</a>
</header>

<main id="app"></main>
%s
%s
%s
<div class="pvw">Preview of 6 separate pages</div>

<script>
%s
</script>
<script>
(function () {
  var app = document.getElementById('app');
  var tpls = {};
  document.querySelectorAll('template[data-page]').forEach(function (t) {
    tpls[t.getAttribute('data-page')] = t.innerHTML;
  });
  function go(page, push) {
    if (!tpls[page]) page = 'index.html';
    app.innerHTML = tpls[page];
    document.querySelectorAll('.nav a').forEach(function (a) {
      a.classList.toggle('is-here', a.getAttribute('data-route') === page);
    });
    if (push) location.hash = page;
    window.scrollTo(0, 0);
    document.dispatchEvent(new CustomEvent('ff:page'));
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href]');
    if (!a) return;
    var href = a.getAttribute('href');
    if (!href || /^(https?:|tel:|mailto:|#)/.test(href)) return;
    var page = href.split('#')[0];
    if (!tpls[page]) return;
    e.preventDefault();
    go(page, true);
    var frag = href.split('#')[1];
    if (frag) { var el = document.getElementById(frag); if (el) el.scrollIntoView(); }
    var nav = document.getElementById('nav');
    if (nav) nav.classList.remove('is-open');
  });
  window.addEventListener('hashchange', function () { go(location.hash.slice(1), false); });
  go(location.hash.slice(1) || 'index.html', false);
})();
</script>
''' % (css, nav, "\n".join(tpls), FOOTER, MODAL, js)

if __name__ == "__main__":
    import sys
    out = os.environ.get("PREVIEW_OUT")
    if out:
        open(out,"w").write(make_preview(out))
        print("wrote preview", out)
