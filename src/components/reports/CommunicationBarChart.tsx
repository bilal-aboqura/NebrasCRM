"use client";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
export function CommunicationBarChart({ data }: { data: Array<{ outcome: string; count: number }> }) {
  return <div className="h-80" dir="ltr"><ResponsiveContainer><BarChart data={data}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="outcome" /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="count" name="العدد" fill="#0b4d3b" /></BarChart></ResponsiveContainer></div>;
}
