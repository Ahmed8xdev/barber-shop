import { defaultHttpClient } from '../http-client';
import { defaultCache } from '../cache';

const CACHE_TTL_MS = 172800_000;
const SPARQL_URL = 'https://query.wikidata.org/sparql';

const QUERY = `
SELECT ?item ?itemLabel ?description ?image WHERE {
  ?item wdt:P31 wd:Q3348447.
  OPTIONAL { ?item wdt:P18 ?image. }
  OPTIONAL { ?item schema:description ?description. FILTER(LANG(?description) = "en") }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
}
LIMIT 100
`;

interface WikidataBinding {
  item: { value: string };
  itemLabel: { value: string };
  description?: { value: string };
  image?: { value: string };
}

interface WikidataResponse {
  results: {
    bindings: WikidataBinding[];
  };
}

interface WikidataStyle {
  id: string;
  label: string;
  description: string;
  imageUrl?: string;
}

export async function fetchWikidataStyles(): Promise<WikidataStyle[]> {
  const cacheKey = 'wikidata_styles';
  const cached = defaultCache.get<WikidataStyle[]>(cacheKey);
  if (cached && !cached.stale) return cached.data;

  try {
    const data = await defaultHttpClient.fetchJSON<WikidataResponse>(`${SPARQL_URL}?query=${encodeURIComponent(QUERY)}&format=json`);
    const results = data.results?.bindings || [];

    const styles: WikidataStyle[] = results
      .filter((r: WikidataBinding) => r.itemLabel?.value)
      .map((r: WikidataBinding) => ({
        id: r.item.value.split('/').pop() || '',
        label: r.itemLabel.value,
        description: r.description?.value || '',
        imageUrl: r.image?.value ? `${r.image.value}?width=600` : undefined,
      }))
      .filter((s: WikidataStyle) => !s.label.toLowerCase().includes('list of'));

    if (styles.length > 0) {
      defaultCache.set(cacheKey, styles, 'wikidata', CACHE_TTL_MS);
    }
    return styles;
  } catch {
    const stale = defaultCache.get<WikidataStyle[]>(cacheKey);
    if (stale) return stale.data;
    return [];
  }
}
