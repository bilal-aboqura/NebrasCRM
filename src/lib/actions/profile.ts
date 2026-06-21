"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/context";
import { validatePassword } from "@/lib/auth/password-security";
import type { ActionResult } from "./admin";

export async function updateProfileName(displayName: string): Promise<ActionResult> {
  try {
    const context = await requireAuth();
    const name = displayName.trim();
    if (name.length < 2 || name.length > 100) throw new Error("يرجى إدخال اسم صحيح.");
    const { error } = await createClient().from("profiles").update({ display_name: name }).eq("id", context.userId);
    if (error) throw new Error(error.message);
    revalidatePath("/profile");
    return { success: true };
  } catch (error) { return { success: false, error: error instanceof Error ? error.message : "تعذر تحديث الاسم." }; }
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<ActionResult> {
  try {
    const context = await requireAuth();
    await validatePassword(newPassword);
    const client = createClient();
    const { error: verifyError } = await client.auth.signInWithPassword({ email: context.email, password: currentPassword });
    if (verifyError) throw new Error("كلمة المرور الحالية غير صحيحة أو الجديدة لا تطابق الشروط.");
    const { error } = await client.auth.updateUser({ password: newPassword });
    if (error) throw new Error(error.message);
    await client.auth.signOut({ scope: "global" });
    return { success: true };
  } catch (error) { return { success: false, error: error instanceof Error ? error.message : "تعذر تغيير كلمة المرور." }; }
}

export async function updateProfileNameAction(_: ActionResult | undefined, formData: FormData) {
  return updateProfileName(String(formData.get("display_name") ?? ""));
}
export async function changePasswordAction(_: ActionResult | undefined, formData: FormData) {
  return changePassword(String(formData.get("current_password") ?? ""), String(formData.get("new_password") ?? ""));
}

