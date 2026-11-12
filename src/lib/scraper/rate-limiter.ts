interface DomainBudget {
  domain: string;
  maxRequestsPerMinute: number;
  requestTimestamps: number[];
  concurrentCount: number;
  maxConcurrent: number;
}

interface BackoffState {
  domain: string;
  attempt: number;
  baseDelayMs: number;
  maxDelayMs: number;
  lastRetryAt: number;
}

const DEFAULT_BUDGETS: Record<string, { rpm: number; concurrent: number }> = {
  'en.wikipedia.org': { rpm: 3, concurrent: 1 },
  'query.wikidata.org': { rpm: 5, concurrent: 1 },
  'open.er-api.com': { rpm: 10, concurrent: 2 },
  'frankfurter.app': { rpm: 10, concurrent: 2 },
  'api.exchangerate-api.com': { rpm: 5, concurrent: 1 },
  'www.reddit.com': { rpm: 5, concurrent: 1 },
  'nominatim.openstreetmap.org': { rpm: 1, concurrent: 1 },
  'overpass.kumi.systems': { rpm: 5, concurrent: 1 },
  'restcountries.com': { rpm: 10, concurrent: 2 },
  'commons.wikimedia.org': { rpm: 10, concurrent: 2 },
  'default': { rpm: 5, concurrent: 1 },
};

export class RateLimiter {
  private budgets: Map<string, DomainBudget> = new Map();
  private backoffStates: Map<string, BackoffState> = new Map();

  constructor(customBudgets?: Record<string, { rpm: number; concurrent: number }>) {
    const merged = { ...DEFAULT_BUDGETS, ...customBudgets };
    for (const [domain, config] of Object.entries(merged)) {
      if (!Number.isInteger(config.rpm) || config.rpm < 1 || !Number.isInteger(config.concurrent) || config.concurrent < 1) {
        throw new RangeError(`Invalid request budget for ${domain}`);
      }
      this.budgets.set(domain, {
        domain,
        maxRequestsPerMinute: config.rpm,
        requestTimestamps: [],
        concurrentCount: 0,
        maxConcurrent: config.concurrent,
      });
    }
  }

  private getBudget(domain: string): DomainBudget {
    const existing = this.budgets.get(domain);
    if (existing) return existing;

    // Unrecognized domains inherit the default limits, not its mutable counters.
    const defaults = this.budgets.get('default')!;
    const budget: DomainBudget = {
      domain,
      maxRequestsPerMinute: defaults.maxRequestsPerMinute,
      maxConcurrent: defaults.maxConcurrent,
      requestTimestamps: [],
      concurrentCount: 0,
    };
    this.budgets.set(domain, budget);
    return budget;
  }

  async acquire(domain: string): Promise<void> {
    const budget = this.getBudget(domain);

    while (true) {
      // Advance the clock after every sleep or the quota window can never expire.
      const now = Date.now();
      budget.requestTimestamps = budget.requestTimestamps.filter(t => now - t < 60000);

      if (budget.concurrentCount >= budget.maxConcurrent) {
        await this.sleep(200);
        continue;
      }

      if (budget.requestTimestamps.length >= budget.maxRequestsPerMinute) {
        const oldest = budget.requestTimestamps[0];
        await this.sleep(Math.max(1, 60000 - (now - oldest) + 100));
        continue;
      }

      budget.requestTimestamps.push(now);
      budget.concurrentCount++;
      return;
    }
  }

  release(domain: string): void {
    const budget = this.getBudget(domain);
    budget.concurrentCount = Math.max(0, budget.concurrentCount - 1);
  }

  getBackoffDelay(domain: string): number {
    const state = this.backoffStates.get(domain);
    if (!state) return 0;
    return Math.min(state.baseDelayMs * Math.pow(2, state.attempt), state.maxDelayMs);
  }

  recordBackoff(domain: string): number {
    const now = Date.now();
    const existing = this.backoffStates.get(domain);
    if (existing && now - existing.lastRetryAt < 60000) {
      existing.attempt++;
      existing.lastRetryAt = now;
    } else {
      this.backoffStates.set(domain, {
        domain,
        attempt: 1,
        baseDelayMs: 2000,
        maxDelayMs: 120000,
        lastRetryAt: now,
      });
    }
    return this.getBackoffDelay(domain);
  }

  resetBackoff(domain: string): void {
    this.backoffStates.delete(domain);
  }

  async waitWithJitter(domain: string): Promise<void> {
    const delay = this.getBackoffDelay(domain);
    if (delay > 0) {
      const jitter = delay * (0.5 + Math.random() * 0.5);
      await this.sleep(jitter);
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const defaultRateLimiter = new RateLimiter();
