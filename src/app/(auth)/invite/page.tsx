import Link from "next/link";
import { InvitationForm } from "@/components/admin/InvitationForm";

export default function InvitePage({ searchParams }: { searchParams: { token?: string } }) {
  return <main className="grid min-h-screen place-items-center px-4"><section className="w-full max-w-lg rounded-3xl bg-white p-8 shadow-xl"><h1 className="text-3xl font-extrabold text-nebras-green">تفعيل حسابك</h1><p className="mb-6 mt-2 text-slate-600">أنشئ كلمة مرور آمنة لإكمال الدعوة.</p>{searchParams.token ? <InvitationForm token={searchParams.token} /> : <div><p className="text-red-700">رابط الدعوة غير صالح.</p><Link href="/login" className="mt-4 inline-block font-bold text-nebras-green underline">العودة لتسجيل الدخول</Link></div>}</section></main>;
}

