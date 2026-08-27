// ONE RENDERER, TWO RUNTIMES
//
// These functions return HTML strings, which means Astro can call them at
// build time and the browser can call them again after fetching a fresh
// schedule from Sanity. Same markup either way, so a live update cannot
// drift from what was built.
import { clock } from '../data/schedule.js';

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function classChip(session) {
  const until = session.end
    ? `<span class="chip-until">to ${escapeHtml(clock(session.end))}</span>`
    : '';
  return `<span class="class-chip" data-programs="${escapeHtml((session.programs || []).join(' '))}">
      <span class="chip-name">${escapeHtml(session.name)}</span>${until}
    </span>`;
}

/**
 * The week as one grid: a time rail down the left, seven days across, and
 * every class sitting on its own time row so the same hour lines up across
 * the week. Emitted as a flat run of cells because the whole thing is a
 * single CSS grid, which is what keeps the rows aligned.
 */
export function renderMatrix(rows) {
  const head = rows.length
    ? `<div class="m-corner"></div>` +
      rows[0].cells
        .map(
          (d) =>
            `<div class="m-head"><span class="m-head-long">${escapeHtml(d.name)}</span><span class="m-head-short">${escapeHtml(d.short)}</span></div>`
        )
        .join('')
    : '';

  const body = rows
    .map((row) => {
      const cells = row.cells
        .map(
          (cell) =>
            `<div class="m-cell" data-row="${escapeHtml(row.start)}">${cell.sessions.map(classChip).join('')}</div>`
        )
        .join('');
      return `<div class="m-time" data-row="${escapeHtml(row.start)}">${escapeHtml(row.label)}</div>${cells}`;
    })
    .join('');

  return head + body;
}

/**
 * One class across the week, as a compact run of rows: the day, then its
 * times. Used on the class pages and for the kids block.
 */
export function renderList(board) {
  return board
    .map(
      (day) => `<li class="tl-row">
        <span class="tl-day">${escapeHtml(day.name)}</span>
        <span class="tl-times">${day.sessions
          .map(
            (s) =>
              `<span class="tl-time"><b>${escapeHtml(clock(s.start))}</b>${
                s.end ? ` to ${escapeHtml(clock(s.end))}` : ''
              }<em>${escapeHtml(s.name)}</em></span>`
          )
          .join('')}</span>
      </li>`
    )
    .join('');
}
