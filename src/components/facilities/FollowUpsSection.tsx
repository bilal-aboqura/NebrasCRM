"use client";

import { CheckCircle2, Clock3, History } from "lucide-react";
import { CompleteFollowUpModal } from "@/components/followups/CompleteFollowUpModal";
import { FollowUpModal } from "@/components/followups/FollowUpModal";
import type { FollowUpRecord } from "@/lib/types/followups";

type ContactOption = { id: string; name_ar: string };
type OwnerOption = { id: string; display_name: string; status?: string };

const typeLabels = { call: "اتصال", visit: "زيارة", send_offer: "إرسال عرض", other: "أخرى" } as const;
const statusLabels = { pending: "معلقة", done: "مكتملة", cancelled: "ملغاة" } as const;

function relation<T>(value: T | T[] | null | undefined): T | null {
  return Array.isArray(value) ? value[0] ?? null : value ?? null;
}

function FollowUpCard({ followUp, owners, canManage }: { followUp: FollowUpRecord; owners: OwnerOption[]; canManage: boolean }) {
  const owner = relation(followUp.owner);
  const contact = relation(followUp.contact);
  const completed = followUp.status === "done";
  return <li className={`rounded-2xl border p-4 ${followUp.is_overdue ? "border-red-200 bg-red-50" : completed ? "border-emerald-100 bg-emerald-50/50 text-slate-600" : "border-slate-200 bg-white"}`}>
    <div className="flex flex-wrap items-start justify-between gap-3"><div className="flex items-start gap-3">{completed ? <CheckCircle2 className="mt-1 text-emerald-600" /> : <Clock3 className={followUp.is_overdue ? "mt-1 text-red-600" : "mt-1 text-nebras-gold"} />}<div><div className="flex flex-wrap items-center gap-2"><h3 className={`font-extrabold ${completed ? "line-through" : ""}`}>{typeLabels[followUp.type]}</h3><span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-bold">{statusLabels[followUp.status]}</span>{followUp.is_overdue && <span className="rounded-full bg-red-600 px-2 py-1 text-xs font-bold text-white">متأخرة</span>}</div><time className="mt-1 block text-sm" dateTime={followUp.due_at}>{new Intl.DateTimeFormat("ar-SA", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Riyadh" }).format(new Date(followUp.due_at))}</time></div></div><p className="text-sm text-slate-600">المسؤول: <strong>{owner?.display_name ?? "—"}</strong>{contact && <> · جهة الاتصال: <strong>{contact.name_ar}</strong></>}</p></div>
    {followUp.notes && <p className="mt-3 whitespace-pre-wrap rounded-lg bg-white/70 p-3 text-sm">{followUp.notes}</p>}
    {followUp.outcome_note && <p className="mt-3 text-sm text-emerald-800">النتيجة: {followUp.outcome_note}</p>}
    {followUp.cancel_reason && <p className="mt-3 text-sm text-red-700">سبب الإلغاء: {followUp.cancel_reason}</p>}
    {followUp.status === "pending" && <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-200 pt-3"><CompleteFollowUpModal id={followUp.id} type={followUp.type} /><FollowUpModal facilityId={followUp.facility_id} followUp={followUp} owners={owners} canManage={canManage} /></div>}
  </li>;
}

export function FollowUpsSection({
  facilityId, followUps, contacts, owners, canEdit, canManage, defaultOwnerId,
}: {
  facilityId: string;
  followUps: FollowUpRecord[];
  contacts: ContactOption[];
  owners: OwnerOption[];
  canEdit: boolean;
  canManage: boolean;
  defaultOwnerId: string;
}) {
  const pending = followUps.filter((item) => item.status === "pending");
  const history = followUps.filter((item) => item.status !== "pending");
  return <article className="rounded-2xl bg-white p-5 shadow-sm sm:p-6" dir="rtl">
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-xl font-extrabold text-nebras-green">المتابعات</h2><p className="text-sm text-slate-500">المهام المجدولة والإجراءات القادمة لهذه المنشأة</p></div>{canEdit && <FollowUpModal facilityId={facilityId} contacts={contacts} owners={owners} canManage={canManage} defaultOwnerId={defaultOwnerId} />}</div>
    {!pending.length ? <p className="rounded-xl border border-dashed p-7 text-center text-slate-500">لا توجد متابعات معلقة.</p> : <ul className="space-y-3">{pending.map((followUp) => <FollowUpCard key={followUp.id} followUp={followUp} owners={owners} canManage={canManage} />)}</ul>}
    <details className="mt-5 rounded-xl border border-slate-200 p-4"><summary className="flex cursor-pointer items-center gap-2 font-bold"><History size={18} />سجل المتابعات ({history.length})</summary>{history.length ? <ul className="mt-4 space-y-3">{history.map((followUp) => <FollowUpCard key={followUp.id} followUp={followUp} owners={owners} canManage={canManage} />)}</ul> : <p className="mt-3 text-sm text-slate-500">لا توجد متابعات مكتملة أو ملغاة.</p>}</details>
  </article>;
}
