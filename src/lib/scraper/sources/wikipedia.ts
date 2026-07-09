import { defaultHttpClient } from '../http-client';
import { defaultCache } from '../cache';

const CACHE_TTL_MS = 86400_000;
const WIKI_API = 'https://en.wikipedia.org/w/api.php';

interface WikiMember {
  pageid: number;
  title: string;
}

interface WikiPage {
  pageid: number;
  title: string;
  extract?: string;
  thumbnail?: { source: string };
}

interface WikiQueryResponse {
  query?: {
    categorymembers?: WikiMember[];
  };
  continue?: {
    cmcontinue?: string;
  };
}

interface WikiHaircut {
  id: string;
  title: string;
  extract: string;
  pageUrl: string;
  imageUrl?: string;
}

export async function fetchHairstyles(cmcontinue?: string): Promise<{
  styles: WikiHaircut[];
  nextContinue: string;
  source: string;
}> {
  const params = new URLSearchParams({
    action: 'query',
    format: 'json',
    list: 'categorymembers',
    cmtitle: 'Category:Hairstyles',
    cmlimit: '50',
    origin: '*',
    ...(cmcontinue ? { cmcontinue } : {}),
  });

  const cacheKey = `wikipedia_hairstyles_${cmcontinue || 'first'}`;
  const cached = defaultCache.get<{ styles: WikiHaircut[]; nextContinue: string }>(cacheKey);
  if (cached && !cached.stale) return { ...cached.data, source: 'wikipedia_cache' };

  try {
    const data = await defaultHttpClient.fetchJSON<WikiQueryResponse>(`${WIKI_API}?${params}`);
    const members = data.query?.categorymembers || [];
    const nextContinue = data.continue?.cmcontinue || '';

    const filtered = members.filter((m: WikiMember) =>
      m.title &&
      !m.title.toLowerCase().includes('list of') &&
      !m.title.toLowerCase().includes('template:') &&
      !m.title.toLowerCase().includes('category:')
    );

    const styles = filtered.slice(0, 30).map((m: WikiMember) => ({
      id: `wiki_${m.pageid}`,
      title: m.title,
      extract: '',
      pageUrl: `https://en.wikipedia.org/wiki/${encodeURIComponent(m.title.replace(/ /g, '_'))}`,
    }));

    const enriched = await enrichWithExtracts(styles);
    const result = { styles: enriched, nextContinue };
    defaultCache.set(cacheKey, result, 'wikipedia', CACHE_TTL_MS);
    return { ...result, source: 'wikipedia' };
  } catch {
    const stale = defaultCache.get<{ styles: WikiHaircut[]; nextContinue: string }>(cacheKey);
    if (stale) return { ...stale.data, source: 'wikipedia_stale' };

    return {
      styles: [],
      nextContinue: '',
      source: 'empty',
    };
  }
}

async function enrichWithExtracts(styles: WikiHaircut[]): Promise<WikiHaircut[]> {
  if (styles.length === 0) return styles;

  const titles = styles.map(s => s.title).join('|');
  const params = new URLSearchParams({
    action: 'query',
    format: 'json',
    prop: 'extracts|pageimages',
    exintro: '1',
    explaintext: '1',
    exsentences: '3',
    piprop: 'thumbnail',
    pithumbsize: '600',
    titles,
    origin: '*',
  });

  try {
    const data = await defaultHttpClient.fetchJSON<{ query: { pages: Record<string, WikiPage> } }>(`${WIKI_API}?${params}`);
    const pages = data.query?.pages || {};
    for (const page of Object.values(pages)) {
      const style = styles.find(s => `wiki_${page.pageid}` === s.id);
      if (style) {
        style.extract = page.extract || '';
        style.imageUrl = page.thumbnail?.source || undefined;
      }
    }
  } catch {}

  return styles;
}


