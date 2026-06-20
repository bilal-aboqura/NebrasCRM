"use client";

import { useState } from "react";

function riyadhDate(date = new Date()) { return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Riyadh", year: "numeric", month: "2-digit", day: "2-digit" }).format(date) }
function shift(date: string, days: number) { const value = new Date(`${date}T12:00:00+03:00`); value.setUTCDate(value.getUTCDate() + days); return riyadhDate(value) }

export default function DateRangePicker({ startDate, endDate }: { startDate: string; endDate: string }) {
  const [start, setStart] = useState(startDate); const [end, setEnd] = useState(endDate);
  const applyPreset = (preset: string) => {
    const today = riyadhDate(); const current = new Date(`${today}T12:00:00+03:00`); let first = today;
    if (preset === "week") first = shift(today, -current.getUTCDay());
    if (preset === "month") first = `${today.slice(0, 8)}01`;
    if (preset === "quarter") first = `${today.slice(0, 5)}${String(Math.floor((Number(today.slice(5, 7)) - 1) / 3) * 3 + 1).padStart(2, "0")}-01`;
    if (preset === "year") first = `${today.slice(0, 4)}-01-01`;
    setStart(first); setEnd(today);
  };
  return <div className="flex flex-wrap items-end gap-2"><label className="text-sm">من<input className="mt-1 block rounded-md border border-nebras-line px-3 py-2" type="date" name="startDate" value={start} onChange={(e) => setStart(e.target.value)} /></label><label className="text-sm">إلى<input className="mt-1 block rounded-md border border-nebras-line px-3 py-2" type="date" name="endDate" value={end} onChange={(e) => setEnd(e.target.value)} /></label><div className="flex flex-wrap gap-1">{[["today","اليوم"],["week","هذا الأسبوع"],["month","هذا الشهر"],["quarter","هذا الربع"],["year","هذه السنة"]].map(([value,label]) => <button key={value} type="button" onClick={() => applyPreset(value)} className="rounded-md border border-nebras-line px-2 py-2 text-xs hover:bg-nebras-cream">{label}</button>)}</div></div>;
}
