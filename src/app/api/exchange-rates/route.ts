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
    const msg = error instanceof Error ? error.message : "Exchange rate fetch failed";
    return NextResponse.json(
      { success: false, error: msg },
      { status: 502 }
    );
  }
}
