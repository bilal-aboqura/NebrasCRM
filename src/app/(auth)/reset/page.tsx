import Link from "next/link";
import { PasswordResetForm } from "@/components/admin/PasswordResetForm";

export default function ResetPage({ searchParams }: { searchParams: { token?: string } }) {
  return <main className="grid min-h-screen place-items-center px-4 py-8"><section className="w-full max-w-lg rounded-3xl bg-white p-6 text-center shadow-xl sm:p-10"><h1 className="mb-6 text-3xl font-extrabold text-nebras-green">استعادة كلمة المرور</h1>{searchParams.token ? <PasswordResetForm token={searchParams.token} /> : <p className="my-6 leading-8 text-slate-600">تواصل مع مدير شركتك للتحقق من هويتك والحصول على رابط استعادة كلمة المرور. الرابط صالح لمدة ساعة ويُستخدم مرة واحدة.</p>}<Link href="/login" className="mt-6 inline-block font-bold text-nebras-green underline">العودة إلى تسجيل الدخول</Link></section></main>;
}

