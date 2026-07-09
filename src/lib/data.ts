export interface CountryItem {
  code: string;
  name: { en: string; ar: string };
  currency: string;
  symbol: string;
}

export interface ServiceItem {
  id: string;
  slug: string;
  category: 'hair' | 'beard' | 'packages' | 'facials';
  name: { en: string; ar: string };
  description: { en: string; ar: string };
  duration: number;
  basePriceUSD: number;
  features: {
    en: string[];
    ar: string[];
  };
  image: string;
}

export interface BarberItem {
  id: string;
  name: string;
  title: { en: string; ar: string };
  languages: { en: string[]; ar: string[] };
  specialties: { en: string[]; ar: string[] };
  image: string;
  instagram: string;
}

export function getCalculatedPrice(basePriceUSD: number, exchangeRate: number, tierMultiplier: number = 1.0) {
  const calculated = basePriceUSD * exchangeRate * tierMultiplier;
  if (calculated > 200) {
    return Math.round(calculated / 10) * 10;
  }
  return Math.round(calculated / 5) * 5;
}
