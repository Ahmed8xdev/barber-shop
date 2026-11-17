import { defaultCache } from '../cache';
import { createHash } from 'node:crypto';
import { buildStealthHeaders } from '../stealth-client';

const CACHE_TTL_MS = 21600_000;

const DEFAULT_INSTANCES = [
  'https://inv.nadeko.net',
  'https://invidious.nerdvpn.de',
  'https://invidious.tiekoetter.com',
  'https://invidious.f5.si',
  'https://inv.zoomerville.com',
  'https://yt.chocolatemoo53.com',
  'https://yewtu.be',
  'https://inv.vern.cc',
  'https://invidious.snopyta.org',
  'https://invidious.private.coffee',
  'https://inv.odyssey346.dev',
  'https://invidious.jing.rocks',
  'https://invidious.stitcom.fr',
  'https://invidious.fdn.fr',
  'https://invidious.flokinet.to',
  'https://invidious.projectsegfau.lt',
  'https://invidious.lunar.icu',
  'https://invidious.privacydev.net',
  'https://inv.bp.projectsegfau.lt',
  'https://invidious.h/es',
];

interface SearchResult {
  title: string;
  channel: string;
  views: string;
  url: string;
  thumbnail: string;
}

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function formatViews(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export function invidiousCacheKey(query: string, maxResults: number): string {
  const count = Number.isFinite(maxResults) ? Math.max(1, Math.min(25, Math.trunc(maxResults))) : 10;
  const identity = JSON.stringify([query.trim().toLowerCase(), count]);
  return 'invidious_v2_' + createHash('sha256').update(identity).digest('hex');
}

export function normalizeInvidiousLimit(maxResults: number): number {
  return Number.isFinite(maxResults) ? Math.max(1, Math.min(25, Math.trunc(maxResults))) : 10;
}

export function parseInvidiousVideos(data: unknown, maxResults: number): SearchResult[] {
  if (!Array.isArray(data)) return [];
  const seen = new Set<string>();
  const results: SearchResult[] = [];
  const limit = normalizeInvidiousLimit(maxResults);
  for (const v of data) {
    if (!v || typeof v !== 'object' || typeof v.videoId !== 'string') continue;
    if (!/^[A-Za-z0-9_-]{11}$/.test(v.videoId) || seen.has(v.videoId)) continue;
    seen.add(v.videoId);
    results.push({
      title: typeof v.title === 'string' ? v.title : 'Unknown',
      channel: typeof v.author === 'string' ? v.author : '',
      views: formatViews(typeof v.viewCount === 'number' && Number.isFinite(v.viewCount) && v.viewCount > 0 ? v.viewCount : 0),
      url: `https://youtube.com/watch?v=${v.videoId}`,
      thumbnail: `https://img.youtube.com/vi/${v.videoId}/mqdefault.jpg`,
    });
    if (results.length === limit) break;
  }
  return results;
}

export async function searchInvidious(query: string, maxResults: number = 10): Promise<SearchResult[]> {
  const limit = normalizeInvidiousLimit(maxResults);
  const cacheKey = invidiousCacheKey(query, limit);
  const cached = defaultCache.get<SearchResult[]>(cacheKey);
  if (cached && !cached.stale) return cached.data.slice(0, limit);

  const envInstances = process.env.INVIDIOUS_INSTANCES;
  const instances = envInstances
    ? envInstances.split(',').map(s => s.trim()).filter(Boolean)
    : DEFAULT_INSTANCES;

  const shuffled = shuffleArray(instances);

  for (const instance of shuffled) {
    try {
      const urls = [
        `${instance}/api/v1/search?q=${encodeURIComponent(query)}&type=video&sort=relevance`,
        `${instance}/search?q=${encodeURIComponent(query)}&type=video`,
      ];

      for (const url of urls) {
        try {
          const res = await fetch(url, {
            headers: buildStealthHeaders(),
            signal: AbortSignal.timeout(6000),
          });
          if (!res.ok) continue;
          const text = await res.text();
          let data: any[];
          try { data = JSON.parse(text); } catch { continue; }
          const results = parseInvidiousVideos(data, limit);
          if (results.length === 0) continue;

          if (results.length > 0) {
            defaultCache.set(cacheKey, results, 'invidious', CACHE_TTL_MS);
          }
          return results;
        } catch { continue; }
      }
    } catch { continue; }
  }

  const stale = defaultCache.get<SearchResult[]>(cacheKey);
  return stale?.data || [];
}
