import Link from "next/link";
import { BarChart3, CircleDollarSign, ListChecks, MessagesSquare, Users } from "lucide-react";
import { requireAuth } from "@/lib/auth/context";

const reports = [
  { path: "pipeline", title: "تدفق المبيعات", description: "حركة المنشآت بين مراحل المسار", icon: <BarChart3 className="text-nebras-gold" size={32} /> },
  { path: "conversion-loss", title: "التحويل والخسارة", description: "قمع التحويل وأسباب خسارة الفرص", icon: <BarChart3 className="text-nebras-gold" size={32} /> },
  { path: "followup-performance", title: "أداء المتابعات", description: "الالتزام بالمواعيد ومعدلات الإنجاز", icon: <ListChecks className="text-nebras-gold" size={32} /> },
  { path: "communication", title: "نشاط التواصل", description: "المكالمات ورسائل واتساب والنتائج", icon: <MessagesSquare className="text-nebras-gold" size={32} /> },
  { path: "offers-revenue", title: "العروض والإيرادات", description: "قيم العروض والعقود النشطة", icon: <CircleDollarSign className="text-nebras-gold" size={32} /> },
  { path: "team-comparison", title: "مقارنة الفريق", description: "مقارنة أداء مندوبي المبيعات", icon: <Users className="text-nebras-gold" size={32} /> },
] as const;

export default async function ReportsPage() {
  const context = await requireAuth(); const visible = context.role === "sales_user" ? reports.slice(0, 5) : reports;
  return <section className="space-y-8"><header><p className="font-bold text-nebras-gold">التحليلات</p><h1 className="text-3xl font-extrabold text-nebras-green">التقارير</h1><p className="mt-2 text-slate-600">اختر تقريراً لتحليل الأداء خلال فترة زمنية محددة.</p></header><div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{visible.map(({ path, title, description, icon }) => <Link key={path} href={`/reports/${path}`} className="group rounded-2xl bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md">{icon}<h2 className="mt-5 text-xl font-extrabold text-nebras-green">{title}</h2><p className="mt-2 text-sm text-slate-600">{description}</p><span className="mt-5 inline-block font-bold text-nebras-green group-hover:underline">فتح التقرير</span></Link>)}</div></section>;
}
