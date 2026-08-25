// Headless browser control with no dependencies.
//
// Some public records portals render their results with JavaScript, so plain HTTP
// returns an empty shell. Rather than pay a scraping platform for a browser, this
// drives a locally installed Chromium over the DevTools Protocol using the
// WebSocket built into Node. No Playwright, no Puppeteer, no monthly fee.
//
// It is deliberately modest: navigate, optionally fill and submit a form, wait for
// something to appear, read the rendered HTML, optionally click through pages. That
// covers the county court portals this project cares about. It is not a general
// purpose automation framework, and it does not defeat bot protection or CAPTCHAs.
// If a site needs that, see docs/SCRAPING.md for the better options.

import { spawn, type ChildProcess } from 'node:child_process';
import { existsSync } from 'node:fs';
import { getEnv } from './env.ts';

/** Where a Chromium binary usually lives, in the order worth trying. */
const CANDIDATE_PATHS = [
  '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',
  '/opt/pw-browsers/chromium/chrome-linux/chrome',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
];

export function findBrowser(explicit?: string): string {
  const fromEnv = explicit ?? getEnv('GF_BROWSER_PATH') ?? getEnv('CHROME_PATH');
  if (fromEnv) {
    if (!existsSync(fromEnv)) throw new Error(`browser not found at ${fromEnv}`);
    return fromEnv;
  }
  for (const p of CANDIDATE_PATHS) {
    if (existsSync(p)) return p;
  }
  throw new Error(
    'no Chromium or Chrome found. Install Chrome, or set GF_BROWSER_PATH to the binary. '
    + 'On a Mac with Chrome installed that is '
    + '"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome".',
  );
}

export interface Step {
  /** waitForSelector waits for an element, wait pauses, type fills, click clicks. */
  type: 'click' | 'type' | 'wait' | 'waitForSelector' | 'select';
  selector?: string;
  text?: string;
  ms?: number;
}

export interface RenderOptions {
  /** Wait until this selector exists before reading the page. */
  waitForSelector?: string;
  /** Fixed settle time after load, for pages that fill in progressively. */
  waitMs?: number;
  /** Fill a search form and submit it before reading results. */
  steps?: Step[];
  /** Click this to advance, up to maxPages times. */
  nextSelector?: string;
  maxPages?: number;
  timeoutMs?: number;
}

interface CdpMessage {
  id?: number;
  method?: string;
  params?: Record<string, unknown>;
  result?: Record<string, unknown>;
  error?: { message: string };
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function jsString(s: string): string {
  return JSON.stringify(s);
}

export class HeadlessBrowser {
  private proc: ChildProcess;
  private ws: WebSocket;
  private nextId = 1;
  private pending = new Map<number, (m: CdpMessage) => void>();
  private sessionId?: string;
  private timeoutMs: number;

  private constructor(proc: ChildProcess, ws: WebSocket, timeoutMs: number) {
    this.proc = proc;
    this.ws = ws;
    this.timeoutMs = timeoutMs;
    this.ws.onmessage = (ev: MessageEvent) => {
      let msg: CdpMessage;
      try {
        msg = JSON.parse(String(ev.data)) as CdpMessage;
      } catch { return; }
      if (msg.id && this.pending.has(msg.id)) {
        this.pending.get(msg.id)!(msg);
        this.pending.delete(msg.id);
      }
    };
  }

  static async launch(opts: { executablePath?: string; timeoutMs?: number } = {}): Promise<HeadlessBrowser> {
    const bin = findBrowser(opts.executablePath);
    const timeoutMs = opts.timeoutMs ?? 30_000;
    const proc = spawn(bin, [
      '--headless',
      '--disable-gpu',
      '--no-sandbox',
      '--disable-dev-shm-usage',
      '--disable-extensions',
      '--disable-background-networking',
      '--remote-debugging-port=0',
      // Required for a WebSocket client that is not a browser page.
      '--remote-allow-origins=*',
      'about:blank',
    ], { stdio: ['ignore', 'pipe', 'pipe'] });

    const endpoint = await new Promise<string>((resolve, reject) => {
      let buf = '';
      const timer = setTimeout(
        () => reject(new Error(`browser did not report a debug endpoint in ${timeoutMs}ms: ${buf.slice(0, 300)}`)),
        timeoutMs,
      );
      proc.stderr?.on('data', (d: Buffer) => {
        buf += d.toString();
        const m = buf.match(/ws:\/\/\S+/);
        if (m) { clearTimeout(timer); resolve(m[0]); }
      });
      proc.on('exit', (code) => {
        clearTimeout(timer);
        reject(new Error(`browser exited with ${code}: ${buf.slice(0, 300)}`));
      });
    });

    const ws = new WebSocket(endpoint);
    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('websocket connect timed out')), timeoutMs);
      ws.onopen = () => { clearTimeout(timer); resolve(); };
      ws.onerror = () => { clearTimeout(timer); reject(new Error('websocket connect failed')); };
    });

    const browser = new HeadlessBrowser(proc, ws, timeoutMs);
    const target = await browser.send('Target.createTarget', { url: 'about:blank' });
    const attached = await browser.send('Target.attachToTarget', {
      targetId: (target.result as { targetId: string }).targetId,
      flatten: true,
    });
    browser.sessionId = (attached.result as { sessionId: string }).sessionId;
    await browser.send('Page.enable');
    await browser.send('Runtime.enable');
    return browser;
  }

  private send(method: string, params: Record<string, unknown> = {}): Promise<CdpMessage> {
    return new Promise((resolve, reject) => {
      const id = this.nextId++;
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`${method} timed out after ${this.timeoutMs}ms`));
      }, this.timeoutMs);
      this.pending.set(id, (msg) => {
        clearTimeout(timer);
        if (msg.error) reject(new Error(`${method}: ${msg.error.message}`));
        else resolve(msg);
      });
      this.ws.send(JSON.stringify({ id, method, params, sessionId: this.sessionId }));
    });
  }

  /** Evaluate an expression in the page and return its value. */
  private async evaluate<T>(expression: string): Promise<T> {
    const msg = await this.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    const result = msg.result as { result?: { value?: T }; exceptionDetails?: { text?: string } };
    if (result.exceptionDetails) {
      throw new Error(`page script failed: ${result.exceptionDetails.text ?? 'unknown'}`);
    }
    return result.result?.value as T;
  }

  async goto(url: string): Promise<void> {
    await this.send('Page.navigate', { url });
    // Poll readiness rather than relying on a load event that may already have
    // fired before the listener was attached.
    const deadline = Date.now() + this.timeoutMs;
    while (Date.now() < deadline) {
      const state = await this.evaluate<string>('document.readyState');
      if (state === 'interactive' || state === 'complete') return;
      await sleep(50);
    }
    throw new Error(`page did not become ready: ${url}`);
  }

  async waitForSelector(selector: string, timeoutMs = this.timeoutMs): Promise<void> {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      const found = await this.evaluate<boolean>(
        `!!document.querySelector(${jsString(selector)})`,
      );
      if (found) return;
      await sleep(100);
    }
    throw new Error(`selector never appeared: ${selector}`);
  }

  async click(selector: string): Promise<void> {
    const ok = await this.evaluate<boolean>(
      `(() => { const el = document.querySelector(${jsString(selector)});
         if (!el) return false; el.click(); return true; })()`,
    );
    if (!ok) throw new Error(`nothing to click at ${selector}`);
  }

  /** Fill an input and fire the events a framework listens for. */
  async type(selector: string, text: string): Promise<void> {
    const ok = await this.evaluate<boolean>(
      `(() => { const el = document.querySelector(${jsString(selector)});
         if (!el) return false;
         el.focus(); el.value = ${jsString(text)};
         el.dispatchEvent(new Event('input', { bubbles: true }));
         el.dispatchEvent(new Event('change', { bubbles: true }));
         return true; })()`,
    );
    if (!ok) throw new Error(`no input at ${selector}`);
  }

  async select(selector: string, value: string): Promise<void> {
    const ok = await this.evaluate<boolean>(
      `(() => { const el = document.querySelector(${jsString(selector)});
         if (!el) return false; el.value = ${jsString(value)};
         el.dispatchEvent(new Event('change', { bubbles: true })); return true; })()`,
    );
    if (!ok) throw new Error(`no select at ${selector}`);
  }

  async html(): Promise<string> {
    return this.evaluate<string>('document.documentElement.outerHTML');
  }

  async runSteps(steps: Step[]): Promise<void> {
    for (const step of steps) {
      if (step.type === 'wait') await sleep(step.ms ?? 500);
      else if (step.type === 'waitForSelector') await this.waitForSelector(step.selector!, step.ms);
      else if (step.type === 'click') await this.click(step.selector!);
      else if (step.type === 'type') await this.type(step.selector!, step.text ?? '');
      else if (step.type === 'select') await this.select(step.selector!, step.text ?? '');
    }
  }

  async close(): Promise<void> {
    try { this.ws.close(); } catch { /* already closed */ }
    this.proc.kill();
    // Give it a moment, then insist.
    await sleep(50);
    if (this.proc.exitCode == null) this.proc.kill('SIGKILL');
  }
}

/**
 * Render one or more pages and yield the HTML of each.
 * Always closes the browser, including on failure.
 */
export async function* renderPages(
  url: string,
  opts: RenderOptions = {},
  executablePath?: string,
): AsyncGenerator<string> {
  const browser = await HeadlessBrowser.launch({
    executablePath,
    timeoutMs: opts.timeoutMs ?? 30_000,
  });
  try {
    await browser.goto(url);
    if (opts.steps?.length) await browser.runSteps(opts.steps);
    if (opts.waitForSelector) await browser.waitForSelector(opts.waitForSelector);
    if (opts.waitMs) await sleep(opts.waitMs);

    const maxPages = Math.max(1, opts.maxPages ?? 1);
    for (let page = 0; page < maxPages; page++) {
      yield await browser.html();
      if (page + 1 >= maxPages || !opts.nextSelector) break;
      try {
        await browser.click(opts.nextSelector);
      } catch {
        break; // no next link, the listing is finished
      }
      if (opts.waitForSelector) await browser.waitForSelector(opts.waitForSelector);
      await sleep(opts.waitMs ?? 500);
    }
  } finally {
    await browser.close();
  }
}
