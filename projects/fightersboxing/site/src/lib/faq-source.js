// WHERE THE ANSWERS COME FROM
//
// Same story as the schedule: Sanity is the source of truth, the build
// reads it and writes the answers into the HTML, and the committed copy in
// src/data/faqs.js is the fallback so the site always builds.
//
// Unlike the schedule there is no browser re-check. Answers change rarely,
// and the alternative would mean shipping every answer twice, once in the
// HTML and once in a JavaScript bundle, on a page whose whole job is being
// read and quoted.
import { fallbackFaqs, faqSections } from '../data/faqs.js';
import { queryUrl, fetchOrFallback } from './sanity.js';

const sectionSlugs = faqSections.map((s) => s.slug);

/** One document per question. Drafts stay out, and order is the gym's. */
export const FAQ_QUERY = `*[_type == "faqItem" && !(_id in path("drafts.**"))] | order(order asc){
  "q": question, "a": answer, section, order
}`;

/** Drop anything half-typed rather than letting it break the page. */
export function normalizeFaqs(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(
      (f) =>
        f &&
        typeof f.q === 'string' &&
        f.q.trim() &&
        typeof f.a === 'string' &&
        f.a.trim() &&
        sectionSlugs.includes(f.section)
    )
    .map((f) => ({
      q: f.q.trim(),
      // Answers are written as one or more paragraphs of plain text in the
      // Studio; the page renders them as paragraphs.
      a: f.a
        .trim()
        .split(/\n{2,}/)
        .map((para) => `<p>${para.trim()}</p>`)
        .join(''),
      section: f.section,
    }));
}

let pending = null;

export function getFaqs(env = import.meta.env) {
  pending =
    pending ||
    fetchOrFallback({
      url: queryUrl(env, FAQ_QUERY),
      label: 'faqs',
      parse: normalizeFaqs,
      fallback: fallbackFaqs,
    });
  return pending;
}
