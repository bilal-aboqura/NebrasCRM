import Link from "next/link";

export default function ResetPage() {
  return <main className="grid min-h-screen place-items-center px-4"><section className="max-w-lg rounded-3xl bg-white p-10 text-center shadow-xl"><h1 className="text-3xl font-extrabold text-nebras-green">استعادة كلمة المرور</h1><p className="my-6 leading-8 text-slate-600">يرجى التواصل مع مدير شركتك لإعادة تعيين كلمة المرور والتحقق من هويتك.</p><Link href="/login" className="font-bold text-nebras-green underline">العودة إلى تسجيل الدخول</Link></section></main>;
}

