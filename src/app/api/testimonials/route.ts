import { NextResponse } from "next/server";
import { defaultCache } from "@/lib/scraper/cache";
import { stealthFetch } from "@/lib/scraper/stealth-client";
import { STATIC_TESTIMONIALS, type Testimonial } from "@/lib/scraper/sources/testimonials-data";

const CACHE_TTL_MS = 1_200_000;

const TESTIMONIAL_KEYWORDS = [
  { q: "best haircut", sub: "malehairadvice" },
  { q: "love my new haircut", sub: "malehairadvice" },
  { q: "great barber", sub: "barber" },
  { q: "amazing haircut", sub: "Hair" },
  { q: "hair transformation", sub: "curlyhair" },
  { q: "finally found a barber", sub: "barber" },
  { q: "best hairstyle", sub: "malehairadvice" },
  { q: "haircut advice", sub: "malehairadvice" },
];

const SEARCH_SOURCES = [
  {
    name: "old.reddit.com",
    url: (kw: typeof TESTIMONIAL_KEYWORDS[0]) =>
      `https://old.reddit.com/r/${kw.sub}/search.json?q=${encodeURIComponent(kw.q)}&restrict_sr=on&sort=top&t=all&limit=5`,
  },
  {
    name: "www.reddit.com",
    url: (kw: typeof TESTIMONIAL_KEYWORDS[0]) =>
      `https://www.reddit.com/r/${kw.sub}/search.json?q=${encodeURIComponent(kw.q)}&restrict_sr=1&sort=top&limit=5&raw_json=1`,
  },
];

function extractTestimonials(json: any, kw: typeof TESTIMONIAL_KEYWORDS[0]): Testimonial[] {
  const children = json?.data?.children || [];
  const results: Testimonial[] = [];
  for (const c of children) {
    const p = c.data;
    if (!p || !p.author || p.author === "AutoModerator") continue;
    const text = p.selftext?.replace(/\n+/g, " ").trim() || p.title?.trim() || "";
    if (text.length < 20 || text.length > 400) continue;
    results.push({
      text: text.slice(0, 350),
      author: p.author,
      subreddit: p.subreddit || kw.sub,
      score: p.score || 0,
    });
  }
  return results;
}

export async function GET() {
  const cacheKey = "real_testimonials_v3";
  const cached = defaultCache.get<Testimonial[]>(cacheKey);
  if (cached && !cached.stale) {
    return NextResponse.json({ success: true, testimonials: cached.data });
  }

  let liveData: Testimonial[] = [];

  for (const source of SEARCH_SOURCES) {
    if (liveData.length >= 6) break;
    try {
      const results = await Promise.allSettled(
        TESTIMONIAL_KEYWORDS.map(kw =>
          stealthFetch({
            url: source.url(kw),
            retries: 1,
            baseDelayMs: 200,
            timeoutMs: 5000,
          })
            .then(r => r.json())
            .then(j => extractTestimonials(j, kw))
        )
      );
      const all: Testimonial[] = [];
      for (const r of results) {
        if (r.status === "fulfilled") all.push(...r.value);
      }
      if (all.length > 0) {
        liveData = all
          .filter((t, i, a) => a.findIndex(x => x.text.slice(0, 40) === t.text.slice(0, 40)) === i)
          .sort((a, b) => b.score - a.score)
          .slice(0, 12);
        if (liveData.length >= 2) break;
      }
    } catch {}
  }

  const combined = liveData.length >= 2
    ? liveData
    : [...liveData, ...STATIC_TESTIMONIALS]
        .filter((t, i, a) => a.findIndex(x => x.text.slice(0, 40) === t.text.slice(0, 40)) === i)
        .sort((a, b) => b.score - a.score)
        .slice(0, 12);

  if (combined.length >= 2) {
    defaultCache.set(cacheKey, combined, "testimonials", CACHE_TTL_MS);
  }

  return NextResponse.json({
    success: true,
    testimonials: combined,
    count: combined.length,
  });
}
