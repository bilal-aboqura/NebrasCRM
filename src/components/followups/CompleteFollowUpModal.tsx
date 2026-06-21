"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, X } from "lucide-react";
import { completeFollowUp } from "@/lib/actions/followups";
import { COMMUNICATION_LABELS, type CommunicationOutcome } from "@/lib/types/call-logs";
import { OUTCOMES_BY_TYPE, type FollowUpOutcome, type FollowUpType } from "@/lib/types/followups";

const labels: Record<FollowUpOutcome, string> = {
  answered: "تم الرد", no_answer: "لم يتم الرد", callback_requested: "طلب إعادة اتصال", not_interested: "غير مهتم",
  met_decision_maker: "مقابلة صاحب القرار", no_show: "لم يحضر", rescheduled: "تم التأجيل", followup_needed: "بحاجة لمتابعة",
  offer_sent: "تم إرسال العرض", feedback_received: "تم استلام ملاحظات", offer_rejected: "رُفض العرض", offer_accepted: "قُبل العرض",
  task_completed: "تم إنجاز المهمة", postponed: "تم التأجيل",
};

export function CompleteFollowUpModal({ id, type }: { id: string; type: FollowUpType }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<FollowUpOutcome | undefined>();
  const [logCommunication, setLogCommunication] = useState(type === "call");
  const [callOutcome, setCallOutcome] = useState<CommunicationOutcome>("answered");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function submit(formData: FormData) {
    startTransition(async () => {
      const note = String(formData.get("outcome_note") ?? "");
      const minutes = Number(formData.get("duration_minutes") || 0);
      const result = await completeFollowUp(id, {
        outcome: selected, outcome_note: note,
        callLog: logCommunication ? {
          channel: type === "send_offer" ? "whatsapp" : "call", outcome: callOutcome,
          durationSeconds: minutes ? Math.round(minutes * 60) : undefined, notes: note,
        } : undefined,
      });
      if (!result.success) return setError(result.error);
      setOpen(false); setError(""); router.refresh();
    });
  }

  return <>
    <button type="button" onClick={() => setOpen(true)} className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-bold text-white"><Check size={16} />إتمام</button>
    {open && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4" role="dialog" aria-modal="true" aria-label="إتمام المتابعة" dir="rtl"><form action={submit} className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl">
      <div className="mb-5 flex items-center justify-between"><h2 className="text-2xl font-extrabold text-nebras-green">إتمام المتابعة</h2><button type="button" onClick={() => setOpen(false)} aria-label="إغلاق"><X /></button></div>
      <p className="mb-3 text-sm text-slate-600">اختر النتيجة إن وجدت:</p><div className="flex flex-wrap gap-2">{OUTCOMES_BY_TYPE[type].map((outcome) => <button key={outcome} type="button" onClick={() => setSelected(selected === outcome ? undefined : outcome)} className={`rounded-full border px-3 py-2 text-sm font-bold ${selected === outcome ? "border-nebras-green bg-nebras-green text-white" : "border-slate-200"}`}>{labels[outcome]}</button>)}</div>
      <label className="mt-5 block">ملاحظات النتيجة (اختيارية)<textarea name="outcome_note" rows={4} className="mt-1 w-full rounded-xl border border-slate-200 p-3" /></label>
      {(type === "call" || type === "send_offer") && <div className="mt-4 rounded-xl bg-emerald-50 p-4"><label className="flex items-center gap-2 font-bold"><input type="checkbox" checked={logCommunication} onChange={(event) => setLogCommunication(event.target.checked)} />تسجيل اتصال مرتبط</label>{logCommunication && <div className="mt-3 grid gap-3 sm:grid-cols-2"><label>نتيجة الاتصال<select value={callOutcome} onChange={(event) => setCallOutcome(event.target.value as CommunicationOutcome)} className="mt-1 w-full rounded-lg border bg-white p-2">{Object.entries(COMMUNICATION_LABELS.outcomes).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label>المدة بالدقائق<input name="duration_minutes" type="number" min="0" className="mt-1 w-full rounded-lg border bg-white p-2" /></label></div>}</div>}
      {error && <p className="mt-4 rounded-lg bg-red-50 p-3 text-red-700" role="alert">{error}</p>}
      <div className="mt-6 flex gap-3"><button disabled={pending} className="rounded-xl bg-emerald-600 px-6 py-3 font-bold text-white disabled:opacity-60">{pending ? "جارٍ الإتمام..." : "تأكيد الإتمام"}</button><button type="button" onClick={() => setOpen(false)} className="rounded-xl border px-6 py-3">رجوع</button></div>
    </form></div>}
  </>;
}
