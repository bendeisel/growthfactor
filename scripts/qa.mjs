#!/usr/bin/env node
/**
 * Quality gate. Runs against a staging URL after assembly.
 * Blocking failures mean the site does not go to the client.
 *
 *   npm i -D playwright @axe-core/playwright
 *   node scripts/qa.mjs https://staging.example.com
 *
 * Chromium is preinstalled in this environment at PLAYWRIGHT_BROWSERS_PATH.
 * See qa/checklist.md for the full gate, including the human polish items
 * this script deliberately does not attempt to automate.
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { chromium } from 'playwright';
import { AxeBuilder } from '@axe-core/playwright';

const BASE = process.argv[2];
if (!BASE) {
  console.error('usage: node scripts/qa.mjs <staging-url> [path,path,...]');
  process.exit(2);
}
const PATHS = (process.argv[3] ?? '/').split(',');
const OUT = 'qa/reports';

const BUDGET = {
  lcpMs: 2500,
  cls: 0.1,
  pageWeightBytes: 2_000_000,
  heroPosterBytes: 150_000,
};

const VIEWPORTS = [
  { name: 'mobile', width: 390, height: 844 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'laptop', width: 1024, height: 768 },
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'wide', width: 1920, height: 1080 },
];

const PLACEHOLDERS = [/lorem ipsum/i, /\bTODO\b/, /\{\{[^}]+\}\}/, /\bplaceholder\b/i, /your business name/i];

const failures = [];
const notes = [];

mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();

for (const path of PATHS) {
  const url = new URL(path, BASE).href;
  const label = path.replace(/\W+/g, '_') || 'home';

  /* ---- perf + integrity on throttled mobile ---- */
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent:
      'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Mobile Safari/537.36',
  });
  const page = await ctx.newPage();

  let weight = 0;
  const resources = [];
  page.on('response', async (res) => {
    const len = Number(res.headers()['content-length'] ?? 0);
    weight += len;
    resources.push({ url: res.url(), type: res.request().resourceType(), bytes: len });
  });

  // Emulate a slow 4G connection so the numbers mean something.
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Network.emulateNetworkConditions', {
    offline: false,
    latency: 150,
    downloadThroughput: (1.6 * 1024 * 1024) / 8,
    uploadThroughput: (750 * 1024) / 8,
  });
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });

  await page.goto(url, { waitUntil: 'networkidle', timeout: 60_000 });

  const vitals = await page.evaluate(
    () =>
      new Promise((resolve) => {
        const out = { lcp: 0, cls: 0, lcpElement: '' };
        new PerformanceObserver((list) => {
          const e = list.getEntries().at(-1);
          out.lcp = e.startTime;
          out.lcpElement = e.element
            ? `${e.element.tagName.toLowerCase()}${e.element.id ? '#' + e.element.id : ''}`
            : 'unknown';
        }).observe({ type: 'largest-contentful-paint', buffered: true });

        new PerformanceObserver((list) => {
          for (const e of list.getEntries()) if (!e.hadRecentInput) out.cls += e.value;
        }).observe({ type: 'layout-shift', buffered: true });

        setTimeout(() => resolve(out), 3000);
      })
  );

  if (vitals.lcp > BUDGET.lcpMs) failures.push(`${path}: LCP ${Math.round(vitals.lcp)}ms > ${BUDGET.lcpMs}ms`);
  if (vitals.cls > BUDGET.cls) failures.push(`${path}: CLS ${vitals.cls.toFixed(3)} > ${BUDGET.cls}`);
  if (weight > BUDGET.pageWeightBytes)
    failures.push(`${path}: page weight ${(weight / 1e6).toFixed(2)}MB > ${BUDGET.pageWeightBytes / 1e6}MB`);

  // The rule the whole depth system rests on: 3D is never LCP.
  if (/^(video|canvas)/.test(vitals.lcpElement))
    failures.push(`${path}: LCP element is <${vitals.lcpElement}> — must be text or a static poster`);

  // Hero imagery is the LCP candidate, so it carries its own tighter budget.
  const oversizedHero = resources
    .filter((r) => r.type === 'image' && r.bytes > BUDGET.heroPosterBytes)
    .slice(0, 5);
  for (const r of oversizedHero)
    failures.push(`${path}: image ${Math.round(r.bytes / 1024)}KB exceeds ${BUDGET.heroPosterBytes / 1024}KB — ${r.url}`);

  notes.push(`${path}: LCP ${Math.round(vitals.lcp)}ms on <${vitals.lcpElement}>, CLS ${vitals.cls.toFixed(3)}, ${(weight / 1e6).toFixed(2)}MB`);

  /* ---- accessibility ---- */
  const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag22aa']).analyze();
  const serious = axe.violations.filter((v) => ['critical', 'serious'].includes(v.impact));
  for (const v of serious) failures.push(`${path}: a11y ${v.impact} — ${v.id} (${v.nodes.length} nodes)`);

  /* ---- content integrity ---- */
  const text = await page.locator('body').innerText();
  for (const re of PLACEHOLDERS) {
    if (re.test(text)) failures.push(`${path}: placeholder content matching ${re}`);
  }

  const imgsMissingAlt = await page.locator('img:not([alt])').count();
  if (imgsMissingAlt) failures.push(`${path}: ${imgsMissingAlt} image(s) missing alt`);

  const h1s = await page.locator('h1').count();
  if (h1s !== 1) failures.push(`${path}: ${h1s} <h1> elements, expected exactly 1`);

  // Every depth-layer must reserve space or it will shift the page.
  const unreserved = await page.evaluate(() =>
    [...document.querySelectorAll('[data-depth-layer]')].filter((el) => {
      const s = getComputedStyle(el);
      return s.aspectRatio === 'auto' && !s.height.endsWith('px');
    }).length
  );
  if (unreserved) failures.push(`${path}: ${unreserved} depth-layer(s) without reserved dimensions`);

  /* ---- links ---- */
  const links = await page.$$eval('a[href]', (as) => as.map((a) => a.href));
  const internal = [...new Set(links)].filter((h) => h.startsWith(BASE));
  for (const href of internal.slice(0, 60)) {
    const res = await page.request.head(href).catch(() => null);
    if (!res || res.status() >= 400) failures.push(`${path}: broken link ${href} (${res?.status() ?? 'unreachable'})`);
  }

  /* ---- reduced motion ---- */
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.reload({ waitUntil: 'networkidle' });
  const playing = await page.evaluate(
    () => [...document.querySelectorAll('video')].filter((v) => !v.paused).length
  );
  if (playing) failures.push(`${path}: ${playing} video(s) still playing under prefers-reduced-motion`);
  await page.emulateMedia({ reducedMotion: null });

  await ctx.close();

  /* ---- responsive screenshots + overflow ---- */
  for (const vp of VIEWPORTS) {
    const c = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
    const p = await c.newPage();
    await p.goto(url, { waitUntil: 'networkidle' });
    await p.screenshot({ path: `${OUT}/${label}-${vp.name}.png`, fullPage: true });

    const overflow = await p.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
    if (overflow) failures.push(`${path} @${vp.width}px: horizontal overflow`);
    await c.close();
  }
}

await browser.close();

writeFileSync(
  `${OUT}/summary.json`,
  JSON.stringify({ base: BASE, budget: BUDGET, notes, failures }, null, 2)
);

console.log('\n' + notes.join('\n'));
console.log(`\nScreenshots → ${OUT}/`);

if (failures.length) {
  console.log('\nBLOCKING FAILURES:');
  for (const f of failures) console.log(`  ✗ ${f}`);
  console.log(`\n${failures.length} failure(s). Do not send to client.`);
  process.exit(1);
}
console.log('\nGate passed. Now do the human polish pass — see qa/checklist.md.');
