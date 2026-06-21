"use client";

import { useFormState } from "react-dom";
import { changePasswordAction, updateProfileNameAction } from "@/lib/actions/profile";
import type { ActionResult } from "@/lib/actions/admin";

export function ProfileForms({ displayName, email }: { displayName: string; email: string }) {
  const [nameState, nameAction] = useFormState<ActionResult | undefined, FormData>(updateProfileNameAction, undefined);
  const [passwordState, passwordAction] = useFormState<ActionResult | undefined, FormData>(changePasswordAction, undefined);
  return <div className="grid gap-6 lg:grid-cols-2"><form action={nameAction} className="space-y-4 rounded-2xl bg-white p-6 shadow-sm"><h2 className="text-xl font-bold text-nebras-green">البيانات الشخصية</h2><label className="block space-y-2"><span>الاسم المعروض</span><input name="display_name" defaultValue={displayName} required className="w-full rounded-lg border px-3 py-2" /></label><label className="block space-y-2"><span>البريد الإلكتروني</span><input value={email} disabled dir="ltr" className="w-full rounded-lg border bg-slate-100 px-3 py-2 text-left" /></label><button className="rounded-lg bg-nebras-green px-4 py-2 font-bold text-white">حفظ الاسم</button>{nameState && <p className={nameState.success ? "text-emerald-700" : "text-red-700"}>{nameState.success ? "تم تحديث الاسم." : nameState.error}</p>}</form><form action={passwordAction} className="space-y-4 rounded-2xl bg-white p-6 shadow-sm"><h2 className="text-xl font-bold text-nebras-green">تغيير كلمة المرور</h2><label className="block space-y-2"><span>كلمة المرور الحالية</span><input name="current_password" type="password" required dir="ltr" className="w-full rounded-lg border px-3 py-2" /></label><label className="block space-y-2"><span>كلمة المرور الجديدة</span><input name="new_password" type="password" minLength={12} required dir="ltr" className="w-full rounded-lg border px-3 py-2" /></label><button className="rounded-lg bg-nebras-green px-4 py-2 font-bold text-white">تغيير كلمة المرور</button>{passwordState && <p className={passwordState.success ? "text-emerald-700" : "text-red-700"}>{passwordState.success ? "تم تغيير كلمة المرور. سجّل الدخول مجدداً." : passwordState.error}</p>}</form></div>;
}

