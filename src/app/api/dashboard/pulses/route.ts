// ============================================
// XEROVA — Live Threat Pulses Feed (AlienVault OTX)
// ============================================

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { otxGetLivePulses } from "@/lib/threat-apis";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const pulses = await otxGetLivePulses(8);
    return NextResponse.json({ pulses });
  } catch (error) {
    console.error("[Threat Pulses Feed Error]:", error);
    return NextResponse.json(
      { error: "Failed to fetch threat pulses feed" },
      { status: 500 }
    );
  }
}
