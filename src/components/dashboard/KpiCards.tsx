import Link from "next/link";
import { Building2, CalendarClock, FileCheck2, FileText, Percent } from "lucide-react";
import type { DashboardData } from "@/lib/actions/dashboard";

const number = new Intl.NumberFormat("ar-SA");
const money = new Intl.NumberFormat("ar-SA", { style: "currency", currency: "SAR", minimumFractionDigits: 2 });

export function KpiCards({ kpis }: { kpis: DashboardData["kpis"] }) {
  const cards = [
    { label: "المنشآت النشطة", value: number.format(kpis.totalFacilities), detail: "إجمالي المنشآت ضمن نطاقك", href: "/dashboard/facilities", icon: Building2, tone: "bg-emerald-50 text-emerald-700" },
    { label: "متابعات مستحقة", value: number.format(kpis.overdueFollowUps), detail: "متأخرة أو مستحقة اليوم", href: "/dashboard/followups", icon: CalendarClock, tone: "bg-amber-50 text-amber-700" },
    { label: "عروض بانتظار الرد", value: number.format(kpis.pendingOffersCount), detail: money.format(kpis.pendingOffersValue), href: "/dashboard/offers", icon: FileText, tone: "bg-blue-50 text-blue-700" },
    { label: "العقود النشطة", value: number.format(kpis.activeContractsCount), detail: money.format(kpis.activeContractsValue), href: "/dashboard/contracts", icon: FileCheck2, tone: "bg-violet-50 text-violet-700" },
    { label: "معدل التحويل", value: `${number.format(kpis.conversionRate)}٪`, detail: "من المنشآت إلى عقود", href: "/dashboard/pipeline", icon: Percent, tone: "bg-rose-50 text-rose-700" },
  ];

  return <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
    {cards.map(({ label, value, detail, href, icon: Icon, tone }) => <Link
      key={label}
      href={href}
      className="group rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <span className={`grid size-10 place-items-center rounded-xl ${tone}`}><Icon aria-hidden size={20} /></span>
      <p className="mt-4 text-sm font-bold text-slate-500">{label}</p>
      <strong className="mt-1 block text-3xl font-extrabold text-nebras-green">{value}</strong>
      <span className="mt-2 block text-xs font-bold text-slate-500 group-hover:text-nebras-gold">{detail}</span>
    </Link>)}
  </div>;
}
