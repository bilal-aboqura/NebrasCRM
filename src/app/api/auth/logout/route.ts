import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { supabaseEnv } from "@/lib/supabase/env";

export async function POST(request: NextRequest) {
  const response = NextResponse.redirect(new URL("/login", request.url), 302);
  const { url, anonKey } = supabaseEnv();
  const client = createServerClient(url, anonKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (items) => items.forEach(({ name, value, options }) => response.cookies.set(name, value, {
        ...options,
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: 0,
      })),
    },
  });
  await client.auth.signOut();
  response.cookies.set("active_company_id", "", { httpOnly: true, maxAge: 0, path: "/" });
  return response;
}
