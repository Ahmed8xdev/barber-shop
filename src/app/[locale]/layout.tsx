import type { Metadata } from "next";
import { Caveat, Inter, Aref_Ruqaa, Tajawal } from "next/font/google";
import "../globals.css";

const caveat = Caveat({
  variable: "--font-caveat",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const arefRuqaa = Aref_Ruqaa({
  variable: "--font-aref-ruqaa",
  subsets: ["arabic"],
  weight: ["400", "700"],
});

const tajawal = Tajawal({
  variable: "--font-tajawal",
  subsets: ["arabic"],
  weight: ["300", "400", "500", "700", "800"],
});

export const metadata: Metadata = {
  title: "THE BARON | Global Grooming & Haircut Database",
  description: "Explore the worldwide database of luxury haircuts, beard sculpting, and VIP pricing packages at THE BARON Lounge.",
};

import GsapInit from "@/components/GsapInit";
import LenisProvider from "@/components/LenisProvider";
import PageTransition from "@/components/PageTransition";

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const dir = locale === "ar" ? "rtl" : "ltr";

  const fontClasses = locale === "ar" 
    ? `${arefRuqaa.variable} ${tajawal.variable} font-arabic`
    : `${caveat.variable} ${inter.variable} font-english`;

  return (
    <html lang={locale} dir={dir} className={`${fontClasses} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-white text-[#120E0B] selection:bg-[#C5A880]/30 selection:text-[#120E0B]">
        <GsapInit />
        <LenisProvider>
          <PageTransition>
            {children}
          </PageTransition>
        </LenisProvider>
      </body>
    </html>
  );
}
