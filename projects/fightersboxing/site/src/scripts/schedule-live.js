// LIVE SCHEDULE
//
// The times are already in the HTML, rendered at build time. This re-checks
// Sanity when the page loads and re-renders in place if the gym has changed
// something since the last deploy, so a schedule edit in the Studio reaches
// the live site immediately instead of waiting for a rebuild.
//
// Everything about it is optional: no Sanity project configured, a failed
// request, a stripped-down browser, JavaScript off, and the page simply
// keeps the times it was built with.
import { sessionQueryUrl, normalizeSessions } from '../lib/schedule-source.js';
import { week, activeDays } from '../data/schedule.js';
import { renderBoard, renderCards } from '../lib/render-schedule.js';

/** Read a filter off the container: absent attribute means no filter. */
function filterFor(el) {
  const filter = {};
  if (el.dataset.program) filter.program = el.dataset.program;
  if (el.dataset.audience) filter.audience = el.dataset.audience;
  return filter;
}

function updateBoard(el, sessions) {
  const html = renderBoard(week(sessions, filterFor(el)));
  // The day cells come first and the call to action closes the grid, so
  // replace the cells and leave everything else where it is.
  el.querySelectorAll('.day[data-day]').forEach((cell) => cell.remove());
  el.insertAdjacentHTML('afterbegin', html);
}

function updateCards(el, sessions) {
  const board = activeDays(sessions, filterFor(el));
  const section = el.closest('section');
  if (board.length === 0) {
    // The class has no sessions any more: hide the whole block rather than
    // leave an empty heading behind.
    if (section) section.hidden = true;
    return;
  }
  if (section) section.hidden = false;
  el.innerHTML = renderCards(board);
}

export function syncSchedule() {
  const targets = document.querySelectorAll('[data-live="board"], [data-live="cards"]');
  if (targets.length === 0) return;

  const url = sessionQueryUrl(import.meta.env);
  if (!url) return;

  fetch(url)
    .then((res) => (res.ok ? res.json() : Promise.reject(new Error(String(res.status)))))
    .then((body) => {
      const sessions = normalizeSessions(body.result);
      if (sessions.length === 0) return;
      targets.forEach((el) => {
        if (el.dataset.live === 'board') updateBoard(el, sessions);
        else updateCards(el, sessions);
      });
      document.dispatchEvent(new CustomEvent('schedule:updated'));
    })
    .catch(() => {
      // Built-in times stand. Nothing to tell the visitor.
    });
}
