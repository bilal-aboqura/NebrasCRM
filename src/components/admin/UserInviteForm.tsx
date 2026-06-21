"use client";

import { useFormState, useFormStatus } from "react-dom";
import { inviteUserAction, type ActionResult } from "@/lib/actions/admin";
import type { AppRole } from "@/lib/auth/types";

const labels: Record<AppRole, string> = { super_admin: "مدير النظام", company_admin: "مدير شركة", supervisor: "مشرف", sales_user: "مستخدم مبيعات" };
function Submit() { const { pending } = useFormStatus(); return <button disabled={pending} className="rounded-xl bg-nebras-green px-5 py-3 font-bold text-white disabled:opacity-60">{pending ? "جارٍ إنشاء الدعوة..." : "دعوة مستخدم"}</button>; }

export function UserInviteForm({ isSuperAdmin, companies }: { isSuperAdmin: boolean; companies: { id: string; name: string }[] }) {
  const [state, action] = useFormState<ActionResult<{ user_id: string; invitation_url: string }> | undefined, FormData>(inviteUserAction, undefined);
  const roles: AppRole[] = isSuperAdmin ? ["super_admin", "company_admin", "supervisor", "sales_user"] : ["company_admin", "supervisor", "sales_user"];
  return <form action={action} className="grid gap-4 rounded-2xl bg-white p-6 shadow-sm md:grid-cols-2">
    <h2 className="text-xl font-bold text-nebras-green md:col-span-2">دعوة مستخدم جديد</h2>
    <label className="space-y-2"><span>الاسم</span><input name="display_name" required className="w-full rounded-lg border px-3 py-2" /></label>
    <label className="space-y-2"><span>البريد الإلكتروني</span><input name="email" type="email" required dir="ltr" className="w-full rounded-lg border px-3 py-2 text-left" /></label>
    <label className="space-y-2"><span>الدور</span><select name="role" className="w-full rounded-lg border px-3 py-2">{roles.map((role) => <option key={role} value={role}>{labels[role]}</option>)}</select></label>
    {isSuperAdmin && <label className="space-y-2"><span>الشركة</span><select name="company_id" className="w-full rounded-lg border px-3 py-2"><option value="">بدون شركة (لمدير النظام فقط)</option>{companies.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}</select></label>}
    <div className="space-y-3 md:col-span-2"><Submit />{state && !state.success && <p role="alert" className="text-red-700">{state.error}</p>}{state?.success && <div role="status" className="rounded-lg bg-emerald-50 p-3 text-emerald-900"><p>تم إنشاء الدعوة. رابط التفعيل:</p><code dir="ltr" className="mt-1 block break-all select-all text-xs">{state.invitation_url}</code></div>}</div>
  </form>;
}
