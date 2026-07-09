import { defaultCache } from '../cache';

const CACHE_TTL_MS = 86400_000;
const FETCH_TIMEOUT_MS = 10000;

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';



async function fetchWithHeaders(url: string, extra?: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      ...extra,
      signal: controller.signal,
      headers: {
        'User-Agent': UA,
        'Accept': 'application/json, */*',
        ...extra?.headers,
      },
    });
    return res;
  } finally {
    clearTimeout(timeout);
  }
}

export async function getHaircutImages(query: string, count: number = 5): Promise<string[]> {
  const cacheKey = `images_${query.toLowerCase().replace(/\s+/g, '_')}`;
  const cached = defaultCache.get<string[]>(cacheKey);
  if (cached && !cached.stale) return cached.data;

  const results = await Promise.allSettled([
    searchWikimediaCommons(query, count),
    searchDuckDuckGo(query, count),
    searchPexels(query, count),
    searchGoogleImages(query, count),
    searchOpenverse(query, count),
  ]);

  const allUrls: string[] = [];
  for (const r of results) {
    if (r.status === 'fulfilled' && r.value.length > 0) {
      allUrls.push(...r.value);
    }
  }

  const unique = [...new Set(allUrls)].slice(0, count);
  if (unique.length > 0) {
    defaultCache.set(cacheKey, unique, 'images', CACHE_TTL_MS);
  }
  return unique;
}

async function searchGoogleImages(query: string, count: number): Promise<string[]> {
  const apiKey = process.env.GOOGLE_API_KEY;
  const cx = process.env.GOOGLE_CX;
  if (!apiKey || !cx) return [];

  try {
    const res = await fetchWithHeaders(
      `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${encodeURIComponent(query + ' haircut hairstyle')}&searchType=image&num=${Math.min(count, 10)}`
    );
    if (!res.ok) return [];
    const data = await res.json() as { items?: { link: string }[] };
    return data.items?.map(i => i.link).filter(Boolean).slice(0, count) || [];
  } catch {
    return [];
  }
}

async function searchDuckDuckGo(query: string, count: number): Promise<string[]> {
  try {
    const { searchImages, ImageSize } = await import('duck-duck-scrape');
    const results = await searchImages(`${query} haircut hairstyle`, {
      size: ImageSize.LARGE,
    } as import('duck-duck-scrape').ImageSearchOptions);
    return results.results?.slice(0, count).map(r => r.image).filter(Boolean) || [];
  } catch {
    return [];
  }
}

async function searchWikimediaCommons(query: string, count: number): Promise<string[]> {
  const apiUrl = 'https://commons.wikimedia.org/w/api.php';

  try {
    const searchRes = await fetchWithHeaders(
      `${apiUrl}?action=query&format=json&list=search&srsearch=${encodeURIComponent(query + ' hairstyle')}&srlimit=${Math.min(count * 2, 10)}&origin=*`
    );
    if (!searchRes.ok) return [];
    const searchData = await searchRes.json() as { query?: { search?: { title: string }[] } };
    const titles = searchData.query?.search?.map(s => s.title) || [];
    if (titles.length === 0) return [];

    const imgRes = await fetchWithHeaders(
      `${apiUrl}?action=query&format=json&titles=${encodeURIComponent(titles.join('|'))}&prop=imageinfo&iiprop=url&iiurlwidth=600&origin=*`
    );
    if (!imgRes.ok) return [];
    const imgData = await imgRes.json() as { query?: { pages?: Record<string, { imageinfo?: { url: string }[] }> } };
    const pages = imgData.query?.pages || {};
    const urls: string[] = [];

    for (const page of Object.values(pages)) {
      if (page.imageinfo?.[0]?.url) {
        urls.push(page.imageinfo[0].url);
      }
    }

    return urls.slice(0, count);
  } catch {
    return [];
  }
}

async function searchOpenverse(query: string, count: number): Promise<string[]> {
  try {
    const res = await fetchWithHeaders(
      `https://api.openverse.org/v1/images/?q=${encodeURIComponent(query + ' hairstyle')}&license=cc0&page_size=${count}`
    );
    if (!res.ok) return [];
    const data = await res.json() as { results?: { url?: string }[] };
    return data.results?.map(i => i.url).filter(Boolean) as string[] || [];
  } catch {
    return [];
  }
}

async function searchPexels(query: string, count: number): Promise<string[]> {
  const apiKey = process.env.PEXELS_API_KEY;
  if (!apiKey) return [];

  try {
    const res = await fetchWithHeaders(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query + ' haircut')}&per_page=${count}`,
      { headers: { Authorization: apiKey } }
    );
    if (!res.ok) return [];
    const data = await res.json() as { photos?: { src?: { medium?: string } }[] };
    return data.photos?.map(p => p.src?.medium).filter(Boolean) as string[] || [];
  } catch {
    return [];
  }
}
