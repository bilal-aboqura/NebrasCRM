"use client";

import { useFormState, useFormStatus } from "react-dom";
import { loginAction, type LoginState } from "@/lib/auth/login-action";

function SubmitButton() {
  const { pending } = useFormStatus();
  return <button disabled={pending} className="w-full rounded-xl bg-nebras-green px-4 py-3 font-bold text-white transition hover:bg-emerald-900 disabled:opacity-60">{pending ? "جارٍ تسجيل الدخول..." : "تسجيل الدخول"}</button>;
}

export function LoginForm() {
  const [state, action] = useFormState<LoginState, FormData>(loginAction, {});
  return (
    <form action={action} className="space-y-5">
      <div><label htmlFor="email" className="mb-2 block font-medium">البريد الإلكتروني</label><input id="email" name="email" type="email" required autoComplete="email" className="w-full rounded-xl border border-emerald-900/20 bg-white px-4 py-3 text-left" dir="ltr" /></div>
      <div><label htmlFor="password" className="mb-2 block font-medium">كلمة المرور</label><input id="password" name="password" type="password" required autoComplete="current-password" className="w-full rounded-xl border border-emerald-900/20 bg-white px-4 py-3 text-left" dir="ltr" /></div>
      {state.error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm font-medium text-red-800">{state.error}</p>}
      <SubmitButton />
    </form>
  );
}

