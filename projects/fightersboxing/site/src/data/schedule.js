// WEEKLY SCHEDULE: the one source of truth for every class time on the site.
//
// Transcribed from the client's own Schedule page in the WordPress export
// (Tools > Export, 2026-08-26). Everything that shows a class time reads
// from this file and nothing else:
//
//   /schedule/                 the adult week board, plus the kids block
//   class pages                "Class times", filtered to that class
//   /schedule.ics              subscribe feed, adult classes
//   /youth-schedule.ics        subscribe feed, kids classes
//
// So a schedule change is one edit here. Add, remove or move a session and
// the board, all three class pages and everyone's subscribed calendar move
// with it.
//
// Adults and kids are separated by `audience`, per Ben (2026-08-27): the
// schedule page leads with the adult week and carries the kids classes as
// their own block, and the kids classes also sit on the youth page.
//
// TWO THINGS FOR BEN TO CONFIRM, both flagged in the data below:
//   1. Saturday open gym reads "2AM-12PM" on the client's page. Almost
//      certainly a typo (weekday mornings are 7AM-10AM). Kept verbatim
//      rather than guessed at: fix the one line and every surface follows.
//   2. Sessions the client listed with a start time only (Boxing Basics,
//      Competition Team Training, both sparring classes, IBAN Youth) get a
//      60 minute default length in the .ics feeds. Real lengths welcome.
//
// The client's page had no Sunday row, so Sunday carries no sessions.

/** Monday-first, the order the client used. */
export const days = [
  { key: 'mon', name: 'Monday', short: 'Mon', ics: 'MO' },
  { key: 'tue', name: 'Tuesday', short: 'Tue', ics: 'TU' },
  { key: 'wed', name: 'Wednesday', short: 'Wed', ics: 'WE' },
  { key: 'thu', name: 'Thursday', short: 'Thu', ics: 'TH' },
  { key: 'fri', name: 'Friday', short: 'Fri', ics: 'FR' },
  { key: 'sat', name: 'Saturday', short: 'Sat', ics: 'SA' },
  { key: 'sun', name: 'Sunday', short: 'Sun', ics: 'SU' },
];

/**
 * Programs, each tied to the page that owns it and the feed it belongs to.
 * The adult ones become the filter chips on the week board; the kids one
 * drives its own block, so it is not a chip.
 */
export const programs = [
  { slug: 'boxing-basics', label: 'Boxing basics', href: '/beginners-boxing-class/', audience: 'adult' },
  { slug: 'competition', label: 'Competition team', href: '/competition-team-training/', audience: 'adult' },
  { slug: 'open-gym', label: 'Open gym', href: null, audience: 'adult' },
  { slug: 'youth', label: 'Youth boxing', href: '/youth-boxing-class/', audience: 'youth' },
];

/** The two subscribe feeds, one per audience. */
export const feeds = {
  adult: { href: '/schedule.ics', name: 'Fighters Boxing Gym Classes' },
  youth: { href: '/youth-schedule.ics', name: 'Fighters Boxing Gym Youth Classes' },
};

// start/end are 24 hour "HH:MM". end omitted means the client published a
// start time only. `tags` is a list so a session can sit under more than
// one program filter.
export const sessions = [
  // ---- Monday ----
  { day: 'mon', name: 'Open Gym', start: '07:00', end: '10:00', audience: 'adult', tags: ['open-gym'] },
  { day: 'mon', name: 'Boxing Basics', start: '07:00', audience: 'adult', tags: ['boxing-basics'] },
  { day: 'mon', name: 'Open Gym', start: '16:30', end: '19:30', audience: 'adult', tags: ['open-gym'] },
  { day: 'mon', name: 'Competition Team Training', start: '17:45', audience: 'adult', tags: ['competition'] },
  { day: 'mon', name: 'Boxing Basics', start: '18:00', audience: 'adult', tags: ['boxing-basics'] },

  // ---- Tuesday ----
  { day: 'tue', name: 'Open Gym', start: '07:00', end: '10:00', audience: 'adult', tags: ['open-gym'] },
  { day: 'tue', name: 'Open Gym', start: '16:30', end: '19:30', audience: 'adult', tags: ['open-gym'] },
  { day: 'tue', name: 'Boxing Basics', start: '18:00', audience: 'adult', tags: ['boxing-basics'] },

  // ---- Wednesday ----
  { day: 'wed', name: 'Open Gym', start: '07:00', end: '10:00', audience: 'adult', tags: ['open-gym'] },
  { day: 'wed', name: 'Open Gym', start: '16:30', end: '19:30', audience: 'adult', tags: ['open-gym'] },
  { day: 'wed', name: 'Competition Team Training', start: '17:45', audience: 'adult', tags: ['competition'] },
  { day: 'wed', name: 'Boxing Basics', start: '18:00', audience: 'adult', tags: ['boxing-basics'] },

  // ---- Thursday ----
  { day: 'thu', name: 'Open Gym', start: '07:00', end: '10:00', audience: 'adult', tags: ['open-gym'] },
  { day: 'thu', name: 'Open Gym', start: '16:30', end: '19:30', audience: 'adult', tags: ['open-gym'] },
  { day: 'thu', name: 'Competition Sparring', start: '17:45', audience: 'adult', tags: ['competition'] },
  // Sits in the client's competition block next to Competition Sparring, so
  // it lives on the competition page. Say the word and it moves to basics.
  { day: 'thu', name: 'Foundational Sparring', start: '18:00', audience: 'adult', tags: ['competition'] },

  // ---- Friday ----
  { day: 'fri', name: 'Open Gym', start: '07:00', end: '10:00', audience: 'adult', tags: ['open-gym'] },
  { day: 'fri', name: 'Open Gym', start: '16:30', end: '19:30', audience: 'adult', tags: ['open-gym'] },
  { day: 'fri', name: 'Boxing Basics', start: '18:00', audience: 'adult', tags: ['boxing-basics'] },

  // ---- Saturday ----
  // verbatim "2AM-12PM" from the client's page. See note 1 at the top.
  { day: 'sat', name: 'Open Gym', start: '02:00', end: '12:00', audience: 'adult', tags: ['open-gym'], verify: true },
  // the client's page reads "Bsics & Kardio KO 9AM"; per Ben (2026-08-27)
  // the Saturday class is Boxing Basics.
  { day: 'sat', name: 'Boxing Basics', start: '09:00', audience: 'adult', tags: ['boxing-basics'] },
  { day: 'sat', name: 'IBAN Youth', start: '12:00', audience: 'youth', tags: ['youth'] },
];

/** "07:00" -> 420, for sorting. */
function minutes(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

/** "17:45" -> "5:45 PM", "12:00" -> "12 PM". Whole hours drop the ":00". */
export function clock(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  const suffix = h < 12 ? 'AM' : 'PM';
  const hour = h % 12 === 0 ? 12 : h % 12;
  return m === 0 ? `${hour} ${suffix}` : `${hour}:${String(m).padStart(2, '0')} ${suffix}`;
}

/** One session as a time label: "7 AM - 10 AM" or just "5:45 PM". */
export function timeLabel(session) {
  return session.end ? `${clock(session.start)} - ${clock(session.end)}` : clock(session.start);
}

/** Every session matching { program, audience }, earliest first. */
export function pick({ program, audience } = {}) {
  return sessions
    .filter((s) => (!program || s.tags.includes(program)) && (!audience || s.audience === audience))
    .sort((a, b) => minutes(a.start) - minutes(b.start));
}

/** All seven days as [{ ...day, sessions }]: the week board. */
export function week(filter = {}) {
  const matching = pick(filter);
  return days.map((d) => ({ ...d, sessions: matching.filter((s) => s.day === d.key) }));
}

/** Only the days that actually have a session: the day-card strips. */
export function activeDays(filter = {}) {
  return week(filter).filter((d) => d.sessions.length > 0);
}

/** The program a class page owns, or undefined for pages with no classes. */
export function programForHref(href) {
  return programs.find((p) => p.href === href);
}
