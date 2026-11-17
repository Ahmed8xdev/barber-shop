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

export function extractPosts(json: unknown, sub: string): RedditTrend[] {
  const root = json as { data?: { children?: unknown } } | null;
  const children = root?.data?.children;
  if (!Array.isArray(children)) return [];
  const parsed: RedditTrend[] = [];
  for (const child of children) {
    const post = child?.data;
    if (typeof post?.title !== 'string' || !post.title.trim()) continue;
    if (typeof post?.permalink !== 'string' ||
        !/^\\/r\\/[A-Za-z0-9_]+\\/comments\\/[A-Za-z0-9]+(?:\\/|$)/.test(post.permalink)) continue;
    const subreddit = typeof post.subreddit === 'string' &&
      /^[A-Za-z0-9_]{1,30}$/.test(post.subreddit) ? post.subreddit : sub;
    const seconds = typeof post.created_utc === 'number' &&
      Number.isFinite(post.created_utc) && post.created_utc >= 0 ? post.created_utc : 0;
    parsed.push({
      title: post.title.trim(),
      subreddit,
      score: typeof post.score === 'number' && Number.isFinite(post.score) ? post.score : 0,
      url: `https://www.reddit.com${post.permalink}`,
      created: seconds * 1000,
    });
  }
  return parsed;
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
