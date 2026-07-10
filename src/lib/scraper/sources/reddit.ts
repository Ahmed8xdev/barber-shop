import { defaultCache } from '../cache';
import { stealthFetch } from '../stealth-client';

const CACHE_TTL_MS = 1_200_000;

interface RedditTrend {
  title: string;
  subreddit: string;
  score: number;
  url: string;
  created: number;
  thumbnail?: string;
}

const SUBREDDITS = [
  'malehairadvice',
  'barber',
  'Hair',
  'curlyhair',
];

const SOURCES = [
  { name: 'old.reddit.com', url: (sub: string) => `https://old.reddit.com/r/${sub}/hot.json?limit=15` },
  { name: 'www.reddit.com', url: (sub: string) => `https://www.reddit.com/r/${sub}/hot.json?limit=15&raw_json=1` },
];

function extractPosts(json: any, sub: string): RedditTrend[] {
  const children = json?.data?.children || [];
  return children
    .map((c: any) => c.data)
    .filter((p: any) => p?.title && p?.permalink)
    .map((p: any) => ({
      title: p.title.trim(),
      subreddit: p.subreddit || sub,
      score: p.score || 0,
      url: `https://reddit.com${p.permalink}`,
      created: (p.created_utc || 0) * 1000,
    }));
}

export async function fetchRedditTrends(): Promise<RedditTrend[]> {
  const cacheKey = 'reddit_hair_trends_v5';
  const cached = defaultCache.get<RedditTrend[]>(cacheKey);
  if (cached && !cached.stale) return cached.data;

  for (const source of SOURCES) {
    try {
      const results = await Promise.allSettled(
        SUBREDDITS.map(sub =>
          stealthFetch({
            url: source.url(sub),
            retries: 2,
            baseDelayMs: 300,
            timeoutMs: 6000,
          }).then(r => r.json()).then(j => extractPosts(j, sub))
        )
      );

      const allPosts: RedditTrend[] = [];
      const seen = new Set<string>();
      for (const r of results) {
        if (r.status !== 'fulfilled') continue;
        for (const post of r.value) {
          if (!seen.has(post.url)) {
            seen.add(post.url);
            allPosts.push(post);
          }
        }
      }
      if (allPosts.length > 0) {
        const top = allPosts.slice(0, 30);
        defaultCache.set(cacheKey, top, source.name, CACHE_TTL_MS);
        return top;
      }
    } catch {}
  }

  const stale = defaultCache.get<RedditTrend[]>(cacheKey);
  return stale?.data || [];
}
