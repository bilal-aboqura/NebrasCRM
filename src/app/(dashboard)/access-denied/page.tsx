import Link from "next/link";

export default function AccessDeniedPage() {
  return <section className="rounded-2xl bg-white p-10 text-center"><h1 className="text-3xl font-extrabold text-red-800">غير مصرح بالدخول</h1><p className="my-4 text-slate-600">ليست لديك الصلاحية اللازمة لعرض هذه الصفحة.</p><Link href="/" className="font-bold text-nebras-green underline">العودة إلى لوحة التحكم</Link></section>;
}

