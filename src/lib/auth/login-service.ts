import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { writeAudit } from "./audit";

export const INVALID_LOGIN = "البريد الإلكتروني أو كلمة المرور غير صحيحة.";
export const THROTTLED_LOGIN = "لقد تجاوزت الحد الأقصى للمحاولات. يرجى الانتظار 30 ثانية قبل المحاولة مرة أخرى.";
export const INACTIVE_USER = "حسابك غير نشط. يرجى التواصل مع المسؤول.";
export const INACTIVE_COMPANY = "حساب الشركة الخاص بك غير نشط. يرجى التواصل مع المسؤول.";

export type LoginResult =
  | { success: true; user: { id: string; email: string; role: string; company_id: string | null } }
  | { success: false; status: 401 | 429; error: string };

export async function loginWithPassword(client: SupabaseClient, emailInput: string, password: string, sourceIp?: string): Promise<LoginResult> {
  const email = emailInput.trim().toLowerCase();
  const admin = createAdminClient();
  const since = new Date(Date.now() - 30_000).toISOString();
  const { count } = await admin.from("login_attempts").select("id", { count: "exact", head: true })
    .eq("email", email).eq("successful", false).gte("attempted_at", since);

  if ((count ?? 0) >= 5) {
    await writeAudit({ eventType: "failed_login", sourceIp, outcome: "throttled" });
    return { success: false, status: 429, error: THROTTLED_LOGIN };
  }

  const { data, error } = await client.auth.signInWithPassword({ email, password });
  await admin.from("login_attempts").insert({ email, ip_address: sourceIp ?? null, successful: !error });
  if (error || !data.user) {
    await writeAudit({ eventType: "failed_login", sourceIp, outcome: "failure" });
    return { success: false, status: 401, error: INVALID_LOGIN };
  }

  const { data: profile } = await admin.from("profiles").select("company_id,role,status,companies(status)").eq("id", data.user.id).single();
  if (!profile) {
    await client.auth.signOut();
    return { success: false, status: 401, error: INVALID_LOGIN };
  }
  const company = profile.companies as unknown as { status?: string } | null;
  if (profile.status !== "active" || (profile.role !== "super_admin" && company?.status !== "active")) {
    await client.auth.signOut();
    await writeAudit({ actorUserId: data.user.id, actorCompanyId: profile.company_id, eventType: "failed_login", sourceIp, outcome: "failure" });
    return { success: false, status: 401, error: profile.status !== "active" ? INACTIVE_USER : INACTIVE_COMPANY };
  }
  await writeAudit({ actorUserId: data.user.id, actorCompanyId: profile.company_id, eventType: "login", sourceIp, outcome: "success" });
  return { success: true, user: { id: data.user.id, email: data.user.email ?? email, role: profile.role, company_id: profile.company_id } };
}
