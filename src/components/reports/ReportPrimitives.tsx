import type { ReactNode } from "react";
import type { ReportFilter } from "@/lib/actions/reports-actions";

export function defaultReportFilter(params?: Record<string, string | undefined>): ReportFilter {
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Riyadh", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  return { startDate: params?.startDate ?? `${today.slice(0, 8)}01`, endDate: params?.endDate ?? today, ownerId: params?.ownerId || undefined, facilityType: params?.facilityType || undefined, region: params?.region || undefined, city: params?.city || undefined };
}
export function ReportHeader({ title, description, action }: { title: string; description: string; action: ReactNode }) { return <div className="flex flex-wrap items-start justify-between gap-3"><div><h1 className="text-2xl font-bold text-nebras-green">{title}</h1><p className="mt-1 text-sm text-slate-600">{description}</p></div>{action}</div> }
export function MetricCards({ items }: { items: Array<{ label: string; value: string | number }> }) { return <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{items.map((item) => <article key={item.label} className="rounded-xl border border-nebras-line bg-white p-4 shadow-sm"><p className="text-sm text-slate-500">{item.label}</p><p className="mt-2 text-2xl font-bold text-nebras-green">{item.value}</p></article>)}</div> }
export function EmptyState() { return <p className="rounded-xl border border-dashed border-nebras-line bg-white p-8 text-center text-slate-500">لا توجد بيانات للفترة المحددة</p> }
