"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList
} from "recharts";
import type { DashboardData } from "@/lib/actions/dashboard";

interface Props {
  funnelData: DashboardData["funnelData"];
}

interface TooltipPayload {
  value: number;
  payload: { name: string; color: string };
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayload[] }) {
  if (!active || !payload?.length) return null;
  const { value, payload: item } = payload[0];
  return (
    <div className="rounded-lg border border-nebras-line bg-white px-3 py-2 shadow-lg text-sm">
      <p className="font-semibold text-nebras-ink">{item.name}</p>
      <p className="text-slate-500">{value.toLocaleString("ar-SA")} منشأة</p>
    </div>
  );
}

export default function PipelineFunnel({ funnelData }: Props) {
  const hasData = funnelData.some((d) => d.count > 0);

  if (!hasData) {
    return (
      <div id="pipeline-funnel" className="rounded-xl border border-nebras-line bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-base font-semibold text-nebras-ink">مسار المبيعات</h2>
        <p className="text-center text-slate-400 py-8">لا توجد بيانات لعرضها</p>
      </div>
    );
  }

  return (
    <div id="pipeline-funnel" className="rounded-xl border border-nebras-line bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-base font-semibold text-nebras-ink">مسار المبيعات</h2>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart
          data={funnelData}
          layout="vertical"
          margin={{ top: 0, right: 48, bottom: 0, left: 8 }}
        >
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="name"
            width={90}
            tick={{ fontSize: 13, fill: "#374151", fontFamily: "inherit" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(0,0,0,0.04)" }} />
          <Bar dataKey="count" radius={[0, 6, 6, 0]} maxBarSize={28}>
            {funnelData.map((entry) => (
              <Cell key={entry.status} fill={entry.color} />
            ))}
            <LabelList
              dataKey="count"
              position="right"
              style={{ fontSize: 13, fill: "#374151", fontFamily: "inherit", fontWeight: 600 }}
              formatter={(v) => (typeof v === "number" ? v.toLocaleString("ar-SA") : String(v ?? ""))}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
