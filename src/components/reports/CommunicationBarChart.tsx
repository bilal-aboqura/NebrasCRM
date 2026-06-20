"use client";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { CommOutcomeMetric } from "@/lib/actions/reports-actions";
export default function CommunicationBarChart({ data }: { data: CommOutcomeMetric[] }) { return <div className="h-80 w-full" dir="ltr"><ResponsiveContainer><BarChart data={data}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="outcome"/><YAxis allowDecimals={false}/><Tooltip/><Bar dataKey="count" name="العدد" fill="#d6a84b"/></BarChart></ResponsiveContainer></div> }
