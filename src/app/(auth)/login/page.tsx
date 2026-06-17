import Link from "next/link";
import { loginAction } from "@/lib/auth/login-action";

export default function LoginPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-nebras-cream px-4">
      <section className="w-full max-w-sm rounded-lg border border-nebras-line bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-nebras-green">NEBRASGOO CRM</h1>
        <p className="mt-2 text-sm text-slate-600">تسجيل الدخول إلى منصة إدارة المبيعات والاعتماد</p>
        <form action={loginAction} className="mt-6 space-y-4">
          <label className="block text-sm font-medium">
            البريد الإلكتروني
            <input name="email" type="email" defaultValue="super@nebras.local" className="mt-1 w-full rounded-md border border-nebras-line px-3 py-2 text-left" />
          </label>
          <label className="block text-sm font-medium">
            كلمة المرور
            <input name="password" type="password" defaultValue="password" className="mt-1 w-full rounded-md border border-nebras-line px-3 py-2 text-left" />
          </label>
          <button className="w-full rounded-md bg-nebras-green px-4 py-2 font-semibold text-white">دخول</button>
        </form>
        <Link href="/reset" className="mt-4 block text-sm text-nebras-green">تعليمات استعادة كلمة المرور</Link>
      </section>
    </main>
  );
}
