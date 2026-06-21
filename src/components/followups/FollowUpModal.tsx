"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CalendarClock, RotateCw, Trash2, UserRoundCog, X } from "lucide-react";
import { cancelFollowUp, createFollowUp, reassignFollowUp, rescheduleFollowUp } from "@/lib/actions/followups";
import type { FollowUpRecord, FollowUpType } from "@/lib/types/followups";

type ContactOption = { id: string; name_ar: string };
type OwnerOption = { id: string; display_name: string; status?: string };
type Mode = "create" | "reschedule" | "cancel" | "reassign";

const fieldClass = "mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 outline-none focus:border-nebras-gold";

function asRiyadhIsoInput(value: FormDataEntryValue | null) {
  const localValue = String(value ?? "");
  return localValue && !/(?:z|[+-]\d\d:\d\d)$/i.test(localValue) ? `${localValue}:00+03:00` : localValue;
}

export function FollowUpModal({
  facilityId, followUp, contacts = [], owners = [], canManage = false, defaultOwnerId, disabled = false,
}: {
  facilityId: string;
  followUp?: FollowUpRecord;
  contacts?: ContactOption[];
  owners?: OwnerOption[];
  canManage?: boolean;
  defaultOwnerId?: string;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode | null>(null);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function close() {
    setMode(null);
    setError("");
  }

  function submit(formData: FormData) {
    if (!mode) return;
    startTransition(async () => {
      const result = mode === "create"
        ? await createFollowUp({
          facility_id: facilityId,
          type: String(formData.get("type")) as FollowUpType,
          due_at: asRiyadhIsoInput(formData.get("due_at")),
          assigned_to: String(formData.get("assigned_to") ?? "") || undefined,
          contact_id: String(formData.get("contact_id") ?? "") || undefined,
          notes: String(formData.get("notes") ?? ""),
        })
        : mode === "reschedule"
          ? await rescheduleFollowUp(followUp!.id, asRiyadhIsoInput(formData.get("due_at")))
          : mode === "cancel"
            ? await cancelFollowUp(followUp!.id, String(formData.get("cancel_reason") ?? ""))
            : await reassignFollowUp(followUp!.id, String(formData.get("assigned_to") ?? ""));
      if (!result.success) return setError(result.error);
      close();
      router.refresh();
    });
  }

  const title = mode === "create" ? "إضافة متابعة" : mode === "reschedule" ? "إعادة جدولة المتابعة" : mode === "cancel" ? "إلغاء المتابعة" : "تغيير المسؤول";
  return <>
    {!followUp ? <button type="button" disabled={disabled} onClick={() => setMode("create")} className="inline-flex items-center gap-2 rounded-xl bg-nebras-green px-4 py-2.5 font-bold text-white disabled:opacity-50"><CalendarClock size={18} />إضافة متابعة</button> : <div className="flex flex-wrap gap-2">
      <button type="button" onClick={() => setMode("reschedule")} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold"><RotateCw size={15} />إعادة جدولة</button>
      <button type="button" onClick={() => setMode("cancel")} className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-2 text-sm font-bold text-red-700"><Trash2 size={15} />إلغاء</button>
      {canManage && <button type="button" onClick={() => setMode("reassign")} className="inline-flex items-center gap-1 rounded-lg border border-amber-300 px-3 py-2 text-sm font-bold text-amber-800"><UserRoundCog size={15} />تغيير المسؤول</button>}
    </div>}
    {mode && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4" role="dialog" aria-modal="true" aria-label={title} dir="rtl">
      <form action={submit} className="w-full max-w-xl rounded-2xl bg-slate-50 p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between"><h2 className="text-2xl font-extrabold text-nebras-green">{title}</h2><button type="button" onClick={close} aria-label="إغلاق"><X /></button></div>
        {mode === "create" && <div className="grid gap-4 sm:grid-cols-2">
          <label>نوع المتابعة<select name="type" defaultValue="call" className={fieldClass}><option value="call">اتصال</option><option value="visit">زيارة</option><option value="send_offer">إرسال عرض</option><option value="other">أخرى</option></select></label>
          <label>تاريخ ووقت الاستحقاق<input type="datetime-local" name="due_at" required className={fieldClass} /></label>
          <label>جهة الاتصال<select name="contact_id" defaultValue="" className={fieldClass}><option value="">بدون جهة اتصال</option>{contacts.map((contact) => <option key={contact.id} value={contact.id}>{contact.name_ar}</option>)}</select></label>
          {canManage ? <label>المسؤول<select name="assigned_to" defaultValue={defaultOwnerId ?? ""} required className={fieldClass}>{owners.map((owner) => <option key={owner.id} value={owner.id}>{owner.display_name}</option>)}</select></label> : <input type="hidden" name="assigned_to" value={defaultOwnerId ?? ""} />}
          <label className="sm:col-span-2">ملاحظات<textarea name="notes" rows={4} className={fieldClass} /></label>
        </div>}
        {mode === "reschedule" && <label>الموعد الجديد<input type="datetime-local" name="due_at" required className={fieldClass} /></label>}
        {mode === "cancel" && <label>سبب الإلغاء (اختياري)<textarea name="cancel_reason" rows={4} className={fieldClass} /></label>}
        {mode === "reassign" && <label>المسؤول الجديد<select name="assigned_to" defaultValue={followUp?.assigned_to} required className={fieldClass}>{owners.map((owner) => <option key={owner.id} value={owner.id}>{owner.display_name}</option>)}</select></label>}
        {error && <p className="mt-4 rounded-lg bg-red-50 p-3 text-red-700" role="alert">{error}</p>}
        <div className="mt-6 flex gap-3"><button disabled={pending} className="rounded-xl bg-nebras-green px-6 py-3 font-bold text-white disabled:opacity-60">{pending ? "جارٍ الحفظ..." : "حفظ"}</button><button type="button" onClick={close} className="rounded-xl border px-6 py-3">رجوع</button></div>
      </form>
    </div>}
  </>;
}
