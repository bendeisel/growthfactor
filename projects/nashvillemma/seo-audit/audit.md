# Nashville MMA: SEO, Local, AEO and GEO Audit

Growth Factor AI

---

Nashville MMA SEO Audit

GROWTH FACTOR AI

nashvillemma.com 3 Sep 2026 Rev A

# THE BLOG ISN'T  
YOUR PROBLEM.

Full audit of nashvillemma.com across search, local, answer engines and AI retrieval. Plus the answer on those blog backlinks, and how to cut over to a new site without giving up a single ranking.

**Technical SEO****Local****AEO****GEO****Migration plan**

The verdict

## You are competing against yourself, roughly 80 times over.

Every program on the site is published at two different addresses, then multiplied again by three city names, and the city versions do not even change their own titles. That is around **84 near-identical URLs doing the work of 14**. It is a far bigger drag on rankings than anything on the blog.

Killing the blog is safe. Killing the blog **URLs** is not, and you never have to. A 301 to a relevant live page keeps the link equity. The redirect map is in section 05.

~84

Program URLs live

14

Programs that exist

4.9

Google rating

483

Google reviews

01  /  Method and limits

## What I could verify, and what I could not

Read this before you action anything

This session's network policy blocked direct access to nashvillemma.com, to web.archive.org and to every third-party host. I could not crawl the site, so I could not read the HTML, the robots.txt, the sitemap, the canonical tags, the existing schema or Core Web Vitals.

Everything below is built from Google's own index (live titles, live URLs, live descriptions), from the review platforms, and from the brand kernel we already extracted off the client's 97Display build. That turned out to be enough to find the structural problems, because the URL patterns and the title tags _are_ the evidence. Findings marked Verify need a crawl before you quote work on them.

Two things follow from that. First, the URL and title findings are solid: those strings came out of the live index, not from inference. Second, get me these five exports and the audit closes completely, including the exact backlink list:

Source| Export| What it settles  
---|---|---  
Search Console| Links > Top linked pages| Google's own view of which pages hold links. This is the view that decides equity.  
Search Console| Pages > all indexed, 16 mo| The real indexed inventory, including URLs I could not surface.  
Ahrefs or Semrush| Referring pages, filter /blog/| The definitive per-post backlink list. Sort by referring domains.  
GA4| Landing pages, 16 mo| Which posts actually earn sessions and trials. Kill the rest without ceremony.  
Screaming Frog| Full crawl, JS rendering on| Status codes, canonicals, existing schema, thin pages, CWV.  
  
02  /  Technical SEO

## Four structural faults, in priority order

CriticalSEO-01

### EVERY PROGRAM IS PUBLISHED TWICE, UNDER /CLASSES AND /SERVICES

Evidence, live in the index

classes  and  /services  -> both titled "Martial Arts & Fitness Classes - Nashville MMA Training Camp" classes/Mixed-Martial-Arts-Competition-Team services/Mixed-Martial-Arts-Competition-Team services/Muay-Thai

Why it costs you

Two URLs holding the same content compete for the same query. Internal links split between them, any external links split between them, and Google picks the winner instead of you. Identical title tags on two hub pages is the clearest possible signal that neither is the canonical one.

Fix

Pick `/classes` and 301 the whole `/services` tree onto it. "Classes" matches how people actually search. Do this at the server, one rule, not page by page.

CriticalSEO-02

### CITY URLS ARE DOORWAY PAGES, AND THEY DO NOT EVEN SWAP THEIR OWN TITLES

Evidence, live in the index

classes/Mixed-Martial-Arts/Nashville classes/Mixed-Martial-Arts/Antioch  -> titled "_Nashville_ Mixed Martial Arts ... _Nashville, Tennessee_ " classes/Brazilian-Jiu-Jitsu/Hermitage classes/Kids-Brazilian-Jiu-Jitsu-/Hermitage  -> titled "_Nashville_ Kids Brazilian Jiu Jitsu ... _Nashville, Tennessee_ "

Why it costs you

The city is in the URL and nowhere else. The Antioch page says Nashville in its title, so it cannot rank for Antioch anyway, and it is a duplicate of the Nashville page in Google's eyes. This is the scaled-content and doorway pattern Google names by name in its spam policies. Best case these get ignored and burn crawl budget. Worst case they drag a quality signal across the whole domain.

Fix

Delete the city dimension. One page per program, no exceptions. Antioch and Hermitage get served by the Business Profile service area, by one strong location page that names real neighborhoods and drive times, and by reviews from people who live there. Not by URL permutations.

CriticalSEO-03

### THE HOMEPAGE SERVES DIFFERENT PAGES OFF A QUERY PARAMETER

Evidence, live in the index

?p=38  -> titled "Nashville Jiu Jitsu - Nashville MMA - Nashville, Tennessee" Blog/?p=42  -> blog pagination on a capitalised path

Why it costs you

A parameter on the root that changes the content is a duplicate factory and a crawl trap. It also means the homepage's authority, your strongest page, is being split across parameter variants of itself.

Fix

No parameter routing on the new build. Clean static paths only. 301 the known parameter URLs to their real destinations and strip the rest at the server.

CriticalSEO-04

### URL CASE IS INCONSISTENT, SO PAGES EXIST TWICE BY ACCIDENT

Evidence, live in the index

Contact  /Event  /FAQ  /Instructors  /Home/Reviews  /Home/Schedule  -> capitalised classes  /services  /blog  /reviews  -> lowercase reviews  _and_   /Home/Reviews  -> same content, both indexed blog  _and_   /Blog/?p=42  -> same section, both indexed

Why it costs you

URLs are case sensitive to search engines even when the server is not. `/Blog` and `/blog` are two different pages as far as Google is concerned, and the legacy `/Home/` prefix duplicates pages that already exist at a clean path.

Fix

Lowercase every path on the new build and pick one trailing-slash convention. Enumerate the capitalised legacy paths explicitly in the redirect file. Do not try to force lowercase with a RewriteMap on shared hosting, it is unreliable there and there are only about twenty of them.

ModerateSEO-05

### A TRAILING-WHITESPACE BUG HAS LEAKED INTO SLUGS AND TITLES SITE-WIDE

Evidence, live in the index

classes/Kids-Muay-Thai-Kickboxing**-** classes/Kids-Brazilian-Jiu-Jitsu**-** /Hermitage Instructors/Ronnie-Lawrence**-**  -> titled "Ronnie Lawrence**,** Fitness and Martial Arts Instructor" blog/113132/Facility-Walkthrough**-**

Why it costs you

Someone typed a trailing space into the CMS name field and it flowed into both the slug and the title tag. It looks unmaintained in the results page, and it means the obvious version of each URL is a near-miss that anyone linking to you will get wrong.

Fix

Trim on migration. These specific URLs go in the redirect map, since they are indexed and may hold links.

ModerateSEO-06

### TITLE TAGS BURN THEIR BEST 60 CHARACTERS SAYING NASHVILLE THREE TIMES

Evidence, live in the index

"Nashville Mixed Martial Arts - Nashville MMA - Nashville, Tennessee" "Nashville Kids Martial Arts - Nashville MMA Training Camp - Nashville, Tennessee"

Why it costs you

The template repeats the city up to three times, pushes the differentiating word to the front and then truncates. It reads as stuffing to a person scanning results and to a model summarising them.

Fix

One pattern, one city mention: `{Program} in Nashville | Nashville MMA Training Camp`. Write the meta description as a reason to click, not a keyword list.

03  /  Local

## The review profile is the best asset here. One listing is actively hurting it.

CriticalLOC-01

### A DUPLICATE YELP LISTING AT YOUR ADDRESS IS MARKED CLOSED

Evidence

Yelp carries two records at 1504 Elm Hill Pike: the live "Nashville MMA Training Camp" with 22 reviews, and a second one titled "**TRAINING CAMP - CLOSED** " with 11 reviews stranded on it.

Why it costs you

A listing that says CLOSED at your street address is the worst citation you can own. It contradicts your NAP, it buries 11 reviews, and answer engines that read Yelp will repeat the word closed to someone asking whether you are open.

Fix

Claim both records and file a merge with Yelp support this week. Then run a full citation sweep for the same duplicate on Apple Maps, Bing Places, Tripadvisor and the niche directories.

ModerateLOC-02

### HOURS AND CLASS COUNT DISAGREE DEPENDING ON WHERE YOU LOOK

Evidence

Sources split on the weekend: one shows Saturday and Sunday 8am to 2pm, another shows Saturday only. Program pages state "80+ weekly classes" while the approved brand figure on our side is "90+ classes".

Why it costs you

Local ranking and AI answers both lean on agreement across sources. Conflicting hours is a direct negative signal, and two different class counts makes the whole site look stale.

Fix

Confirm one set of hours and one figure with the front desk, then push it to the site, the Business Profile, Yelp, Facebook, Instagram, Apple Maps and Bing on the same day. Put hours in `openingHoursSpecification` schema so it is machine readable.

ProtectLOC-03

### 483 REVIEWS AT 4.9 IS THE MOAT. IT IS ALSO NOT ON THE WEBSITE.

Why it matters

No competitor in Nashville is catching that review profile quickly, and it is the single strongest thing driving your local pack position. But reviews are sitting in Google while the program pages carry none of them.

Fix

Pull real reviews onto the matching program page, with the reviewer's first name and the class they mention. Do not put `AggregateRating` schema on pages without genuine on-page reviews, that is the self-serving markup Google strips rich results for. Through the migration, keep the NAP byte identical and update the Business Profile website link on launch day.

04  /  AEO and GEO

## You are already in the AI answer set. You are not the one shaping it.

CriticalGEO-01

### AGGREGATORS ARE ANSWERING "BEST MMA GYM IN NASHVILLE" FOR YOU

Evidence

For that query the pages that surface are Yelp category pages, statspros.com/best-mma-gyms-in-nashville-tn, westrive.com/gym/nashville-mma, boxinggyms.net, bjjmetrics.com and Tapology gym 1244. Your own pages rank, but the list-shaped answer gets assembled from theirs.

Why it costs you

When someone asks an assistant for the best gym in Nashville, it retrieves the pages that are already shaped like that answer: listicles, directories and Reddit. Your competitors Bonafyde, SwiftKick, Phoenix and Pedigo appear inside those same lists. And one of your own profiles currently says a version of the business is closed.

Fix

Treat those eight profiles as owned properties. Claim each one, correct the NAP, add the coach roster and the real class count, link to the new site. Getting your entry on the listicles that already rank moves more AI answers than another blog post ever will.

CriticalGEO-02

### THE COACH ROSTER IS YOUR HARDEST-TO-COPY ASSET AND IT IS UNSTRUCTURED

Evidence

Instructor pages exist at `/Instructors/{Name}` for Kevin Patterson, Rashad Lockhart, Ronnie Lawrence, Sammy Shires and Monty Burks, and the fight team lists Dustin Ortiz as head coach, Brian Tidwell on grappling, Tim Semisch on strength. Real credentials, real records, verifiable elsewhere.

Why it costs you

Language models cite pages that tie named people to credentials they can verify against another source. A former UFC flyweight as head coach is exactly that kind of fact. Right now those pages carry no `Person` markup, no `sameAs` links to Tapology or Sherdog or Instagram, and no link from the coach to the program they teach. Nothing connects the entity.

Fix

`Person` schema per coach with `sameAs` pointing at Tapology, Sherdog and their Instagram. Rank, belt, record and years coaching as visible on-page text, not just prose. Cross-link each coach to the classes they run and each class back to its coaches. This is how you get named when someone asks who the best BJJ coaches in Nashville are.

ModerateAEO-01

### ALL THE ANSWERS LIVE ON ONE FAQ PAGE INSTEAD OF WHERE THE QUESTIONS GET ASKED

Evidence

`/FAQ` exists and it is decent. It covers the trial, the month-to-month terms, the 28 day cancellation, the recovery room, rental gear and the military and first responder discounts. All of that is centralised on one URL.

Why it costs you

Answer engines lift the answer sitting next to the relevant content. A single FAQ page can win "nashville mma faq" and almost nothing else. The kids BJJ page should be the thing that answers what age can my kid start.

Fix

Move three to five real questions onto every program page with `FAQPage` markup on each. Keep the hub as an index. Answer in the first 40 words, then expand, because that first block is what gets quoted.

ModerateAEO-02 Verify

### NO SIGN OF STRUCTURED DATA BEYOND THE PLATFORM DEFAULT

Evidence, and its limits

I could not read the markup, so this needs a crawl to confirm. What I can say: none of these URLs surface a rich result in the index, and the 97Display Ultimate theme does not ship program-level, instructor-level or per-page FAQ markup.

Fix, the full set for the new build

  * `SportsActivityLocation` on the location page. It is the correct type and it is more specific than `LocalBusiness`, including `openingHoursSpecification`, `geo` and `hasMap`.
  * `Course` plus `Offer` on every program page, with the real age range and skill level.
  * `Person` on every coach page, with `sameAs`.
  * `FAQPage` per page, not just on the hub.
  * `BreadcrumbList` site-wide, and `Organization` with `sameAs` to the eight real profiles.
  * `VideoObject` if the hero video and the facility walkthrough stay.

ModerateAEO-03

### EVERY AI ANSWER ABOUT YOUR PRICING SAYS "CONTACT THEM"

Evidence

Pricing is published nowhere. The answer that comes back is that memberships depend on how often you train and you should call the front desk.

Why it costs you

Not publishing pricing is a legitimate sales call and I am not going to argue you out of it. But understand the trade: cost is the first thing people ask, and the gym that publishes a range gets cited in the answer while you get skipped. You are buying phone-call control with retrieval visibility.

Fix, if you want the middle path

Publish a starting-from figure and what is included, keep the exact tiers behind the conversation. It gets you into the answer set without giving up the close. Your call, it is a business decision, not an SEO one.

05  /  The blog question

## Drop the content. Never drop the URLs.

Three things get bundled together as "the blog" and they carry completely different risk. Separate them and the decision gets easy.

What it is| Risk if you drop it| Call  
---|---|---  
**The content.** The words in the posts. | Low. Local rankings run on the Business Profile, reviews, proximity and program pages. Stale posts contribute close to nothing here. | Drop it  
**The URLs.** The addresses other sites point at. | High, and entirely avoidable. A 404 throws away every link pointing at it. A 301 to a relevant live page keeps essentially all of it. | Keep as 301s  
**The rankings.** Terms a few posts hold today. | Moderate on two posts specifically. Both have commercial intent and may be holding terms you actually want. | Fold in, then 301  
  
So the direct answer to your question: **yes, those backlinks matter, and no, you do not lose them.** You lose link equity by letting a URL 404, not by unpublishing the article behind it. Redirect it and the equity moves to whatever you point it at.

The one thing that genuinely does damage sites in a replatform is the lazy version of this: bulk-redirecting every old URL to the homepage. Google reads an irrelevant blanket redirect as a soft 404 and drops the equity anyway. Relevance of the target is the whole game. Which is why the map below is hand-picked rather than a wildcard.

Starting redirect map, built from the posts I could surface

Old URL| 301 target| Reasoning  
---|---|---  
/blog/59198/Brazilian-Jiu-Jitsu-and-Muay-Thai-Classes-in-Nashville | /classes | Commercial intent, spans two programs. Highest priority to check for links. Fold the substance into the hub.  
/blog/83721/Women-s-Only-Classes | /classes/womens-program | Direct program match. This one becomes a real page in the new build, so the redirect is an upgrade.  
/blog/110798/How-Martial-Arts-Benefits-Kids-Beyond-Traditional-Sports | /classes/kids-martial-arts | Direct match. Parent-intent content, worth keeping the argument on the program page itself.  
/blog/113132/Facility-Walkthrough- | /facility | Direct match. Note the trailing hyphen, redirect both spellings.  
/blog/150948/Beginning-your-championship-journey-in-Jiu-Jitsu | /classes/brazilian-jiu-jitsu | Closest program. Competition angle could point at /classes/fight-team instead if the post leans that way.  
/blog, /Blog, /Blog/?p=* | /classes | Index and pagination. Point at /resources instead if you keep the evergreen set.  
/blog/* (unmapped, zero links, zero traffic) | /classes | Last resort only. Any post with even one referring domain gets a hand-picked target instead.  
  
Two rules for finishing this map

Post IDs run from 59198 to at least 150948, so there are more posts than the five I could surface. The Ahrefs referring-pages export filtered to `/blog/` is what completes it. **Every post with a referring domain gets a target chosen by hand.** Never bulk-redirect a linked post.

Then keep five to eight evergreen answers as permanent pages under `/resources`, or fold them into the program FAQs. That keeps the answer-engine value the blog was theoretically providing, with none of the maintenance. You are retiring a format, not the content strategy.

06  /  Target architecture

## 84 URLs collapse into 18 real pages

Fourteen programs, confirmed against the program artwork in the design set. One page each, lowercase, no city suffix, no second prefix. This is the spine the redirect map points into, so it gets signed off before anything gets built.

New URL| Replaces| Job  
---|---|---  
/| / and /?p=*| Position, proof, trial CTA  
/classes| /classes, /services| Hub, links all 14  
/classes/mixed-martial-arts| 4 URLs across both prefixes and 3 cities| Program  
/classes/brazilian-jiu-jitsu| 4+ URLs| Program, highest volume term  
/classes/muay-thai| /services/Muay-Thai and city variants| Program  
/classes/boxing| city variants| Program  
/classes/wrestling| city variants| Program  
/classes/self-defense| city variants| Program  
/classes/womens-program| /blog/83721| Program, new page  
/classes/fitness| /classes/Fitness-Classes/| Program  
/classes/sports-performance| new| Program  
/classes/personal-training| new| Program  
/classes/kids-martial-arts| /classes/Kids-Martial-Arts + variants| Program, parent intent  
/classes/kids-brazilian-jiu-jitsu| /classes/Kids-Brazilian-Jiu-Jitsu-/*| Program  
/classes/kids-kickboxing| /classes/Kids-Kickboxing, /Kids-Muay-Thai-Kickboxing-| Program, merges two  
/classes/fight-team| /classes/ and /services/Mixed-Martial-Arts-Competition-Team| Program, GEO anchor  
/schedule| /Home/Schedule| 90+ classes, filterable  
/instructors, /instructors/{name}| /Instructors/*| Person schema, GEO anchor  
/facility| /blog/113132| 30K sqft proof  
/reviews| /reviews, /Home/Reviews| 483 reviews surfaced  
/faq| /FAQ| Index, answers live on programs  
/contact| /Contact| NAP, map, hours schema  
/free-trial| new| Single conversion target  
  
`/Event` stays or goes depending on whether events are actually being maintained. An empty events page is worse than none.

07  /  Launch strategy

## Seven phases. The order is the whole point.

0

### BASELINE AND INVENTORY

Before a single page gets built

  * Pull the five exports in section 01 and dedupe them into one master URL list. That list is the spine of the migration.
  * Snapshot current rankings for the 30 terms you care about, so the post-launch conversation runs on data instead of nerves.
  * Archive the old site's HTML. When you find in month two that a paragraph got dropped, you will want the original.
  * Screenshot the Business Profile insights and the current review count.

1

### SIGN OFF THE ARCHITECTURE

Before design goes to build

  * Approve the 18-page spine in section 06. Changing a URL after the redirect map is written means writing it twice.
  * Confirm one set of hours and one class figure. The site says 80+, the approved figure is 90+. Pick.
  * Decide the pricing question in AEO-03 now, because it changes whether /free-trial or /pricing is the conversion target.

2

### WRITE THE REDIRECT MAP

In parallel with the build, not after it

  * One row per old URL: old, new, reason. Every URL with a link, a session or a ranking gets a hand-picked 1:1 target.
  * Rule-level redirects for the patterns, explicit rows for the legacy capitalised paths and the trailing-hyphen slugs.
  * 301 permanent, never 302, never a meta refresh, never JavaScript. Server level, in `.htaccess`, since Hostinger's LiteSpeed reads it.
  * No redirect chains. Old URL to final URL in one hop. Chains leak equity and burn crawl budget.

    
    
    # Collapse the duplicate prefix
    RewriteRule ^services/?$            /classes [R=301,L]
    RewriteRule ^services/(.*)$         /classes/$1 [R=301,L]
    
    # Strip the city doorway suffix
    RewriteRule ^classes/([^/]+)/(Nashville|Antioch|Hermitage)/?$ /classes/$1 [R=301,L,NC]
    
    # Legacy MVC paths
    RewriteRule ^Home/Reviews/?$        /reviews  [R=301,L,NC]
    RewriteRule ^Home/Schedule/?$       /schedule [R=301,L,NC]
    
    # Kill parameter routing on the root
    RewriteCond %{QUERY_STRING} ^p=\d+$
    RewriteRule ^$                      /? [R=301,L]
    
    # Per-post, one line each, from the Ahrefs export
    Redirect 301 /blog/83721/Women-s-Only-Classes /classes/womens-program

3

### BUILD AND STAGE

Build window

  * Staging goes behind HTTP auth _and_ `noindex`. Staging sites leaking into the index is the most common own-goal in this whole process.
  * Schema in as you build, not bolted on later. The full set is in AEO-02.
  * Copy stays frozen at 99% per the standing client instruction. Anything you want reworded gets listed at handover instead of changed.

4

### PRE-LAUNCH QA

The week before cutover

  * Crawl staging. Zero 404s, zero chains, one canonical per page, no stray `noindex`.
  * Validate every schema block. Rich Results Test plus the Schema.org validator.
  * Core Web Vitals on mobile, on a real throttled connection, not a desktop lab score.
  * Test the redirect map against the master list. A spreadsheet of 300 rows is worth nothing until you have actually resolved them.
  * Confirm the popup lead form fires from every request CTA, per the standing instruction, and that submissions land somewhere a human checks.
  * Remove the staging `noindex`. Write it on a sticky note. This is the single most common launch-day failure.

5

### CUTOVER

Tuesday or Wednesday morning. Never a Friday.

  * Same domain, so no change of address in Search Console and no domain authority reset. Do not change the domain and the platform in the same month.
  * Redirects go live in the same deploy as the new site, not an hour later.
  * Update the Business Profile website link, then Yelp, Facebook, Instagram, Tapology, BJJMetrics, Tripadvisor, boxinggyms.net and westrive. 
  * Submit the new sitemap, request indexing on the top 20 pages by hand.
  * Do not cut over inside a promo push or two weeks before a seasonal enrolment spike.

6

### FIRST 48 HOURS, THEN 8 WEEKS

Post-launch

  * Hour one: crawl the live site. Check the redirects resolve, the forms submit, analytics fires, and nothing is `noindex`.
  * Day one and two: watch Search Console crawl errors and server logs for 404s from real referrers. Patch as they appear.
  * Weeks one to six: expect a wobble. Rankings move around while Google recrawls and reconsolidates. **Change nothing in week one based on rank noise.**
  * Week two: confirm the old URLs are dropping out of the index and the new ones are entering. That is the signal the consolidation is landing.
  * Week four: pull the Links report again and confirm the redirected equity is showing up against the new URLs.
  * Week eight: compare against the section-0 baseline. Consolidating 84 near-duplicates into 18 real pages should read as a gain by then, not a recovery.

08  /  Honest expectations

## What this does and does not do

A short dip in the first two to six weeks is normal on any replatform and is not evidence of a mistake. The thing that protects you is the redirect map, and the map is only as good as the Ahrefs and Search Console exports feeding it. That is the one place not to cut corners.

What actually moves the needle here, in order: fixing the duplicate URL architecture, merging the closed Yelp listing, getting the coach roster structured, and putting answers on the pages where the questions get asked. The blog is not on that list, which is why dropping it is the easy call.

Under-promise, over-deliver: I am not going to tell you the rebuild alone wins the local pack. You already hold the review moat that decides that. The rebuild stops the site from wasting it.

Growth Factor AI  /  Automate Everything

Nashville MMA Training Camp  /  Rev A  /  3 Sep 2026
