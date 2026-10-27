"use client";

import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import { completePasswordResetAction } from "@/lib/actions/password-reset";
import type { ActionResult } from "@/lib/actions/admin";

function Submit() {
  const { pending } = useFormStatus();
  return <button disabled={pending} className="w-full rounded-xl bg-nebras-green px-5 py-3 font-bold text-white hover:bg-emerald-900 disabled:opacity-60">{pending ? "جارٍ حفظ كلمة المرور..." : "حفظ كلمة المرور الجديدة"}</button>;
}

export function PasswordResetForm({ token }: { token: string }) {
  const [state, action] = useFormState<ActionResult | undefined, FormData>(completePasswordResetAction, undefined);
  if (state?.success) return <div className="space-y-5">
    <p role="status" className="rounded-lg bg-emerald-50 p-4 text-emerald-900">تم تحديث كلمة المرور وإنهاء الجلسات السابقة. يمكنك تسجيل الدخول بكلمة المرور الجديدة.</p>
    <Link href="/login" className="inline-block font-bold text-nebras-green underline">تسجيل الدخول</Link>
  </div>;
  return <form action={action} className="space-y-5 text-right">
    <input type="hidden" name="token" value={token} />
    <label className="block space-y-2"><span>كلمة المرور الجديدة</span><input name="password" type="password" required minLength={12} autoComplete="new-password" dir="ltr" aria-describedby="password-hint" className="w-full rounded-lg border px-3 py-3" /></label>
    <p id="password-hint" className="text-sm text-slate-600">12 خانة على الأقل، ويجب ألا تكون ضمن كلمات المرور المسرّبة.</p>
    <label className="block space-y-2"><span>تأكيد كلمة المرور</span><input name="confirm_password" type="password" required minLength={12} autoComplete="new-password" dir="ltr" className="w-full rounded-lg border px-3 py-3" /></label>
    {state && !state.success && <p role="alert" className="rounded-lg bg-red-50 p-3 text-red-800">{state.error}</p>}
    <Submit />
  </form>;
}
