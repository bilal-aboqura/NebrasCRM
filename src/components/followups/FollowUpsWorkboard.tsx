"use client";

import Link from "next/link";
import { AlertTriangle, CheckCircle2, Clock3 } from "lucide-react";
import { CompleteFollowUpModal } from "./CompleteFollowUpModal";
import { FollowUpModal } from "./FollowUpModal";
import type { FollowUpRecord } from "@/lib/types/followups";

type OwnerOption = { id: string; display_name: string; status?: string };
const typeLabels = { call: "اتصال", visit: "زيارة", send_offer: "إرسال عرض", other: "أخرى" } as const;

function first<T>(value: T | T[] | null | undefined): T | null {
  return Array.isArray(value) ? value[0] ?? null : value ?? null;
}

export function FollowUpsWorkboard({ records, owners, canManage }: { records: FollowUpRecord[]; owners: OwnerOption[]; canManage: boolean }) {
  if (!records.length) return <div className="rounded-2xl border border-dashed bg-white p-12 text-center text-slate-500">لا توجد متابعات ضمن هذا التصنيف.</div>;
  return <ul className="space-y-3" dir="rtl">{records.map((followUp) => {
    const facility = first(followUp.facility);
    const owner = first(followUp.owner);
    const contact = first(followUp.contact);
    const done = followUp.status === "done";
    return <li key={followUp.id} className={`rounded-2xl border p-5 shadow-sm ${followUp.is_overdue ? "border-red-200 bg-red-50" : done ? "border-emerald-100 bg-emerald-50/60" : "border-slate-200 bg-white"}`}>
      <div className="flex flex-wrap items-start justify-between gap-4"><div className="flex items-start gap-3">{followUp.is_overdue ? <AlertTriangle className="mt-1 text-red-600" /> : done ? <CheckCircle2 className="mt-1 text-emerald-600" /> : <Clock3 className="mt-1 text-nebras-gold" />}<div><div className="flex flex-wrap items-center gap-2"><strong className={done ? "line-through" : ""}>{typeLabels[followUp.type]}</strong>{followUp.is_overdue && <span className="rounded-full bg-red-600 px-2 py-1 text-xs font-bold text-white">متأخرة</span>}{followUp.due_state === "today" && <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-bold text-amber-800">اليوم</span>}</div><time className="mt-1 block text-sm text-slate-600">{new Intl.DateTimeFormat("ar-SA", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Riyadh" }).format(new Date(followUp.due_at))}</time>{facility && <Link href={`/dashboard/facilities/${facility.id}`} className="mt-2 inline-block font-bold text-nebras-green hover:underline">{facility.name_ar}</Link>}</div></div><div className="text-sm text-slate-600"><p>المسؤول: <strong>{owner?.display_name ?? "—"}</strong></p>{contact && <p>جهة الاتصال: {contact.name_ar}</p>}</div></div>
      {followUp.notes && <p className="mt-3 whitespace-pre-wrap rounded-lg bg-white/70 p-3 text-sm">{followUp.notes}</p>}
      {followUp.status === "pending" && <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-200 pt-3"><CompleteFollowUpModal id={followUp.id} type={followUp.type} /><FollowUpModal facilityId={followUp.facility_id} followUp={followUp} owners={owners} canManage={canManage} /></div>}
    </li>;
  })}</ul>;
}

