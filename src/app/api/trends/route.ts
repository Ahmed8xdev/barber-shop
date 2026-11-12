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
  } catch {
    return NextResponse.json(
      { success: false, error: "Trends fetch failed" },
      { status: 502 }
    );
  }
}
