// ============================================
// XEROVA — Live Cyber Threat Intelligence News API
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getLatestCyberNews } from "@/lib/news-api";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") || undefined;
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : 8;
    const forceRefresh = searchParams.get("refresh") === "true";

    const news = await getLatestCyberNews({
      query,
      limit,
      forceRefresh,
    });

    return NextResponse.json({ news });
  } catch (error) {
    console.error("[Dashboard News API Error]:", error);
    return NextResponse.json(
      { error: "Failed to fetch cyber threat news" },
      { status: 500 }
    );
  }
}
