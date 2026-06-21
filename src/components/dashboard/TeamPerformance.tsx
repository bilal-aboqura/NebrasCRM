"use client";

import { useState, useTransition } from "react";
import { Users } from "lucide-react";
import type { PerformancePeriod, RepPerformance } from "@/lib/actions/dashboard";

const PERIODS: Array<{ value: PerformancePeriod; label: string }> = [
  { value: "week", label: "هذا الأسبوع" },
  { value: "month", label: "هذا الشهر" },
  { value: "quarter", label: "هذا الربع" },
];
const number = new Intl.NumberFormat("ar-SA");

export function TeamPerformance({ initialData, onPeriodChange }: { initialData: RepPerformance[]; onPeriodChange: (period: PerformancePeriod) => Promise<RepPerformance[]> }) {
  const [period, setPeriod] = useState<PerformancePeriod>("week");
  const [rows, setRows] = useState(initialData);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function selectPeriod(next: PerformancePeriod) {
    setPeriod(next);
    setError("");
    startTransition(async () => {
      try { setRows(await onPeriodChange(next)); }
      catch { setError("تعذر تحديث أداء الفريق. حاول مرة أخرى."); }
    });
  }

  return <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm" aria-labelledby="team-title">
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
      <div className="flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-xl bg-blue-50 text-blue-700"><Users aria-hidden size={20} /></span>
        <div><h2 id="team-title" className="text-lg font-extrabold text-nebras-green">أداء الفريق</h2><p className="mt-1 text-sm text-slate-500">ملخص نشاط مندوبي المبيعات</p></div>
      </div>
      <div className="flex rounded-xl bg-slate-100 p-1" aria-label="فترة الأداء">
        {PERIODS.map((item) => <button key={item.value} type="button" aria-pressed={period === item.value} disabled={pending} onClick={() => selectPeriod(item.value)} className={`rounded-lg px-3 py-2 text-xs font-bold transition ${period === item.value ? "bg-white text-nebras-green shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>{item.label}</button>)}
      </div>
    </div>
    {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</p>}
    <div className={`mt-5 overflow-x-auto transition-opacity ${pending ? "opacity-50" : "opacity-100"}`} aria-busy={pending}>
      {rows.length === 0 ? <p className="rounded-xl bg-slate-50 px-4 py-10 text-center text-sm font-bold text-slate-500">لا توجد بيانات لعرضها</p> :
        <table className="w-full min-w-[720px] text-right text-sm">
          <thead><tr className="border-b border-slate-200 text-xs text-slate-500"><th className="px-3 py-3">المندوب</th><th className="px-3 py-3">المنشآت المسندة</th><th className="px-3 py-3">متابعات مكتملة</th><th className="px-3 py-3">اتصالات مسجلة</th><th className="px-3 py-3">عروض مرسلة</th><th className="px-3 py-3">عقود ناجحة</th></tr></thead>
          <tbody>{rows.map((row) => <tr key={row.repId} className="border-b border-slate-100 last:border-0"><th className="px-3 py-4 font-extrabold text-slate-800">{row.displayName}</th><td className="px-3 py-4">{number.format(row.facilitiesAssigned)}</td><td className="px-3 py-4">{number.format(row.followUpsCompleted)}</td><td className="px-3 py-4">{number.format(row.callsLogged)}</td><td className="px-3 py-4">{number.format(row.offersSent)}</td><td className="px-3 py-4 font-extrabold text-emerald-700">{number.format(row.contractsWon)}</td></tr>)}</tbody>
        </table>}
    </div>
  </section>;
}
