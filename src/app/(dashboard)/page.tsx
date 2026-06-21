import { Building2, ShieldCheck } from "lucide-react";
import { requireAuth } from "@/lib/auth/context";

export default async function DashboardPage() {
  const context = await requireAuth();
  return <section><p className="text-nebras-gold">لوحة التحكم</p><h1 className="mt-1 text-3xl font-extrabold text-nebras-green">أهلاً، {context.fullName || context.email}</h1><p className="mt-3 text-slate-600">أنت تعمل الآن ضمن نطاق <strong>{context.companyName}</strong>.</p><div className="mt-8 grid gap-5 sm:grid-cols-2"><article className="rounded-2xl bg-white p-6 shadow-sm"><Building2 className="mb-4 text-nebras-gold" aria-hidden /><h2 className="font-bold">عزل بيانات الشركة</h2><p className="mt-2 text-sm text-slate-500">جميع البيانات محصورة في الشركة النشطة.</p></article><article className="rounded-2xl bg-white p-6 shadow-sm"><ShieldCheck className="mb-4 text-nebras-gold" aria-hidden /><h2 className="font-bold">صلاحيات آمنة</h2><p className="mt-2 text-sm text-slate-500">القوائم والصفحات مخصصة حسب دورك.</p></article></div></section>;
}

