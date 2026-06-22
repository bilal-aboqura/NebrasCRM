import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { supabaseEnv } from "@/lib/supabase/env";
import { canAccessPath } from "@/lib/auth/rbac-guards";
import type { AppRole } from "@/lib/auth/types";

const PUBLIC_PATHS = ["/assessment", "/login", "/reset", "/invite", "/api/auth/login"];

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const { url, anonKey } = supabaseEnv();
  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (items) => {
        items.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        items.forEach(({ name, value, options }) => response.cookies.set(name, value, {
          ...options,
          httpOnly: true,
          sameSite: "lax",
          secure: process.env.NODE_ENV === "production",
        }));
      },
    },
  });

  // Explicitly pass the stored access token. Edge middleware can fail to
  // resolve ES256 cloud sessions when getUser() performs its implicit lookup.
  const { data: { session } } = await supabase.auth.getSession();
  const { data: { user } } = session?.access_token
    ? await supabase.auth.getUser(session.access_token)
    : { data: { user: null } };
  const pathname = request.nextUrl.pathname;
  const isPublic = pathname === "/" || PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
  if (!user && !isPublic) return NextResponse.redirect(new URL("/login?reason=session_expired", request.url));
  if (user && (pathname === "/login" || pathname === "/reset")) return NextResponse.redirect(new URL("/dashboard", request.url));

  if (user && !isPublic) {
    const { data: profile } = await supabase.from("profiles").select("status,role,companies(status)").eq("id", user.id).single();
    const company = profile?.companies as unknown as { status?: string } | null;
    const inactive = !profile || profile.status !== "active" || (profile.role !== "super_admin" && company?.status !== "active");
    if (inactive) {
      await supabase.auth.signOut();
      const redirectResponse = NextResponse.redirect(new URL("/login?reason=inactive", request.url));
      response.cookies.getAll().forEach((cookie) => redirectResponse.cookies.set(cookie));
      return redirectResponse;
    }
  }

  const role = (user?.app_metadata.user_role ?? user?.user_metadata.role) as AppRole | undefined;
  if (user && role && !isPublic && !pathname.startsWith("/api/") && !canAccessPath(role, pathname) && pathname !== "/access-denied") {
    return NextResponse.redirect(new URL("/access-denied", request.url));
  }
  return response;
}
