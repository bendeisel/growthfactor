// FAQs: the questions people in Nashville actually ask before they walk in.
//
// Written to be quotable. An answer engine that gets asked "where can I
// learn to box in Nashville" or "what age can kids start boxing" can lift a
// whole paragraph from here and have it be correct, specific and attributed
// to this gym. That is the same thing that makes the page useful to a human
// who is nervous about walking into a boxing gym for the first time.
//
// Question set built from what people search and ask around Nashville
// (search demand for cost, first class, gear, kids' ages, real boxing
// versus boutique classes, how to start competing) plus the questions the
// client's own copy already answers. Local geography is real: the gym sits
// on 42nd Ave N in the Charlotte Avenue corridor, between Sylvan Park and
// The Nations, near the I-40 exit at 46th Ave, with a WeGo stop at 42nd.
//
// RULE FOR EDITING THIS FILE: every answer must be something the gym can
// stand behind. Nothing here invents a price, a policy, or a promise. The
// four answers that need the gym's own numbers say so out loud rather than
// guessing, and they are listed in source/inner-pages.md for Ben.
//
// Live copy lives in Sanity once wired (see ../../CMS.md); this is the
// committed fallback and the seed for the CMS.

export const faqSections = [
  { slug: 'starting', title: 'Starting from zero' },
  { slug: 'classes', title: 'The classes' },
  { slug: 'kids', title: 'Kids and teens' },
  { slug: 'competing', title: 'Competing' },
  { slug: 'visiting', title: 'Visiting the gym' },
];

export const fallbackFaqs = [
  // ---------- starting from zero ----------
  {
    section: 'starting',
    q: 'I have never boxed before. Can I start here?',
    a: `<p>Yes, and most people who walk in have never boxed. Our
      <a href="/beginners-boxing-class/">Boxing Basics</a> class exists for exactly
      that: stance, footwork, the punches, and how to defend yourself, taught by USA
      Certified coaches. You are not thrown in with fighters on day one. You learn the
      same fundamentals our competitors learned, at the speed you can absorb them.</p>`,
  },
  {
    section: 'starting',
    q: 'Do I need to be in shape before I start boxing?',
    a: `<p>No. Getting in shape is what the training does to you. Boxing conditioning
      is built around rounds, so you work, rest, and work again, which means you can
      go at your own effort level while learning the same skills as everyone else in
      the room. If you can walk in the door, you can start. Tell your coach about any
      injuries before class and they will adjust what you do.</p>`,
  },
  {
    section: 'starting',
    q: 'What should I wear and bring to my first boxing class?',
    a: `<p>Athletic shorts or leggings, a t-shirt or tank, training shoes, a water
      bottle, and a towel. Hand wraps are the one piece of gear worth owning from the
      start, since they support the small bones in your hands and they are personal
      kit, not something you borrow. Leave the jewelry at home and come a few minutes
      early so you can get wrapped up before the round starts.</p>`,
  },
  {
    section: 'starting',
    q: 'Do I need my own boxing gloves?',
    a: `<p>Not for your first visit. Come as you are, see the gym, and talk to a coach
      about gloves once you know you are staying. When you do buy, most beginners are
      well served by 12oz to 16oz all-purpose gloves sized to their bodyweight, and
      your coach will tell you which end of that range fits you and the work you are
      doing. Ask us before you spend money on gear you do not need yet.</p>`,
  },
  {
    section: 'starting',
    q: 'What does it cost to train at Fighters Boxing Gym?',
    a: `<p>Call us at <a href="tel:6292892988">629-289-2988</a> or send the form and we
      will give you current rates for the program you are asking about, along with what
      a first visit looks like. Rates differ between open gym access, the classes, and
      competition team training, so a straight answer beats a range that turns out not
      to apply to you.</p>`,
    needsGymInput: 'Send me your rates and trial terms and this becomes a real number, which ranks far better than a call to action.',
  },
  {
    section: 'starting',
    q: 'How often should a beginner train?',
    a: `<p>Two or three sessions a week is plenty to start, and it is enough to make
      real progress on technique. <a href="/schedule/">Boxing Basics</a> runs most
      weekday evenings plus Monday and Saturday mornings, so you can pick the days
      that survive your work week. Add open gym time once the movements feel familiar
      and you want rounds on the bag between classes.</p>`,
  },

  // ---------- the classes ----------
  {
    section: 'classes',
    q: 'Is this a real boxing gym or a fitness boxing class?',
    a: `<p>A real boxing gym. In the gym's own words, it is built "for those serious
      about the sport", and the difference shows in what a session is about: technique,
      rounds, coaching corrections, and sparring for those who want it. There is no
      choreography and no punch counter on a screen. You will get very fit here, but
      fitness is the byproduct of learning to box rather than the product being sold.</p>`,
  },
  {
    section: 'classes',
    q: 'What is the difference between Boxing Basics, Competition Team Training and Open Gym?',
    a: `<p><a href="/beginners-boxing-class/">Boxing Basics</a> is the coached class
      where you learn and drill fundamentals, and it is where new members start.
      <a href="/competition-team-training/">Competition Team Training</a> is the
      advanced program: sparring, conditioning, technical refinement, ring IQ, training
      alongside active competitors. Open gym is unstructured time to work the bags,
      shadowbox, and put in your own rounds. See the full week on the
      <a href="/schedule/">schedule</a>.</p>`,
  },
  {
    section: 'classes',
    q: 'When are boxing classes in Nashville at your gym?',
    a: `<p>The full week is on the <a href="/schedule/">schedule page</a>, and it is the
      same schedule the coaches work from, so it is current. The shape of it: open gym
      mornings and late afternoons on weekdays, Boxing Basics on weekday evenings plus
      Monday and Saturday mornings, competition sessions early evening midweek, and
      youth boxing on Saturday.</p>`,
  },
  {
    section: 'classes',
    q: 'Will I have to spar?',
    a: `<p>No. Sparring is something you opt into once your coach thinks you are ready
      for it, and plenty of members train for years without ever taking a hard round.
      When you do want it, there is a path: foundational sparring on Thursdays, then
      competition sparring with the team. Nobody puts a new boxer in front of a
      competitor to see what happens.</p>`,
  },
  {
    section: 'classes',
    q: 'Can I use the gym on my own instead of taking a class?',
    a: `<p>Yes, that is what open gym is for. It runs mornings and late afternoons on
      weekdays plus Saturday morning, and it gives you the bags, the space, and the
      equipment to work at your own pace. Most members mix the two: coached classes to
      learn the technique, open gym to put in the reps.</p>`,
  },
  {
    section: 'classes',
    q: 'Are your classes mixed, and do women train here?',
    a: `<p>Yes to both. The classes on the schedule are open to any adult, men and
      women train in the same sessions, and the coaching is the same coaching. If you
      would rather see the room before you commit to a class, come by for a tour and
      watch a session first.</p>`,
  },

  // ---------- kids and teens ----------
  {
    section: 'kids',
    q: 'What age can kids start boxing?',
    a: `<p>Our <a href="/youth-boxing-class/">Youth Boxing Program</a> is designed for
      ages 8 and up. That is also the age USA Boxing allows athletes to register, so a
      child who eventually wants to compete can follow the same path from the same
      starting point. Younger than 8, call us and we will tell you honestly whether it
      is worth waiting a year.</p>`,
  },
  {
    section: 'kids',
    q: 'Is youth boxing safe? Do kids get hit?',
    a: `<p>The youth class is <b>non-contact</b>. Kids learn stance, movement, defense,
      and striking fundamentals on bags and pads, coached by USA Certified staff, and
      nobody is trading punches with anybody. Parents are welcome to watch. If a young
      athlete later wants to compete, that is a separate conversation with the coaches,
      with headgear, medicals, and USA Boxing registration involved.</p>`,
  },
  {
    section: 'kids',
    q: 'What does youth boxing teach besides how to punch?',
    a: `<p>The gym's own answer: respect, patience, perseverance, and confidence, plus
      coordination, focus, and discipline. In practice, a kid who trains here learns to
      take a correction without falling apart, to keep working when a round is hard, and
      to hold their own in a room of adults doing serious work. That travels well
      outside the gym.</p>`,
  },
  {
    section: 'kids',
    q: 'When does the youth class meet?',
    a: `<p>Youth boxing is on the <a href="/schedule/">schedule</a> and on the
      <a href="/youth-boxing-class/">youth class page</a>, both fed by the same source,
      so they never disagree. If you need a weekday time for your child, call
      <a href="tel:6292892988">629-289-2988</a> and ask, because the youth schedule is
      the part of our week most likely to grow.</p>`,
    needsGymInput: 'The schedule shows one youth session (Saturday noon). If kids train more often than that, send the times.',
  },

  // ---------- competing ----------
  {
    section: 'competing',
    q: 'How do I get on the competition team?',
    a: `<p>You earn the spot. Because the program is built for experienced boxers, we do
      not let first-time visitors jump straight into the competition class unless a coach
      knows them or invited them. The route in: take a
      <a href="/beginners-boxing-class/">Boxing Basics</a> class and be evaluated, or come
      by for a tour and meet the coaching staff. Once you are ready, we will help you earn
      your spot.</p>`,
  },
  {
    section: 'competing',
    q: 'Do I have to fight if I train with the competition team?',
    a: `<p>No. Many of the team actively fight in sanctioned bouts, and plenty of others
      train with the team purely for the challenge, the discipline, and the skill that
      comes with high-level boxing. The atmosphere is focused, respectful and intense,
      which is what you would expect from a real fight gym, and none of that requires you
      to book a bout.</p>`,
  },
  {
    section: 'competing',
    q: 'What do I need in order to box as an amateur?',
    a: `<p>Three things beyond the training: a USA Boxing membership, a sports physical
      from a doctor each year, and an athlete passbook, which is the record your bouts get
      written into. Athletes can register from age 8, and anyone under 18 needs a parent or
      guardian signature. Your coach walks you through the paperwork before your first
      bout; nobody expects you to work it out alone.</p>`,
  },

  // ---------- visiting ----------
  {
    section: 'visiting',
    q: 'Where is the gym?',
    a: `<p>405 42nd Ave N, Nashville, TN 37209, in the Charlotte Avenue corridor in West
      Nashville, between Sylvan Park and The Nations. It is close to the I-40 exit at 46th
      Ave, and WeGo buses stop at 42nd Ave, so it is reachable from downtown, West End,
      Charlotte Park and the neighborhoods on either side of Charlotte without a
      cross-town drive.</p>`,
  },
  {
    section: 'visiting',
    q: 'Can I come look at the gym before I sign up?',
    a: `<p>Yes, and we would rather you did. Stop by for a gym tour, watch a class, and
      meet the coaching staff, which the coaches suggest themselves for anyone thinking
      about the competition program. Call <a href="tel:6292892988">629-289-2988</a> first
      so somebody is expecting you and can actually talk instead of holding pads.</p>`,
  },
  {
    section: 'visiting',
    q: 'Do you offer personal training or private sessions?',
    a: `<p>Ask us. Call <a href="tel:6292892988">629-289-2988</a> or send the form and we
      will tell you which coaches have room and what a session involves. Some members do
      privates to fix something specific in their technique, then take that back into
      class where the reps happen.</p>`,
    needsGymInput: 'Confirm whether privates are offered, by whom, and at what rate. If they are not, I will pull this question.',
  },
];
