import { NextResponse } from "next/server";
import { getExchangeRates } from "@/lib/scraper";

export async function GET() {
  try {
    const data = await getExchangeRates();
    return NextResponse.json({
      success: true,
      rates: data.rates,
      base: data.base,
      source: data.source,
      fetchedAt: data.fetchedAt,
    });
  } catch (error: unknown) {
    // Public API clients must never receive upstream credentials or error traces.
    console.error("Exchange rates API error:", error);
    const msg = "Exchange rates are temporarily unavailable";
    return NextResponse.json(
      { success: false, error: msg },
      { status: 502 }
    );
  }
}
