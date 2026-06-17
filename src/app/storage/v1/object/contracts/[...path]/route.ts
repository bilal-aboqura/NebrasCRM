import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({ error: "Access denied" }, { status: 403 });
}
