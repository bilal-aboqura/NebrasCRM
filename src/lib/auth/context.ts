import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { AppRole, AuthContext } from "./types";

export const getAuthContext = cache(async (): Promise<AuthContext | null> => {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  const { data: { user } } = session?.access_token
    ? await supabase.auth.getUser(session.access_token)
    : { data: { user: null } };
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("company_id,email,display_name,role,status,companies(name,status)")
    .eq("id", user.id)
    .single();
  if (!profile || !profile.role) return null;

  let activeCompanyId = profile.company_id as string | null;
  let companyName = ((profile.companies as unknown as { name?: string } | null)?.name ?? "") as string;
  if (profile.role === "super_admin") {
    const requestedId = cookies().get("active_company_id")?.value;
    const { data: companies } = await supabase.from("companies").select("id,name").eq("status", "active");
    const selected = companies?.find((company) => company.id === requestedId) ?? companies?.[0];
    activeCompanyId = selected?.id ?? null;
    companyName = selected?.name ?? "كل الشركات";
  }

  return {
    userId: user.id,
    email: profile.email,
    fullName: profile.display_name || profile.email,
    role: profile.role as AppRole,
    companyId: profile.company_id,
    activeCompanyId,
    companyName,
    status: profile.status,
  };
});

export async function requireAuth() {
  const context = await getAuthContext();
  if (!context) redirect("/login?reason=session_expired");
  return context;
}
