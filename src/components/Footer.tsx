"use client";

import { getTranslations } from "@/lib/translations";

interface FooterProps {
  locale: string;
}

export default function Footer({ locale }: FooterProps) {
  const t = getTranslations(locale);
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-bronze/15 bg-espresso-dark text-sand-muted">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">

        <div className="grid grid-cols-1 gap-12 md:grid-cols-3">

          <div className="space-y-4">
            <h3 className="font-serif text-2xl font-bold tracking-widest text-bronze">
              THE BARON
            </h3>
            <p className="text-sm leading-relaxed max-w-xs text-sand-muted/80">
              {locale === "ar"
                ? "قاعدة بيانات عالمية لأسعار وتصميمات الشعر الفاخرة. نقدم مقارنة شاملة للأسعار حول العالم."
                : "The global haircut & pricing database. Compare luxury grooming costs across 9 countries with real-time exchange rates."}
            </p>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-bold tracking-wider uppercase text-bronze">
              {locale === "ar" ? "روابط سريعة" : "Quick Links"}
            </h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#database" className="hover:text-bronze transition-colors">{locale === "ar" ? "قاعدة البيانات" : "Price Database"}</a></li>
              <li><a href="#trends" className="hover:text-bronze transition-colors">{locale === "ar" ? "أحدث الصيحات" : "Latest Trends"}</a></li>
              <li><a href="#about" className="hover:text-bronze transition-colors">{locale === "ar" ? "عن المنصة" : "About"}</a></li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-bold tracking-wider uppercase text-bronze">
              {locale === "ar" ? "البيانات" : "Data"}
            </h4>
            <ul className="space-y-2 text-sm">
              <li className="text-sand-muted/70">{locale === "ar" ? "المصدر: ويكيبيديا، ريديت، يوتيوب" : "Sources: Wikipedia, Reddit, YouTube"}</li>
              <li className="text-sand-muted/70">{locale === "ar" ? "تحديث الأسعار: يومياً" : "Exchange rates: Daily"}</li>
            </ul>
          </div>

        </div>

        <div className="mt-12 border-t border-bronze/10 pt-8 text-center text-xs font-semibold text-sand-muted/65">
          <p>{t.footer.rights.replace("2026", currentYear.toString())}</p>
        </div>

      </div>
    </footer>
  );
}
