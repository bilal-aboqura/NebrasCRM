import Link from "next/link";
import { BarChart3, ChartNoAxesCombined, CircleDollarSign, GitCompareArrows, ListChecks, MessageSquareMore } from "lucide-react";
import { getAuthContext, isManagementRole } from "@/lib/auth/context";

const reports = [
  { href: "/reports/pipeline", title: "تدفق المبيعات", description: "حركة المنشآت بين مراحل مسار المبيعات", icon: BarChart3 },
  { href: "/reports/conversion-loss", title: "التحويل والخسارة", description: "قمع التحويل ونسبة الفوز وأسباب الخسارة", icon: ChartNoAxesCombined },
  { href: "/reports/followup-performance", title: "أداء المتابعات", description: "الإنجاز والالتزام بالمواعيد حسب النوع", icon: ListChecks },
  { href: "/reports/communication", title: "نشاط التواصل", description: "المكالمات ورسائل واتساب والنتائج", icon: MessageSquareMore },
  { href: "/reports/offers-revenue", title: "العروض والإيرادات", description: "قيمة العروض والعقود النشطة", icon: CircleDollarSign },
  { href: "/reports/team-comparison", title: "مقارنة الفريق", description: "مقارنة أداء مندوبي المبيعات", icon: GitCompareArrows, managerOnly: true }
];
export default async function ReportsPage() { const { role } = await getAuthContext(); return <section className="space-y-5"><div><h1 className="text-3xl font-bold text-nebras-green">التقارير</h1><p className="mt-1 text-slate-600">حلّل الأداء خلال فترة زمنية وحدد فرص التحسين.</p></div><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{reports.filter((report) => !report.managerOnly || isManagementRole(role)).map((report) => { const Icon=report.icon; return <Link key={report.href} href={report.href} className="rounded-xl border border-nebras-line bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-nebras-gold"><Icon className="text-nebras-gold"/><h2 className="mt-4 text-lg font-bold text-nebras-green">{report.title}</h2><p className="mt-1 text-sm text-slate-600">{report.description}</p></Link> })}</div></section> }
