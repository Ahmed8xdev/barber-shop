const BROWSER_FINGERPRINTS = [
  {
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    acceptLanguage: "en-US,en;q=0.9",
    secChUa: '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
    secChUaMobile: "?0",
    secChUaPlatform: '"Windows"',
  },
  {
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
    acceptLanguage: "en-US,en;q=0.9",
    secChUa: '"Chromium";v="125", "Google Chrome";v="125", "Not-A.Brand";v="99"',
    secChUaMobile: "?0",
    secChUaPlatform: '"Windows"',
  },
  {
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15",
    acceptLanguage: "en-US,en;q=0.9",
    secChUa: undefined,
    secChUaMobile: undefined,
    secChUaPlatform: undefined,
  },
  {
    userAgent: "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    acceptLanguage: "en-US,en;q=0.9",
    secChUa: '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
    secChUaMobile: "?0",
    secChUaPlatform: '"Linux"',
  },
];

let fingerprintIndex = 0;

export function getNextFingerprint() {
  const fp = BROWSER_FINGERPRINTS[fingerprintIndex % BROWSER_FINGERPRINTS.length];
  fingerprintIndex++;
  return fp;
}

export function buildStealthHeaders(): Record<string, string> {
  const fp = getNextFingerprint();
  const headers: Record<string, string> = {
    "User-Agent": fp.userAgent,
    Accept: "application/json, text/plain, */*",
    "Accept-Language": fp.acceptLanguage,
    "Accept-Encoding": "gzip, deflate, br",
    "Cache-Control": "no-cache",
    Pragma: "no-cache",
    "Sec-Fetch-Dest": "empty",
    "Sec-Fetch-Mode": "cors",
    "Sec-Fetch-Site": "same-origin",
  };
  if (fp.secChUa) headers["Sec-Ch-Ua"] = fp.secChUa;
  if (fp.secChUaMobile) headers["Sec-Ch-Ua-Mobile"] = fp.secChUaMobile;
  if (fp.secChUaPlatform) headers["Sec-Ch-Ua-Platform"] = fp.secChUaPlatform;
  const rng = Math.random();
  if (rng < 0.33) headers["Priority"] = "u=1, i";
  else if (rng < 0.66) headers["Priority"] = "u=0, i";
  return headers;
}

export interface FetchWithRetryOptions {
  url: string;
  retries?: number;
  baseDelayMs?: number;
  proxy?: { host: string; port: number; protocol: string };
  timeoutMs?: number;
}

export async function stealthFetch(options: FetchWithRetryOptions): Promise<Response> {
  const { url } = options;
  // A misconfigured caller must never produce an unbounded number of requests.
  const retries = Number.isSafeInteger(options.retries) ? Math.max(0, Math.min(3, options.retries!)) : 2;
  const baseDelayMs = Number.isFinite(options.baseDelayMs) && (options.baseDelayMs ?? 0) >= 0
    ? Math.min(5000, options.baseDelayMs!) : 500;
  const timeoutMs = Number.isFinite(options.timeoutMs) && (options.timeoutMs ?? 0) > 0
    ? Math.min(30000, options.timeoutMs!) : 8000;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      // AbortSignal.timeout releases its timer with the request lifecycle.
      // The previous manual timer leaked whenever fetch() rejected.
      const res = await fetch(url, {
        headers: buildStealthHeaders(),
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (res.ok) return res;

      // Permission failures (403) and other 4xx statuses should not be
      // retried automatically. Retry only rate limiting or server outages.
      const retryable = res.status === 429 || res.status >= 500;
      if (!retryable) return res;
      lastError = new Error(`HTTP ${res.status}`);
      if (attempt === retries) break;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt === retries) break;
    }

    const delay = Math.min(10000, baseDelayMs * Math.pow(2, attempt))
      + Math.random() * baseDelayMs * 0.3;
    await new Promise(resolve => setTimeout(resolve, delay));
  }
  throw lastError || new Error("Fetch failed after retries");
}
