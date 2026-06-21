"use client";

import { useMemo } from "react";

export interface DateRangeValue { startDate: string; endDate: string }

function riyadhDate(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Riyadh", year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}

function shift(date: Date, days: number) {
  const next = new Date(date); next.setUTCDate(next.getUTCDate() + days); return riyadhDate(next);
}

export function getDatePreset(preset: "today" | "week" | "month" | "quarter" | "year", now = new Date()): DateRangeValue {
  const endDate = riyadhDate(now);
  const local = new Date(`${endDate}T12:00:00Z`);
  if (preset === "today") return { startDate: endDate, endDate };
  if (preset === "week") return { startDate: shift(local, -local.getUTCDay()), endDate };
  if (preset === "month") return { startDate: `${endDate.slice(0, 8)}01`, endDate };
  if (preset === "quarter") {
    const month = Number(endDate.slice(5, 7));
    const first = Math.floor((month - 1) / 3) * 3 + 1;
    return { startDate: `${endDate.slice(0, 4)}-${String(first).padStart(2, "0")}-01`, endDate };
  }
  return { startDate: `${endDate.slice(0, 4)}-01-01`, endDate };
}

export function DateRangePicker({ value }: { value: DateRangeValue }) {
  const presets = useMemo(() => ([
    ["today", "اليوم"], ["week", "هذا الأسبوع"], ["month", "هذا الشهر"],
    ["quarter", "هذا الربع"], ["year", "هذه السنة"],
  ] as const), []);
  const apply = (preset: typeof presets[number][0]) => {
    const range = getDatePreset(preset);
    const start = document.querySelector<HTMLInputElement>('input[name="startDate"]');
    const end = document.querySelector<HTMLInputElement>('input[name="endDate"]');
    if (start && end) { start.value = range.startDate; end.value = range.endDate; }
  };
  return <div className="space-y-3">
    <div className="flex flex-wrap gap-2">{presets.map(([key, label]) =>
      <button key={key} type="button" onClick={() => apply(key)} className="rounded-lg border border-nebras-green/20 bg-white px-3 py-2 text-sm font-bold text-nebras-green hover:bg-nebras-cream">{label}</button>
    )}</div>
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="text-sm font-bold text-slate-700">من<input name="startDate" type="date" required defaultValue={value.startDate} className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2" /></label>
      <label className="text-sm font-bold text-slate-700">إلى<input name="endDate" type="date" required defaultValue={value.endDate} className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2" /></label>
    </div>
  </div>;
}
