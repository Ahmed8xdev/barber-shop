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
    options: { raw?: boolean; timeoutMs?: number; maxRetries?: number } = {}
  ): Promise<{ ok: boolean; status: number; data: T }> {
    const domain = new URL(url).hostname;
    // Every request gets a bounded number of attempts to avoid unending recursion.
    const maxRetries = Math.min(3, Math.max(0, Math.trunc(options.maxRetries ?? 2)));

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      await this.rateLimiter.acquire(domain);
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 15000);
      let retryableResponse = false;

      try {
        const res = await fetch(url, {
          headers: buildHeaders(),
          signal: controller.signal,
          redirect: 'follow',
        });

        if (res.ok) {
          // Keep the slot acquired until the response body has been consumed.
          const data = options.raw ? (await res.text()) as unknown as T : (await res.json()) as T;
          this.rateLimiter.resetBackoff(domain);
          return { ok: true, status: res.status, data };
        }

        retryableResponse = res.status === 429 || res.status === 503;
        if (!retryableResponse || attempt === maxRetries) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') {
          throw new Error(`Timeout fetching ${url}`);
        }
        throw err;
      } finally {
        clearTimeout(timeout);
        // Release exactly once, including failures and JSON parsing errors.
        this.rateLimiter.release(domain);
      }

      if (retryableResponse) {
        this.rateLimiter.recordBackoff(domain);
        await this.rateLimiter.waitWithJitter(domain);
      }
    }

    throw new Error(`Retry budget exhausted fetching ${url}`);
  }

  async fetchJSON<T>(url: string): Promise<T> {
    const result = await this.fetch<T>(url);
    return result.data;
  }
}

export const defaultHttpClient = new HttpClient();
