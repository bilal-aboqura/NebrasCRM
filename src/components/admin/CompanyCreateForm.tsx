"use client";

import { useFormState, useFormStatus } from "react-dom";
import { createCompanyAction, type ActionResult } from "@/lib/actions/admin";

function Submit() { const { pending } = useFormStatus(); return <button disabled={pending} className="rounded-xl bg-nebras-green px-5 py-3 font-bold text-white disabled:opacity-60">{pending ? "جارٍ الحفظ..." : "إضافة الشركة"}</button>; }

export function CompanyCreateForm() {
  const [state, action] = useFormState<ActionResult<{ company_id: string }> | undefined, FormData>(createCompanyAction, undefined);
  return <form action={action} className="grid gap-4 rounded-2xl bg-white p-6 shadow-sm md:grid-cols-2">
    <h2 className="text-xl font-bold text-nebras-green md:col-span-2">إضافة شركة</h2>
    <label className="space-y-2"> <span>اسم الشركة بالعربية</span><input name="name_ar" required minLength={2} className="w-full rounded-lg border px-3 py-2" /></label>
    <label className="space-y-2"> <span>البريد الإلكتروني</span><input name="contact_email" type="email" className="w-full rounded-lg border px-3 py-2" /></label>
    <label className="space-y-2"> <span>رقم الهاتف</span><input name="contact_phone" dir="ltr" className="w-full rounded-lg border px-3 py-2 text-right" /></label>
    <label className="space-y-2"> <span>الحالة</span><select name="status" className="w-full rounded-lg border px-3 py-2"><option value="active">نشطة</option><option value="inactive">غير نشطة</option></select></label>
    <div className="flex items-center gap-4 md:col-span-2"><Submit />{state && <p role="status" className={state.success ? "text-emerald-700" : "text-red-700"}>{state.success ? "تمت إضافة الشركة." : state.error}</p>}</div>
  </form>;
}
