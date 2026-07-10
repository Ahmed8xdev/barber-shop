import { buildStealthHeaders } from '../stealth-client';

const API_KEY_CACHE: { key: string; expiresAt: number } = { key: '', expiresAt: 0 };
const BASE_URL = 'https://www.youtube.com/youtubei/v1';

interface InnerTubeSearchResult {
  title: string;
  channel: string;
  views: string;
  url: string;
  thumbnail: string;
  videoId: string;
}

async function scrapeApiKey(): Promise<string> {
  if (API_KEY_CACHE.key && Date.now() < API_KEY_CACHE.expiresAt) return API_KEY_CACHE.key;
  const res = await fetch('https://www.youtube.com', {
    headers: buildStealthHeaders(),
    signal: AbortSignal.timeout(5000),
  });
  const html = await res.text();
  const match = html.match(/"INNERTUBE_API_KEY":"([^"]+)"/);
  if (!match) throw new Error('Failed to scrape InnerTube API key');
  API_KEY_CACHE.key = match[1];
  API_KEY_CACHE.expiresAt = Date.now() + 3600_000;
  return match[1];
}

let clientVersion = '';

async function getClientContext() {
  const apiKey = await scrapeApiKey();
  if (!clientVersion) {
    const res = await fetch('https://www.youtube.com', {
      headers: buildStealthHeaders(),
      signal: AbortSignal.timeout(5000),
    });
    const html = await res.text();
    const match = html.match(/"INNERTUBE_CLIENT_VERSION":"([^"]+)"/);
    clientVersion = match ? match[1] : '1.20250101';
  }
  return { apiKey, clientVersion };
}

function formatViews(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export async function searchInnerTube(query: string, maxResults: number = 5): Promise<InnerTubeSearchResult[]> {
  const { apiKey, clientVersion } = await getClientContext();

  const body = {
    query,
    context: {
      client: {
        clientName: 'WEB',
        clientVersion,
        hl: 'en',
        gl: 'US',
      },
    },
  };

  const res = await fetch(`${BASE_URL}/search?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...buildStealthHeaders(),
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(6000),
  });

  if (!res.ok && res.status === 400) {
    API_KEY_CACHE.key = '';
    const freshKey = await scrapeApiKey();
    const retryRes = await fetch(`${BASE_URL}/search?key=${freshKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...buildStealthHeaders(),
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(6000),
    });
    if (!retryRes.ok) return [];
    const retryJson = await retryRes.json();
    return parseSearchResults(retryJson, maxResults);
  }

  if (!res.ok) return [];
  const json = await res.json();
  return parseSearchResults(json, maxResults);
}

function parseSearchResults(json: any, maxResults: number): InnerTubeSearchResult[] {
  try {
    const contents = json?.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents || [];
    const results: InnerTubeSearchResult[] = [];

    for (const section of contents) {
      const items = section?.itemSectionRenderer?.contents || [];
      for (const item of items) {
        const video = item?.videoRenderer;
        if (!video) continue;
        const videoId = video.videoId;
        if (!videoId) continue;

        results.push({
          title: video.title?.runs?.map((r: any) => r.text).join('') || 'Unknown',
          channel: video.ownerText?.runs?.[0]?.text || video.longBylineText?.runs?.[0]?.text || '',
          views: formatViews(parseInt(video.viewCount?.simpleText?.replace(/\D/g, '') || '0', 10)),
          url: `https://youtube.com/watch?v=${videoId}`,
          thumbnail: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
          videoId,
        });

        if (results.length >= maxResults) break;
      }
      if (results.length >= maxResults) break;
    }

    return results;
  } catch {
    return [];
  }
}
