import { getRandomUserAgent } from './user-agents';
import { defaultRateLimiter, RateLimiter } from './rate-limiter';

const UA = getRandomUserAgent();

function buildHeaders(): Record<string, string> {
  return {
    'User-Agent': UA,
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'en-US,en;q=0.9,ar;q=0.8',
    'Cache-Control': 'no-cache',
  };
}

export class HttpClient {
  private rateLimiter: RateLimiter;

  constructor(rateLimiter?: RateLimiter) {
    this.rateLimiter = rateLimiter || defaultRateLimiter;
  }

  async fetch<T = string>(
    url: string,
    options: { raw?: boolean; timeoutMs?: number } = {}
  ): Promise<{ ok: boolean; status: number; data: T }> {
    const domain = new URL(url).hostname;
    await this.rateLimiter.acquire(domain);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), options.timeoutMs || 15000);

    try {
      const res = await fetch(url, {
        headers: buildHeaders(),
        signal: controller.signal,
        redirect: 'follow',
      });

      if (!res.ok) {
        this.rateLimiter.release(domain);
        if (res.status === 429 || res.status === 503) {
          const backoff = this.rateLimiter.recordBackoff(domain);
          await new Promise(r => setTimeout(r, backoff));
          return this.fetch(url, options);
        }
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      this.rateLimiter.resetBackoff(domain);
      this.rateLimiter.release(domain);

      const data = options.raw ? (await res.text()) as unknown as T : (await res.json()) as T;
      return { ok: true, status: res.status, data };
    } catch (err: unknown) {
      this.rateLimiter.release(domain);
      if (err instanceof Error && err.name === 'AbortError') {
        throw new Error(`Timeout fetching ${url}`);
      }
      throw err;
    } finally {
      clearTimeout(timeout);
    }
  }

  async fetchJSON<T>(url: string): Promise<T> {
    const result = await this.fetch<T>(url);
    return result.data;
  }
}

export const defaultHttpClient = new HttpClient();
