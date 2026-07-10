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
  const { url, retries = 3, baseDelayMs = 500, timeoutMs = 8000 } = options;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const headers = buildStealthHeaders();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      const res = await fetch(url, {
        headers,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) return res;

      if (res.status === 429 || res.status === 403) {
        lastError = new Error(`HTTP ${res.status}`);
        const delay = baseDelayMs * Math.pow(2, attempt) + Math.random() * baseDelayMs * 0.3;
        await new Promise(r => setTimeout(r, delay));
        continue;
      }

      if (res.status >= 500) {
        lastError = new Error(`HTTP ${res.status}`);
        const delay = baseDelayMs * Math.pow(2, attempt) + Math.random() * baseDelayMs * 0.3;
        await new Promise(r => setTimeout(r, delay));
        continue;
      }

      return res;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt < retries) {
        const delay = baseDelayMs * Math.pow(2, attempt) + Math.random() * baseDelayMs * 0.3;
        await new Promise(r => setTimeout(r, delay));
      }
    }
  }

  throw lastError || new Error("Fetch failed after retries");
}
