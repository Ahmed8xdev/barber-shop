"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { getTranslations } from "@/lib/translations";
import { getCalculatedPrice } from "@/lib/data";
import { parseBookingNumber } from "@/lib/booking-number";
import { Search, Globe, Filter, MessageSquare, Coins, Loader, ArrowUpDown, Tag } from "lucide-react";

interface CountryInfo {
  code: string;
  name: Record<string, string>;
  currency: string;
  symbol: string;
}

interface HaircutItem {
  id: string;
  slug: string;
  category: string;
  name: Record<string, string>;
  description: Record<string, string>;
  duration: number;
  basePriceUSD: number;
  features: Record<string, string[]>;
  image: string;
  source?: string;
}

interface PriceDatabaseClientProps {
  locale: string;
}

type SortOption = "best" | "price-asc" | "price-desc" | "name-asc" | "name-desc" | "duration-asc" | "duration-desc";

const CATEGORY_KEYS = ["all", "hair", "beard", "packages", "facials"] as const;
const CATEGORY_LABELS: Record<string, { en: string; ar: string }> = {
  all: { en: "All", ar: "الكل" },
  hair: { en: "Haircuts & Styling", ar: "قصات الشعر" },
  beard: { en: "Beard Care", ar: "العناية باللحية" },
  packages: { en: "Luxury Packages", ar: "باقات" },
  facials: { en: "Skin & Facials", ar: "العناية بالوجه" },
};

export default function PriceDatabaseClient({ locale }: PriceDatabaseClientProps) {
  const t = getTranslations(locale);
  const [allHaircuts, setAllHaircuts] = useState<HaircutItem[]>([]);
  const [rates, setRates] = useState<Record<string, number> | null>(null);
  const [countries, setCountries] = useState<CountryInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedCountryCode, setSelectedCountryCode] = useState("US");
  const [searchQuery, setSearchQuery] = useState("");
  const [maxBudget, setMaxBudget] = useState(300);
  const [activeCompareId, setActiveCompareId] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(6);
  const [fetchingMore, setFetchingMore] = useState(false);
  const [nextContinue, setNextContinue] = useState("");
  const [noMoreData, setNoMoreData] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>("best");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const nextContinueRef = useRef(nextContinue);
  nextContinueRef.current = nextContinue;

  const allHaircutsRef = useRef(allHaircuts);
  allHaircutsRef.current = allHaircuts;

  useEffect(() => {
    async function fetchAPI() {
      try {
        setLoading(true);
        const params = new URLSearchParams({ limit: "30", locale });
        const res = await fetch(`/api/haircuts?${params}`);
        if (!res.ok) throw new Error("Failed to contact internal pricing API");
        const payload = await res.json();
        if (payload.success) {
          setAllHaircuts(payload.haircuts);
          setRates(payload.rates);
          setCountries(payload.countries || []);
          setNextContinue(payload.nextContinue || "");
          setNoMoreData(!payload.nextContinue);
          const usRate = payload.rates?.USD || 1.0;
          setMaxBudget(Math.round(150 * usRate));
        } else {
          throw new Error("API responded with unsuccessful operation status");
        }
      } catch (err: unknown) {
        console.error("Pricing database fetch failed:", err);
        setError(err instanceof Error ? err.message : "Unknown retrieval error occurred");
      } finally {
        setLoading(false);
      }
    }
    fetchAPI();
  }, [locale]);

  const currentCountry = countries.find((c: CountryInfo) => c.code === selectedCountryCode) || countries[0] || { code: "US", symbol: "$", currency: "USD", name: { en: "United States", ar: "الولايات المتحدة" } };
  const activeRate = rates ? (rates[currentCountry.currency] || 1.0) : 1.0;

  const filteredServices = useMemo(() => {
    let items = allHaircuts;

    if (categoryFilter !== "all") {
      items = items.filter(s => s.category === categoryFilter);
    }

    const query = searchQuery.toLowerCase();
    if (query) {
      items = items.filter(s => {
        const name = s.name?.[locale] || s.name?.en || "";
        const desc = s.description?.[locale] || s.description?.en || "";
        return name.toLowerCase().includes(query) || desc.toLowerCase().includes(query);
      });
    }

    items = items.filter(s => {
      const price = getCalculatedPrice(s.basePriceUSD, activeRate, 1.0);
      return price <= maxBudget;
    });

    switch (sortBy) {
      case "price-asc":
        items = [...items].sort((a, b) => getCalculatedPrice(a.basePriceUSD, activeRate, 1.0) - getCalculatedPrice(b.basePriceUSD, activeRate, 1.0));
        break;
      case "price-desc":
        items = [...items].sort((a, b) => getCalculatedPrice(b.basePriceUSD, activeRate, 1.0) - getCalculatedPrice(a.basePriceUSD, activeRate, 1.0));
        break;
      case "name-asc":
        items = [...items].sort((a, b) => (a.name?.[locale] || a.name?.en || "").localeCompare(b.name?.[locale] || b.name?.en || ""));
        break;
      case "name-desc":
        items = [...items].sort((a, b) => (b.name?.[locale] || b.name?.en || "").localeCompare(a.name?.[locale] || a.name?.en || ""));
        break;
      case "duration-asc":
        items = [...items].sort((a, b) => a.duration - b.duration);
        break;
      case "duration-desc":
        items = [...items].sort((a, b) => b.duration - a.duration);
        break;
    }

    return items;
  }, [allHaircuts, categoryFilter, searchQuery, maxBudget, activeRate, sortBy, locale]);

  const displayedServices = filteredServices.slice(0, visibleCount);

  const fetchNextPage = useCallback(async () => {
    const cursor = nextContinueRef.current;
    if (!cursor) return false;
    try {
      const params = new URLSearchParams({ limit: "30", locale, continue: cursor });
      const res = await fetch(`/api/haircuts?${params}`);
      if (!res.ok) return false;
      const payload = await res.json();
      if (payload.success && payload.haircuts?.length > 0) {
        setAllHaircuts(prev => [...prev, ...payload.haircuts]);
        setNextContinue(payload.nextContinue || "");
        if (!payload.nextContinue) setNoMoreData(true);
        return true;
      } else {
        setNoMoreData(true);
        return false;
      }
    } catch {
      return false;
    }
  }, [locale]);

  const handleLoadMore = async () => {
    setFetchingMore(true);
    const currentVisible = visibleCount;
    const totalFiltered = filteredServices.length;
    const nextCount = currentVisible + 6;

    if (nextCount > totalFiltered && nextContinueRef.current) {
      await fetchNextPage();
    }

    setVisibleCount(prev => Math.max(prev + 6, nextCount));
    setFetchingMore(false);
  };

  const handleWhatsAppBooking = (serviceName: string) => {
    const number = parseBookingNumber(process.env.NEXT_PUBLIC_BOOKING_WHATSAPP);
    if (!number) {
      setError(locale === "ar"
        ? "رقم التواصل للحجز غير مُعد حالياً. يرجى التواصل مع النشاط التجاري مباشرة."
        : "Booking contact is not configured. Please contact the business directly.");
      return;
    }

    const service = allHaircuts.find(h => (h.name?.en || h.name?.[locale]) === serviceName);
    if (!service) {
      setError(locale === "ar" ? "الخدمة المطلوبة غير متاحة." : "Selected service is unavailable.");
      return;
    }

    const price = getCalculatedPrice(service.basePriceUSD, activeRate, 1.0);
    const message = locale === "ar"
      ? `مرحباً صالون ذا بارون، أود حجز موعد لخدمة: ${serviceName} بسعر: ${currentCountry.symbol} ${price}`
      : `Hi THE BARON, I'd like to book: ${serviceName} under the rates of: ${currentCountry.symbol} ${price}`;
    const url = `https://api.whatsapp.com/send?phone=${number}&text=${encodeURIComponent(message)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  if (loading) {
    return (
      <div className="space-y-6 py-12 text-center">
        <Loader className="h-10 w-10 animate-spin text-bronze mx-auto" />
        <p className="text-sm text-sand-muted animate-pulse">
          {locale === "ar" ? "جاري تحميل قاعدة بيانات قصات الشعر العالمية..." : "Querying global styling database and currency indices..."}
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-12 text-center">
        <p className="text-red-500/80 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-12">

      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 bg-espresso-dark p-6 rounded-sm border border-bronze/10">

        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-sand-muted flex items-center gap-1.5">
            <Globe className="h-4 w-4 text-bronze" />
            <span>{t.database.selectCountry}</span>
          </label>
          <select
            value={selectedCountryCode}
            onChange={(e) => {
              setSelectedCountryCode(e.target.value);
              const targetCountry = countries.find((c: CountryInfo) => c.code === e.target.value);
              const rate = rates ? (rates[targetCountry?.currency || "USD"] || 1.0) : 1.0;
              setMaxBudget(Math.round(150 * rate));
            }}
            className="w-full bg-white border border-bronze/10 rounded-sm px-4 py-3 text-sm font-bold text-foreground focus:outline-none focus:border-bronze cursor-pointer"
          >
            {countries.length === 0 && <option value="US">$ - United States (USD)</option>}
            {countries.map((c: CountryInfo) => (
              <option key={c.code} value={c.code}>
                {c.symbol} - {c.name?.[locale] || c.name?.en || c.code} ({c.currency})
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-sand-muted flex items-center gap-1.5">
            <Tag className="h-4 w-4 text-bronze" />
            <span>{locale === "ar" ? "التصنيف" : "Category"}</span>
          </label>
          <select
            value={categoryFilter}
            onChange={(e) => { setCategoryFilter(e.target.value); setVisibleCount(6); }}
            className="w-full bg-white border border-bronze/10 rounded-sm px-4 py-3 text-sm font-bold text-foreground focus:outline-none focus:border-bronze cursor-pointer"
          >
            {CATEGORY_KEYS.map(key => (
              <option key={key} value={key}>
                {CATEGORY_LABELS[key][locale === "ar" ? "ar" : "en"]}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-sand-muted flex items-center gap-1.5">
            <ArrowUpDown className="h-4 w-4 text-bronze" />
            <span>{locale === "ar" ? "الترتيب" : "Sort By"}</span>
          </label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="w-full bg-white border border-bronze/10 rounded-sm px-4 py-3 text-sm font-bold text-foreground focus:outline-none focus:border-bronze cursor-pointer"
          >
            <option value="best">{locale === "ar" ? "الأفضل" : "Best Match"}</option>
            <option value="price-asc">{locale === "ar" ? "السعر: من الأقل إلى الأعلى" : "Price: Low to High"}</option>
            <option value="price-desc">{locale === "ar" ? "السعر: من الأعلى إلى الأقل" : "Price: High to Low"}</option>
            <option value="name-asc">{locale === "ar" ? "الاسم: أ إلى ي" : "Name: A to Z"}</option>
            <option value="name-desc">{locale === "ar" ? "الاسم: ي إلى أ" : "Name: Z to A"}</option>
            <option value="duration-asc">{locale === "ar" ? "المدة: من الأقصر إلى الأطول" : "Duration: Short to Long"}</option>
            <option value="duration-desc">{locale === "ar" ? "المدة: من الأطول إلى الأقصر" : "Duration: Long to Short"}</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-sand-muted flex items-center gap-1.5">
            <Search className="h-4 w-4 text-bronze" />
            <span>{locale === "ar" ? "ابحث بالاسم" : "Search Haircut"}</span>
          </label>
          <input
            type="text"
            placeholder={t.database.searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-bronze/10 rounded-sm px-4 py-3 text-sm focus:outline-none focus:border-bronze text-foreground"
          />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider text-sand-muted">
            <span className="flex items-center gap-1.5">
              <Filter className="h-4 w-4 text-bronze" />
              <span>{t.database.maxPrice}</span>
            </span>
            <span className="text-bronze text-sm font-extrabold font-mono">
              {maxBudget} {currentCountry.symbol}
            </span>
          </div>
          <div className="pt-2">
            <input
              type="range"
              min={Math.round(10 * activeRate)}
              max={Math.round(250 * activeRate)}
              step={Math.round(5 * activeRate) || 1}
              value={maxBudget}
              onChange={(e) => { setMaxBudget(Number(e.target.value)); setVisibleCount(6); }}
              className="w-full accent-bronze cursor-ew-resize"
            />
            <div className="flex justify-between text-[10px] text-sand-muted/75 font-mono pt-1">
              <span>{Math.round(10 * activeRate)} {currentCountry.symbol}</span>
              <span>{Math.round(250 * activeRate)} {currentCountry.symbol}</span>
            </div>
          </div>
        </div>

      </div>

      <div className="flex items-center justify-between text-xs text-sand-muted font-medium px-1">
        <span>
          {locale === "ar"
            ? `عرض ${displayedServices.length} من ${filteredServices.length} خدمة`
            : `Showing ${displayedServices.length} of ${filteredServices.length} services`}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {displayedServices.map((service: HaircutItem) => {
          const standardCost = getCalculatedPrice(service.basePriceUSD, activeRate, 1.0);
          const vipCost = getCalculatedPrice(service.basePriceUSD, activeRate, 1.5);
          const isComparing = activeCompareId === service.id;
          const svcName = service.name?.[locale] || service.name?.en || "";
          const svcDesc = service.description?.[locale] || service.description?.en || "";

          return (
            <div
              key={service.id}
              className="group flex flex-col md:flex-row gap-6 bg-espresso-dark border border-bronze/10 rounded-sm p-6 hover:border-bronze/35 transition-all duration-300 bronze-glow"
            >

              {service.image && (
                <div className="relative w-full md:w-44 aspect-video md:aspect-square rounded-sm overflow-hidden border border-bronze/10 bg-espresso-dark flex-shrink-0">
                  <img
                    src={service.image}
                    alt={svcName}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; (e.target as HTMLImageElement).parentElement!.classList.add('flex', 'items-center', 'justify-center'); (e.target as HTMLImageElement).parentElement!.innerHTML = '<span class=\"text-4xl opacity-20\">\u{1F488}</span>'; }}
                  />
                </div>
              )}

              <div className="flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                    <div>
                      <span className="text-xs uppercase tracking-wider text-bronze font-bold">
                        {service.category?.toUpperCase()}
                      </span>
                      <h3 className="text-2xl font-bold tracking-tight text-foreground group-hover:text-bronze transition-colors mt-1">
                        {svcName}
                      </h3>
                    </div>
                    <div className="text-right sm:text-right">
                      <span className="block text-[10px] text-sand-muted uppercase tracking-wider">{t.database.localCost}</span>
                      <span className="text-2xl font-extrabold text-foreground font-mono">
                        {currentCountry.symbol} {standardCost}
                      </span>
                    </div>
                  </div>

                  <p className="text-sm leading-relaxed text-sand-muted">
                    {svcDesc}
                  </p>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-sand-muted/50">{service.duration} min</span>
                    {service.source && (
                      <span className="text-[10px] text-sand-muted/40">via {service.source}</span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-bronze/5">
                    <div className="space-y-1">
                      <span className="block text-[10px] text-sand-muted uppercase tracking-wider">{t.database.standardPrice}</span>
                      <span className="text-sm font-extrabold text-foreground">
                        {currentCountry.symbol} {standardCost}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <span className="block text-[10px] text-sand-muted uppercase tracking-wider">{t.database.vipPrice}</span>
                      <span className="text-sm font-extrabold text-bronze">
                        {currentCountry.symbol} {vipCost}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => setActiveCompareId(isComparing ? null : service.id)}
                    className="w-full flex items-center justify-between px-4 py-2.5 rounded-sm bg-white border border-bronze/10 text-xs font-bold text-bronze hover:bg-espresso-light transition-all"
                  >
                    <span className="flex items-center gap-1.5">
                      <Coins className="h-4 w-4" />
                      <span>{t.database.comparison}</span>
                    </span>
                    <span className="text-xs">{isComparing ? "▲" : "▼"}</span>
                  </button>

                  {isComparing && (
                    <div className="mt-4 p-4 rounded-sm bg-white border border-bronze/15 divide-y divide-bronze/5 animate-fade-in space-y-2">
                      <div className="grid grid-cols-3 text-[10px] font-bold uppercase tracking-wider text-sand-muted pb-2">
                        <span>{t.database.country}</span>
                        <span className="text-center">{t.database.exchangeRate}</span>
                        <span className="text-right">Price</span>
                      </div>
                      {countries.map((c: CountryInfo) => {
                        const localMultiplier = rates ? (rates[c.currency] || 1.0) : 1.0;
                        const localRate = getCalculatedPrice(service.basePriceUSD, localMultiplier, 1.0);
                        return (
                          <div key={c.code} className="grid grid-cols-3 text-xs font-semibold py-2 items-center">
                            <span className="text-foreground">{c.name?.[locale] || c.name?.en || c.code}</span>
                            <span className="text-center text-sand-muted/70 font-mono">1 USD = {localMultiplier} {c.currency}</span>
                            <span className="text-right font-extrabold text-bronze font-mono">{c.symbol} {localRate}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    onClick={() => handleWhatsAppBooking(svcName)}
                    className="flex-1 flex items-center justify-center gap-2 rounded-sm bg-bronze py-3 text-xs font-bold text-white hover:bg-bronze-dark transition-all duration-300"
                  >
                    <MessageSquare className="h-4 w-4 fill-white" />
                    <span>{t.services.bookWhatsapp}</span>
                  </button>
                </div>

              </div>

            </div>
          );
        })}

        {displayedServices.length === 0 && (
          <div className="text-center py-12 text-sand-muted font-medium bg-espresso-dark border border-bronze/10 rounded-sm">
            {locale === "ar" ? "لا توجد خدمات تطابق حدود الميزانية المحددة." : "No services found matching your criteria."}
          </div>
        )}
      </div>

      <div className="text-center pt-4">
        <button
          onClick={handleLoadMore}
          disabled={fetchingMore}
          className="inline-flex items-center justify-center gap-2 rounded-sm border border-bronze px-8 py-3 text-sm font-bold text-bronze hover:bg-bronze hover:text-white transition-all transform active:scale-95 cursor-pointer shadow-sm disabled:opacity-50"
        >
          {fetchingMore ? (
            <>
              <Loader className="h-4 w-4 animate-spin" />
              <span>{locale === "ar" ? "جاري التحميل..." : "Loading..."}</span>
            </>
          ) : (
            <span>{locale === "ar" ? "تحميل المزيد" : "Load More Styles"}</span>
          )}
        </button>
        {noMoreData && (
          <p className="text-xs text-sand-muted/50 mt-3">
            {locale === "ar" ? "جميع الخدمات المتاحة معروضة" : "All available services are displayed"}
          </p>
        )}
      </div>

    </div>
  );
}