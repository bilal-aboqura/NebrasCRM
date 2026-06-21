"use client";

import { useEffect, useState } from "react";
import type { LostReason, PipelineStage } from "@/lib/actions/pipeline";
import { LOST_REASON_LABELS, STAGE_LABELS } from "@/lib/utils/pipeline";

interface ConfirmTerminalModalProps {
  open: boolean;
  facilityName: string;
  targetStage: PipelineStage;
  busy?: boolean;
  onCancel: () => void;
  onConfirm: (lostReason?: LostReason) => void;
}

export function ConfirmTerminalModal({ open, facilityName, targetStage, busy, onCancel, onConfirm }: ConfirmTerminalModalProps) {
  const [reason, setReason] = useState<LostReason | "">("");
  useEffect(() => {
    if (!open) {
      setReason("");
      return;
    }
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape" && !busy) onCancel(); };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [busy, onCancel, open]);
  if (!open) return null;
  const needsReason = targetStage === "lost";

  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) onCancel(); }}>
    <section role="dialog" aria-modal="true" aria-labelledby="terminal-title" className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl" dir="rtl">
      <h2 id="terminal-title" className="text-xl font-extrabold text-nebras-green">تأكيد نقل المنشأة</h2>
      <p className="mt-3 text-slate-600">هل تريد نقل <strong>{facilityName}</strong> إلى مرحلة <strong>{STAGE_LABELS[targetStage]}</strong>؟</p>
      {needsReason && <label className="mt-5 block font-bold">سبب الخسارة
        <select autoFocus value={reason} onChange={(event) => setReason(event.target.value as LostReason)} className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 font-normal">
          <option value="">اختر السبب</option>
          {Object.entries(LOST_REASON_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      </label>}
      <div className="mt-6 flex justify-end gap-3">
        <button type="button" disabled={busy} onClick={onCancel} className="rounded-xl border px-4 py-2 font-bold disabled:opacity-50">إلغاء</button>
        <button type="button" autoFocus={!needsReason} disabled={busy || (needsReason && !reason)} onClick={() => onConfirm(reason || undefined)} className={`rounded-xl px-4 py-2 font-bold text-white disabled:opacity-50 ${targetStage === "lost" ? "bg-red-600" : "bg-emerald-600"}`}>{busy ? "جارٍ الحفظ…" : "تأكيد"}</button>
      </div>
    </section>
  </div>;
}
