import { defaultCache } from '../cache';
import { searchInvidious } from './invidious';

const CACHE_TTL_MS = 1_200_000;

export async function fetchYouTubeTrends(): Promise<{
  title: string;
  channel: string;
  views: string;
  url: string;
  thumbnail: string;
  videoId: string;
}[]> {
  const cacheKey = 'youtube_hair_trends_v5';
  const cached = defaultCache.get<ReturnType<typeof fetchYouTubeTrends> extends Promise<infer T> ? T : never>(cacheKey);
  if (cached && !cached.stale) return cached.data as any;

  const queries = [
    'popular haircut 2026',
    'best hairstyle men',
    'haircut tutorial',
    'barber skills',
    'trending hairstyle',
  ];

  const allVideos: Map<string, {
    title: string;
    channel: string;
    views: string;
    url: string;
    thumbnail: string;
    videoId: string;
  }> = new Map();

  for (const q of queries) {
    try {
      const results = await searchInvidious(q, 5);
      for (const v of results) {
        const vid = v.url.match(/(?:v=|\/)([\w-]{11})/)?.[1];
        if (vid && !allVideos.has(vid)) {
          allVideos.set(vid, {
            title: v.title,
            channel: v.channel,
            views: v.views,
            url: `https://youtube.com/watch?v=${vid}`,
            thumbnail: `https://img.youtube.com/vi/${vid}/mqdefault.jpg`,
            videoId: vid,
          });
        }
      }
    } catch {}
  }

  const result = [...allVideos.values()].slice(0, 12);

  if (result.length > 0) {
    defaultCache.set(cacheKey, result, 'youtube', CACHE_TTL_MS);
  }

  return result;
}