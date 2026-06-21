"use client";

import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { DashboardData } from "@/lib/actions/dashboard";

export function PipelineFunnel({ data }: { data: DashboardData["funnelData"] }) {
  const hasData = data.some((item) => item.count > 0);
  return <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm" aria-labelledby="pipeline-title">
    <div className="mb-4">
      <h2 id="pipeline-title" className="text-lg font-extrabold text-nebras-green">مسار المبيعات</h2>
      <p className="mt-1 text-sm text-slate-500">توزيع المنشآت حسب المرحلة الحالية</p>
    </div>
    {!hasData ? <div className="grid h-72 place-items-center rounded-xl bg-slate-50 text-sm font-bold text-slate-500">لا توجد بيانات لعرضها</div> :
      <div className="h-72" dir="ltr">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 4, right: 24, bottom: 4, left: 8 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
            <XAxis type="number" allowDecimals={false} tick={{ fill: "#64748b", fontSize: 12 }} />
            <YAxis type="category" dataKey="name" width={78} tick={{ fill: "#334155", fontSize: 12, fontWeight: 700 }} />
            <Tooltip formatter={(value: number) => [new Intl.NumberFormat("ar-SA").format(value), "المنشآت"]} />
            <Bar dataKey="count" radius={[0, 8, 8, 0]} maxBarSize={24}>
              {data.map((entry) => <Cell key={entry.status} fill={entry.color} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>}
  </section>;
}
