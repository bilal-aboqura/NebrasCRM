"use client";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { FunnelStage } from "@/lib/actions/reports-actions";
export default function FunnelChart({ data }: { data: FunnelStage[] }) { return <div className="h-80 w-full" dir="ltr"><ResponsiveContainer><BarChart data={data} layout="vertical"><CartesianGrid strokeDasharray="3 3"/><XAxis type="number" allowDecimals={false}/><YAxis type="category" dataKey="stage" width={90}/><Tooltip/><Bar dataKey="count" name="العدد" fill="#1f6b4f"/></BarChart></ResponsiveContainer></div> }
