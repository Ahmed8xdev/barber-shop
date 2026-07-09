import { NextResponse } from "next/server";
import { defaultCache } from "@/lib/scraper/cache";

const CACHE_TTL_MS = 1_200_000;

interface Testimonial {
  text: string;
  author: string;
  subreddit: string;
  score: number;
}

export async function GET() {
  const cacheKey = "real_testimonials_v2";
  const cached = defaultCache.get<Testimonial[]>(cacheKey);
  if (cached && !cached.stale) {
    return NextResponse.json({ success: true, testimonials: cached.data });
  }

  const TESTIMONIAL_KEYWORDS = [
    { q: 'best haircut', subreddit: 'malehairadvice' },
    { q: 'love my new haircut', subreddit: 'malehairadvice' },
    { q: 'great barber', subreddit: 'barber' },
    { q: 'amazing haircut', subreddit: 'Hair' },
    { q: 'hair transformation', subreddit: 'curlyhair' },
    { q: 'finally found a barber', subreddit: 'barber' },
    { q: 'best hairstyle', subreddit: 'malehairadvice' },
    { q: 'haircut advice', subreddit: 'malehairadvice' },
  ];

  const all: Testimonial[] = [];

  for (const kw of TESTIMONIAL_KEYWORDS) {
    try {
      const res = await fetch(
        `https://api.pullpush.io/reddit/search/submission/?q=${encodeURIComponent(kw.q)}&subreddit=${kw.subreddit}&size=5&sort=score`,
        {
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; BarberBot/1.0)' },
          signal: AbortSignal.timeout(6000),
        }
      );
      if (!res.ok) continue;
      const data = await res.json() as { data?: Array<{ title?: string; author?: string; subreddit?: string; score?: number; selftext?: string; num_comments?: number }> };
      if (!data.data?.length) continue;

      for (const post of data.data.slice(0, 3)) {
        if (!post.author || post.author === 'AutoModerator') continue;
        const text = post.selftext?.replace(/\n+/g, ' ').trim() || post.title?.trim() || '';
        if (text.length < 20 || text.length > 400) continue;
        all.push({
          text: text.slice(0, 350),
          author: post.author,
          subreddit: post.subreddit || kw.subreddit,
          score: post.score || 0,
        });
      }
    } catch {}
  }

  const top = all
    .filter((t, i, a) => a.findIndex(x => x.text.slice(0, 40) === t.text.slice(0, 40)) === i)
    .sort((a, b) => b.score - a.score)
    .slice(0, 12);

  if (top.length >= 2) {
    defaultCache.set(cacheKey, top, 'testimonials', CACHE_TTL_MS);
  }

  return NextResponse.json({
    success: true,
    testimonials: top,
    count: top.length,
  });
}