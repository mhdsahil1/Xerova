// ============================================
// XEROVA — Reports API (List + Create)
// ============================================

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Report from "@/models/Report";
import { reportSchema } from "@/lib/validations";

// GET — List user's reports
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const reports = await Report.find({ userId: session.user.id })
      .sort({ createdAt: -1 })
      .limit(50)
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
