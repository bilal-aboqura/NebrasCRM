"use client";

import { useState, useTransition } from "react";
import { getTeamPerformanceAction, type RepPerformance, type PerformancePeriod } from "@/lib/actions/dashboard";

interface Props {
  initialData: RepPerformance[];
  initialPeriod?: PerformancePeriod;
}

const PERIOD_LABELS: Record<PerformancePeriod, string> = {
  week: "هذا الأسبوع",
  month: "هذا الشهر",
  quarter: "هذا الربع"
};

export default function TeamPerformance({ initialData, initialPeriod = "month" }: Props) {
  const [period, setPeriod] = useState<PerformancePeriod>(initialPeriod);
  const [data, setData] = useState<RepPerformance[]>(initialData);
  const [isPending, startTransition] = useTransition();

  function handlePeriodChange(newPeriod: PerformancePeriod) {
    setPeriod(newPeriod);
    startTransition(async () => {
      const result = await getTeamPerformanceAction(newPeriod);
      setData(result);
    });
  }

  return (
    <section id="team-performance" className="rounded-xl border border-nebras-line bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h2 className="text-base font-semibold text-nebras-ink flex items-center gap-2">
          <span>👥</span>
          أداء الفريق
        </h2>
        <div id="period-filter" role="group" aria-label="تصفية الفترة" className="flex gap-1 rounded-lg border border-nebras-line p-0.5 bg-nebras-cream">
          {(["week", "month", "quarter"] as PerformancePeriod[]).map((p) => (
            <button
              key={p}
              id={`period-${p}`}
              onClick={() => handlePeriodChange(p)}
              disabled={isPending}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                period === p
                  ? "bg-nebras-green text-white shadow-sm"
                  : "text-slate-600 hover:bg-white hover:text-nebras-ink"
              }`}
            >
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>
      </div>

      {data.length === 0 ? (
        <p className="text-center text-slate-400 py-6 text-sm">لا يوجد مندوبو مبيعات في الشركة</p>
      ) : (
        <div className="overflow-x-auto">
          <table
            id="team-performance-table"
            className={`w-full text-sm transition-opacity ${isPending ? "opacity-50" : "opacity-100"}`}
          >
            <thead>
              <tr className="border-b border-nebras-line text-xs text-slate-500">
                <th className="pb-2 text-start font-medium">المندوب</th>
                <th className="pb-2 text-center font-medium">المنشآت</th>
                <th className="pb-2 text-center font-medium">المتابعات المكتملة</th>
                <th className="pb-2 text-center font-medium">المكالمات</th>
                <th className="pb-2 text-center font-medium">العروض المرسلة</th>
                <th className="pb-2 text-center font-medium">العقود المبرمة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-nebras-line">
              {data.map((rep) => (
                <tr key={rep.repId} className="hover:bg-nebras-cream/50 transition-colors">
                  <td className="py-2.5 font-medium text-nebras-ink">{rep.displayName}</td>
                  <td className="py-2.5 text-center text-slate-700">{rep.facilitiesAssigned.toLocaleString("ar-SA")}</td>
                  <td className="py-2.5 text-center text-slate-700">{rep.followUpsCompleted.toLocaleString("ar-SA")}</td>
                  <td className="py-2.5 text-center text-slate-700">{rep.callsLogged.toLocaleString("ar-SA")}</td>
                  <td className="py-2.5 text-center text-slate-700">{rep.offersSent.toLocaleString("ar-SA")}</td>
                  <td className="py-2.5 text-center">
                    <span className={`font-semibold ${rep.contractsWon > 0 ? "text-green-600" : "text-slate-400"}`}>
                      {rep.contractsWon.toLocaleString("ar-SA")}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
