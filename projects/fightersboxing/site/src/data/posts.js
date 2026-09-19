// BLOG POSTS
//
// HAND-AUTHORED. Do NOT run source/build_posts.py against this file any
// more: that script regenerates posts.js from the 2026-08-26 WordPress
// export and would wipe everything below. It is kept only as the record of
// the original port, and now refuses to run without --force.
//
// Rebuilt 2026-09-19 (Ben round 11) as SEO content. Two standing
// instructions drove it:
//
//   1. Christy Halbert's name comes off the blog. Every one of the 10
//      ported posts ended with the same blockquote bio of her, and the
//      Falco post was built almost entirely out of her quotes. She is
//      still on the site (Coaches, Our Gyms); she is not on the blog.
//   2. The posts answer what people actually search, in blog form. Not a
//      second FAQ page: these read like articles, and each one owns one
//      query and links to the page that sells the thing.
//
// Provenance change, logged in source/copy.md: the ported posts were the
// client's verbatim WordPress copy. These are original copy written for
// Growth Factor, which is a deliberate departure from this project's
// copy-verbatim lock, made on Ben's instruction.
//
// URL policy. All 8 evergreen slugs are unchanged, so every existing
// backlink still resolves. The 2 that could not carry evergreen content
// honestly are 301'd in site/public/.htaccess:
//   /billy-falco-named-interim-head-coach-of-fighters-boxing-gym/ -> /coaches/
//   /jake-paul-vs-mike-tyson/ -> /5-steps-to-start-boxing-at-any-age/
//
// HARD RULES when editing:
//   - No em dash, anywhere (root CLAUDE.md).
//   - No price, no class size, no win record, no invented statistic. The
//     gym has never given us rates. Posts route cost questions to the
//     phone and the form instead of guessing.
//   - No named coach and no personal byline. Author is the organisation.
//   - Every claim traceable to site data (schedule.js, classes.js,
//     faqs.js) or to the client's own published copy.

export const posts = [
  {
    slug: 'how-much-do-boxing-classes-cost',
    title: 'What Do Boxing Classes Cost in Nashville?',
    date: '2026-09-19',
    dek: 'What actually sets the price of boxing training in Nashville, and the four questions worth asking before you hand over a card.',
    body: `
<p>Boxing is one of the cheaper ways to get seriously good at something. There is no court to rent, no greens fee, no equipment list that runs into four figures. What you pay for is coaching time and a room with the right things in it.</p>
<p>That said, "what does it cost" has no single answer, at this gym or any other, because you are not all buying the same thing.</p>

<h2>Why nobody can quote you one number</h2>
<p>Three different people walk into a boxing gym and want three different products.</p>
<ul>
<li><strong>Open gym</strong> is access. You let yourself in, you work the bag, you leave. Cheapest thing on any gym's list because no coach is assigned to you.</li>
<li><strong>Classes</strong> are coached group sessions on a fixed schedule. A coach is in the room running you through the work.</li>
<li><strong>Competition team</strong> is a coached pathway toward actually fighting, with a coach tracking your progress toward a bout.</li>
</ul>
<p>Quoting you an open gym rate when you want coached classes is how people end up annoyed on day one. So call and say which of the three you want. You get a straight number instead of a range that turns out not to apply to you.</p>

<h2>Four questions worth asking any boxing gym</h2>
<p>These separate a real answer from a sales script, and they work on us as well as on anyone else in town.</p>
<ol>
<li><strong>What is included, and what is extra?</strong> Some gyms price classes and open gym separately. Some bundle them. Neither is wrong, but you cannot compare two gyms until you know which one you are looking at.</li>
<li><strong>Am I locked in?</strong> Ask the contract length out loud before you sign. A gym that is comfortable with the answer will tell you plainly.</li>
<li><strong>What do I have to buy?</strong> Gear costs are real and they are separate from training. Ask what you need on day one versus what can wait, because the honest answer is usually "less than you think".</li>
<li><strong>Can I see the place first?</strong> Any gym worth training at will say yes.</li>
</ol>

<h2>What gear actually costs you</h2>
<p>Hand wraps are the only thing worth buying before your first class, and they are the cheapest item in the sport. Gloves can wait until you know you are staying, and when you do buy, your coach will tell you what size fits you and the work you are doing. More on that in <a href="/boxing-gear-for-beginners/">what beginners actually need to buy</a>.</p>
<p>Anyone pushing a full kit on a first visit is selling gear, not coaching.</p>

<h2>Cheap, expensive, and worth it are three different things</h2>
<p>The real cost of a gym is the sessions you paid for and did not attend. A cheap membership at a gym 30 minutes the wrong way down I-40 costs more per session than a slightly pricier one you can reach on the way home, because you will actually go to the second one.</p>
<p>Before you compare prices, compare schedules. Ours is on the <a href="/schedule/">schedule page</a> with every class time on it. Find the sessions you could genuinely make three weeks in a row. Then talk money.</p>

<h2>Get the number</h2>
<p>Call <a href="tel:6292892988">629-289-2988</a> or send the form and say which program you are asking about. You get current rates for that program and a straight description of what a first visit looks like.</p>
<p>Fighters Boxing Gym is at 405 42nd Ave N, in the Charlotte Avenue corridor between Sylvan Park and The Nations.</p>
`,
  },
  {
    slug: 'do-you-have-to-spar-in-boxing',
    title: 'Do You Have to Spar in Boxing? No.',
    date: '2026-09-18',
    dek: 'The single biggest reason people never try boxing is the fear of getting punched. Here is what sparring is, who does it, and how to train without it.',
    body: `
<p>No. You do not have to spar, and most people training at a boxing gym on any given evening are not sparring.</p>
<p>This is the question that stops more people from walking in than any other, so it is worth answering properly rather than reassuringly.</p>

<h2>What sparring actually is</h2>
<p>Sparring is controlled practice against a live partner, with headgear, heavy gloves, a coach watching, and an agreed intensity. It is not a fight. It is not two people trying to hurt each other to see who wins. The point is to practise timing and distance against someone who moves, because a heavy bag does not move.</p>
<p>It is a training tool for people whose skills have reached the point where it teaches them something. Used on a beginner, it teaches panic.</p>

<h2>Who spars and who does not</h2>
<p>At this gym, sparring sits with the <a href="/competition-team-training/">competition team</a>, and that class requires a coach's permission to join. That permission requirement is the filter. Nobody drifts into sparring by accident, and nobody gets waved into it on week two to see how they do.</p>
<p>If you come to <a href="/beginners-boxing-class/">Boxing Basics</a>, you are learning stance, footwork, punches and defence. You will hit pads and bags. You will not be put in front of someone throwing back at you.</p>

<h2>You can train boxing for years and never spar</h2>
<p>Plenty of people do, and they get genuinely good. The skills that make boxing worth doing, the footwork, the conditioning, the coordination, the ability to stay calm while your heart rate is high, all come from the training, not from being hit.</p>
<p>If what you want is to be fit, learn a real skill and hit something hard three times a week, the entire sport is available to you without ever sparring a round. See <a href="/make-non-contact-boxing-more-fun/">non-contact boxing</a> for what that looks like week to week.</p>

<h2>If you do want to spar eventually</h2>
<p>Then the path runs through the coaches, not around them. You build the fundamentals in Boxing Basics, you move up to <a href="/intermediate-boxing-class/">Intermediate Boxing</a> when a coach says you are ready, and sparring comes when your defence is good enough that the round teaches you something.</p>
<p>That order is not gatekeeping. Sparring before your defence works is just getting hit while learning nothing.</p>

<h2>What to say on your first visit</h2>
<p>Tell the coach, out loud, that you are not looking to spar. It is a normal thing to say and they hear it constantly. Nothing about the session changes except that you now know you said it.</p>
<p>Come see the room first if that helps. Open gym runs weekday mornings and afternoons, and the <a href="/schedule/">full schedule</a> lists every session. Call <a href="tel:6292892988">629-289-2988</a> or send the form.</p>
`,
  },
  {
    slug: 'what-age-can-kids-start-boxing',
    title: 'What Age Can Kids Start Boxing?',
    date: '2026-09-17',
    dek: 'What age youth boxing starts, whether kids get hit, and what the sport teaches an 8 year old besides how to throw a punch.',
    body: `
<p>Youth boxing at Fighters starts at <strong>age 8</strong>, and the youth class runs for ages 8 to 13. That is the answer. The rest of this is what parents actually want to know underneath the question.</p>

<h2>Will my kid get hit?</h2>
<p>Not in the youth class. Youth boxing here is skill work: stance, footwork, punching mechanics, defence, conditioning, and a lot of repetition on pads and bags. It is a coached class, not a room where children are matched against each other.</p>
<p>Competitive boxing exists as a pathway for older kids who want it and whose coaches think they are ready, and it is a deliberate decision made with the family. It is not the default and it is not where anybody starts.</p>

<h2>Is boxing safe for children?</h2>
<p>Non-contact youth boxing is a conditioning and coordination sport. The risk profile of a child hitting a bag under supervision is not the risk profile of a child in a contact bout, and treating those two as the same thing is the mistake most of the internet makes on this topic.</p>
<p>What makes any youth sport safe is the coaching. Ask who is running the class, what their certification is, and what the ratio looks like. Ask us that. Ask every gym that.</p>

<h2>What it actually teaches an 8 year old</h2>
<p>The punching is the hook. The reason the sport works on kids is everything around it.</p>
<ul>
<li><strong>Composure.</strong> Boxing is done tired, on a clock, with someone watching. Learning to think while your heart rate is high is a skill that transfers to every hard thing a child will do later.</li>
<li><strong>Coordination.</strong> Boxing is a whole-body skill: feet, hips, shoulders and hands in the right order. Kids who box tend to pick up other sports faster.</li>
<li><strong>Being bad at something on purpose.</strong> Nobody is good at boxing in week one. A child who learns that effort closes that gap has learned the thing the sport is actually for.</li>
<li><strong>Respect for the person in front of you.</strong> The sport does not work without it.</li>
</ul>
<p>Parents of quiet kids and parents of loud kids both show up here for the same reason, which is that the sport tends to move children toward the middle.</p>

<h2>Does my kid need to be athletic first?</h2>
<p>No, and the ones who are not athletic yet are often the ones the sport does the most for. There is no bench, no cut and no sitting out because a better kid plays that position. Everybody works every round.</p>

<h2>When the class runs</h2>
<p>Youth Boxing runs <strong>Monday and Wednesday at 4:30 PM</strong>, ages 8 to 13. The <a href="/schedule/">schedule page</a> has the full week including the adult classes, if you are thinking about training while they do.</p>
<p>Full details on the <a href="/youth-boxing-class/">youth boxing page</a>. To ask about your specific kid, call <a href="tel:6292892988">629-289-2988</a> or send the form. Come watch a class before you commit. Most parents do.</p>
`,
  },
  {
    slug: 'real-boxing-gym-vs-fitness-boxing',
    title: 'Real Boxing Gym or Fitness Class?',
    date: '2026-09-16',
    dek: 'Boutique fitness studios and actual boxing gyms sell similar-sounding classes. Six tells that show you which one you are standing in.',
    body: `
<p>A lot of places in Nashville will sell you something called a boxing class. Some of them are boxing. Some of them are a cardio class with gloves on. Both are legitimate products and you should know which one you are buying.</p>
<p>Here is how to tell, ideally before the card comes out.</p>

<h2>1. Does anyone correct your technique?</h2>
<p>This is the whole test, and everything below is a version of it. In a boxing gym, a coach stops you and fixes your stance. In a fitness class, an instructor counts you through a round from the front of the room and never touches your feet.</p>
<p>Neither is lazy. They are different jobs. But only one of them makes you a boxer.</p>

<h2>2. Is there a progression, or just a workout?</h2>
<p>A boxing gym has levels, because skill has levels. Here it runs <a href="/beginners-boxing-class/">Boxing Basics</a>, then <a href="/intermediate-boxing-class/">Intermediate Boxing</a>, then the <a href="/competition-team-training/">competition team</a>, and you move up when a coach says you are ready rather than when you have attended enough times.</p>
<p>A fitness studio has one class that is the same difficulty forever. You get fitter. You do not get better.</p>

<h2>3. Look at who else is in the room</h2>
<p>A real gym has a spread: people in week one, people who have been there a decade, and some people who actually compete. If every person in the room is at the same level and the same age, you are in a class, not a gym.</p>

<h2>4. Is there an open gym?</h2>
<p>Boxing gyms have hours where you can let yourself in and work. That exists because the sport requires solo repetition, and gyms built around the sport make room for it. Open gym here runs weekday mornings and afternoons plus Saturday mornings, on the <a href="/schedule/">schedule</a>.</p>
<p>Studios rarely have this, because the room is booked for the next class.</p>

<h2>5. Ask what the coaches have done</h2>
<p>Not to be difficult. Coaching credentials in boxing are specific and checkable: USA Boxing certification, competitive background, who they have cornered. Our <a href="/coaches/">coaches page</a> lists what each coach has actually done.</p>
<p>"Certified instructor" with no sport named is a fitness qualification.</p>

<h2>6. Count the mirrors and the bags</h2>
<p>Crude, but it works. A room built for training has a ring, heavy bags and equipment that looks used. A room built for classes has mirrors, a sound system, and bags that all look identical because they were bought at the same time last year.</p>

<h2>Which one do you actually want?</h2>
<p>Be honest with yourself, because the wrong answer wastes your money either way.</p>
<p>If you want a hard 45 minutes with music and no homework, a fitness studio is genuinely the right product and you should go to one. If you want to learn the sport, get corrected, and still be improving in three years, you want a boxing gym.</p>
<p>Then ask what it costs, which is a different question at each kind of place and is covered in <a href="/how-much-do-boxing-classes-cost/">what boxing classes cost</a>.</p>
<p>Fighters is the second kind. It has been run as a boxing program since 2001. Come look at the room before you decide: <a href="tel:6292892988">629-289-2988</a>, or send the form. We are at 405 42nd Ave N.</p>
`,
  },
  {
    slug: 'boxing-gear-for-beginners',
    title: 'What Gear Do You Need to Start Boxing?',
    date: '2026-09-15',
    dek: 'Most beginners overbuy. Here is the one thing worth owning before your first class, what can wait, and what you probably never need.',
    body: `
<p>Buy hand wraps. That is the list for day one.</p>
<p>Everything else can wait until you have been a few times and know what you are doing, and some of it you will never need. The boxing gear industry is very happy to sell a beginner a full kit, so here is the honest version.</p>

<h2>Day one: what to bring</h2>
<ul>
<li>Athletic shorts or leggings</li>
<li>A t-shirt or tank</li>
<li>Training shoes</li>
<li>A water bottle</li>
<li>A towel</li>
<li>Hand wraps, if you have them</li>
</ul>
<p>That is genuinely it. Come as you are, see the gym, and talk to a coach about gear once you know you are staying.</p>

<h2>Hand wraps: the one thing to own</h2>
<p>Your hand has a lot of small bones in it and they are not naturally arranged to survive being driven into a heavy bag. Wraps hold that structure together and support the wrist behind it.</p>
<p>They are also the cheapest item in the sport, which makes them the easiest good decision you will make. Get the long ones, 180 inches, and have a coach show you how to put them on properly. A badly wrapped hand is close to no wrap at all. More on why this matters in <a href="/5-critical-ways-to-protect-your-hands/">protecting your hands</a>.</p>

<h2>Gloves: wait, then ask</h2>
<p>Most beginners are well served by 12oz to 16oz all-purpose gloves sized to bodyweight, and your coach will tell you which end of that range fits you and the work you are doing. That conversation takes 30 seconds and saves you buying the wrong thing twice.</p>
<p>Do not buy gloves before your first class. You do not yet know what you need them for.</p>

<h2>What can wait</h2>
<ul>
<li><strong>Boxing shoes.</strong> Useful once your footwork is good enough to notice the difference. Before that, training shoes are fine.</li>
<li><strong>A mouthguard.</strong> Needed when you start any contact work, not before. If you are not sparring, you do not need one yet. See <a href="/do-you-have-to-spar-in-boxing/">how sparring actually works</a>.</li>
<li><strong>Headgear.</strong> Same answer, and gyms generally have some.</li>
<li><strong>A skipping rope.</strong> Worth owning eventually, because it is the cheapest conditioning tool there is.</li>
</ul>

<h2>What you probably never need</h2>
<p>Weighted gloves, "resistance" punch trainers, reflex balls on headbands and most of what a search for boxing equipment will put in front of you. None of them fix anything a coach cannot fix for free, and weighted gloves in particular teach your shoulders a punch mechanic you will then have to unlearn.</p>
<p>The heavy bag, the pads and the rope do the job. They have done it for a century.</p>

<h2>Buy the class first</h2>
<p>The gear that makes you better is coaching time. Everything in this article is worth less than turning up three times a week, and it is a smaller number than the training itself. What that costs is covered in <a href="/how-much-do-boxing-classes-cost/">what boxing classes cost</a>.</p>
<p><a href="/beginners-boxing-class/">Boxing Basics</a> is where most people start, and it runs most weekday evenings plus mornings and Saturday. The <a href="/schedule/">schedule is here</a>. Questions about gear before you spend money: <a href="tel:6292892988">629-289-2988</a>.</p>
`,
  },
  {
    slug: 'womens-boxing-classes',
    title: 'Women Who Box: What Training Is Like',
    date: '2026-09-12',
    dek: 'Mixed classes, same coaching, same work. What women walking into a Nashville boxing gym for the first time usually want to know.',
    body: `
<p>Women train at this gym, in the same classes, doing the same work, coached to the same standard. There is no separate women's track and no lighter version of the session.</p>
<p>That is the short answer. The longer answer covers the things people ask quietly on the phone.</p>

<h2>Are the classes mixed?</h2>
<p>Yes. <a href="/beginners-boxing-class/">Boxing Basics</a>, <a href="/intermediate-boxing-class/">Intermediate</a>, open gym and the <a href="/competition-team-training/">competition team</a> are all mixed. You will train alongside men, and you will be corrected by the coaches on exactly the same points they correct everyone else on.</p>
<p>Boxing sorts people by skill and weight, not by gender. A gym that runs it any other way is doing something else.</p>

<h2>"Will I be the only woman there?"</h2>
<p>No, and this is the question that comes up most. Women's boxing has been an Olympic sport since 2012 and the sport at club level has changed accordingly. You will not be an anomaly in the room.</p>
<p>If seeing that for yourself would settle it, come and watch a session before you sign up for anything. That is a normal request and the answer is yes.</p>

<h2>Do I need to be fit first?</h2>
<p>No. Getting fit is what the training does to you, and boxing conditioning is built around rounds, so you work, rest and work again. That structure means you can go at your own effort level while learning the same skills as everyone else in the room.</p>
<p>Tell a coach about any injury before the session and they will adjust what you do.</p>

<h2>Will I have to fight anyone?</h2>
<p>No. Sparring sits with the competition team and needs a coach's permission, so nobody arrives at it by accident. You can train here for years, get genuinely skilled, and never spar a round. The full answer is in <a href="/do-you-have-to-spar-in-boxing/">do you have to spar</a>.</p>

<h2>What boxing gives you that a gym membership does not</h2>
<p>Strength training makes you stronger. Boxing makes you harder to rattle, which is a different thing and harder to buy.</p>
<p>You learn to keep thinking while tired, to stay composed with someone in your space, and to move your bodyweight deliberately. Self defence is a side effect rather than the pitch, but the composure is the part people notice first, usually somewhere outside the gym.</p>

<h2>What to wear, what to bring</h2>
<p>Athletic shorts or leggings, a t-shirt or tank, training shoes, water, a towel. Hand wraps are the only gear worth owning on day one, and gloves can wait. Full list in <a href="/boxing-gear-for-beginners/">what beginners actually need</a>.</p>

<h2>Come see it</h2>
<p>Boxing Basics runs most weekday evenings plus early mornings and Saturday at 9 AM. The full week is on the <a href="/schedule/">schedule page</a>.</p>
<p>Call <a href="tel:6292892988">629-289-2988</a> or send the form. We are at 405 42nd Ave N, off Charlotte Avenue between Sylvan Park and The Nations.</p>
`,
  },
  {
    slug: 'how-often-should-you-train-boxing',
    title: 'How Often Should You Train Boxing?',
    date: '2026-09-11',
    dek: 'Two or three sessions a week beats five sessions for two weeks and then nothing. How to pick a frequency you will actually keep.',
    body: `
<p>Two or three sessions a week. That is enough to make real progress on technique, and it is the number most people can sustain past the first month.</p>
<p>The instinct when you start something is to go hard. Five days a week, every week, starting Monday. That plan has a failure rate close to total, and the reason is not discipline.</p>

<h2>Why three beats five</h2>
<p>Boxing is a skill sport. Skills consolidate between sessions, not during them. Your nervous system needs the gap to turn what a coach showed you into something your body does without being asked.</p>
<p>Train five days in week one and you get sore, you get behind on everything else in your life, and week three is when you stop. Train three days for three months and you are a boxer.</p>
<p>Consistency compounds. Intensity does not.</p>

<h2>Pick the sessions your week can survive</h2>
<p>This is the part people skip. Before you commit to a frequency, look at the actual week.</p>
<p>At this gym, <a href="/beginners-boxing-class/">Boxing Basics</a> gives you a spread to choose from: early mornings, most weekday evenings, and Saturday at 9 AM. Early classes run at 6 AM on Monday and Wednesday and 7 AM on Tuesday and Thursday. Evening classes run at 6 PM.</p>
<p>Find the two or three slots that survive a bad week at work, not a good one. The <a href="/schedule/">schedule page</a> has the whole grid.</p>

<h2>What a realistic first three months looks like</h2>
<ul>
<li><strong>Weeks 1 to 4:</strong> two classes a week. You are learning stance and footwork, and you are sore in places you did not know about. Do not add anything.</li>
<li><strong>Weeks 5 to 8:</strong> two or three classes. The movements start feeling less foreign. This is where most quitting happens and where showing up matters most.</li>
<li><strong>Weeks 9 to 12:</strong> three sessions, and this is a good point to add open gym time to work the bag between classes. Open gym runs weekday mornings and afternoons plus Saturday mornings.</li>
</ul>

<h2>When to add more</h2>
<p>Add volume when the movements feel familiar and you want rounds on the bag between classes, not because a calendar says week six. The signal is wanting to, not planning to.</p>
<p>If you are heading toward competing, the frequency changes and a coach sets it. That is covered in <a href="/how-to-become-an-amateur-boxer/">how to become an amateur boxer</a>.</p>

<h2>What about rest?</h2>
<p>Rest is training. Boxing is hard on hands, wrists, shoulders and hips, and the people who last are the ones who take the day off before the body forces a fortnight off. See <a href="/10-ways-to-protect-yourself-when-boxing/">training without getting hurt</a>.</p>

<h2>Start with two</h2>
<p>Pick two class times off the <a href="/schedule/">schedule</a> and commit to those for a month. Call <a href="tel:6292892988">629-289-2988</a> or send the form and a coach will help you pick the two that fit.</p>
`,
  },
  {
    slug: 'how-to-become-an-amateur-boxer',
    title: 'How to Become an Amateur Boxer',
    date: '2026-09-10',
    dek: 'What it actually takes to have your first amateur bout: the registration, the physical, the gym pathway, and a realistic timeline.',
    body: `
<p>Competing as an amateur is a real pathway with real paperwork, and it is more accessible than most people assume. It is also slower than most people hope.</p>
<p>Here is the honest route from a first class to a first bout.</p>

<h2>What you need on paper</h2>
<p>Amateur boxing in the United States runs through USA Boxing, and the requirements are administrative rather than mysterious.</p>
<ul>
<li>A current <strong>USA Boxing membership</strong>, registered as an athlete.</li>
<li>A <strong>physical examination</strong> from a physician, on their form, current within the required window.</li>
<li>A <strong>passbook or athlete record</strong> that tracks your bouts.</li>
<li>A <strong>coach registered with USA Boxing</strong> to work your corner. You cannot compete without one.</li>
<li>Gear that meets competition specification, which is not the same as your training gear.</li>
</ul>
<p>Requirements and fees change, so confirm the current version with USA Boxing directly rather than with an article. Your coach will walk you through the paperwork.</p>

<h2>What you need in the gym, which is the longer part</h2>
<p>Nobody registers on a Tuesday and boxes on a Saturday. The pathway here runs in order:</p>
<ol>
<li><strong><a href="/beginners-boxing-class/">Boxing Basics</a>.</strong> Stance, footwork, the punches, defence. Everyone starts here, including people who arrive certain they want to fight.</li>
<li><strong><a href="/intermediate-boxing-class/">Intermediate Boxing</a>.</strong> The step up, Tuesday and Thursday at 5:45 PM. Coach permission required.</li>
<li><strong><a href="/competition-team-training/">Competition team</a>.</strong> Monday, Wednesday and Thursday. Coach permission required. This is where sparring and bout preparation live.</li>
</ol>
<p>The permission requirement at the top two levels is the whole system. A coach moves you up when your defence holds, not when you ask.</p>

<h2>How long does it take?</h2>
<p>Longer than you want and less long than you fear. It depends on how often you train, what athletic background you arrive with, and how quickly your defence becomes reliable under pressure.</p>
<p>Anyone quoting you a fixed number of months has not seen you box. Ask a coach after they have watched you for a few weeks and you will get a real answer.</p>

<h2>Do I have to compete if I join the competition team?</h2>
<p>No. Plenty of people train with the competition team for the quality of the work and never take a bout. The training is the hardest and most technical in the building, and wanting that is a good enough reason to be there.</p>

<h2>The part nobody tells you</h2>
<p>Amateur boxing is scored on clean punching, not aggression. Fighters who arrive wanting to brawl get outpointed by people who are calmer and more accurate, and then have to unlearn the habit.</p>
<p>If the amateur record is meant to lead somewhere, <a href="/8-nasty-career-traps-to-avoid-for-pro-boxers/">the traps that sink professional careers</a> is worth reading years before it is relevant.</p>
<p>The boring work, the footwork drills and the jab repetitions, is what wins amateur bouts. Train accordingly.</p>

<h2>Start the conversation</h2>
<p>Tell a coach that competing is the goal. Say it early, because it changes what they watch for and how they correct you from your first month rather than your sixth.</p>
<p>Call <a href="tel:6292892988">629-289-2988</a> or send the form. The <a href="/schedule/">schedule</a> has every class time.</p>
`,
  },
  {
    slug: '5-steps-to-start-boxing-at-any-age',
    title: 'How to Start Boxing at Any Age',
    date: '2026-09-09',
    dek: 'You are not too old and you are not too out of shape. Five steps from thinking about boxing to having actually done it.',
    body: `
<p>You are not too old. People start boxing in their thirties, forties, fifties and beyond, and the sport is unusually good at absorbing them, because it is scaled by rounds rather than by a single maximum effort.</p>
<p>The obstacle is almost never the body. It is the walk through the door.</p>

<h2>Step 1: Drop the idea that you get in shape first</h2>
<p>This is the single most common reason people never start, and it is backwards. Getting in shape is what the training does to you.</p>
<p>Boxing conditioning runs in rounds: you work, you rest, you work again. That structure means you can go at your own effort level while learning the same skills as everyone else in the room. Nobody is timing you against the room.</p>
<p>If you can walk in the door, you can start. Tell a coach about injuries before the session and they will adjust what you do.</p>

<h2>Step 2: Pick a gym that coaches, not one that counts</h2>
<p>There is a real difference between a boxing gym and a fitness class with gloves, and starting late is exactly when it matters, because good technique is what keeps an older body intact.</p>
<p>You want someone correcting your stance in week one. The tells are in <a href="/real-boxing-gym-vs-fitness-boxing/">how to spot a real boxing gym</a>.</p>

<h2>Step 3: Look at the schedule before the price</h2>
<p>Find sessions you could genuinely make three weeks running, on a bad week rather than an ideal one.</p>
<p>Boxing Basics here runs 6 AM Monday and Wednesday, 7 AM Tuesday and Thursday, 6 PM on weekday evenings, and 9 AM Saturday. The full grid is on the <a href="/schedule/">schedule page</a>. Two workable slots beat five aspirational ones.</p>

<h2>Step 4: Buy hand wraps. Buy nothing else</h2>
<p>Wraps support the small bones in your hands and the wrist behind them, they are the cheapest item in the sport, and they are the only thing worth owning before your first class.</p>
<p>Gloves can wait until a coach has seen you and can tell you what size you need. The rest of the kit list is in <a href="/boxing-gear-for-beginners/">what beginners actually need</a>.</p>

<h2>Step 5: Go once, then go again</h2>
<p>The first session is the whole barrier. It is also the one where nobody is looking at you, because everyone in a boxing gym is occupied with being bad at something in front of a coach.</p>
<p>Then the second session, which is the one that actually decides it. Turning up twice is the difference between people who box and people who considered boxing.</p>

<h2>On starting late</h2>
<p>Older beginners tend to be better students. They listen, they do the boring repetitions, and they do not try to skip to sparring. Coaches notice this constantly.</p>
<p>What you lose in recovery speed you make up in patience, and patience is what boxing technique runs on. See <a href="/how-often-should-you-train-boxing/">how often to train</a> for a realistic first three months, and <a href="/7-reasons-to-start-boxing-in-the-new-year/">what the training actually gives you</a> if you are still deciding.</p>
<p>Classes here are mixed and coached to one standard. If that is the question behind the question, <a href="/womens-boxing-classes/">women who box</a> covers it.</p>

<h2>Come in</h2>
<p><a href="/beginners-boxing-class/">Boxing Basics</a> is where to start. Call <a href="tel:6292892988">629-289-2988</a> or send the form and ask which session suits a first-timer. We are at 405 42nd Ave N in Nashville.</p>
`,
  },
  {
    slug: '10-ways-to-protect-yourself-when-boxing',
    title: 'How to Train Boxing Without Getting Hurt',
    date: '2026-09-08',
    dek: 'Most boxing injuries come from training habits, not from being punched. Ten things that keep people in the gym for years.',
    body: `
<p>The injuries that end people's boxing are almost never dramatic. They are wrists, shoulders, lower backs and hands, and they come from repetition done slightly wrong for a long time.</p>
<p>Here is what keeps people training for years instead of months.</p>

<h2>1. Wrap your hands properly, every time</h2>
<p>Not loosely, not sometimes. A wrap that has gone slack is doing close to nothing, and the hand is where most preventable boxing damage happens. Full detail in <a href="/5-critical-ways-to-protect-your-hands/">protecting your hands</a>.</p>

<h2>2. Punch with your legs</h2>
<p>Power comes off the floor, through the hips, into the shoulder, out of the hand. People who punch with their arm alone hit less hard and wreck their shoulder doing it. If your shoulders ache and your legs never do, your mechanics are wrong.</p>

<h2>3. Do not hit the heavy bag as hard as you can</h2>
<p>The bag does not care and your wrists do. Hard rounds have their place, but a beginner throwing maximum-effort punches into a heavy bag is practising bad alignment at high force, which is how wrists get damaged.</p>
<p>Speed and accuracy first. Power arrives on its own.</p>

<h2>4. Warm up the shoulders specifically</h2>
<p>Boxing asks the shoulder to do thousands of fast reps in a small range. Two minutes of shoulder work before you throw anything is the cheapest insurance in the sport.</p>

<h2>5. Keep your chin down and your eyes open</h2>
<p>A blink reflex is natural and trainable, and training it away early matters, because you cannot defend what you did not see. Keep your eyes on target and your chin tucked. Both are habits built in drills, long before anyone throws at you.</p>

<h2>6. Learn defence at the same time as offence</h2>
<p>Beginners want to learn punches. Coaches want you to learn the guard, the slip and the step back, because those are what let you keep training. A good class teaches both from week one.</p>

<h2>7. Tell the coach about your injuries</h2>
<p>Before the session, not after it flares up. A coach who knows about your shoulder will change what you do. A coach who finds out afterwards cannot.</p>

<h2>8. Do not spar to prove something</h2>
<p>Sparring should teach you something, and it only does that once your defence works. Here it sits behind coach permission on the <a href="/competition-team-training/">competition team</a> for exactly that reason. If you are not sparring, <a href="/do-you-have-to-spar-in-boxing/">you do not have to</a>.</p>

<h2>9. Take rest days on purpose</h2>
<p>Two or three sessions a week is the sustainable range for most people. The ones who train six days in month one are the ones nursing something in month two. See <a href="/how-often-should-you-train-boxing/">how often to train</a>.</p>

<h2>10. Fix the small thing early</h2>
<p>A wrist that twinges is information. Worked around for six weeks, it becomes the reason you stop boxing. Say something while it is still small.</p>

<h2>The theme</h2>
<p>Nine of these ten are about technique and honesty with your coach, not about contact. That is the part people get wrong about boxing safety.</p>
<p>Coaching is the variable that matters. <a href="/beginners-boxing-class/">Boxing Basics</a> runs most weekday evenings plus mornings and Saturday: <a href="/schedule/">full schedule</a>, or call <a href="tel:6292892988">629-289-2988</a>.</p>
`,
  },
  {
    slug: '5-critical-ways-to-protect-your-hands',
    title: 'How to Protect Your Hands in Boxing',
    date: '2026-09-05',
    dek: 'Boxer’s fracture, wrist strain and sore knuckles are mostly preventable. Five habits that keep your hands working.',
    body: `
<p>Your hands are the part of boxing you cannot replace. They contain a lot of small bones arranged for gripping things, not for being driven into a heavy bag several hundred times an evening.</p>
<p>Almost all hand damage in boxing is preventable, and it comes down to five habits.</p>

<h2>1. Wrap properly, and learn how from a person</h2>
<p>A hand wrap is not padding. It holds the small bones of the hand together as a unit and supports the wrist behind them, so force travels through a structure instead of through individual bones.</p>
<p>Get the long wraps, 180 inches, and have a coach show you in person. A video is a poor substitute, because the thing that matters is tension, and you cannot see tension on a screen. Too loose does nothing. Too tight cuts off your hand in round two.</p>
<p>Re-wrap when they loosen. They always loosen.</p>

<h2>2. Land on the first two knuckles</h2>
<p>Index and middle. Those two sit in line with the strong bones of the forearm, so force runs straight up the arm instead of bending anything.</p>
<p>The classic boxer's fracture, a break behind the little finger, comes from landing on the outside of the hand. That happens when the punch is thrown with a loose wrist or a rotated fist, which is a technique problem rather than bad luck.</p>

<h2>3. Keep the wrist straight at impact</h2>
<p>A fist, a wrist and a forearm should form one line when the punch lands. Any bend at the wrist puts the whole force of the shot through a joint that is not built to take it.</p>
<p>This is the single most common cause of wrist pain in beginners, and it is also the reason not to throw your hardest punches before your technique is reliable.</p>

<h2>4. Do not go maximum effort on a heavy bag</h2>
<p>Especially early. The heavy bag punishes bad alignment harder than anything else in the gym, because it does not move out of the way.</p>
<p>Work speed, accuracy and shape first. Add power once a coach has told you the mechanics are right. See <a href="/10-ways-to-protect-yourself-when-boxing/">training without getting hurt</a>.</p>

<h2>5. Use the right gloves for the job</h2>
<p>Bag gloves, sparring gloves and competition gloves are different tools. Most beginners are well served by 12oz to 16oz all-purpose gloves sized to bodyweight, and a coach will tell you which end of that range you want.</p>
<p>Do not buy before your first class. You do not yet know what you are buying for. The full kit question is in <a href="/boxing-gear-for-beginners/">what beginners actually need</a>.</p>

<h2>If it already hurts</h2>
<p>Hand and wrist pain that persists past a session or two is not something to train through. Boxers who protect a sore hand change their mechanics to avoid it, which spreads the problem to the shoulder and the back.</p>
<p>Tell a coach. Get it looked at. Boxing will still be here.</p>

<h2>Learn it properly from the start</h2>
<p>Wrapping and punching mechanics are both taught in <a href="/beginners-boxing-class/">Boxing Basics</a> by USA Boxing certified coaches, which is cheaper than learning them wrong and correcting later.</p>
<p><a href="/schedule/">Class times</a>, or call <a href="tel:6292892988">629-289-2988</a>.</p>
`,
  },
  {
    slug: '7-reasons-to-start-boxing-in-the-new-year',
    title: '7 Reasons to Start Boxing',
    date: '2026-09-04',
    dek: 'Boxing is a skill sport that happens to be brutal conditioning. Seven things it does to you that a gym membership does not.',
    body: `
<p>Most people take up boxing for the fitness and stay for something else. Here is the honest list, fitness included but not first.</p>

<h2>1. You learn a skill, not just a workout</h2>
<p>A treadmill makes you fitter and teaches you nothing. Boxing has technique that takes years to get good at, which means there is always a next thing. People quit workouts. They rarely quit skills.</p>
<p>This is the reason boxing retains people who have bounced off every gym they ever joined.</p>

<h2>2. The conditioning is genuinely hard</h2>
<p>Boxing is built in rounds, which is interval training designed a century before anyone called it that. Work, rest, work again, with your heart rate spiking and dropping.</p>
<p>Because it is structured in rounds, you can scale your own effort inside the same session as everyone else. That is why it works for a first-timer and a competitor in the same room.</p>

<h2>3. It is full body, and it does not feel like it</h2>
<p>A punch starts at the floor and runs through the legs, hips, core and shoulder. An hour of boxing works all of it, and you will notice in your legs and midsection more than your arms, which surprises most people the next morning.</p>

<h2>4. Composure under pressure</h2>
<p>This is the one people do not expect. Boxing is done tired, on a clock, with someone watching and correcting you. Learning to think clearly while your heart rate is high is a trainable skill, and it does not stay in the gym.</p>
<p>More on that in <a href="/mindset-matters/">the mental side of boxing</a>.</p>

<h2>5. It is coordination work disguised as cardio</h2>
<p>Feet, hips, hands and eyes in the right order, at speed. Boxing sharpens the connection between deciding something and doing it, which is why athletes in other sports use it as cross-training. See <a href="/boxing-football-3-ways-theyre-similar/">boxing for athletes</a>.</p>

<h2>6. You can do it at any age and any fitness level</h2>
<p>People start in their forties and fifties and do fine, because the sport scales by effort rather than by a single maximum. Getting in shape is what the training does to you, not a thing you do beforehand. Full breakdown in <a href="/5-steps-to-start-boxing-at-any-age/">how to start boxing at any age</a>.</p>
<p>It runs the other way too. Youth boxing takes ages 8 to 13, so see <a href="/what-age-can-kids-start-boxing/">what age kids can start</a> if the whole house is coming.</p>

<h2>7. Hitting things is good for you</h2>
<p>No complicated argument here. Three rounds on a heavy bag after a bad day does something that no other form of exercise quite replicates, and everyone who has done it knows exactly what that sentence means.</p>

<h2>What it does not require</h2>
<p>It does not require being fit first, being young, being naturally athletic, or being willing to get punched. Sparring sits behind coach permission and plenty of people never do it. See <a href="/do-you-have-to-spar-in-boxing/">do you have to spar</a>.</p>

<h2>Where to start</h2>
<p><a href="/beginners-boxing-class/">Boxing Basics</a> covers stance, footwork, the punches and defence, taught by USA Boxing certified coaches. It runs early mornings, most weekday evenings, and Saturday at 9 AM.</p>
<p><a href="/schedule/">Pick a time</a>, or call <a href="tel:6292892988">629-289-2988</a>. We are at 405 42nd Ave N in Nashville.</p>
`,
  },
  {
    slug: 'make-non-contact-boxing-more-fun',
    title: 'Non-Contact Boxing: No Punches Taken',
    date: '2026-09-03',
    dek: 'You can train boxing properly for years without ever being hit. What non-contact training looks like and how to keep it interesting.',
    body: `
<p>Non-contact boxing is not a watered down version of the sport. It is the same technical training, the same conditioning and the same coaching, with the sparring removed.</p>
<p>It is also how most people at most boxing gyms train, most of the time.</p>

<h2>What you actually do</h2>
<p>A non-contact session covers the whole craft:</p>
<ul>
<li><strong>Footwork</strong>, which is the part that separates boxers from people who punch</li>
<li><strong>Shadow boxing</strong>, where technique gets built and corrected</li>
<li><strong>Bag work</strong>, for power, accuracy and conditioning</li>
<li><strong>Pad work</strong> with a coach, which is as close to the real thing as it gets without contact</li>
<li><strong>Defence</strong>: the guard, the slip, the roll, the step back</li>
<li><strong>Conditioning</strong>: rope, rounds, core work</li>
</ul>
<p>The only thing missing is somebody throwing back. Everything else is the sport.</p>

<h2>Why it stops being fun, and how to fix it</h2>
<p>Non-contact training goes stale for one reason: people turn the heavy bag into a treadmill. Same three punches, same pace, twelve minutes, done.</p>
<p>Four fixes, in order of how much they help.</p>
<ol>
<li><strong>Give every round a job.</strong> One round for the jab only. One for movement, where you are not allowed to stand still. One for body shots. A round with a purpose is a different experience from a round of hitting a bag.</li>
<li><strong>Get on the pads.</strong> Pad work with a coach is the most engaging thing in a boxing gym and the closest you get to reading another person without contact.</li>
<li><strong>Work with a partner on defence drills.</strong> Slipping a partner's controlled jab is not sparring, and it teaches distance better than any bag can.</li>
<li><strong>Get better at something specific.</strong> Pick one thing, the pivot, the step back, the double jab, and work it for a month. Boredom is usually a symptom of having no target.</li>
</ol>

<h2>Who trains non-contact</h2>
<p>People who want the fitness and the skill and have no interest in being hit. People with jobs, faces and families they would rather not risk. People who will spar eventually but are not close yet. And people who simply prefer it, which is a complete reason.</p>
<p>At this gym, sparring lives with the <a href="/competition-team-training/">competition team</a> behind coach permission, so it is opt-in by design. Nobody drifts into it. See <a href="/do-you-have-to-spar-in-boxing/">do you have to spar</a>.</p>

<h2>Does it still make you good?</h2>
<p>At everything except reading a live opponent, yes. Your footwork, conditioning, technique and composure all come from the training. Sparring teaches timing against a person, which matters enormously if you want to compete and very little if you do not.</p>

<h2>Train it properly</h2>
<p><a href="/beginners-boxing-class/">Boxing Basics</a> is non-contact and coached by USA Boxing certified coaches. Open gym gives you the room to work on your own between classes, weekday mornings and afternoons plus Saturday mornings.</p>
<p><a href="/schedule/">Full schedule</a>, or call <a href="tel:6292892988">629-289-2988</a>.</p>
`,
  },
  {
    slug: 'mindset-matters',
    title: 'The Mental Side of Boxing',
    date: '2026-09-02',
    dek: 'Boxing trains composure the way it trains conditioning: in rounds, under fatigue, on purpose. What that actually builds.',
    body: `
<p>Every boxing gym has someone who is fitter, faster and more coordinated than the person beating them. The gap is almost always mental, and unlike talent, the mental side is trainable on a schedule.</p>

<h2>Composure is a physical skill</h2>
<p>People treat staying calm as a personality trait. In boxing it is a trained response, and the training is specific: you are tired, the clock is running, a coach is correcting you, and you have to keep thinking anyway.</p>
<p>Do that three times a week for a year and your baseline for what counts as stressful moves. That is the effect people notice outside the gym long before they notice their conditioning.</p>

<h2>Confidence comes after competence, not before</h2>
<p>This order matters and most people have it backwards. You do not decide to feel confident and then perform. You get repetitions in, you become competent, and confidence turns up as a byproduct.</p>
<p>Which means the route to feeling good about your boxing is boring: turn up, do the drills, get corrected. Competence leads to effort, effort leads to more competence, and confidence rides along behind both.</p>

<h2>Train to win, not to survive</h2>
<p>There is a visible difference between a boxer working to not lose and one working to win. The first is reactive, tight and waiting. The second is deciding what happens.</p>
<p>This shows up in training long before it shows up in a bout. Someone doing rounds to get through them and someone doing rounds to get better are doing different sessions at the same time in the same room.</p>

<h2>Learn to be bad at something in public</h2>
<p>This is the real entry barrier to boxing, and it has nothing to do with fitness. Walking into a room where people are good at a thing you cannot do, and being visibly bad at it, is uncomfortable.</p>
<p>It is also the single most useful habit the sport builds, because everything worth learning starts there. Everyone in the gym went through it. Most of them went through it recently.</p>

<h2>Trust the work</h2>
<p>The point of consistent training is that you go into a hard session, a tough round or a bout knowing you have done the preparation. That knowledge does the same job as confidence and is more reliable, because it is based on something.</p>
<p>Which is another argument for <a href="/how-often-should-you-train-boxing/">two or three sessions a week, consistently</a>, over five sessions for a fortnight.</p>

<h2>Where it transfers</h2>
<p>Composure under fatigue, being coachable, doing the boring repetitions, staying calm with someone in your space. None of those stay in the gym, and they are the reason people who box tend to keep boxing long after the fitness goal that brought them in has been met.</p>

<h2>Come and be bad at it</h2>
<p><a href="/beginners-boxing-class/">Boxing Basics</a> is where everyone starts, including the people who look like they never did. <a href="/schedule/">Class times here</a>, or call <a href="tel:6292892988">629-289-2988</a>.</p>
`,
  },
  {
    slug: 'boxing-football-3-ways-theyre-similar',
    title: 'Why Athletes in Other Sports Train Boxing',
    date: '2026-09-01',
    dek: 'Footballers, wrestlers and field athletes use boxing as cross-training for three specific reasons. None of them is cardio.',
    body: `
<p>Boxing shows up in the off-season programme of a lot of athletes who have no intention of fighting anyone. It is not because it is a hard workout, though it is. It is because three things transfer almost directly.</p>

<h2>1. Force starts at the floor</h2>
<p>A punch and a tackle are the same mechanical idea: drive from the ground, rotate through the hips, deliver through the upper body. The sequence is identical and the timing is what makes it powerful.</p>
<p>Boxing drills that chain hundreds of times a session, which is far more repetitions of hip-driven force than most field sports give you. Athletes who box tend to get better at transferring power through the trunk, and that shows up in their own sport without anyone coaching it there.</p>

<h2>2. Footwork under pressure</h2>
<p>Boxing footwork is short, balanced and constant: never crossing the feet, never stopping, always able to move in any direction from where you are.</p>
<p>That is the same demand a defensive back, a wrestler or a midfielder has. The difference is that boxing drills it in isolation, at high volume, with someone correcting your base. Very few sports train the feet that deliberately.</p>

<h2>3. Conditioning shaped like competition</h2>
<p>Boxing is intervals: three hard minutes, a short rest, repeat. Field and court sports are also intervals, which is why steady-state running is a poor match for them.</p>
<p>Round-based conditioning trains the recovery between efforts, not just the effort. That recovery is what decides the fourth quarter.</p>

<h2>The one nobody plans for</h2>
<p>Composure. Boxing puts athletes in a position where they are tired, being corrected, and not the best person in the room, which is a rare experience for someone good at their own sport.</p>
<p>Learning to think clearly in that state is the part coaches notice when the athlete goes back to their season. More on that in <a href="/mindset-matters/">the mental side of boxing</a>.</p>

<h2>What cross-training boxing looks like</h2>
<p>You do not need to spar, and most cross-training athletes never do. Sparring here sits behind coach permission with the <a href="/competition-team-training/">competition team</a>, so the technical and conditioning work is entirely available on its own. See <a href="/make-non-contact-boxing-more-fun/">non-contact boxing</a>.</p>
<p>Two or three sessions a week slots into an existing training week without wrecking it. <a href="/how-often-should-you-train-boxing/">How often to train</a> covers the load question.</p>

<h2>A note on the off-season</h2>
<p>Learn the technique properly rather than treating the bag as conditioning equipment. Bad punching mechanics at high volume is how athletes pick up wrist and shoulder problems in a sport they do not even play. <a href="/5-critical-ways-to-protect-your-hands/">Protect your hands</a> covers it.</p>

<h2>Come in during the off-season</h2>
<p><a href="/beginners-boxing-class/">Boxing Basics</a> runs early mornings, weekday evenings and Saturday mornings, which tends to fit around another sport's schedule. <a href="/schedule/">Times here</a>, or call <a href="tel:6292892988">629-289-2988</a>.</p>
`,
  },
  {
    slug: '8-nasty-career-traps-to-avoid-for-pro-boxers',
    title: '8 Career Traps That Sink Professional Boxers',
    date: '2026-08-29',
    dek: 'Pro boxing is a short window inside a difficult industry. Eight traps that end careers, and what to do instead.',
    body: `
<p>Professional boxers have a short window in which to make a career happen, and they have to build skill and experience while navigating an entertainment business that is not built in their favour.</p>
<p>The traps below end more careers than losses do.</p>

<h2>1. Staying with a bad trainer because leaving is awkward</h2>
<p>Loyalty is a virtue right up to the point where it costs you the career. Look for a trainer who treats you with respect, keeps learning themselves, and builds toward your goals rather than their reputation.</p>
<p>Changing camps is uncomfortable. Being 32 with nothing to show for it is worse.</p>

<h2>2. Trying to recreate another fighter's path</h2>
<p>The route that made someone else is closed, because it depended on their style, their timing and their era. Play to the strengths that make you appealing to promoters, and find ways to win convincingly in front of a crowd.</p>

<h2>3. Waiting for someone else to build your career</h2>
<p>Nobody is coming. Take part in the decisions, understand the contracts you sign, and know what your own record is being built toward. You are responsible for the career, including the parts you delegate.</p>

<h2>4. Assuming everyone has your interests at heart</h2>
<p>Some do. Build a team of trusted people around you, trainers, manager, promoter, sparring partners, and judge them by whether they give you energy or take it. Keep your head on a swivel outside the ring as well as inside it.</p>

<h2>5. Drowning in the small stuff</h2>
<p>There is an endless supply of minor grievances in this sport: a purse split, a card position, something said online. Fighters who litigate every one of them run out of attention for training.</p>
<p>Pick the things that change the trajectory. Let the rest go.</p>

<h2>6. Letting one loss end it</h2>
<p>A loss is information, not a verdict. Decide honestly whether you want to continue, and if you do, work like it. Hard work beats talent when talent does not work hard, and most careers have a loss in the middle of them.</p>

<h2>7. Getting cocky on the way up</h2>
<p>Be confident and calm rather than loud. People who are cruel on the way up are usually insecure, and the sport has a long memory. Treat people well while you are rising and they are still there if you fall.</p>

<h2>8. Assuming talent gets discovered on its own</h2>
<p>It does not. Nobody is going to find you walking down the street. Build an audience, network with trainers, managers and promoters, and understand that pro boxing is an entertainment industry where being watchable is part of the job.</p>

<h2>The foundation under all of it</h2>
<p>Every one of these gets easier if the fundamentals are genuinely good, because a fighter with reliable technique has more options and less desperation. That work happens years earlier, in <a href="/beginners-boxing-class/">basics</a> and on the <a href="/competition-team-training/">competition team</a>, not in the pro career.</p>
<p>If competing is the goal and you are earlier in the process, <a href="/how-to-become-an-amateur-boxer/">how to become an amateur boxer</a> is the realistic route.</p>

<h2>Train like a fighter</h2>
<p>Our coaches work with fitness clients, amateurs and professional boxers. Call <a href="tel:6292892988">629-289-2988</a> or come by 405 42nd Ave N. <a href="/schedule/">Class times</a>.</p>
`,
  },
];
