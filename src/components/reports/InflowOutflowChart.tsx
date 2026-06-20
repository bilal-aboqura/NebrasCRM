"use client";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { PipelineStageMetric } from "@/lib/actions/reports-actions";
export default function InflowOutflowChart({ data }: { data: PipelineStageMetric[] }) { return <div className="h-80 w-full" dir="ltr"><ResponsiveContainer><BarChart data={data}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="stage"/><YAxis allowDecimals={false}/><Tooltip/><Legend/><Bar dataKey="inflow" name="الدخول" fill="#1f6b4f"/><Bar dataKey="outflow" name="الخروج" fill="#d6a84b"/></BarChart></ResponsiveContainer></div> }
