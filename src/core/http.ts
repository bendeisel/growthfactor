// HTTP with retry, backoff, polite rate limiting, and a call counter.
// The call counter feeds ingest_runs so spend and load per source per night are
// visible without opening anybody's dashboard.

export interface HttpOptions {
  /** Total attempts per URL. The build spec caps retries at 3. */
  retries?: number;
  timeoutMs?: number;
  /** Minimum gap between requests. Public county servers are not load balanced. */
  minIntervalMs?: number;
  userAgent?: string;
  headers?: Record<string, string>;
}

export class HttpError extends Error {
  status: number;
  body: string;
  constructor(status: number, body: string, url: string) {
    super(`HTTP ${status} for ${url}: ${body.slice(0, 300)}`);
    this.name = 'HttpError';
    this.status = status;
    this.body = body;
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export class HttpClient {
  calls = 0;
  bytes = 0;
  private lastAt = 0;
  private opts: Required<Omit<HttpOptions, 'headers'>> & { headers: Record<string, string> };

  constructor(opts: HttpOptions = {}) {
    this.opts = {
      retries: opts.retries ?? 3,
      timeoutMs: opts.timeoutMs ?? 45_000,
      minIntervalMs: opts.minIntervalMs ?? 250,
      userAgent: opts.userAgent ?? 'growthfactor-leads/0.1 (public records research)',
      headers: opts.headers ?? {},
    };
  }

  private async throttle(): Promise<void> {
    const wait = this.lastAt + this.opts.minIntervalMs - Date.now();
    if (wait > 0) await sleep(wait);
    this.lastAt = Date.now();
  }

  /** Like request, but also surfaces response headers, needed for PostgREST counts. */
  async requestMeta(
    url: string,
    init: RequestInit = {},
  ): Promise<{ text: string; headers: Headers; status: number }> {
    let lastErr: unknown;
    for (let attempt = 1; attempt <= this.opts.retries; attempt++) {
      await this.throttle();
      const ac = new AbortController();
      const timer = setTimeout(() => ac.abort(), this.opts.timeoutMs);
      try {
        this.calls++;
        const res = await fetch(url, {
          ...init,
          signal: ac.signal,
          headers: {
            'user-agent': this.opts.userAgent,
            accept: 'application/json, text/plain, */*',
            ...this.opts.headers,
            ...(init.headers as Record<string, string> | undefined),
          },
        });
        const text = await res.text();
        this.bytes += text.length;
        if (res.ok) return { text, headers: res.headers, status: res.status };

        const retryable = res.status === 429 || res.status >= 500;
        if (!retryable || attempt === this.opts.retries) {
          throw new HttpError(res.status, text, url);
        }
        const retryAfter = Number(res.headers.get('retry-after'));
        const backoff = Number.isFinite(retryAfter) && retryAfter > 0
          ? retryAfter * 1000
          : 2 ** attempt * 500;
        lastErr = new HttpError(res.status, text, url);
        await sleep(backoff);
      } catch (err) {
        if (err instanceof HttpError && attempt === this.opts.retries) throw err;
        lastErr = err;
        if (attempt === this.opts.retries) break;
        await sleep(2 ** attempt * 500);
      } finally {
        clearTimeout(timer);
      }
    }
    throw lastErr instanceof Error ? lastErr : new Error(`request failed: ${url}`);
  }

  async request(url: string, init: RequestInit = {}): Promise<string> {
    return (await this.requestMeta(url, init)).text;
  }

  async getJson<T = unknown>(url: string, init?: RequestInit): Promise<T> {
    const text = await this.request(url, init);
    try {
      return JSON.parse(text) as T;
    } catch {
      throw new Error(`expected JSON from ${url} but got: ${text.slice(0, 200)}`);
    }
  }

  async getText(url: string, init?: RequestInit): Promise<string> {
    return this.request(url, init);
  }
}

export function qs(params: Record<string, string | number | boolean | undefined>): string {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') p.set(k, String(v));
  }
  return p.toString();
}
