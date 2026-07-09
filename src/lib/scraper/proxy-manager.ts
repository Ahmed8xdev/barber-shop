interface ProxyEntry {
  host: string;
  port: number;
  protocol: 'http' | 'https' | 'socks4' | 'socks5';
  successCount: number;
  failureCount: number;
  consecutiveFailures: number;
  isDead: boolean;
  cooldownUntil: number;
  lastUsed: number;
  latencyMs?: number;
}

interface ProxyManagerConfig {
  maxConsecutiveFailuresBeforeCooldown: number;
  cooldownBaseMs: number;
  cooldownMaxMs: number;
  healthCheckUrl: string;
  maxPoolSize: number;
  refreshIntervalMs: number;
  minProxiesBeforeRefresh: number;
}

const DEFAULT_CONFIG: ProxyManagerConfig = {
  maxConsecutiveFailuresBeforeCooldown: 3,
  cooldownBaseMs: 60_000,
  cooldownMaxMs: 7_200_000,
  healthCheckUrl: 'https://httpbin.org/ip',
  maxPoolSize: 2000,
  refreshIntervalMs: 1_800_000,
  minProxiesBeforeRefresh: 50,
};

const PROXY_LIST_URLS = [
  'https://raw.githubusercontent.com/mohammedcha/ProxRipper/main/full_proxies/http.txt',
  'https://raw.githubusercontent.com/mohammedcha/ProxRipper/main/full_proxies/https.txt',
  'https://cdn.jsdelivr.net/gh/proxyscrape/free-proxy-list@main/proxies/protocols/http/data.txt',
  'https://raw.githubusercontent.com/VPSLabCloud/VPSLab-Free-Proxy-List/main/http_all.txt',
  'https://raw.githubusercontent.com/TheSpeedX/PROXY-List/master/http.txt',
  'https://raw.githubusercontent.com/monosans/proxy-list/main/proxies/http.txt',
];

function parseProxyLine(line: string): { host: string; port: number; protocol: 'http' | 'https' } | null {
  const s = line.trim();
  if (!s) return null;

  let protocol: 'http' | 'https' = 'http';
  let rest = s;

  if (s.startsWith('http://')) { protocol = 'http'; rest = s.slice(7); }
  else if (s.startsWith('https://')) { protocol = 'https'; rest = s.slice(8); }
  else if (s.startsWith('socks4://') || s.startsWith('socks5://')) return null;

  const parts = rest.split(':');
  if (parts.length !== 2) return null;

  const port = parseInt(parts[1], 10);
  if (isNaN(port) || port < 1 || port > 65535) return null;

  return { host: parts[0], port, protocol };
}

export class ProxyManager {
  private proxies: Map<string, ProxyEntry> = new Map();
  private config: ProxyManagerConfig;
  private refreshTimer: ReturnType<typeof setTimeout> | null = null;
  private isRefreshing = false;

  constructor(config: Partial<ProxyManagerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.refreshPool();
  }

  private key(e: { protocol: string; host: string; port: number }): string {
    return `${e.protocol}://${e.host}:${e.port}`;
  }

  private addProxy(host: string, port: number, protocol: 'http' | 'https'): void {
    const k = this.key({ protocol, host, port });
    if (this.proxies.has(k)) return;
    if (this.proxies.size >= this.config.maxPoolSize) return;

    this.proxies.set(k, {
      host, port, protocol,
      successCount: 0, failureCount: 0,
      consecutiveFailures: 0, isDead: false,
      cooldownUntil: 0, lastUsed: 0,
    });
  }

  async refreshPool(): Promise<void> {
    if (this.isRefreshing) return;
    this.isRefreshing = true;

    try {
      const allPromises = PROXY_LIST_URLS.map(async (url) => {
        try {
          const res = await fetch(url, {
            signal: AbortSignal.timeout(10000),
            headers: { 'User-Agent': 'Mozilla/5.0 (compatible; BarberShop/1.0)' },
          });
          if (!res.ok) return [];
          const text = await res.text();
          return text.split('\n');
        } catch {
          return [];
        }
      });

      const results = await Promise.allSettled(allPromises);

      for (const result of results) {
        if (result.status !== 'fulfilled') continue;
        for (const line of result.value) {
          const parsed = parseProxyLine(line);
          if (parsed) {
            this.addProxy(parsed.host, parsed.port, parsed.protocol);
          }
        }
      }
    } catch {}

    this.isRefreshing = false;

    if (this.getHealthyCount() < this.config.minProxiesBeforeRefresh) {
      this.scheduleRefresh(60_000);
    } else {
      this.scheduleRefresh(this.config.refreshIntervalMs);
    }
  }

  private scheduleRefresh(ms: number): void {
    if (this.refreshTimer) clearTimeout(this.refreshTimer);
    this.refreshTimer = setTimeout(() => this.refreshPool(), ms);
  }

  getProxy(): ProxyEntry | null {
    const now = Date.now();
    const candidates: ProxyEntry[] = [];

    for (const proxy of this.proxies.values()) {
      if (proxy.isDead) continue;
      if (proxy.cooldownUntil > now) continue;
      candidates.push(proxy);
    }

    if (candidates.length === 0) {
      this.reviveDeadProxies();
      return null;
    }

    const scores = candidates.map(p => {
      const total = p.successCount + p.failureCount;
      const successRate = total > 0 ? (p.successCount + 1) / (total + 2) : 0.5;
      const latencyPenalty = p.latencyMs ? Math.min(p.latencyMs / 5000, 1) : 0.3;
      return { proxy: p, score: successRate * (1 - latencyPenalty * 0.3) };
    });

    scores.sort((a, b) => b.score - a.score);
    const topTier = scores.slice(0, Math.max(1, Math.floor(scores.length / 3)));
    const selected = topTier[Math.floor(Math.random() * topTier.length)].proxy;
    selected.lastUsed = now;
    return selected;
  }

  reportSuccess(proxyKey: string): void {
    const proxy = this.proxies.get(proxyKey);
    if (!proxy) return;
    proxy.successCount++;
    proxy.consecutiveFailures = 0;
  }

  reportFailure(proxyKey: string): void {
    const proxy = this.proxies.get(proxyKey);
    if (!proxy) return;
    proxy.failureCount++;
    proxy.consecutiveFailures++;

    if (proxy.consecutiveFailures >= this.config.maxConsecutiveFailuresBeforeCooldown) {
      const backoff = Math.min(
        this.config.cooldownBaseMs * Math.pow(2, proxy.consecutiveFailures - this.config.maxConsecutiveFailuresBeforeCooldown),
        this.config.cooldownMaxMs
      );
      proxy.cooldownUntil = Date.now() + backoff;
      if (proxy.consecutiveFailures >= 10) {
        proxy.isDead = true;
      }
    }
  }

  getHealthyCount(): number {
    const now = Date.now();
    let count = 0;
    for (const proxy of this.proxies.values()) {
      if (!proxy.isDead && proxy.cooldownUntil <= now) count++;
    }
    return count;
  }

  reviveDeadProxies(): void {
    const now = Date.now();
    for (const proxy of this.proxies.values()) {
      if (proxy.isDead && now - proxy.lastUsed > this.config.cooldownMaxMs * 2) {
        proxy.isDead = false;
        proxy.consecutiveFailures = 0;
        proxy.cooldownUntil = 0;
      }
    }
  }

  destroy(): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
  }
}

export const defaultProxyManager = new ProxyManager();
