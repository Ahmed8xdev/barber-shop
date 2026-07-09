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

export async function fetchCountries(): Promise<CountryData[]> {
  const cacheKey = 'countries_data_v2';
  const cached = defaultCache.get<CountryData[]>(cacheKey);
  if (cached && !cached.stale) return cached.data;

  try {
    const res = await fetch('https://www.apicountries.com/countries', {
      headers: { 'User-Agent': 'BarberShop/1.0' },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json() as APICountry[];

    const countries: CountryData[] = data
      .filter(c => c.alpha2Code && c.currencies?.[0]?.code)
      .map(c => {
        const currency = c.currencies![0];
        return {
          code: c.alpha2Code,
          name: {
            en: c.name,
            ar: ARABIC_NAMES[c.name] || c.name,
          },
          currency: currency.code || '',
          symbol: currency.symbol || currency.code || '',
        };
      });

    if (countries.length > 0) {
      defaultCache.set(cacheKey, countries, 'apicountries', CACHE_TTL_MS);
    }

    return countries;
  } catch {
    const stale = defaultCache.get<CountryData[]>(cacheKey);
    return stale?.data || [];
  }
}