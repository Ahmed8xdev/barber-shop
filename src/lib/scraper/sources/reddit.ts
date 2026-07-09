import { defaultCache } from '../cache';

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

export async function fetchRedditTrends(): Promise<RedditTrend[]> {
  const cacheKey = 'reddit_hair_trends_v4';
  const cached = defaultCache.get<RedditTrend[]>(cacheKey);
  if (cached && !cached.stale) return cached.data;

  const allPosts: RedditTrend[] = [];
  const seen = new Set<string>();

  for (const sub of SUBREDDITS) {
    try {
      const res = await fetch(
        `https://api.pullpush.io/reddit/search/submission/?subreddit=${sub}&size=15&sort=score&order=desc`,
        {
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; BarberBot/1.0)' },
          signal: AbortSignal.timeout(6000),
        }
      );
      if (!res.ok) continue;
      const data = await res.json() as { data?: Array<{ title?: string; author?: string; subreddit?: string; score?: number; created_utc?: number; permalink?: string; url?: string }> };
      if (!data.data?.length) continue;

      for (const post of data.data) {
        if (!post.title || !post.permalink) continue;
        const url = `https://reddit.com${post.permalink}`;
        if (!seen.has(url)) {
          seen.add(url);
          allPosts.push({
            title: post.title.trim(),
            subreddit: post.subreddit || sub,
            score: post.score || 0,
            url,
            created: (post.created_utc || 0) * 1000,
          });
        }
      }
    } catch {}

    await new Promise(r => setTimeout(r, 200));
  }

  const top = allPosts.slice(0, 30);

  if (top.length > 0) {
    defaultCache.set(cacheKey, top, 'reddit', CACHE_TTL_MS);
  }

  return top;
}