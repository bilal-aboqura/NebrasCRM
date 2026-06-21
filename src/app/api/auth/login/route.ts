import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { supabaseEnv } from "@/lib/supabase/env";
import { loginWithPassword } from "@/lib/auth/login-service";

export async function POST(request: NextRequest) {
  let body: { email?: unknown; password?: unknown };
  try { body = await request.json(); } catch { return NextResponse.json({ success: false, error: "طلب غير صالح." }, { status: 400 }); }
  if (typeof body.email !== "string" || typeof body.password !== "string") {
    return NextResponse.json({ success: false, error: "البريد الإلكتروني وكلمة المرور مطلوبان." }, { status: 400 });
  }

  const response = NextResponse.json({ success: true });
  const { url, anonKey } = supabaseEnv();
  const client = createServerClient(url, anonKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (items) => items.forEach(({ name, value, options }) => response.cookies.set(name, value, {
        ...options,
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      })),
    },
  });
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const result = await loginWithPassword(client, body.email, body.password, ip);
  return NextResponse.json(result, { status: result.success ? 200 : result.status, headers: response.headers });
}
