"use client";

import { useEffect } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { completeInvitationAction, type ActionResult } from "@/lib/actions/admin";

function Submit() { const { pending } = useFormStatus(); return <button disabled={pending} className="w-full rounded-xl bg-nebras-green px-5 py-3 font-bold text-white disabled:opacity-60">{pending ? "جارٍ التفعيل..." : "تفعيل الحساب"}</button>; }
export function InvitationForm({ token }: { token: string }) {
  const router = useRouter();
  const [state, action] = useFormState<ActionResult<{ message: string }> | undefined, FormData>(completeInvitationAction, undefined);
  useEffect(() => { if (state?.success) router.push("/dashboard"); }, [state, router]);
  return <form action={action} className="space-y-5"><input type="hidden" name="token" value={token} /><label className="block space-y-2"><span>كلمة المرور الجديدة</span><input name="password" type="password" minLength={12} required autoComplete="new-password" dir="ltr" className="w-full rounded-lg border px-3 py-3" /><small className="text-slate-500">12 خانة على الأقل، ويجب ألا تكون ضمن كلمات المرور المسرّبة.</small></label><Submit />{state && <p role="status" className={state.success ? "text-emerald-700" : "text-red-700"}>{state.success ? state.message : state.error}</p>}</form>;
}

