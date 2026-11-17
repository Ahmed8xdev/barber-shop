import { defaultCache } from '../cache';

const CACHE_TTL_MS = 86400_000;

interface CountryData {
  code: string;
  name: { en: string; ar: string };
  currency: string;
  symbol: string;
}

interface APICountry {
  alpha2Code: string;
  name: string;
  currencies?: Array<{ code?: string; name?: string; symbol?: string }>;
}

const ARABIC_NAMES: Record<string, string> = {
  'United Arab Emirates': 'الإمارات العربية المتحدة',
  'Saudi Arabia': 'المملكة العربية السعودية',
  'United States': 'الولايات المتحدة',
  'United Kingdom': 'المملكة المتحدة',
  'France': 'فرنسا',
  'Germany': 'ألمانيا',
  'Italy': 'إيطاليا',
  'Spain': 'إسبانيا',
  'Netherlands': 'هولندا',
  'Turkey': 'تركيا',
  'Japan': 'اليابان',
  'China': 'الصين',
  'India': 'الهند',
  'Pakistan': 'باكستان',
  'Canada': 'كندا',
  'Australia': 'أستراليا',
  'Egypt': 'مصر',
  'Kuwait': 'الكويت',
  'Qatar': 'قطر',
  'Bahrain': 'البحرين',
  'Oman': 'عُمان',
  'Malaysia': 'ماليزيا',
  'Singapore': 'سنغافورة',
  'South Korea': 'كوريا الجنوبية',
  'Brazil': 'البرازيل',
  'Mexico': 'المكسيك',
  'Russia': 'روسيا',
  'South Africa': 'جنوب أفريقيا',
  'Sweden': 'السويد',
  'Norway': 'النرويج',
  'Switzerland': 'سويسرا',
  'Thailand': 'تايلاند',
  'Philippines': 'الفلبين',
  'Indonesia': 'إندونيسيا',
  'Nigeria': 'نيجيريا',
  'Israel': 'إسرائيل',
  'Algeria': 'الجزائر',
  'Morocco': 'المغرب',
  'Iraq': 'العراق',
  'Jordan': 'الأردن',
  'Lebanon': 'لبنان',
  'Libya': 'ليبيا',
  'Sudan': 'السودان',
  'Syria': 'سوريا',
  'Tunisia': 'تونس',
  'Yemen': 'اليمن',
  'Palestine': 'فلسطين',
  'Iran': 'إيران',
  'Afghanistan': 'أفغانستان',
  'Bangladesh': 'بنغلاديش',
  'Sri Lanka': 'سريلانكا',
  'Nepal': 'نيبال',
  'New Zealand': 'نيوزيلندا',
  'Argentina': 'الأرجنتين',
  'Chile': 'تشيلي',
  'Colombia': 'كولومبيا',
  'Denmark': 'الدنمارك',
  'Finland': 'فنلندا',
  'Greece': 'اليونان',
  'Ireland': 'أيرلندا',
  'Poland': 'بولندا',
  'Portugal': 'البرتغال',
  'Ukraine': 'أوكرانيا',
  'Vietnam': 'فيتنام',
  'Hong Kong': 'هونغ كونغ',
};

/** Accept only valid country/currency identifiers and readable names. */
export function parseLegacyCountries(data: unknown): CountryData[] {
  if (!Array.isArray(data)) return [];
  return data.flatMap((item: APICountry) => {
    if (!item || typeof item.alpha2Code !== 'string' ||
        !/^[A-Za-z]{2}$/.test(item.alpha2Code) ||
        typeof item.name !== 'string' || !item.name.trim() ||
        !Array.isArray(item.currencies)) return [];
    const currency = item.currencies.find(c => c && typeof c.code === 'string' && /^[A-Z]{3}$/.test(c.code));
    if (!currency?.code) return [];
    return [{
      code: item.alpha2Code.toUpperCase(),
      name: { en: item.name.trim(), ar: ARABIC_NAMES[item.name] || item.name.trim() },
      currency: currency.code,
      symbol: typeof currency.symbol === 'string' && currency.symbol.length <= 8 ? currency.symbol : currency.code,
    }];
  });
}

interface RestCountry {
  cca2?: string;
  name?: { common?: string };
  currencies?: Record<string, { name?: string; symbol?: string }>;
}

export function parseRestCountries(data: unknown): CountryData[] {
  if (!Array.isArray(data)) return [];
  return data.flatMap((country: RestCountry) => {
    const code = country?.cca2;
    const name = country?.name?.common;
    if (!code || !/^[A-Za-z]{2}$/.test(code) || !name || !country.currencies) return [];
    const currencyCode = Object.keys(country.currencies).find(key => /^[A-Z]{3}$/.test(key));
    if (!currencyCode) return [];
    const symbol = country.currencies[currencyCode]?.symbol;
    return [{
      code: code.toUpperCase(),
      name: { en: name, ar: ARABIC_NAMES[name] || name },
      currency: currencyCode,
      symbol: typeof symbol === 'string' && symbol.length <= 8 ? symbol : currencyCode,
    }];
  });
}

async function fetchProvider(url: string): Promise<unknown> {
  const response = await fetch(url, {
    headers: { 'Accept': 'application/json', 'User-Agent': 'BarberShop/1.0' },
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

export async function fetchCountries(): Promise<CountryData[]> {
  const cacheKey = 'countries_data_v3';
  const cached = defaultCache.get<CountryData[]>(cacheKey);
  if (cached && !cached.stale) return cached.data;

  const providers = [
    { url: 'https://www.apicountries.com/countries', parse: parseLegacyCountries, name: 'apicountries' },
    { url: 'https://restcountries.com/v3.1/all?fields=cca2,name,currencies', parse: parseRestCountries, name: 'restcountries' },
  ];
  for (const provider of providers) {
    try {
      const countries = provider.parse(await fetchProvider(provider.url));
      if (countries.length === 0) continue;
      const unique = [...new Map(countries.map(country => [country.code, country])).values()];
      unique.sort((a, b) => a.name.en.localeCompare(b.name.en));
      defaultCache.set(cacheKey, unique, provider.name, CACHE_TTL_MS);
      return unique;
    } catch {
      // Use the next independent provider instead of returning no countries.
    }
  }
  const stale = defaultCache.get<CountryData[]>(cacheKey);
  return stale?.data || [];
}
