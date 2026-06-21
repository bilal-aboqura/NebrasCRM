import Link from "next/link";
import { LoginForm } from "@/components/LoginForm";

export default function LoginPage({ searchParams }: { searchParams: { reason?: string } }) {
  return (
    <main className="grid min-h-screen place-items-center px-4 py-10">
      <section className="w-full max-w-md rounded-3xl border border-nebras-gold/30 bg-white p-7 shadow-xl sm:p-10" aria-labelledby="login-title">
        <div className="mb-8 text-center"><div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-nebras-green text-2xl font-extrabold text-nebras-gold">ن</div><h1 id="login-title" className="text-3xl font-extrabold text-nebras-green">مرحباً بك في نبراس</h1><p className="mt-2 text-slate-600">سجّل الدخول إلى مساحة عمل شركتك</p></div>
        {searchParams.reason === "session_expired" && <p role="status" className="mb-5 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">انتهت جلستك. يرجى تسجيل الدخول مرة أخرى.</p>}
        {searchParams.reason === "inactive" && <p role="status" className="mb-5 rounded-lg bg-red-50 p-3 text-sm text-red-800">تم إيقاف الحساب أو الشركة. يرجى التواصل مع المسؤول.</p>}
        <LoginForm />
        <Link href="/reset" className="mt-6 block text-center font-medium text-nebras-green underline decoration-nebras-gold underline-offset-4">هل نسيت كلمة المرور؟</Link>
      </section>
    </main>
  );
}
