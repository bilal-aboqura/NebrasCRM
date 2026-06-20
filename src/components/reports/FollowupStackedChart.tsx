"use client";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { FollowupTypeMetric } from "@/lib/actions/reports-actions";
export default function FollowupStackedChart({ data }: { data: FollowupTypeMetric[] }) { return <div className="h-80 w-full" dir="ltr"><ResponsiveContainer><BarChart data={data}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="type"/><YAxis allowDecimals={false}/><Tooltip/><Legend/><Bar dataKey="completed" stackId="a" name="مكتملة" fill="#1f6b4f"/><Bar dataKey="cancelled" stackId="a" name="ملغاة" fill="#94a3b8"/><Bar dataKey="overdue" stackId="a" name="متأخرة" fill="#dc2626"/></BarChart></ResponsiveContainer></div> }
