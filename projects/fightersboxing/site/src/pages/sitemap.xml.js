// SITEMAP
//
// Generated, not hand-written. The file this replaced was a stub in
// public/ listing only the homepage: correct on the day it was written,
// when the site WAS one page, and silently wrong ever since. It was still
// declaring 1 URL with 25 built, which tells Google to discover the whole
// site the hard way.
//
// This enumerates the page modules at build time, so a new page is in the
// sitemap the moment it exists and nobody has to remember this file.
// Blog posts come off posts.js for the same reason (the dynamic [post]
// route has no file of its own to glob).
import { posts } from '../data/posts.js';

const SITE = 'https://fightersnashville.com';

// Newest post first, so the whole blog shares one honest lastmod.
const newestPost = posts.map((p) => p.date).sort().reverse()[0];

// Pages that exist as files. Dynamic routes ([post].astro) and endpoints
// (this file) are excluded: the former is expanded from posts.js below,
// the latter is not a page.
const pageFiles = Object.keys(import.meta.glob('./**/*.astro', { eager: false }))
  .map((f) => f.replace(/^\.\//, '').replace(/\.astro$/, ''))
  .filter((name) => !name.includes('[') && !name.startsWith('_'));

const routes = [
  ...pageFiles.map((name) => (name === 'index' ? '/' : `/${name}/`)),
  ...posts.map((p) => `/${p.slug}/`),
];

// Priority reflects what actually earns money here: the schedule and the
// class pages are what people search for and convert on, the legal pages
// are not. Values are hints, not promises, so they stay coarse.
function priorityOf(route) {
  if (route === '/') return '1.0';
  if (route === '/schedule/') return '0.9';
  if (/boxing-class|competition-team|boxing-classes/.test(route)) return '0.9';
  if (/coaches|what-to-expect|faqs|contact-us|our-gyms/.test(route)) return '0.8';
  if (route === '/boxing-blog/') return '0.6';
  if (/privacy-policy|terms-conditions/.test(route)) return '0.2';
  return '0.5';
}

function lastmodOf(route) {
  const post = posts.find((p) => `/${p.slug}/` === route);
  if (post) return post.date;
  if (route === '/boxing-blog/') return newestPost;
  return null;
}

export function GET() {
  const urls = [...new Set(routes)]
    .sort()
    .map((route) => {
      const lastmod = lastmodOf(route);
      return [
        '  <url>',
        `    <loc>${SITE}${route}</loc>`,
        lastmod ? `    <lastmod>${lastmod}</lastmod>` : null,
        `    <priority>${priorityOf(route)}</priority>`,
        '  </url>',
      ]
        .filter(Boolean)
        .join('\n');
    })
    .join('\n');

  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
      `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
    { headers: { 'Content-Type': 'application/xml' } }
  );
}
