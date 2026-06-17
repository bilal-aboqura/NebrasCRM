import { NextResponse } from "next/server";

export function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const path = searchParams.get("path");
  if (!path) {
    return NextResponse.json({ error: "Missing document path" }, { status: 400 });
  }

  return NextResponse.json({
    path,
    expiresIn: 15 * 60,
    access: "signed"
  });
}
