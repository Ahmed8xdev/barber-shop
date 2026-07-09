import { getTranslations } from "@/lib/translations";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HeroParticles from "@/components/3d/HeroParticles";
import PriceDatabaseClient from "@/components/PriceDatabaseClient";
import TrendsSection from "@/components/TrendsSection";
import TestimonialsSection from "@/components/TestimonialsSection";
import { Scissors, Globe, TrendingUp, Star } from "lucide-react";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = getTranslations(locale);

  return (
    <>
      <Header />

      <div className="fixed inset-0 pointer-events-none flex items-center justify-center overflow-hidden z-0 select-none perspective-container">
        <span id="bg-4d-text" className="font-serif text-[18vw] font-black tracking-widest text-bronze uppercase preserve-3d opacity-[0.03]">
          THE BARON
        </span>
      </div>

      <main className="flex-grow pb-20 md:pb-0 bg-white relative z-10">

        <section className="relative flex min-h-[95vh] items-center justify-center overflow-hidden bg-white px-4 py-32 text-center">
          <HeroParticles />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(197,168,128,0.06)_0%,transparent_70%)]" />

          <div className="absolute inset-x-0 top-0 h-px bg-bronze/10" />
          <div className="absolute inset-y-0 left-1/4 w-px bg-bronze/5 hidden lg:block" />
          <div className="absolute inset-y-0 right-1/4 w-px bg-bronze/5 hidden lg:block" />

          <div className="relative z-10 mx-auto max-w-4xl space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-bronze/20 bg-espresso-dark px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-bronze gsap-reveal">
              <Globe className="h-3.5 w-3.5" />
              <span>{locale === "ar" ? "قاعدة بيانات عالمية لتصميمات الشعر" : "Global Haircut Database"}</span>
            </div>

            <h1 className="text-5xl font-bold tracking-tight sm:text-7xl lg:text-8xl leading-none text-foreground gsap-reveal">
              {locale === "ar" ? "أسعار وتصميمات الشعر حول العالم" : "Worldwide Haircut Prices & Styles"}
            </h1>

            <p className="mx-auto max-w-2xl text-lg sm:text-xl leading-relaxed text-sand-muted gsap-reveal">
              {locale === "ar"
                ? "تصفح أحدث قصات الشعر وأسعارها في 9 دول مع تحديث يومي لأسعار الصرف. مقارنة فورية، تصفية حسب البلد والسعر."
                : "Browse the latest haircut styles with real-time prices across 9 countries. Compare, filter, and discover global grooming costs."}
            </p>

            <div className="flex flex-col justify-center gap-4 sm:flex-row pt-4 gsap-reveal">
              <a
                href="#database"
                className="rounded-sm bg-bronze px-8 py-4 text-base font-bold text-white hover:bg-bronze-dark transition-all duration-300 shadow-md transform hover:-translate-y-0.5"
              >
                {locale === "ar" ? "استعرض قاعدة البيانات" : "Browse the Database"}
              </a>
              <a
                href="#trends"
                className="rounded-sm border border-bronze/30 px-8 py-4 text-base font-bold text-bronze hover:bg-espresso-dark transition-all"
              >
                {locale === "ar" ? "أحدث الصيحات" : "Latest Trends"}
              </a>
            </div>
          </div>
        </section>

        <section id="about" className="relative border-y border-bronze/10 bg-espresso-dark py-24 px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:items-center">

              <div className="space-y-6">
                <div className="h-1 w-12 bg-bronze" />
                <h2 className="text-4xl font-bold tracking-tight sm:text-5xl gsap-reveal">
                  {locale === "ar" ? "قاعدة بيانات عالمية فورية" : "Live Global Price Database"}
                </h2>
                <p className="text-base leading-relaxed text-sand-muted gsap-reveal">
                  {locale === "ar"
                    ? "أكبر قاعدة بيانات لتصميمات الشعر الفاخر وأسعارها. نقوم بجلب البيانات من ويكيبيديا وريديت ويوتيوب لتقديم أحدث الصيحات وأسعارها في 9 دول."
                    : "The most comprehensive global haircut pricing database. We aggregate data from Wikipedia, Reddit, and YouTube to bring you the latest styles and their costs across 9 countries."}
                </p>
                <p className="text-base leading-relaxed text-sand-muted gsap-reveal">
                  {locale === "ar"
                    ? "أسعار الصرف تُحدث يومياً للحصول على مقارنة دقيقة. يمكنك تصفية النتائج حسب البلد والسعر للعثور على المزيج المثالي."
                    : "Exchange rates update daily for accurate comparisons. Filter by country and price range to find the perfect style for your budget."}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 text-sm font-semibold">
                  <div className="flex items-center gap-3 gsap-reveal-slide">
                    <Globe className="h-5 w-5 text-bronze flex-shrink-0" />
                    <span>{locale === "ar" ? "تغطية 9 دول" : "9 Countries Covered"}</span>
                  </div>
                  <div className="flex items-center gap-3 gsap-reveal-slide">
                    <TrendingUp className="h-5 w-5 text-bronze flex-shrink-0" />
                    <span>{locale === "ar" ? "أسعار صرف حية" : "Live Exchange Rates"}</span>
                  </div>
                  <div className="flex items-center gap-3 gsap-reveal-slide">
                    <Scissors className="h-5 w-5 text-bronze flex-shrink-0" />
                    <span>{locale === "ar" ? "أكثر من 15 تصميماً" : "15+ Hairstyles"}</span>
                  </div>
                  <div className="flex items-center gap-3 gsap-reveal-slide">
                    <Star className="h-5 w-5 text-bronze flex-shrink-0" />
                    <span>{locale === "ar" ? "أسعار VIP وصالونات عادية" : "Standard & VIP Pricing"}</span>
                  </div>
                </div>
              </div>

              <div className="relative aspect-video rounded-sm overflow-hidden border border-bronze/15 bg-white flex items-center justify-center p-8 bronze-glow gsap-reveal-scale">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(197,168,128,0.08)_0%,transparent_70%)]" />
                <div className="text-center relative z-10 space-y-4">
                  <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-bronze/20 bg-espresso-dark text-bronze">
                    <Globe className="h-10 w-10 animate-pulse" />
                  </div>
                  <span className="block font-serif text-2xl tracking-widest text-bronze">
                    {locale === "ar" ? "بيانات حية • 9 دول" : "LIVE DATA • 9 COUNTRIES"}
                  </span>
                  <span className="block text-xs uppercase tracking-widest text-sand-muted">
                    {locale === "ar" ? "تحديث يومي لأسعار الصرف" : "DAILY EXCHANGE RATE UPDATES"}
                  </span>
                </div>
              </div>

            </div>
          </div>
        </section>

        <section id="database" className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <div className="inline-flex items-center gap-2 rounded-full border border-bronze/20 bg-espresso-dark px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-bronze gsap-reveal">
              <Globe className="h-3.5 w-3.5" />
              <span>{t.database.globalIndex}</span>
            </div>
            <h2 className="text-4xl font-bold tracking-tight sm:text-5xl gsap-reveal">
              {locale === "ar" ? "قاعدة البيانات العالمية للأسعار" : "Worldwide Haircut Pricing Database"}
            </h2>
            <p className="text-base text-sand-muted gsap-reveal">
              {locale === "ar"
                ? "قاعدة بيانات تفاعلية لمقارنة وتصفية تكلفة خدمات تصفيف الشعر في 9 دول."
                : "Interactive database to compare and filter haircut costs across 9 countries with real-time exchange rates."}
            </p>
          </div>

          <div className="gsap-reveal">
            <PriceDatabaseClient locale={locale} />
          </div>
        </section>

        <TrendsSection locale={locale} />

        <TestimonialsSection locale={locale} />

      </main>

      <Footer locale={locale} />
    </>
  );
}
