import { defaultHttpClient } from '../http-client';
import { defaultCache } from '../cache';
import { parseUsdRates } from '@/lib/currency-rates';

const CACHE_KEY = 'exchange_rates_usd';
const CACHE_TTL_MS = 3600_000;

interface RateResponse {
  rates: Record<string, number>;
  base?: string;
  base_code?: string;
}

interface ExchangeRateResult {
  rates: Record<string, number>;
  base: string;
  fetchedAt: number;
  source: string;
}

const SOURCES: Array<{
  name: string;
  url: string;
  parser: (data: RateResponse) => Record<string, number>;
}> = [
  {
    name: 'open.er-api.com',
    url: 'https://open.er-api.com/v6/latest/USD',
    parser: (data: RateResponse) => data.rates,
  },
  {
    name: 'frankfurter.app',
    url: 'https://api.frankfurter.app/latest?from=USD',
    parser: (data: RateResponse) => data.rates,
  },
  {
    name: 'exchangerate-api.com',
    url: 'https://api.exchangerate-api.com/v4/latest/USD',
    parser: (data: RateResponse) => data.rates,
  },
];

export async function getExchangeRates(): Promise<ExchangeRateResult> {
  const cached = defaultCache.get<ExchangeRateResult>(CACHE_KEY);
  if (cached && !cached.stale) return cached.data;

  for (const source of SOURCES) {
    try {
      const data = await defaultHttpClient.fetchJSON<RateResponse>(source.url);
      const rates = parseUsdRates(source.parser(data), data.base || data.base_code);
      if (rates) {
        const result: ExchangeRateResult = {
          rates,
          base: 'USD',
          fetchedAt: Date.now(),
          source: source.name,
        };
        defaultCache.set(CACHE_KEY, result, source.name, CACHE_TTL_MS);
        return result;
      }
    } catch {}
  }

  const stale = defaultCache.get<ExchangeRateResult>(CACHE_KEY);
  if (stale) return stale.data;

  // Do not invent current exchange rates when all live providers fail.
  throw new Error('Verified exchange rates are temporarily unavailable');
}
