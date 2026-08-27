// ONE RENDERER, TWO RUNTIMES
//
// These functions return HTML strings, which means Astro can call them at
// build time and the browser can call them again after fetching a fresh
// schedule from Sanity. Same markup either way, so a live update cannot
// drift from what was built.
import { timeLabel } from '../data/schedule.js';

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function slotsHtml(sessions) {
  return sessions
    .map(
      (s) => `<li class="slot" data-programs="${escapeHtml((s.programs || []).join(' '))}">
          <span class="slot-time">${escapeHtml(timeLabel(s))}</span>
          <span class="slot-name">${escapeHtml(s.name)}</span>
        </li>`
    )
    .join('');
}

/** The week board: one cell per day, whether or not it has sessions. */
export function renderBoard(board) {
  return board
    .map(
      (day) => `<div class="day" data-day="${escapeHtml(day.key)}">
        <p class="day-name">${escapeHtml(day.name)}</p>
        <ul class="slots">${slotsHtml(day.sessions)}</ul>
        <p class="day-empty"${day.sessions.length > 0 ? ' hidden' : ''}>No sessions</p>
      </div>`
    )
    .join('');
}

/** The day-card strips: only the days that have sessions. */
export function renderCards(board) {
  return board
    .map(
      (day) => `<li class="card">
        <p class="card-day">${escapeHtml(day.name)}</p>
        <ul class="card-slots">${slotsHtml(day.sessions)}</ul>
      </li>`
    )
    .join('');
}
