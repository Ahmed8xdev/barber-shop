import { defaultCache } from '../cache';
import { searchInvidious } from './invidious';
import { searchInnerTube } from './innertube';

const CACHE_TTL_MS = 1_200_000;

interface YouTubeVideo {
  title: string;
  channel: string;
  views: string;
  url: string;
  thumbnail: string;
  videoId: string;
}

const queries = [
  'popular haircut 2026',
  'best hairstyle men',
  'haircut tutorial',
  'barber skills',
  'trending hairstyle',
];

async function fetchFromInvidious(): Promise<YouTubeVideo[]> {
  const allVideos = new Map<string, YouTubeVideo>();
  const results = await Promise.allSettled(
    queries.map(q => searchInvidious(q, 5))
  );
  for (const r of results) {
    if (r.status !== 'fulfilled') continue;
    for (const v of r.value) {
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
  }
  return [...allVideos.values()].slice(0, 12);
}

async function fetchFromInnerTube(): Promise<YouTubeVideo[]> {
  const allVideos = new Map<string, YouTubeVideo>();
  const results = await Promise.allSettled(
    queries.map(q => searchInnerTube(q, 5))
  );
  for (const r of results) {
    if (r.status !== 'fulfilled') continue;
    for (const v of r.value) {
      if (!allVideos.has(v.videoId)) {
        allVideos.set(v.videoId, v);
      }
    }
  }
  return [...allVideos.values()].slice(0, 12);
}

export async function fetchYouTubeTrends(): Promise<YouTubeVideo[]> {
  const cacheKey = 'youtube_hair_trends_v6';
  const cached = defaultCache.get<YouTubeVideo[]>(cacheKey);
  if (cached && !cached.stale) return cached.data;

  const invidiousResult = await fetchFromInvidious();
  if (invidiousResult.length >= 3) {
    defaultCache.set(cacheKey, invidiousResult, 'invidious', CACHE_TTL_MS);
    return invidiousResult;
  }

  const innerTubeResult = await fetchFromInnerTube();
  if (innerTubeResult.length >= 3) {
    defaultCache.set(cacheKey, innerTubeResult, 'innertube', CACHE_TTL_MS);
    return innerTubeResult;
  }

  const combined = [...invidiousResult, ...innerTubeResult];
  const deduped = combined.filter((v, i, a) => a.findIndex(x => x.videoId === v.videoId) === i);
  const result = deduped.slice(0, 12);

  if (result.length > 0) {
    defaultCache.set(cacheKey, result, 'combined', CACHE_TTL_MS);
  }

  return result;
}
