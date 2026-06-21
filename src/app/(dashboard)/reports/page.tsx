import Link from "next/link";
import { BarChart3, ChartNoAxesCombined, CircleDollarSign, GitCompareArrows, ListChecks, MessagesSquare } from "lucide-react";
import { requireAuth } from "@/lib/auth/context";

const reports = [
  ["pipeline", "تدفق المبيعات", "حركة المنشآت بين مراحل المسار", BarChart3],
  ["conversion-loss", "التحويل والخسارة", "قمع التحويل وأسباب خسارة الفرص", ChartNoAxesCombined],
  ["followup-performance", "أداء المتابعات", "الالتزام بالمواعيد ومعدلات الإنجاز", ListChecks],
  ["communication", "نشاط التواصل", "المكالمات ورسائل واتساب والنتائج", MessagesSquare],
  ["offers-revenue", "العروض والإيرادات", "قيم العروض والعقود النشطة", CircleDollarSign],
  ["team-comparison", "مقارنة الفريق", "مقارنة أداء مندوبي المبيعات", GitCompareArrows],
] as const;

export default async function ReportsPage() {
  const context = await requireAuth(); const visible = context.role === "sales_user" ? reports.slice(0, 5) : reports;
  return <section className="space-y-8"><header><p className="font-bold text-nebras-gold">التحليلات</p><h1 className="text-3xl font-extrabold text-nebras-green">التقارير</h1><p className="mt-2 text-slate-600">اختر تقريراً لتحليل الأداء خلال فترة زمنية محددة.</p></header><div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{visible.map(([path, title, description, Icon]) => <Link key={path} href={`/reports/${path}`} className="group rounded-2xl bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"><Icon className="text-nebras-gold" size={32} /><h2 className="mt-5 text-xl font-extrabold text-nebras-green">{title}</h2><p className="mt-2 text-sm text-slate-600">{description}</p><span className="mt-5 inline-block font-bold text-nebras-green group-hover:underline">فتح التقرير</span></Link>)}</div></section>;
}
