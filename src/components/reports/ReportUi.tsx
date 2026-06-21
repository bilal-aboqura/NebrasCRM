import type { ReactNode } from "react";

export function ReportHeader({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return <header className="flex flex-wrap items-start justify-between gap-4"><div><p className="font-bold text-nebras-gold">التقارير التحليلية</p><h1 className="text-3xl font-extrabold text-nebras-green">{title}</h1><p className="mt-2 text-slate-600">{description}</p></div>{action}</header>;
}
export function MetricCard({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return <article className="rounded-2xl bg-white p-5 shadow-sm"><p className="text-sm font-bold text-slate-500">{label}</p><p className="mt-2 text-2xl font-extrabold text-nebras-green">{value}</p>{hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}</article>;
}
export function EmptyState() { return <div className="rounded-2xl bg-white p-10 text-center text-slate-500 shadow-sm">لا توجد بيانات للفترة المحددة</div>; }
