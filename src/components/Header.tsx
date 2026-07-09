"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Globe, Database } from "lucide-react";
import { getTranslations } from "@/lib/translations";
import MagneticButton from "./MagneticButton";

export default function Header() {
  const pathname = usePathname() || "";
  const segments = pathname.split("/");
  const currentLocale = segments[1] === "ar" ? "ar" : "en";
  const newLocale = currentLocale === "en" ? "ar" : "en";

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const t = getTranslations(currentLocale);

  const getLanguageSwitchUrl = () => {
    const updatedSegments = [...segments];
    updatedSegments[1] = newLocale;
    const finalPath = updatedSegments.join("/");
    return finalPath || `/${newLocale}`;
  };

  const navLinks = [
    { name: t.database.globalIndex, href: "#database" },
    { name: currentLocale === "ar" ? "أحدث الصيحات" : "Trending", href: "#trends" },
  ];

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 100);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        scrolled
          ? "border-b border-bronze/15 bg-white/98 backdrop-blur-md shadow-sm"
          : "border-b border-transparent bg-white/80 backdrop-blur-sm"
      }`}
      style={{ height: scrolled ? "64px" : "80px" }}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
        <div className="flex-shrink-0">
          <Link
            href={`/${currentLocale}`}
            className={`font-serif font-bold tracking-widest text-bronze transition-all duration-300 hover:text-foreground ${
              scrolled ? "text-xl" : "text-2xl"
            }`}
          >
            THE BARON
          </Link>
        </div>

        <nav className="hidden md:flex space-x-1 items-center rtl:space-x-reverse">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="relative px-4 py-2 text-sm font-medium text-sand-muted hover:text-bronze transition-colors group"
            >
              {link.name}
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-bronze transition-all duration-300 group-hover:w-3/4" />
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-4">
          <Link
            href={getLanguageSwitchUrl()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-bronze/15 hover:border-bronze hover:bg-bronze/5 transition-all text-xs font-semibold text-bronze group"
          >
            <Globe className="h-3.5 w-3.5 transition-transform duration-500 group-hover:rotate-[360deg]" />
            <span>{currentLocale === "en" ? "العربية" : "English"}</span>
          </Link>

          <MagneticButton
            href="#database"
            className="block"
          >
            <div className="flex items-center gap-2 rounded-sm bg-bronze px-5 py-2.5 text-sm font-bold text-white hover:bg-bronze-dark transition-all duration-300 active:scale-95">
              <Database className="h-4 w-4" />
                <span>{currentLocale === "ar" ? "استعرض الأسعار" : "Browse Prices"}</span>
            </div>
          </MagneticButton>
        </div>

        <div className="flex md:hidden items-center gap-3">
          <Link
            href={getLanguageSwitchUrl()}
            className="p-2 border border-bronze/10 rounded-sm text-bronze hover:bg-bronze/5 transition-all"
          >
            <Globe className="h-4 w-4" />
          </Link>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-sand-muted hover:text-bronze focus:outline-none"
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden border-b border-bronze/15 bg-white animate-fade-in">
          <div className="space-y-1 px-4 py-4 pb-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-3 text-base font-semibold text-sand-muted hover:text-bronze hover:bg-espresso-light/40 rounded-sm transition-all"
              >
                {link.name}
              </Link>
            ))}
            <div className="pt-4 border-t border-bronze/10 flex flex-col gap-3">
              <a
                href="#database"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center gap-2 rounded-sm bg-bronze py-3 text-base font-bold text-white"
              >
                <Database className="h-5 w-5" />
              <span>{currentLocale === "ar" ? "استعرض الأسعار" : "Browse Prices"}</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
