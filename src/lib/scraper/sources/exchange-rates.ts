import { defaultHttpClient } from '../http-client';
import { defaultCache } from '../cache';

const CACHE_KEY = 'exchange_rates_usd';
const CACHE_TTL_MS = 3600_000;

interface RateResponse {
  rates: Record<string, number>;
  base?: string;
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
      const rates = source.parser(data);
      if (rates && typeof rates === 'object' && Object.keys(rates).length > 10) {
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

  return {
    rates: {
      USD: 1, AED: 3.67, SAR: 3.75, GBP: 0.78, EUR: 0.92,
      JPY: 155.0, TRY: 32.5, CAD: 1.37, AUD: 1.51, EGP: 48.5,
      KWD: 0.31, QAR: 3.64, BHD: 0.38, OMR: 0.38, PKR: 278.0,
    },
    base: 'USD',
    fetchedAt: Date.now(),
    source: 'fallback',
  };
}
