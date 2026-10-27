"use server";

import { createHash } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { validatePassword } from "@/lib/auth/password-security";
import { writeAudit } from "@/lib/auth/audit";
import type { ActionResult } from "./admin";

export async function completePasswordReset(token: string, password: string): Promise<ActionResult> {
  try {
    if (!/^[A-Za-z0-9_-]{43}$/.test(token)) throw new Error("رابط الاستعادة غير صالح.");
    const admin = createAdminClient();
    const tokenHash = createHash("sha256").update(token).digest("hex");
    const { data: reset } = await admin.from("user_password_resets").select("user_id")
      .eq("token_hash", tokenHash).is("used_at", null).gt("expires_at", new Date().toISOString()).single();
    if (!reset) throw new Error("رابط الاستعادة منتهي الصلاحية أو مستخدم. اطلب رابطاً جديداً من المسؤول.");
    const { data: profile } = await admin.from("profiles").select("id,company_id,role,companies(status)")
      .eq("id", reset.user_id).eq("status", "active").is("deleted_at", null).single();
    const company = profile?.companies as unknown as { status?: string } | null;
    if (!profile || (profile.role !== "super_admin" && company?.status !== "active")) {
      throw new Error("الحساب غير نشط. يرجى التواصل مع المسؤول.");
    }
    await validatePassword(password);
    const claimedAt = new Date().toISOString();
    const { data: claimed } = await admin.from("user_password_resets").update({ used_at: claimedAt })
      .eq("token_hash", tokenHash).is("used_at", null).gt("expires_at", claimedAt).select("user_id").single();
    if (!claimed) throw new Error("رابط الاستعادة منتهي الصلاحية أو مستخدم. اطلب رابطاً جديداً من المسؤول.");
    // Revoke first so no existing session survives the password replacement.
    const { error: revokeError } = await admin.rpc("revoke_user_sessions", { target_user_id: claimed.user_id });
    if (revokeError) {
      await admin.from("user_password_resets").update({ used_at: null }).eq("token_hash", tokenHash).eq("used_at", claimedAt);
      throw new Error("تعذر إنهاء الجلسات السابقة. حاول مرة أخرى.");
    }
    const { error } = await admin.auth.admin.updateUserById(claimed.user_id, { password });
    if (error) {
      await admin.from("user_password_resets").update({ used_at: null }).eq("token_hash", tokenHash).eq("used_at", claimedAt);
      throw new Error("تعذر تحديث كلمة المرور. حاول مرة أخرى.");
    }
    const { error: finalRevokeError } = await admin.rpc("revoke_user_sessions", { target_user_id: claimed.user_id });
    if (finalRevokeError) throw new Error("تم تحديث كلمة المرور، لكن تعذر إنهاء جميع الجلسات. تواصل مع المسؤول.");
    await writeAudit({ eventType: "profile_update", targetCompanyId: profile.company_id, outcome: "success",
      details: { action: "password_reset_completed", target_user_id: claimed.user_id } });
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "تعذر استعادة كلمة المرور." };
  }
}

export async function completePasswordResetAction(_: ActionResult | undefined, formData: FormData) {
  const password = String(formData.get("password") ?? "");
  if (password !== String(formData.get("confirm_password") ?? "")) return { success: false as const, error: "كلمتا المرور غير متطابقتين." };
  return completePasswordReset(String(formData.get("token") ?? ""), password);
}
