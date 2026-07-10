import { defaultCache } from '../cache';
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

export async function searchInvidious(query: string, maxResults: number = 10): Promise<SearchResult[]> {
  const cacheKey = `invidious_${query.toLowerCase().replace(/\s+/g, '_')}`;
  const cached = defaultCache.get<SearchResult[]>(cacheKey);
  if (cached && !cached.stale) return cached.data;

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
          if (!Array.isArray(data) || data.length === 0) continue;

          const results: SearchResult[] = data.slice(0, maxResults).map((v: any) => ({
            title: v.title || 'Unknown',
            channel: v.author || '',
            views: formatViews(v.viewCount || 0),
            url: `https://youtube.com/watch?v=${v.videoId}`,
            thumbnail: `https://img.youtube.com/vi/${v.videoId}/mqdefault.jpg`,
          }));

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
