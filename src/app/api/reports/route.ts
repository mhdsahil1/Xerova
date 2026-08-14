import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Report from "@/models/Report";
import { reportSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

// GET — List user's reports with optional search and filters
export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const type = searchParams.get("type") || "all";
    const status = searchParams.get("status") || "all";

    await connectDB();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: any = { userId: session.user.id };

    if (search.trim()) {
      filter.$or = [
        { title: { $regex: search.trim(), $options: "i" } },
        { summary: { $regex: search.trim(), $options: "i" } },
        { "iocs.value": { $regex: search.trim(), $options: "i" } },
        { "findings.title": { $regex: search.trim(), $options: "i" } },
      ];
    }

    if (type !== "all" && ["investigation", "threat_analysis", "incident"].includes(type)) {
      filter.type = type;
    }

    if (status !== "all" && ["draft", "finalized"].includes(status)) {
      filter.status = status;
    }

    const reports = await Report.find(filter)
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    return NextResponse.json({ reports });
  } catch (error) {
    console.error("[Reports List Error]:", error);
    return NextResponse.json(
      { error: "Failed to fetch reports" },
      { status: 500 }
    );
  }
}

// POST — Create a new report
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validated = reportSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.issues[0].message },
        { status: 400 }
      );
    }

    await connectDB();

    const report = await Report.create({
      userId: session.user.id,
      ...validated.data,
    });

    return NextResponse.json({ report }, { status: 201 });
  } catch (error) {
    console.error("[Report Create Error]:", error);
    return NextResponse.json(
      { error: "Failed to create report" },
      { status: 500 }
    );
  }
}
