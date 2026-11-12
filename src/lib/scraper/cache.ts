import * as fs from 'fs';
import * as path from 'path';
import { createHash } from 'node:crypto';

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

  private getFilePath(key: string): string {
    // Keep distinct keys distinct on disk, even if they include slashes,
    // punctuation or other characters unsafe for filenames.
    const digest = createHash('sha256').update(key).digest('hex');
    return path.join(this.config.persistDir, `cache_${digest}.json`);
  }

  get<T>(key: string): { data: T; stale: boolean; source: string } | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    const now = Date.now();
    if (now > entry.expiresAt && now > entry.staleAt) {
      this.delete(key);
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
    const ttl = ttlMs ?? this.config.defaultTtlMs;
    if (!Number.isFinite(ttl) || ttl <= 0) throw new RangeError('Cache TTL must be a positive duration');
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
      if (oldest) this.delete(oldest[0]);
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
      fs.writeFileSync(filePath, JSON.stringify({ key, entry }), 'utf-8');
    } catch {}
  }

  private loadFromDisk(): void {
    try {
      const dir = this.config.persistDir;
      if (!fs.existsSync(dir)) return;
      for (const file of fs.readdirSync(dir)) {
        // Legacy filenames lost the original key, and cannot be restored safely.
        if (!/^cache_[a-f0-9]{64}\.json$/.test(file)) continue;
        const full = path.join(dir, file);
        try {
          const record = JSON.parse(fs.readFileSync(full, 'utf8')) as {
            key?: unknown;
            entry?: CacheEntry;
          };
          if (typeof record.key !== 'string' || !record.entry ||
              !Number.isFinite(record.entry.staleAt) ||
              !Number.isFinite(record.entry.expiresAt) ||
              record.entry.expiresAt > record.entry.staleAt ||
              file !== path.basename(this.getFilePath(record.key))) {
            fs.unlinkSync(full);
            continue;
          }
          if (Date.now() >= record.entry.staleAt) {
            fs.unlinkSync(full);
            continue;
          }
          if (this.store.size >= this.config.maxEntries) break;
          this.store.set(record.key, record.entry);
        } catch {
          // Corrupted cache entries should never block the application.
          try { fs.unlinkSync(full); } catch {}
        }
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
            if (/^cache_[a-f0-9]{64}\.json$/.test(file)) fs.unlinkSync(path.join(dir, file));
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
