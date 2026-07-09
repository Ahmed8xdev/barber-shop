import { NextResponse } from "next/server";
import { getHaircuts, getExchangeRates, getCategoryNames } from "@/lib/scraper";
import { fetchCountries } from "@/lib/scraper/sources/countries";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query") || "";
    const category = searchParams.get("category") || "";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "15", 10);
    const cmcontinue = searchParams.get("continue") || "";
    const locale = searchParams.get("locale") || "en";

    const [haircutsResult, ratesData, countries] = await Promise.all([
      getHaircuts({ query, category: category || undefined, page, limit, cmcontinue: cmcontinue || undefined }),
      getExchangeRates().catch(() => null),
      fetchCountries().catch(() => []),
    ]);

    return NextResponse.json({
      success: true,
      rates: ratesData?.rates || null,
      haircuts: haircutsResult.haircuts,
      total: haircutsResult.total,
      sources: haircutsResult.sources,
      nextContinue: haircutsResult.nextContinue || "",
      countries,
      categories: getCategoryNames(locale as 'en' | 'ar'),
      fetchedAt: Date.now(),
    });

  } catch (error: unknown) {
    console.error("Haircuts API error:", error);
    const msg = error instanceof Error ? error.message : "Failed to fetch live data";
    return NextResponse.json(
      { success: false, error: msg },
      { status: 502 }
    );
  }
}
