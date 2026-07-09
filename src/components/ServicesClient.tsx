"use client";

import { useState, useEffect } from "react";
import { getTranslations } from "@/lib/translations";
import { getCalculatedPrice } from "@/lib/data";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Search, Clock, MessageSquare, ChevronRight, Loader } from "lucide-react";

interface CountryInfo {
  code: string;
  name: Record<string, string>;
  currency: string;
  symbol: string;
}

interface ServiceItemData {
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

interface ServicesClientProps {
  locale: string;
}

export default function ServicesClient({ locale }: ServicesClientProps) {
  const t = getTranslations(locale);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [services, setServices] = useState<ServiceItemData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [rates, setRates] = useState<Record<string, number> | null>(null);
  const [countries, setCountries] = useState<CountryInfo[]>([]);

  const defaultCountryCode = locale === "ar" ? "SA" : "AE";

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`/api/haircuts?limit=50&locale=${locale}`);
        const data = await res.json();
        if (data.success) {
          setServices(data.haircuts);
          setRates(data.rates);
          setCountries(data.countries || []);
        }
      } catch (err) {
        console.error("Failed to load services:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [locale]);

  const defaultCountry = countries.find((c: CountryInfo) => c.code === defaultCountryCode) || countries[0] || { code: "AE", symbol: "AED", currency: "AED", exchangeRate: 3.67 };

  const categories = [
    { id: "all", name: t.services.all },
    { id: "hair", name: t.services.categories.hair },
    { id: "beard", name: t.services.categories.beard },
    { id: "packages", name: t.services.categories.packages },
    { id: "facials", name: t.services.categories.skin },
  ];

  const filteredServices = services.filter((service) => {
    const matchesCategory = selectedCategory === "all" || service.category === selectedCategory;
    const matchesSearch = 
      service.name?.[locale]?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.description?.[locale]?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleWhatsAppBooking = (serviceName: string) => {
    const whatsappNum = locale === "ar" ? "+966551112233" : "+971508889900";
    const text = locale === "ar"
      ? `مرحباً ذا بارون، أود حجز موعد لخدمة: ${serviceName}`
      : `Hi THE BARON, I'd like to book the service: ${serviceName}`;
    window.open(`https://api.whatsapp.com/send?phone=${whatsappNum}&text=${encodeURIComponent(text)}`, "_blank");
  };

  const activeRate = rates ? (rates[defaultCountry.currency] || 3.67) : 3.67;

  if (loading) {
    return (
      <>
        <Header />
        <main className="flex-grow py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
          <div className="text-center py-24 space-y-4">
            <Loader className="h-10 w-10 animate-spin text-bronze mx-auto" />
            <p className="text-sm text-sand-muted animate-pulse">
              {locale === "ar" ? "جاري تحميل الخدمات..." : "Loading services..."}
            </p>
          </div>
        </main>
        <Footer locale={locale} />
      </>
    );
  }

  return (
    <>
      <Header />

      <main className="flex-grow py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-12">
        
        <div className="space-y-4 text-center">
          <h1 className="text-3xl font-bold sm:text-5xl">{t.services.title}</h1>
          <p className="text-sand-muted max-w-2xl mx-auto">{t.services.subtitle}</p>
        </div>

        <div className="flex flex-col gap-6 md:flex-row md:items-center justify-between border-b border-bronze/10 pb-8">
          
          <div className="flex flex-wrap gap-2 no-scrollbar overflow-x-auto">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`rounded-sm px-5 py-2.5 text-sm font-bold transition-all cursor-pointer ${
                  selectedCategory === cat.id
                    ? "bg-bronze text-espresso-dark"
                    : "border border-bronze/10 text-sand-muted hover:border-bronze/30"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          <div className="relative max-w-xs w-full">
            <input
              type="text"
              placeholder={locale === "ar" ? "ابحث عن خدمة..." : "Search services..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-espresso-light border border-bronze/10 rounded-sm px-4 py-2.5 pl-10 text-sm focus:outline-none focus:border-bronze text-foreground"
            />
            <Search className="absolute left-3 top-3 h-4 w-4 text-bronze/50" />
          </div>

        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {filteredServices.length > 0 ? (
            filteredServices.map((service) => (
              <div 
                key={service.id} 
                className="group flex flex-col justify-between rounded-sm border border-bronze/10 bg-espresso-light p-6 transition-all duration-300 hover:border-bronze/35 hover:shadow-lg"
              >
                <div className="space-y-4">
                  
                  <div className="flex justify-between items-center text-xs font-semibold text-sand-muted">
                    <span className="text-bronze font-bold uppercase">
                      {service.category?.toUpperCase()}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      <span>{service.duration} {t.services.duration}</span>
                    </span>
                  </div>

                  <div>
                    <h3 className="text-xl font-bold tracking-wide text-foreground group-hover:text-bronze transition-colors">
                      {service.name?.[locale] || service.name?.en}
                    </h3>
                    <p className="text-sm leading-relaxed text-sand-muted/80 mt-2">
                      {service.description?.[locale] || service.description?.en}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 bg-espresso-dark/45 p-4 rounded-sm border border-bronze/5">
                    <div>
                      <span className="block text-[10px] text-sand-muted uppercase tracking-wider">{t.services.standard}</span>
                      <span className="text-base font-extrabold text-foreground">
                        {getCalculatedPrice(service.basePriceUSD, activeRate, 1.0)} {defaultCountry.symbol}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-sand-muted uppercase tracking-wider">{t.services.vipRoom}</span>
                      <span className="text-base font-extrabold text-bronze">
                        {getCalculatedPrice(service.basePriceUSD, activeRate, 1.5)} {defaultCountry.symbol}
                      </span>
                    </div>
                  </div>

                  {service.source && (
                    <div className="text-[10px] text-sand-muted/50 text-right">
                      Source: {service.source}
                    </div>
                  )}

                </div>

                <div className="mt-6 pt-6 border-t border-bronze/10 flex flex-wrap items-center justify-between gap-4">
                  <span className="inline-flex items-center gap-1 text-sm font-bold text-bronze">
                    <span>{locale === "ar" ? "تفاصيل الخدمة" : "More details"}</span>
                    <ChevronRight className="h-4 w-4 rtl:rotate-180" />
                  </span>

                  <button
                    onClick={() => handleWhatsAppBooking(service.name?.[locale] || service.name?.en)}
                    className="inline-flex items-center gap-2 rounded-sm bg-bronze px-5 py-2.5 text-xs font-bold text-espresso-dark hover:bg-bronze-dark transition-all"
                  >
                    <MessageSquare className="h-3.5 w-3.5 fill-espresso-dark" />
                    <span>{t.services.bookWhatsapp}</span>
                  </button>
                </div>

              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-12 text-sand-muted">
              {locale === "ar" ? "لم يتم العثور على خدمات مطابقة للبحث." : "No services found matching your criteria."}
            </div>
          )}
        </div>

      </main>

      <Footer locale={locale} />
    </>
  );
}
