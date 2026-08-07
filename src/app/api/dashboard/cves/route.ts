// ============================================
// XEROVA — Latest CVEs API (NVD Feed)
// ============================================

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { nvdLatestCVEs } from "@/lib/threat-apis";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const cves = await nvdLatestCVEs(8);
    return NextResponse.json({ cves });
  } catch (error) {
    console.error("[CVE Feed Error]:", error);
    return NextResponse.json(
      { error: "Failed to fetch CVE feed" },
      { status: 500 }
    );
  }
}
