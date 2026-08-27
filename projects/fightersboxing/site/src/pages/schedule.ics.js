// THE SUBSCRIBE FEED
//
// /schedule.ics, generated from src/data/schedule.js at build time. Each
// session becomes one weekly repeating event, so a member subscribes once
// and the gym's week sits in their phone calendar for good. Change a time
// in the dataset, redeploy, and every subscriber's calendar updates on its
// next refresh (12 hours, per REFRESH-INTERVAL below).
//
// Times are America/Chicago with the VTIMEZONE block spelled out, so the
// feed is correct across daylight saving without the client's calendar
// having to guess.
import { sessions, days } from '../data/schedule.js';

const TZ = 'America/Chicago';
const LOCATION = 'Fighters Boxing Gym, 405 42nd Ave N, Nashville, TN 37209';
// Sessions the client published without an end time run 60 minutes here.
const DEFAULT_MINUTES = 60;
// Week of Monday 5 January 2026: the anchor the weekly rules count from.
const ANCHOR = {
  mon: '20260105',
  tue: '20260106',
  wed: '20260107',
  thu: '20260108',
  fri: '20260109',
  sat: '20260110',
  sun: '20260111',
};
// Fixed so a rebuild with no schedule change produces an identical file.
const STAMP = '20260827T120000Z';

/** "17:45" -> "174500" */
function hhmmss(hhmm) {
  return `${hhmm.replace(':', '')}00`;
}

/** end time for a session, defaulting to a one hour block */
function endTime(session) {
  if (session.end) return session.end;
  const [h, m] = session.start.split(':').map(Number);
  const total = h * 60 + m + DEFAULT_MINUTES;
  const hh = String(Math.floor(total / 60) % 24).padStart(2, '0');
  const mm = String(total % 60).padStart(2, '0');
  return `${hh}:${mm}`;
}

function slug(text) {
  return text
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/** escape then fold to the 75 octet line limit the spec asks for */
function line(name, value) {
  const escaped = String(value)
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
  const full = `${name}:${escaped}`;
  if (full.length <= 75) return full;
  const parts = [full.slice(0, 75)];
  let rest = full.slice(75);
  while (rest.length > 74) {
    parts.push(` ${rest.slice(0, 74)}`);
    rest = rest.slice(74);
  }
  if (rest) parts.push(` ${rest}`);
  return parts.join('\r\n');
}

export function GET() {
  const icsDay = Object.fromEntries(days.map((d) => [d.key, d.ics]));

  const events = sessions.map((s, i) => {
    const date = ANCHOR[s.day];
    return [
      'BEGIN:VEVENT',
      line('UID', `${s.day}-${s.start.replace(':', '')}-${slug(s.name)}-${i}@fightersnashville.com`),
      line('DTSTAMP', STAMP),
      `DTSTART;TZID=${TZ}:${date}T${hhmmss(s.start)}`,
      `DTEND;TZID=${TZ}:${date}T${hhmmss(endTime(s))}`,
      `RRULE:FREQ=WEEKLY;BYDAY=${icsDay[s.day]}`,
      line('SUMMARY', s.name),
      line('LOCATION', LOCATION),
      line('DESCRIPTION', 'Fighters Boxing Gym, Nashville. Call 629-289-2988 with any questions.'),
      'END:VEVENT',
    ].join('\r\n');
  });

  const body = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Fighters Boxing Gym//Weekly Class Schedule//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    line('X-WR-CALNAME', 'Fighters Boxing Gym Classes'),
    `X-WR-TIMEZONE:${TZ}`,
    'REFRESH-INTERVAL;VALUE=DURATION:PT12H',
    'X-PUBLISHED-TTL:PT12H',
    'BEGIN:VTIMEZONE',
    `TZID:${TZ}`,
    'BEGIN:DAYLIGHT',
    'TZOFFSETFROM:-0600',
    'TZOFFSETTO:-0500',
    'TZNAME:CDT',
    'DTSTART:19700308T020000',
    'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=2SU',
    'END:DAYLIGHT',
    'BEGIN:STANDARD',
    'TZOFFSETFROM:-0500',
    'TZOFFSETTO:-0600',
    'TZNAME:CST',
    'DTSTART:19701101T020000',
    'RRULE:FREQ=YEARLY;BYMONTH=11;BYDAY=1SU',
    'END:STANDARD',
    'END:VTIMEZONE',
    ...events,
    'END:VCALENDAR',
    '',
  ].join('\r\n');

  return new Response(body, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'inline; filename="fighters-boxing-schedule.ics"',
    },
  });
}
