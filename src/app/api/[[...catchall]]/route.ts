// ============================================
// XEROVA — Catchall Route for Nonexistent API Endpoints
// Returns HTTP 404 JSON instead of HTML
// ============================================

import { NextResponse } from "next/server";

function createNotFoundResponse() {
  return NextResponse.json(
    {
      error: "API endpoint not found",
      status: 404,
    },
    {
      status: 404,
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
}

export async function GET() {
  return createNotFoundResponse();
}

export async function POST() {
  return createNotFoundResponse();
}

export async function PUT() {
  return createNotFoundResponse();
}

export async function DELETE() {
  return createNotFoundResponse();
}

export async function PATCH() {
  return createNotFoundResponse();
}

export async function HEAD() {
  return new Response(null, { status: 404 });
}

export async function OPTIONS() {
  return createNotFoundResponse();
}
