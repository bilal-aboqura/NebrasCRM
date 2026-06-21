"use client";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
export function FollowupStackedChart({ data }: { data: Array<Record<string, string | number>> }) {
  return <div className="h-80" dir="ltr"><ResponsiveContainer><BarChart data={data}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="type" /><YAxis allowDecimals={false} /><Tooltip /><Legend /><Bar dataKey="completed" name="مكتملة" stackId="a" fill="#0b4d3b" /><Bar dataKey="cancelled" name="ملغاة" stackId="a" fill="#c5a253" /><Bar dataKey="overdue" name="متأخرة" stackId="a" fill="#dc2626" /></BarChart></ResponsiveContainer></div>;
}
