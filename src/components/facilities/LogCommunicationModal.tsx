"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PhoneCall, X } from "lucide-react";
import { createCallLog } from "@/lib/actions/call-logs";
import {
  COMMUNICATION_LABELS,
  defaultCompleteFollowUp,
  type CommunicationChannel,
  type CommunicationOutcome,
} from "@/lib/types/call-logs";

type ContactOption = { id: string; name_ar: string };
type FollowUpOption = { id: string; type: string; due_at: string; status: string; contact_id?: string | null };

export function LogCommunicationModal({ facilityId, contacts, followUps = [], initialContactId, initialChannel = "call", triggerLabel = "تسجيل اتصال", open: controlledOpen, onOpenChange }: {
  facilityId: string;
  contacts: ContactOption[];
  followUps?: FollowUpOption[];
  initialContactId?: string;
  initialChannel?: CommunicationChannel;
  triggerLabel?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const router = useRouter();
  const [localOpen, setLocalOpen] = useState(false);
  const [outcome, setOutcome] = useState<CommunicationOutcome>("answered");
  const [completeFollowUp, setCompleteFollowUp] = useState(true);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const open = controlledOpen ?? localOpen;
  const setOpen = (value: boolean) => { setLocalOpen(value); onOpenChange?.(value); };

  useEffect(() => setCompleteFollowUp(defaultCompleteFollowUp(outcome)), [outcome]);

  function submit(formData: FormData) {
    const durationMinutes = Number(formData.get("duration_minutes") || 0);
    startTransition(async () => {
      const result = await createCallLog({
        facilityId,
        contactId: String(formData.get("contact_id") || "") || undefined,
        followupId: String(formData.get("followup_id") || "") || undefined,
        channel: String(formData.get("channel")) as CommunicationChannel,
        direction: String(formData.get("direction")) as "inbound" | "outbound",
        occurredAt: String(formData.get("occurred_at")), outcome,
        durationSeconds: durationMinutes ? Math.round(durationMinutes * 60) : undefined,
        notes: String(formData.get("notes") || ""), completeFollowUp,
      });
      if (!result.success) return setError(result.error);
      setError(""); setOpen(false); router.refresh();
    });
  }

  return <>
    {controlledOpen === undefined && <button type="button" onClick={() => setOpen(true)} className="inline-flex items-center gap-2 rounded-xl bg-nebras-green px-4 py-2.5 font-bold text-white"><PhoneCall size={18} />{triggerLabel}</button>}
    {open && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4" role="dialog" aria-modal="true" aria-label="تسجيل اتصال" dir="rtl">
      <form action={submit} className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between"><div><h2 className="text-2xl font-extrabold text-nebras-green">تسجيل اتصال</h2><p className="text-sm text-slate-500">وثّق تواصلاً تم بالفعل مع المنشأة.</p></div><button type="button" onClick={() => setOpen(false)} aria-label="إغلاق"><X /></button></div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label>جهة الاتصال<select name="contact_id" defaultValue={initialContactId ?? ""} className="mt-1 w-full rounded-xl border p-3"><option value="">المنشأة مباشرة</option>{contacts.map((contact) => <option key={contact.id} value={contact.id}>{contact.name_ar}</option>)}</select></label>
          <label>قناة الاتصال<select name="channel" defaultValue={initialChannel} className="mt-1 w-full rounded-xl border p-3">{Object.entries(COMMUNICATION_LABELS.channels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <label>الاتجاه<select name="direction" defaultValue="outbound" className="mt-1 w-full rounded-xl border p-3">{Object.entries(COMMUNICATION_LABELS.directions).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <label>وقت الاتصال<input name="occurred_at" type="datetime-local" required defaultValue={new Date(Date.now() - new Date().getTimezoneOffset() * 60_000).toISOString().slice(0, 16)} max={new Date(Date.now() - new Date().getTimezoneOffset() * 60_000).toISOString().slice(0, 16)} className="mt-1 w-full rounded-xl border p-3" /></label>
          <label>النتيجة<select value={outcome} onChange={(event) => setOutcome(event.target.value as CommunicationOutcome)} className="mt-1 w-full rounded-xl border p-3">{Object.entries(COMMUNICATION_LABELS.outcomes).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <label>المدة بالدقائق<input name="duration_minutes" type="number" min="0" max="1440" step="1" className="mt-1 w-full rounded-xl border p-3" /></label>
          {followUps.some((item) => item.status === "pending") && <label className="sm:col-span-2">المتابعة المرتبطة<select name="followup_id" className="mt-1 w-full rounded-xl border p-3"><option value="">بدون متابعة</option>{followUps.filter((item) => item.status === "pending").map((item) => <option key={item.id} value={item.id}>{item.type} — {new Intl.DateTimeFormat("ar-SA", { dateStyle: "medium", timeStyle: "short" }).format(new Date(item.due_at))}</option>)}</select></label>}
          <label className="sm:col-span-2">ملاحظات<textarea name="notes" rows={4} maxLength={5000} className="mt-1 w-full rounded-xl border p-3" /></label>
        </div>
        {followUps.some((item) => item.status === "pending") && <label className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-50 p-3 font-bold"><input type="checkbox" checked={completeFollowUp} onChange={(event) => setCompleteFollowUp(event.target.checked)} />إتمام المتابعة المرتبطة</label>}
        {!completeFollowUp && ["no_answer", "busy", "not_reachable"].includes(outcome) && <p className="mt-2 text-sm text-amber-700">يمكنك إبقاء المتابعة مفتوحة وإعادة جدولتها من قسم المتابعات.</p>}
        {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-red-700">{error}</p>}
        <div className="mt-6 flex gap-3"><button disabled={pending} className="rounded-xl bg-nebras-green px-6 py-3 font-bold text-white disabled:opacity-60">{pending ? "جارٍ الحفظ..." : "حفظ السجل"}</button><button type="button" onClick={() => setOpen(false)} className="rounded-xl border px-6 py-3">إلغاء</button></div>
      </form>
    </div>}
  </>;
}
