// SCHEDULE: shape, helpers, and the fallback copy of the week.
//
// The live schedule lives in Sanity, so the gym can change a class time in
// one place and every page follows (see src/lib/schedule-source.js). This
// file holds the parts that belong in code rather than in the CMS:
//
//   days       the week, in order, structural
//   programs   which class page owns which program
//   helpers    time formatting and filtering, shared by build and browser
//   fallback   a committed copy of the schedule, used when the build has no
//              Sanity credentials, so the site always builds and always has
//              real times in the HTML
//
// Adults and kids are separated by `audience`, per Ben: the schedule page
// leads with the adult week and carries the kids classes as their own block,
// and the kids classes also sit on the youth page.

/** Monday-first, the order the client used. */
export const days = [
  { key: 'mon', name: 'Monday', short: 'Mon' },
  { key: 'tue', name: 'Tuesday', short: 'Tue' },
  { key: 'wed', name: 'Wednesday', short: 'Wed' },
  { key: 'thu', name: 'Thursday', short: 'Thu' },
  { key: 'fri', name: 'Friday', short: 'Fri' },
  { key: 'sat', name: 'Saturday', short: 'Sat' },
  { key: 'sun', name: 'Sunday', short: 'Sun' },
];

export const dayKeys = days.map((d) => d.key);
export const audiences = ['adult', 'youth'];

/**
 * Programs, each tied to the page that owns it. The adult ones become the
 * filter chips on the week board; the kids one drives its own block, so it
 * is not a chip.
 */
export const programs = [
  { slug: 'boxing-basics', label: 'Boxing basics', href: '/beginners-boxing-class/', audience: 'adult' },
  { slug: 'intermediate', label: 'Intermediate boxing', href: '/intermediate-boxing-class/', audience: 'adult' },
  { slug: 'competition', label: 'Competition team', href: '/competition-team-training/', audience: 'adult' },
  { slug: 'open-gym', label: 'Open gym', href: null, audience: 'adult' },
  { slug: 'youth', label: 'Youth boxing', href: '/youth-boxing-class/', audience: 'youth' },
];

export const programSlugs = programs.map((p) => p.slug);

// The committed copy of the week, transcribed from the client's own Schedule
// page in the WordPress export (Tools > Export, 2026-08-26), with two
// changes Ben made on 2026-08-27: the Saturday 9AM class is Boxing Basics
// (their page read "Bsics & Kardio KO"), and Foundational Sparring belongs
// to the competition page.
//
// Saturday open gym reads "2AM-12PM" on the client's page, which is almost
// certainly a typo since weekday mornings are 7AM-10AM. Left as published
// rather than guessed at: the gym can correct it in Sanity in a few seconds
// and every page follows.
//
// TRANSCRIBED FROM THE CLIENT'S OWN SCHEDULE GRAPHIC, 2026-09-08.
//
// Ben sent a screenshot of the schedule image published on
// fightersnashville.com ("Fighters Boxing Schedule"), which settled every
// open question on this file. That image is now the source of truth, and
// it supersedes both the 2026-08-26 WordPress export and everything that
// had been placed provisionally from conversation. The export turned out
// to be materially out of date, so the guesses it forced are all gone:
//
//   6 AM Boxing Basics    Monday and Wednesday only, NOT all five days
//   7 AM Boxing Basics    Tuesday and Thursday only, NOT all five days
//   Intermediate Boxing   Tuesday and Thursday 5:45 PM (the guess had
//                         been Tuesday and Friday; Tuesday was right)
//   Youth Boxing 4:30 PM  Monday and Wednesday, confirmed, ages 8 to 13
//   Saturday open gym     9 AM to 12 PM. The export's "2AM-12PM" was a
//                         typo on their old page, as suspected
//   Saturday 9 AM         plain "Boxing Basics". The export's
//                         "Bsics & Kardio KO" is gone from their schedule
//
// Two classes the export carried no longer exist and are removed:
// "Competition Sparring" and "Foundational Sparring". Thursday evening is
// now Competition Team Training and Intermediate Boxing, both at 5:45 PM,
// then Boxing Basics at 6 PM.
//
// Friday has no morning class and no 5:45 PM class: open gym twice and
// Boxing Basics at 6 PM. Sunday is closed, so it carries no sessions.
//
// `note` carries the graphic's own legend, which is real operational
// information rather than decoration: the two advanced classes need a
// coach's permission, and youth classes are ages 8 to 13.
//
// start/end are 24 hour "HH:MM". end omitted means the client published a
// start time only.
export const fallbackSessions = [
  // ---- Monday ----
  { day: 'mon', name: 'Open Gym', start: '07:00', end: '10:00', audience: 'adult', programs: ['open-gym'] },
  { day: 'mon', name: 'Boxing Basics', start: '06:00', audience: 'adult', programs: ['boxing-basics'] },
  { day: 'mon', name: 'Open Gym', start: '16:30', end: '19:30', audience: 'adult', programs: ['open-gym'] },
  { day: 'mon', name: 'Youth Boxing', start: '16:30', audience: 'youth', programs: ['youth'], note: 'Ages 8 to 13' },
  { day: 'mon', name: 'Competition Team Training', start: '17:45', audience: 'adult', programs: ['competition'], note: 'Coach permission required' },
  { day: 'mon', name: 'Boxing Basics', start: '18:00', audience: 'adult', programs: ['boxing-basics'] },

  // ---- Tuesday ----
  { day: 'tue', name: 'Open Gym', start: '07:00', end: '10:00', audience: 'adult', programs: ['open-gym'] },
  { day: 'tue', name: 'Boxing Basics', start: '07:00', audience: 'adult', programs: ['boxing-basics'] },
  { day: 'tue', name: 'Open Gym', start: '16:30', end: '19:30', audience: 'adult', programs: ['open-gym'] },
  { day: 'tue', name: 'Intermediate Boxing', start: '17:45', audience: 'adult', programs: ['intermediate'], note: 'Coach permission required' },
  { day: 'tue', name: 'Boxing Basics', start: '18:00', audience: 'adult', programs: ['boxing-basics'] },

  // ---- Wednesday ----
  { day: 'wed', name: 'Open Gym', start: '07:00', end: '10:00', audience: 'adult', programs: ['open-gym'] },
  { day: 'wed', name: 'Boxing Basics', start: '06:00', audience: 'adult', programs: ['boxing-basics'] },
  { day: 'wed', name: 'Open Gym', start: '16:30', end: '19:30', audience: 'adult', programs: ['open-gym'] },
  { day: 'wed', name: 'Youth Boxing', start: '16:30', audience: 'youth', programs: ['youth'], note: 'Ages 8 to 13' },
  { day: 'wed', name: 'Competition Team Training', start: '17:45', audience: 'adult', programs: ['competition'], note: 'Coach permission required' },
  { day: 'wed', name: 'Boxing Basics', start: '18:00', audience: 'adult', programs: ['boxing-basics'] },

  // ---- Thursday ----
  { day: 'thu', name: 'Open Gym', start: '07:00', end: '10:00', audience: 'adult', programs: ['open-gym'] },
  { day: 'thu', name: 'Boxing Basics', start: '07:00', audience: 'adult', programs: ['boxing-basics'] },
  { day: 'thu', name: 'Open Gym', start: '16:30', end: '19:30', audience: 'adult', programs: ['open-gym'] },
  { day: 'thu', name: 'Competition Team Training', start: '17:45', audience: 'adult', programs: ['competition'], note: 'Coach permission required' },
  { day: 'thu', name: 'Intermediate Boxing', start: '17:45', audience: 'adult', programs: ['intermediate'], note: 'Coach permission required' },
  { day: 'thu', name: 'Boxing Basics', start: '18:00', audience: 'adult', programs: ['boxing-basics'] },

  // ---- Friday ----
  { day: 'fri', name: 'Open Gym', start: '07:00', end: '10:00', audience: 'adult', programs: ['open-gym'] },
  { day: 'fri', name: 'Open Gym', start: '16:30', end: '19:30', audience: 'adult', programs: ['open-gym'] },
  { day: 'fri', name: 'Boxing Basics', start: '18:00', audience: 'adult', programs: ['boxing-basics'] },

  // ---- Saturday ----
  { day: 'sat', name: 'Open Gym', start: '09:00', end: '12:00', audience: 'adult', programs: ['open-gym'] },
  { day: 'sat', name: 'Boxing Basics', start: '09:00', audience: 'adult', programs: ['boxing-basics'] },
  { day: 'sat', name: 'IBAN Youth', start: '12:00', audience: 'youth', programs: ['youth'], note: 'Ages 8 to 13' },
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

/** Sessions matching { program, audience }, earliest first. */
export function pick(sessions, { program, audience } = {}) {
  return sessions
    .filter(
      (s) =>
        (!program || (s.programs || []).includes(program)) && (!audience || s.audience === audience)
    )
    .sort((a, b) => minutes(a.start) - minutes(b.start));
}

/** All seven days as [{ ...day, sessions }]: the week board. */
export function week(sessions, filter = {}) {
  const matching = pick(sessions, filter);
  return days.map((d) => ({ ...d, sessions: matching.filter((s) => s.day === d.key) }));
}

/**
 * The week as one aligned grid: a row per start time that actually has a
 * class, and seven cells across. Rows exist only for times in use, so the
 * grid stays compact and 6 PM on Monday sits beside 6 PM on Tuesday.
 */
export function matrix(sessions, filter = {}) {
  const matching = pick(sessions, filter);
  const times = [...new Set(matching.map((s) => s.start))].sort(
    (a, b) => minutes(a) - minutes(b)
  );
  // Drop days with nothing in them, so the gym being closed on Sunday
  // does not cost the board a seventh of its width on every page. The
  // client's own schedule graphic runs Monday to Saturday for the same
  // reason. If they ever open on a Sunday, the column returns by itself.
  const shown = days.filter((d) => matching.some((s) => s.day === d.key));
  return times.map((start) => ({
    start,
    label: clock(start),
    cells: shown.map((d) => ({
      ...d,
      sessions: matching.filter((s) => s.day === d.key && s.start === start),
    })),
  }));
}

/** Only the days that actually have a session: the class-page lists. */
export function activeDays(sessions, filter = {}) {
  return week(sessions, filter).filter((d) => d.sessions.length > 0);
}

/** The program a class page owns, or undefined for pages with no classes. */
export function programForHref(href) {
  return programs.find((p) => p.href === href);
}
