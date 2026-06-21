"use server";

import { createHash, randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAuth } from "@/lib/auth/context";
import { assertCanManageUser, resolveInvitationScope } from "@/lib/auth/admin-policy";
import { writeAudit } from "@/lib/auth/audit";
import { validatePassword } from "@/lib/auth/password-security";
import type { AppRole } from "@/lib/auth/types";

export type ActionResult<T extends object = object> = ({ success: true } & T) | { success: false; error: string };
type CompanyInput = { name_ar: string; contact_email?: string; contact_phone?: string; status: "active" | "inactive" };
type InviteInput = { email: string; display_name: string; role: AppRole; company_id?: string | null };

function failure(error: unknown): { success: false; error: string } {
  return { success: false, error: error instanceof Error ? error.message : "تعذر إتمام العملية." };
}

async function requireAdministrator() {
  const context = await requireAuth();
  if (context.role !== "super_admin" && context.role !== "company_admin") throw new Error("غير مصرح لك بإدارة الحسابات.");
  return context;
}

export async function createCompany(input: CompanyInput): Promise<ActionResult<{ company_id: string }>> {
  try {
    const context = await requireAuth();
    if (context.role !== "super_admin") throw new Error("إدارة الشركات متاحة لمدير النظام فقط.");
    const name = input.name_ar.trim();
    if (name.length < 2) throw new Error("اسم الشركة مطلوب.");
    const admin = createAdminClient();
    const { data, error } = await admin.from("companies").insert({ name, name_ar: name, contact_email: input.contact_email || null, contact_phone: input.contact_phone || null, status: input.status }).select("id").single();
    if (error) throw new Error(error.code === "23505" ? "اسم الشركة مسجل بالفعل في النظام." : error.message);
    await writeAudit({ actorUserId: context.userId, actorCompanyId: context.companyId, eventType: "company_create", targetCompanyId: data.id, outcome: "success" });
    revalidatePath("/admin/companies");
    return { success: true, company_id: data.id };
  } catch (error) { return failure(error); }
}

export async function updateCompany(input: CompanyInput & { id: string }): Promise<ActionResult> {
  try {
    const context = await requireAuth();
    if (context.role !== "super_admin") throw new Error("إدارة الشركات متاحة لمدير النظام فقط.");
    const admin = createAdminClient();
    const { data: previous } = await admin.from("companies").select("name_ar,contact_email,contact_phone,status").eq("id", input.id).single();
    const { data: company, error } = await admin.from("companies").update({ name_ar: input.name_ar.trim(), contact_email: input.contact_email || null, contact_phone: input.contact_phone || null, status: input.status }).eq("id", input.id).select("id").single();
    if (error || !company) throw new Error(error?.message ?? "الشركة غير موجودة.");
    if (input.status === "inactive") {
      const { data: users } = await admin.from("profiles").select("id").eq("company_id", input.id);
      for (const user of users ?? []) {
        const { error: revokeError } = await admin.rpc("revoke_user_sessions", { target_user_id: user.id });
        if (revokeError) throw new Error(revokeError.message);
      }
    }
    await writeAudit({ actorUserId: context.userId, actorCompanyId: context.companyId, eventType: "company_update", targetCompanyId: input.id, outcome: "success", details: { before: previous, after: input } });
    revalidatePath("/admin/companies");
    return { success: true };
  } catch (error) { return failure(error); }
}

export async function inviteUser(input: InviteInput): Promise<ActionResult<{ user_id: string; invitation_url: string }>> {
  const context = await requireAdministrator();
  try {
    const role = input.role;
    const companyId = resolveInvitationScope(context, input.company_id ?? null, role);
    const email = input.email.trim().toLowerCase();
    if (!email.includes("@") || input.display_name.trim().length < 2) throw new Error("الاسم والبريد الإلكتروني مطلوبان.");
    const admin = createAdminClient();
    if (companyId) {
      const { data: company } = await admin.from("companies").select("id").eq("id", companyId).eq("status", "active").single();
      if (!company) throw new Error("الشركة المحددة غير نشطة أو غير موجودة.");
    }
    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email, email_confirm: true,
      user_metadata: { full_name: input.display_name.trim(), display_name: input.display_name.trim(), company_id: companyId, role },
    });
    if (createError || !created.user) throw new Error(createError?.message.includes("registered") ? "البريد الإلكتروني مسجل بالفعل في النظام." : createError?.message ?? "تعذر إنشاء المستخدم.");
    const { error: profileError } = await admin.from("profiles").update({ display_name: input.display_name.trim(), company_id: companyId, role, status: "pending" }).eq("id", created.user.id);
    if (profileError) { await admin.auth.admin.deleteUser(created.user.id); throw new Error(profileError.message); }
    const token = randomBytes(32).toString("base64url");
    const tokenHash = createHash("sha256").update(token).digest("hex");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const { error: inviteError } = await admin.from("user_invitations").insert({ user_id: created.user.id, token_hash: tokenHash, created_by: context.userId, expires_at: expiresAt });
    if (inviteError) { await admin.auth.admin.deleteUser(created.user.id); throw new Error(inviteError.message); }
    await writeAudit({ actorUserId: context.userId, actorCompanyId: context.companyId, eventType: "user_invite", targetCompanyId: companyId, outcome: "success" });
    revalidatePath("/admin/users");
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    return { success: true, user_id: created.user.id, invitation_url: `${baseUrl}/invite?token=${encodeURIComponent(token)}` };
  } catch (error) {
    await writeAudit({ actorUserId: context.userId, actorCompanyId: context.companyId, eventType: "unauthorized_admin_attempt", outcome: "failure" });
    return failure(error);
  }
}

export async function toggleUserStatus(userId: string, status: "active" | "inactive"): Promise<ActionResult> {
  const context = await requireAdministrator();
  try {
    const admin = createAdminClient();
    const { data: target } = await admin.from("profiles").select("id,company_id,role").eq("id", userId).single();
    if (!target) throw new Error("المستخدم غير موجود.");
    assertCanManageUser(context, { ...target, role: target.role as AppRole });
    const { error } = await admin.from("profiles").update({ status }).eq("id", userId);
    if (error) throw new Error(error.message);
    if (status === "inactive") {
      const { error: revokeError } = await admin.rpc("revoke_user_sessions", { target_user_id: userId });
      if (revokeError) throw new Error(revokeError.message);
    }
    await writeAudit({ actorUserId: context.userId, actorCompanyId: context.companyId, eventType: "profile_update", targetCompanyId: target.company_id, outcome: "success", details: { status: { old: status === "active" ? "inactive" : "active", new: status } } });
    revalidatePath("/admin/users");
    return { success: true };
  } catch (error) {
    await writeAudit({ actorUserId: context.userId, actorCompanyId: context.companyId, eventType: "unauthorized_admin_attempt", outcome: "failure" });
    return failure(error);
  }
}

export async function completeInvitation(token: string, password: string): Promise<ActionResult<{ message: string }>> {
  try {
    await validatePassword(password);
    const tokenHash = createHash("sha256").update(token).digest("hex");
    const admin = createAdminClient();
    const claimedAt = new Date().toISOString();
    const { data: invitation } = await admin.from("user_invitations").update({ used_at: claimedAt })
      .eq("token_hash", tokenHash).is("used_at", null).gt("expires_at", claimedAt).select("id,user_id").single();
    if (!invitation) throw new Error("رابط الدعوة هذا منتهي الصلاحية أو غير صالح.");
    const { error } = await admin.auth.admin.updateUserById(invitation.user_id, { password, email_confirm: true });
    if (error) {
      await admin.from("user_invitations").update({ used_at: null }).eq("id", invitation.id).eq("used_at", claimedAt);
      throw new Error(error.message);
    }
    await admin.from("profiles").update({ status: "active" }).eq("id", invitation.user_id);
    return { success: true, message: "تم تفعيل الحساب بنجاح." };
  } catch (error) { return failure(error); }
}

export async function createCompanyAction(_: ActionResult<{ company_id: string }> | undefined, formData: FormData) {
  return createCompany({ name_ar: String(formData.get("name_ar") ?? ""), contact_email: String(formData.get("contact_email") ?? ""), contact_phone: String(formData.get("contact_phone") ?? ""), status: String(formData.get("status")) === "inactive" ? "inactive" : "active" });
}
export async function inviteUserAction(_: ActionResult<{ user_id: string; invitation_url: string }> | undefined, formData: FormData) {
  return inviteUser({ email: String(formData.get("email") ?? ""), display_name: String(formData.get("display_name") ?? ""), role: String(formData.get("role")) as AppRole, company_id: String(formData.get("company_id") ?? "") || null });
}
export async function completeInvitationAction(_: ActionResult<{ message: string }> | undefined, formData: FormData) {
  return completeInvitation(String(formData.get("token") ?? ""), String(formData.get("password") ?? ""));
}
export async function updateCompanyAction(formData: FormData) {
  await updateCompany({ id: String(formData.get("id") ?? ""), name_ar: String(formData.get("name_ar") ?? ""), contact_email: String(formData.get("contact_email") ?? ""), contact_phone: String(formData.get("contact_phone") ?? ""), status: String(formData.get("status")) === "inactive" ? "inactive" : "active" });
}
export async function toggleUserStatusAction(formData: FormData) {
  await toggleUserStatus(String(formData.get("user_id") ?? ""), String(formData.get("status")) === "inactive" ? "inactive" : "active");
}
