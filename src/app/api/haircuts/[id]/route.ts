import { NextResponse } from "next/server";
import { getHaircuts, getExchangeRates } from "@/lib/scraper";
import { getUsdRate } from "@/lib/currency-rates";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await getHaircuts({ page: 1, limit: 100 });
    const haircut = result.haircuts.find(h => h.id === id || h.slug === id);

    if (!haircut) {
      return NextResponse.json(
        { success: false, error: "Haircut not found" },
        { status: 404 }
      );
    }

    const ratesData = await getExchangeRates().catch(() => null);
    const countries = [
      { code: "US", name: { en: "United States", ar: "الولايات المتحدة" }, currency: "USD", symbol: "$" },
      { code: "AE", name: { en: "UAE", ar: "الإمارات" }, currency: "AED", symbol: "AED" },
      { code: "SA", name: { en: "Saudi Arabia", ar: "السعودية" }, currency: "SAR", symbol: "SAR" },
      { code: "GB", name: { en: "United Kingdom", ar: "المملكة المتحدة" }, currency: "GBP", symbol: "£" },
      { code: "EU", name: { en: "Eurozone", ar: "منطقة اليورو" }, currency: "EUR", symbol: "€" },
      { code: "JP", name: { en: "Japan", ar: "اليابان" }, currency: "JPY", symbol: "¥" },
      { code: "TR", name: { en: "Turkey", ar: "تركيا" }, currency: "TRY", symbol: "₺" },
      { code: "CA", name: { en: "Canada", ar: "كندا" }, currency: "CAD", symbol: "CA$" },
      { code: "AU", name: { en: "Australia", ar: "أستراليا" }, currency: "AUD", symbol: "A$" },
    ];

    const pricing = countries.map(c => {
      const rate = getUsdRate(c.currency, ratesData?.rates);
      return {
        country: c,
        standardPrice: rate === null ? null : Math.round(haircut.basePriceUSD * rate / 5) * 5,
        vipPrice: rate === null ? null : Math.round(haircut.basePriceUSD * 1.5 * rate / 5) * 5,
        exchangeRate: rate,
      };
    });

    return NextResponse.json({
      success: true,
      haircut,
      pricing,
      rates: ratesData?.rates || null,
      fetchedAt: Date.now(),
    });

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to fetch haircut details";
    return NextResponse.json(
      { success: false, error: msg },
      { status: 502 }
    );
  }
}
