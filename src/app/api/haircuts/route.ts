import { NextResponse } from "next/server";
import { getHaircuts, getExchangeRates, getCategoryNames } from "@/lib/scraper";
import { fetchCountries } from "@/lib/scraper/sources/countries";
import { parseHaircutRequestParameters } from "@/lib/scraper/haircut-request";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const parsed = parseHaircutRequestParameters(searchParams);
    if (!parsed.ok) {
      return NextResponse.json(
        { success: false, error: parsed.error },
        { status: 400 }
      );
    }
    const { query, category, page, limit, cmcontinue, locale } = parsed.value;

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
      categories: getCategoryNames(locale),
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
