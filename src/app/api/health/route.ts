import { NextResponse } from "next/server";

/** Health check — used by deploy smoke tests later. */
export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "roamvantage",
    phase: "1-foundation",
  });
}
