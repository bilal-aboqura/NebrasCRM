"use client";
import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
export function FunnelChart({ data }: { data: Array<{ stage: string; count: number; percentage: number }> }) {
  return <div className="h-80 w-full" dir="ltr"><ResponsiveContainer><BarChart data={data} layout="vertical" margin={{ left: 30 }}><CartesianGrid strokeDasharray="3 3" /><XAxis type="number" allowDecimals={false} /><YAxis type="category" dataKey="stage" width={90} /><Tooltip /><Bar dataKey="count" name="العدد" fill="#0b4d3b"><LabelList dataKey="percentage" position="right" formatter={(value: unknown) => `${value}%`} /></Bar></BarChart></ResponsiveContainer></div>;
}
