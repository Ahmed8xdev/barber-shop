import { defaultCache } from './cache';
import { getExchangeRates } from './sources/exchange-rates';
import { fetchHairstyles } from './sources/wikipedia';
import { fetchWikidataStyles } from './sources/wikidata';
import { getHaircutImages } from './sources/images';
import { fetchRedditTrends } from './sources/reddit';
import { fetchYouTubeTrends } from './sources/youtube';

const CACHE_TTL_HAIRCUTS_MS = 86400_000;

const CATEGORIES = ['hair', 'beard', 'packages', 'facials'] as const;

const ARABIC_NAMES: Record<string, string> = {
  'Hairstyle': 'تصفيف الشعر',
  'African hair threading': 'تجديل الشعر الأفريقي',
  'Hairstyles in the 1950s': 'تصفيفات الخمسينيات',
  'Hairstyles in the 1980s': 'تصفيفات الثمانينيات',
  'African-American hair': 'الشعر الأفروأمريكي',
  'Afro': 'تصفيفة الأفرو',
  'Amasunzu': 'تصفيفة الأماستانزو',
  'Artificial hair integrations': 'وصلات الشعر',
  'Asymmetric cut': 'القصة غير المتماثلة',
  'Backcombing': 'تمشيط الشعر للخلف',
  'Bangs (hair)': 'الغرة الأمامية',
  'Beard and haircut laws by country': 'قوانين اللحية والحلاقة',
  'Beatle haircut': 'قصة البيتلز',
  'Beehive (hairstyle)': 'تصفيفة خلية النحل',
  'Big hair': 'الشعر الكثيف',
};

const ARABIC_DESCRIPTIONS: Record<string, string> = {
  'Hairstyle': 'تصفيف الشعر هو فن تشكيل وتنسيق الشعر باستخدام أدوات وتقنيات مختلفة لإطلالة عصرية وأنيقة.',
  'African hair threading': 'تقنية تقليدية لتجديل الشعر باستخدام الخيوط الملونة، تعود أصولها إلى ثقافة أفريقيا جنوب الصحراء.',
  'Hairstyles in the 1950s': 'قصات مستوحاة من الخمسينيات تتميز بالأناقة الكلاسيكية والكاريزما الراقية.',
  'Hairstyles in the 1980s': 'قصات جريئة ومبتكرة من الثمانينيات تتميز بالحجم الكبير والتموجات الواضحة.',
  'African-American hair': 'تصفيفات الشعر المجعد والكثيف المرتبطة بالثقافة الأفروأمريكية.',
  'Afro': 'قصة الأفرو الكلاسيكية المنفوشة التي تبرز الجمال الطبيعي للشعر.',
  'Amasunzu': 'تصفيفة تقليدية رواندية على شكل هلال ترمز إلى المكانة الاجتماعية.',
  'Artificial hair integrations': 'وصلات شعر طبيعية أو صناعية لإضافة الطول والحجم للشعر.',
  'Asymmetric cut': 'قصة غير متماثلة يكون فيها أحد الجانبين أطول من الآخر لإطلالة عصرية.',
  'Backcombing': 'تقنية تمشيط الشعر باتجاه فروة الرأس لإضافة كثافة وحجم.',
  'Bangs (hair)': 'الغرة الأمامية التي تغطي الجبهة بأنماط وأطوال مختلفة.',
  'Beard and haircut laws by country': 'قوانين وتقاليد اللحية وقصات الشعر حول العالم.',
  'Beatle haircut': 'قصة كلاسيكية مستوحاة من فرقة البيتلز الأيقونية.',
  'Beehive (hairstyle)': 'تصفيفة ضخمة على شكل خلية نحل كانت شائعة في الستينيات.',
  'Big hair': 'تصفيفات جريئة تبرز حجم الشعر الكثيف والضخم.',
};

const ARABIC_FEATURES = [
  ['استشارة تصفيف شخصية', 'غسيل شعر بمنتجات فاخرة', 'تشطيب احترافي'],
  ['تحليل شكل الوجه', 'قص دقيق بالمقص اليدوي', 'تصفيف بمنتجات طبيعية'],
  ['استشارة مكثفة', 'عناية بفروة الرأس', 'تجفيف وتصفيف نهائي'],
  ['جلسة خاصة', 'مشروبات ضيافة', 'هدية ترحيبية'],
];

const ENGLISH_FEATURES = [
  ['Personal style consultation', 'Premium hair wash', 'Signature finish'],
  ['Face shape analysis', 'Hand-scissor precision cut', 'Natural product styling'],
  ['Intensive consultation', 'Scalp care treatment', 'Final dry and style'],
  ['Private session', 'Welcome beverage', 'Complimentary gift'],
];

interface HaircutItem {
  id: string;
  slug: string;
  category: string;
  name: { en: string; ar: string };
  description: { en: string; ar: string };
  duration: number;
  basePriceUSD: number;
  features: { en: string[]; ar: string[] };
  image: string;
  source: string;
}

interface HaircutsResult {
  haircuts: HaircutItem[];
  total: number;
  sources: string[];
  nextContinue?: string;
}

function getArabicName(englishTitle: string): string {
  return ARABIC_NAMES[englishTitle] || `${englishTitle} - تصفيف راقي`;
}

function getArabicDescription(englishTitle: string, extract: string): string {
  return ARABIC_DESCRIPTIONS[englishTitle] ||
    `تصفيف عصري مستوحى من قصة ${englishTitle} الكلاسيكية`;
}

function generatePriceFromTitle(title: string): number {
  const hash = [...title].reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return 15 + (Math.abs(hash) % 85);
}

export async function getHaircuts(options: {
  query?: string;
  category?: string;
  page?: number;
  limit?: number;
  cmcontinue?: string;
}): Promise<HaircutsResult & { nextContinue?: string }> {
  const cacheKey = `haircuts_all_${options.page || 1}_${options.cmcontinue || ''}`;
  const cached = defaultCache.get<HaircutsResult>(cacheKey);
  if (cached && !cached.stale) return { ...cached.data, nextContinue: cached.data.nextContinue || '' };

  const sources: string[] = [];

  const wikiResult = await fetchHairstyles(options.cmcontinue);
  if (wikiResult.styles.length > 0) sources.push(wikiResult.source);

  try {
    const wikidataStyles = await fetchWikidataStyles();
    if (wikidataStyles.length > 0) sources.push('wikidata');
  } catch {}

  try {
    const ratesData = await getExchangeRates();
    sources.push(ratesData.source);
  } catch {}

  const allStyles: HaircutItem[] = [];

  const imagePromises = wikiResult.styles.map(s =>
    getHaircutImages(s.title, 1).then(imgs => imgs[0] || '').catch(() => '')
  );
  const images = await Promise.all(imagePromises);

  for (let i = 0; i < wikiResult.styles.length; i++) {
    const s = wikiResult.styles[i];
    const cat = CATEGORIES[i % CATEGORIES.length];
    const price = generatePriceFromTitle(s.title);
    const featIndex = i % ARABIC_FEATURES.length;

    allStyles.push({
      id: s.id,
      slug: s.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
      category: cat,
      name: { en: s.title, ar: getArabicName(s.title) },
      description: {
        en: s.extract || getEnglishDescription(s.title),
        ar: getArabicDescription(s.title, s.extract),
      },
      duration: 25 + (Math.abs(hashCode(s.title)) % 55),
      basePriceUSD: price,
      features: {
        en: ENGLISH_FEATURES[featIndex],
        ar: ARABIC_FEATURES[featIndex],
      },
      image: s.imageUrl || images[i] || getFallbackImageUrl(s.title),
      source: 'wikipedia',
    });
  }

  let filtered = allStyles;

  if (options.query) {
    const q = options.query.toLowerCase();
    filtered = filtered.filter(s =>
      s.name.en.toLowerCase().includes(q) ||
      s.name.ar.includes(q)
    );
  }

  if (options.category && options.category !== 'all') {
    filtered = filtered.filter(s => s.category === options.category);
  }

  const limit = options.limit || 15;
  const page = options.page || 1;
  const start = (page - 1) * limit;
  const paginated = filtered.slice(start, start + limit);

  const result: HaircutsResult = {
    haircuts: paginated,
    total: filtered.length,
    sources: [...new Set(sources)],
    nextContinue: wikiResult.nextContinue,
  };

  defaultCache.set(cacheKey, result, 'orchestrator', CACHE_TTL_HAIRCUTS_MS);

  return { ...result };
}

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return hash;
}

function getEnglishDescription(title: string): string {
  const descriptions: Record<string, string> = {
    'Hairstyle': 'A premium hairstyling service tailored to your face shape and lifestyle preferences.',
    'African hair threading': 'Traditional African threading technique using colorful threads for elegant protective styling.',
    'Hairstyles in the 1950s': 'Classic 1950s-inspired haircuts featuring refined pompadours and elegant waves.',
    'Hairstyles in the 1980s': 'Bold 1980s-inspired styles with volume, texture, and expressive flair.',
    'African-American hair': 'Specialized care and styling for African-American hair textures and patterns.',
    'Afro': 'The iconic afro — a voluminous, naturally textured style celebrating natural hair beauty.',
    'Amasunzu': 'Traditional Rwandan crescent-shaped hairstyle symbolizing status and marital eligibility.',
    'Artificial hair integrations': 'Premium hair extensions and weaves for added length, volume, and versatility.',
    'Asymmetric cut': 'Modern asymmetric cut with one side longer than the other for an edgy look.',
    'Backcombing': 'Volumizing backcombing technique for added height and fullness.',
    'Bangs (hair)': 'Stylish fringe cut and tailored to frame your face perfectly.',
    'Beard and haircut laws by country': 'Global guide to cultural and legal norms around facial hair and hairstyles.',
    'Beatle haircut': 'The timeless mop-top Beatle cut, refined for the modern gentleman.',
    'Beehive (hairstyle)': 'The iconic 1960s beehive — a towering, elegant updo for special occasions.',
    'Big hair': 'Voluminous, statement-making big hair styles for maximum impact.',
  };
  return descriptions[title] || `A premium take on the classic ${title} cut, refined for modern professionals.`;
}

function getFallbackImageUrl(title: string): string {
  const fallbacks = [
    'https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?q=80&w=600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1596726193640-0f2e15c8b0d9?q=80&w=600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1605496093888-af2d2427a199?q=80&w=600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?q=80&w=600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1517832606299-7ae9b720a186?q=80&w=600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1593702295094-aec22597af65?q=80&w=600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1580618672591-eb73b1ea2a2a?q=80&w=600&auto=format&fit=crop',
  ];
  const index = Math.abs(hashCode(title));
  return fallbacks[index % fallbacks.length];
}

export async function getTrends() {
  const [reddit, youtube] = await Promise.allSettled([
    fetchRedditTrends(),
    fetchYouTubeTrends(),
  ]);

  return {
    reddit: reddit.status === 'fulfilled' ? reddit.value : [],
    youtube: youtube.status === 'fulfilled' ? youtube.value : [],
    fetchedAt: Date.now(),
  };
}

export { getExchangeRates, fetchHairstyles, fetchWikidataStyles, fetchRedditTrends, fetchYouTubeTrends, getHaircutImages };

export function getCategoryNames(locale: 'en' | 'ar') {
  return {
    hair: locale === 'ar' ? 'قصات الشعر' : 'Haircuts',
    beard: locale === 'ar' ? 'العناية باللحية' : 'Beard Care',
    packages: locale === 'ar' ? 'باقات' : 'Packages',
    facials: locale === 'ar' ? 'العناية بالوجه' : 'Facials',
  };
}
