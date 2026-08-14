import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import ThreatSearch from "@/models/ThreatSearch";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const type = searchParams.get("type") || "all";
    const severity = searchParams.get("severity") || "all";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const skip = (page - 1) * limit;

    await connectDB();

    // Build filter query
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: any = { userId: session.user.id };

    if (search.trim()) {
      filter.query = { $regex: search.trim(), $options: "i" };
    }

    if (type !== "all" && ["ip", "domain", "hash", "url", "cve"].includes(type)) {
      filter.type = type;
    }

    if (
      severity !== "all" &&
      ["critical", "high", "medium", "low", "info"].includes(severity)
    ) {
      filter.severity = severity;
    }

    const [items, total] = await Promise.all([
      ThreatSearch.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      ThreatSearch.countDocuments(filter),
    ]);

    return NextResponse.json({
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("[Investigation History GET Error]:", error);
    return NextResponse.json(
      { error: "Failed to fetch investigation history" },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    await ThreatSearch.deleteMany({ userId: session.user.id });

    return NextResponse.json({ message: "Investigation history cleared" });
  } catch (error) {
    console.error("[Investigation History DELETE ALL Error]:", error);
    return NextResponse.json(
      { error: "Failed to clear investigation history" },
      { status: 500 }
    );
  }
}
