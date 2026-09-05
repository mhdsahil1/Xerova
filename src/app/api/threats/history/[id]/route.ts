import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import ThreatSearch from "@/models/ThreatSearch";

export const dynamic = "force-dynamic";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    if (!id || !mongoose.isValidObjectId(id)) {
      return NextResponse.json({ error: "Invalid investigation ID format" }, { status: 400 });
    }

    await connectDB();

    const result = await ThreatSearch.deleteOne({
      _id: id,
      userId: session.user.id,
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: "Investigation item not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Investigation item deleted" });
  } catch (error) {
    console.error("[Investigation History Item DELETE Error]:", error);
    return NextResponse.json(
      { error: "Failed to delete investigation item" },
      { status: 500 }
    );
  }
}
