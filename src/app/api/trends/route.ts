import { NextResponse } from "next/server";
import { getTrends } from "@/lib/scraper";

export async function GET() {
  try {
    const data = await getTrends();
    return NextResponse.json({
      success: true,
      reddit: data.reddit,
      youtube: data.youtube,
      fetchedAt: data.fetchedAt,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Trends fetch failed";
    return NextResponse.json(
      { success: false, error: msg },
      { status: 502 }
    );
  }
}
