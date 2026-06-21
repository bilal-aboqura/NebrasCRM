"use client";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
export function InflowOutflowChart({ data }: { data: Array<{ stage: string; inflow: number; outflow: number }> }) {
  return <div className="h-80 w-full" dir="ltr"><ResponsiveContainer><BarChart data={data}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="stage" /><YAxis allowDecimals={false} /><Tooltip /><Legend /><Bar name="الدخول" dataKey="inflow" fill="#0b4d3b" /><Bar name="الخروج" dataKey="outflow" fill="#c5a253" /></BarChart></ResponsiveContainer></div>;
}
