import * as fs from 'fs';
import * as path from 'path';

interface CacheEntry<T = unknown> {
  data: T;
  createdAt: number;
  expiresAt: number;
  source: string;
  staleAt: number;
}

interface CacheConfig {
  defaultTtlMs: number;
  staleTtlMs: number;
  maxEntries: number;
  persistDir: string;
  enablePersistence: boolean;
}

const DEFAULT_CONFIG: CacheConfig = {
  defaultTtlMs: 3600_000,
  staleTtlMs: 86400_000,
  maxEntries: 2000,
  persistDir: path.join(process.cwd(), '.cache'),
  enablePersistence: true,
};

export class ScraperCache {
  private store: Map<string, CacheEntry> = new Map();
  private config: CacheConfig;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    if (this.config.enablePersistence) {
      this.ensurePersistDir();
      this.loadFromDisk();
    }
  }

  private ensurePersistDir(): void {
    try {
      if (!fs.existsSync(this.config.persistDir)) {
        fs.mkdirSync(this.config.persistDir, { recursive: true });
      }
    } catch {}
  }

  private getFilePath(namespace: string): string {
    const safe = namespace.replace(/[^a-zA-Z0-9_-]/g, '_');
    return path.join(this.config.persistDir, `${safe}.json`);
  }

  get<T>(key: string): { data: T; stale: boolean; source: string } | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    const now = Date.now();
    if (now > entry.expiresAt && now > entry.staleAt) {
      this.store.delete(key);
      return null;
    }
    return {
      data: entry.data as T,
      stale: now > entry.expiresAt,
      source: entry.source,
    };
  }

  set<T>(key: string, data: T, source: string, ttlMs?: number): void {
    const now = Date.now();
    const ttl = ttlMs || this.config.defaultTtlMs;
    const staleTtl = ttl + this.config.staleTtlMs;
    const entry: CacheEntry<T> = {
      data,
      createdAt: now,
      expiresAt: now + ttl,
      staleAt: now + staleTtl,
      source,
    };

    if (this.store.size >= this.config.maxEntries) {
      const oldest = this.store.entries().next().value;
      if (oldest) this.store.delete(oldest[0]);
    }

    this.store.set(key, entry);

    if (this.config.enablePersistence) {
      this.persistToDisk(key, entry);
    }
  }

  private persistToDisk(key: string, entry: CacheEntry): void {
    if (typeof process === 'undefined') return;
    try {
      const filePath = this.getFilePath(key);
      fs.writeFileSync(filePath, JSON.stringify(entry, null, 0), 'utf-8');
    } catch {}
  }

  private loadFromDisk(): void {
    if (typeof process === 'undefined') return;
    try {
      const dir = this.config.persistDir;
      if (!fs.existsSync(dir)) return;
      const files = fs.readdirSync(dir);
      for (const file of files) {
        if (!file.endsWith('.json')) continue;
        try {
          const content = fs.readFileSync(path.join(dir, file), 'utf-8');
          const entry: CacheEntry = JSON.parse(content);
          const key = file.replace('.json', '');
          const now = Date.now();
          if (now < entry.staleAt) {
            this.store.set(key, entry);
          } else {
            fs.unlinkSync(path.join(dir, file));
          }
        } catch {}
      }
    } catch {}
  }

  delete(key: string): void {
    this.store.delete(key);
    if (this.config.enablePersistence) {
      try {
        const filePath = this.getFilePath(key);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      } catch {}
    }
  }

  clear(): void {
    this.store.clear();
    if (this.config.enablePersistence) {
      try {
        const dir = this.config.persistDir;
        if (fs.existsSync(dir)) {
          const files = fs.readdirSync(dir);
          for (const file of files) {
            if (file.endsWith('.json')) fs.unlinkSync(path.join(dir, file));
          }
        }
      } catch {}
    }
  }

  get size(): number {
    return this.store.size;
  }

  getStats(): { size: number; keys: string[] } {
    return {
      size: this.store.size,
      keys: [...this.store.keys()],
    };
  }
}

export const defaultCache = new ScraperCache();
